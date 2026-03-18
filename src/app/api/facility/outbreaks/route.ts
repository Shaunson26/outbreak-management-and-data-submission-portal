import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const createOutbreakSchema = z.object({
  disease: z.string().min(2),
  onsetDate: z.string().min(1),
  description: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.role !== "FACILITY" || !user.facilityId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const outbreaks = await prisma.outbreak.findMany({
    where: { facilityId: user.facilityId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(outbreaks);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "FACILITY" || !user.facilityId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = createOutbreakSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const { disease, onsetDate, description } = parsed.data;

    const outbreak = await prisma.outbreak.create({
      data: {
        disease,
        onsetDate: new Date(onsetDate),
        facilityId: user.facilityId,
        createdById: user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: "Outbreak",
        entityId: outbreak.id,
        action: "OUTBREAK_CREATED",
        details: description ?? "",
        userId: user.id,
        outbreakId: outbreak.id,
      },
    });

    return NextResponse.json({ id: outbreak.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating outbreak:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

