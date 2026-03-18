import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      facility: true,
      phu: true,
    },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      facilityId: u.facilityId,
      phuId: u.phuId,
      facilityName: u.facility?.name ?? null,
      phuName: u.phu?.name ?? null,
      region: u.facility?.region ?? u.phu?.region ?? null,
      createdAt: u.createdAt,
    })),
  );
}

