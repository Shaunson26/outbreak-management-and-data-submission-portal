import { prisma } from "./prisma";
import { FacilityType, OutbreakStatus, PersonType } from "@prisma/client";

type ThresholdConfig = {
  minCases: number;
  windowDays: number;
};

function getThresholdConfig(
  facilityType: FacilityType,
  disease: string,
): ThresholdConfig {
  const name = disease.toLowerCase();

  if (facilityType === "AGE_CARE") {
    if (name.includes("gastro")) {
      return { minCases: 3, windowDays: 2 };
    }
    if (name.includes("flu") || name.includes("influenza")) {
      return { minCases: 2, windowDays: 2 };
    }
  }

  if (facilityType === "CHILD_CARE") {
    if (name.includes("gastro")) {
      return { minCases: 4, windowDays: 2 };
    }
    if (name.includes("flu") || name.includes("influenza")) {
      return { minCases: 3, windowDays: 2 };
    }
  }

  return { minCases: 2, windowDays: 2 };
}

export async function recomputeOutbreakMetrics(outbreakId: number) {
  const outbreak = await prisma.outbreak.findUnique({
    where: { id: outbreakId },
    include: {
      facility: true,
      lineListEntries: true,
    },
  });

  if (!outbreak) {
    throw new Error(`Outbreak ${outbreakId} not found`);
  }

  const { facility, lineListEntries } = outbreak;

  const totalCases = lineListEntries.length;
  const staffCases = lineListEntries.filter(
    (e) => e.personType === PersonType.STAFF,
  ).length;
  const residentCases = lineListEntries.filter(
    (e) => e.personType === PersonType.RESIDENT || e.personType === PersonType.CHILD,
  ).length;

  const latestOnset =
    lineListEntries.length > 0
      ? lineListEntries
          .map((e) => e.symptomOnsetDate)
          .reduce((a, b) => (a > b ? a : b))
      : null;

  const { minCases, windowDays } = getThresholdConfig(
    facility.type,
    outbreak.disease,
  );

  const now = new Date();
  const windowStart = new Date(
    now.getTime() - windowDays * 24 * 60 * 60 * 1000,
  );

  const casesInWindow = lineListEntries.filter(
    (e) => e.symptomOnsetDate >= windowStart,
  ).length;

  const isAboveThreshold = casesInWindow >= minCases;

  const wasAboveThreshold = outbreak.isAboveThreshold;

  let outbreakStartDate = outbreak.outbreakStartDate;
  let outbreakEndDate = outbreak.outbreakEndDate;
  let status = outbreak.status;

  if (isAboveThreshold && !wasAboveThreshold) {
    outbreakStartDate = latestOnset ?? now;
    if (status === OutbreakStatus.NEW) {
      status = OutbreakStatus.UNDER_REVIEW;
    }
  }

  if (latestOnset) {
    const daysSinceLastOnset =
      (now.getTime() - latestOnset.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceLastOnset >= 14 && status !== OutbreakStatus.CLOSED) {
      status = OutbreakStatus.CLOSED;
      outbreakEndDate = now;
    }
  }

  const updated = await prisma.outbreak.update({
    where: { id: outbreakId },
    data: {
      caseCount: totalCases,
      staffCaseCount: staffCases,
      residentCaseCount: residentCases,
      isAboveThreshold,
      outbreakStartDate,
      outbreakEndDate,
      status,
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "Outbreak",
      entityId: outbreakId,
      action: "OUTBREAK_RECOMPUTED",
      details: `cases=${totalCases}, staff=${staffCases}, resident=${residentCases}, aboveThreshold=${isAboveThreshold}`,
      outbreakId,
    },
  });

  return updated;
}

