import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, ctx: RouteParams) {
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

  const outbreak = await prisma.outbreak.findFirst({
    where: {
      id: outbreakId,
      facility: {
        region: phu.region,
      },
    },
    include: {
      facility: true,
      lineListEntries: true,
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!outbreak) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(outbreak);
}

