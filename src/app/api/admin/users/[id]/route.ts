import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const updateUserSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  facilityId: z.number().nullable().optional(),
  phuId: z.number().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const json = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Prevent demoting/deactivating the only remaining admin
  if (data.role === UserRole.FACILITY || data.role === UserRole.PHU) {
    const adminCount = await prisma.user.count({
      where: { role: UserRole.ADMIN, isActive: true },
    });
    if (adminCount <= 1 && currentUser.id === id) {
      return NextResponse.json(
        { error: "Cannot remove the only active admin." },
        { status: 400 },
      );
    }
  }

  if (data.isActive === false) {
    const adminCount = await prisma.user.count({
      where: { role: UserRole.ADMIN, isActive: true },
    });
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });
    if (targetUser?.role === UserRole.ADMIN && adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot deactivate the only active admin." },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      role: data.role,
      isActive: data.isActive,
      facilityId: data.facilityId ?? null,
      phuId: data.phuId ?? null,
    },
    include: {
      facility: true,
      phu: true,
    },
  });

  return NextResponse.json({
    id: updated.id,
    email: updated.email,
    role: updated.role,
    isActive: updated.isActive,
    facilityId: updated.facilityId,
    phuId: updated.phuId,
  });
}

