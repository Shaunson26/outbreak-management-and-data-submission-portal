import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OutbreakStatus } from "@prisma/client";

const updateStatusSchema = z.object({
  status: z.enum(["NEW", "UNDER_REVIEW", "CONFIRMED", "CLOSED"]),
  note: z.string().optional(),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, ctx: RouteParams) {
  const params = await ctx.params;
  const user = await getCurrentUser();

  if (!user || user.role !== "PHU" || !user.phuId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const phu = await prisma.publicHealthUnit.findUnique({
    where: { id: user.phuId },
  });

  if (!phu) {
    return NextResponse.json({ error: "PHU not found" }, { status: 404 });
  }

  const outbreakId = Number(params.id);
  if (!Number.isFinite(outbreakId)) {
    return NextResponse.json({ error: "Invalid outbreak id" }, { status: 400 });
  }

  const json = await request.json();
  const parsed = updateStatusSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.errors },
      { status: 400 },
    );
  }

  const { status, note } = parsed.data;

  const outbreak = await prisma.outbreak.findFirst({
    where: {
      id: outbreakId,
      facility: {
        region: phu.region,
      },
    },
  });

  if (!outbreak) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.outbreak.update({
    where: { id: outbreakId },
    data: {
      status: status as OutbreakStatus,
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "Outbreak",
      entityId: outbreakId,
      action: "PHU_STATUS_UPDATE",
      details: note ?? "",
      userId: user.id,
      outbreakId,
    },
  });

  return NextResponse.json(updated, { status: 200 });
}

