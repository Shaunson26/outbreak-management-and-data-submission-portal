import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PersonType } from "@prisma/client";
import { recomputeOutbreakMetrics } from "@/lib/outbreakRules";

const updateLineListSchema = z.object({
  name: z.string().optional(),
  personType: z.enum(["RESIDENT", "CHILD", "STAFF"]).optional(),
  ageGroup: z.string().optional(),
  symptomOnsetDate: z.string().min(1).optional(),
  symptoms: z.string().optional(),
  hospitalised: z.boolean().optional(),
  outcome: z.string().optional(),
});

type RouteParams = {
  params: Promise<{
    id: string;
    entryId: string;
  }>;
};

export async function PATCH(request: Request, ctx: RouteParams) {
  const params = await ctx.params;
  const user = await getCurrentUser();

  if (!user || user.role !== "FACILITY" || !user.facilityId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const outbreakId = Number(params.id);
  const entryId = Number(params.entryId);

  if (!Number.isFinite(outbreakId) || !Number.isFinite(entryId)) {
    return NextResponse.json(
      { error: "Invalid outbreak or entry id" },
      { status: 400 },
    );
  }

  const entry = await prisma.lineListEntry.findUnique({
    where: { id: entryId },
    include: { outbreak: true },
  });

  if (!entry || entry.outbreakId !== outbreakId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const outbreak = await prisma.outbreak.findUnique({
    where: { id: outbreakId },
  });

  if (!outbreak || outbreak.facilityId !== user.facilityId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const json = await request.json();
    const parsed = updateLineListSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const updated = await prisma.lineListEntry.update({
      where: { id: entryId },
      data: {
        name: data.name ?? entry.name,
        personType: data.personType
          ? (data.personType as PersonType)
          : entry.personType,
        ageGroup: data.ageGroup ?? entry.ageGroup,
        symptomOnsetDate: data.symptomOnsetDate
          ? new Date(data.symptomOnsetDate)
          : entry.symptomOnsetDate,
        symptoms: data.symptoms ?? entry.symptoms,
        hospitalised:
          typeof data.hospitalised === "boolean"
            ? data.hospitalised
            : entry.hospitalised,
        outcome: data.outcome ?? entry.outcome,
      },
    });

    const updatedOutbreak = await recomputeOutbreakMetrics(outbreakId);

    return NextResponse.json(
      { entry: updated, outbreak: updatedOutbreak },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating line list entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, ctx: RouteParams) {
  const params = await ctx.params;
  const user = await getCurrentUser();

  if (!user || user.role !== "FACILITY" || !user.facilityId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const outbreakId = Number(params.id);
  const entryId = Number(params.entryId);

  if (!Number.isFinite(outbreakId) || !Number.isFinite(entryId)) {
    return NextResponse.json(
      { error: "Invalid outbreak or entry id" },
      { status: 400 },
    );
  }

  const entry = await prisma.lineListEntry.findUnique({
    where: { id: entryId },
    include: { outbreak: true },
  });

  if (!entry || entry.outbreakId !== outbreakId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const outbreak = await prisma.outbreak.findUnique({
    where: { id: outbreakId },
  });

  if (!outbreak || outbreak.facilityId !== user.facilityId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.lineListEntry.delete({
    where: { id: entryId },
  });

  const updatedOutbreak = await recomputeOutbreakMetrics(outbreakId);

  return NextResponse.json(
    { deletedId: entryId, outbreak: updatedOutbreak },
    { status: 200 },
  );
}


