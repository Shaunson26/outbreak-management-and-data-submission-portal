import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const facilities = await prisma.facility.findMany({
    orderBy: { name: "asc" },
    include: {
      users: true,
      outbreaks: true,
    },
  });

  return NextResponse.json(
    facilities.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      address: f.address,
      region: f.region,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      users: f.users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })),
      outbreaks: f.outbreaks.map((o) => ({
        id: o.id,
        disease: o.disease,
        onsetDate: o.onsetDate,
        status: o.status,
        caseCount: o.caseCount,
        isAboveThreshold: o.isAboveThreshold,
      })),
    })),
  );
}

