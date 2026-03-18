import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PersonType } from "@prisma/client";
import { recomputeOutbreakMetrics } from "@/lib/outbreakRules";
import {
  toPersonType,
  parseDateString,
  type ParsedRow,
} from "@/lib/parseLineList";

const importBodySchema = z.object({
  rows: z.array(
    z.object({
      name: z.string().optional(),
      personType: z.string().optional(),
      ageGroup: z.string().optional(),
      symptomOnsetDate: z.union([z.string(), z.number()]).optional(),
      symptoms: z.string().optional(),
      hospitalised: z.union([z.boolean(), z.string()]).optional(),
      outcome: z.string().optional(),
    }),
  ),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

function normaliseHospitalised(
  value: string | boolean | undefined,
): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    if (["yes", "y", "true", "1"].includes(v)) return true;
    if (["no", "n", "false", "0"].includes(v)) return false;
  }
  return null;
}

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
  });

  if (!outbreak || outbreak.facilityId !== user.facilityId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const json = await request.json();
  const parsed = importBodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const rows = parsed.data.rows as ParsedRow[];
  let createdCount = 0;

  for (const row of rows) {
    const onset = parseDateString(row.symptomOnsetDate);
    const personType = toPersonType(row.personType);

    if (!onset || !personType) continue;

    const hospitalised = normaliseHospitalised(row.hospitalised);

    await prisma.lineListEntry.create({
      data: {
        name: row.name || null,
        personType: personType as PersonType,
        ageGroup: row.ageGroup || null,
        symptomOnsetDate: onset,
        symptoms: row.symptoms || null,
        hospitalised,
        outcome: row.outcome || null,
        outbreakId,
      },
    });

    createdCount += 1;
  }

  const updatedOutbreak = await recomputeOutbreakMetrics(outbreakId);

  return NextResponse.json(
    { created: createdCount, outbreak: updatedOutbreak },
    { status: 201 },
  );
}
