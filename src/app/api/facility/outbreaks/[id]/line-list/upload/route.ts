import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recomputeOutbreakMetrics } from "@/lib/outbreakRules";
import {
  parseLineListFile,
  toPersonType,
  parseDateString,
  type ParsedRow,
} from "@/lib/parseLineList";

type RouteParams = {
  params: Promise<{ id: string }>;
};

function normaliseHospitalised(
  value: string | boolean | undefined,
): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.toLowerCase();
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
    include: { facility: true },
  });

  if (!outbreak || outbreak.facilityId !== user.facilityId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();

  let rows: ParsedRow[] = [];

  try {
    rows = await parseLineListFile(buffer, file.name);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unsupported file type. Use CSV or Excel.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No data rows found in file" },
      { status: 400 },
    );
  }

  let createdCount = 0;

  for (const row of rows) {
    const onset = parseDateString(row.symptomOnsetDate);
    const personType = toPersonType(row.personType);

    if (!onset || !personType) continue;

    const hospitalised = normaliseHospitalised(row.hospitalised);

    await prisma.lineListEntry.create({
      data: {
        name: row.name || null,
        personType,
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
