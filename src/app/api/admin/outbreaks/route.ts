import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const region = url.searchParams.get("region") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;

  const outbreaks = await prisma.outbreak.findMany({
    where: {
      ...(status
        ? {
            status,
          }
        : {}),
      ...(region
        ? {
            facility: {
              region,
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      facility: true,
    },
  });

  return NextResponse.json(
    outbreaks.map((o) => ({
      id: o.id,
      disease: o.disease,
      onsetDate: o.onsetDate,
      status: o.status,
      caseCount: o.caseCount,
      isAboveThreshold: o.isAboveThreshold,
      facilityName: o.facility.name,
      facilityRegion: o.facility.region,
    })),
  );
}

