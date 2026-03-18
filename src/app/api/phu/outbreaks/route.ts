import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
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

  const outbreaks = await prisma.outbreak.findMany({
    where: {
      facility: {
        region: phu.region,
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      facility: true,
    },
  });

  return NextResponse.json(outbreaks);
}

