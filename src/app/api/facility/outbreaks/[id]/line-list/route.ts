import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PersonType } from "@prisma/client";
import { recomputeOutbreakMetrics } from "@/lib/outbreakRules";

const lineListSchema = z.object({
  name: z.string().optional(),
  personType: z.enum(["RESIDENT", "CHILD", "STAFF"]),
  ageGroup: z.string().optional(),
  symptomOnsetDate: z.string().min(1),
  symptoms: z.string().optional(),
  hospitalised: z.boolean().optional(),
  outcome: z.string().optional(),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, ctx: RouteParams) {
  const params = await ctx.params;
  const user = await getCurrentUser();

  if (!user || user.role !== "FACILITY" || !user.facilityId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const outbreakId = Number(params.id);
  if (!Number.isFinite(outbreakId)) {
    return NextResponse.json({ error: "Invalid outbreak id" }, { status: 400 });
  }

  const outbreak = await prisma.outbreak.findUnique({
    where: { id: outbreakId },
    include: { facility: true },
  });

  if (!outbreak || outbreak.facilityId !== user.facilityId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const json = await request.json();
    const parsed = lineListSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const {
      name,
      personType,
      ageGroup,
      symptomOnsetDate,
      symptoms,
      hospitalised,
      outcome,
    } = parsed.data;

    const entry = await prisma.lineListEntry.create({
      data: {
        name,
        personType: personType as PersonType,
        ageGroup,
        symptomOnsetDate: new Date(symptomOnsetDate),
        symptoms,
        hospitalised,
        outcome,
        outbreakId,
      },
    });

    const updatedOutbreak = await recomputeOutbreakMetrics(outbreakId);

    return NextResponse.json(
      { entry, outbreak: updatedOutbreak },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating line list entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

