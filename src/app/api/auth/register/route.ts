import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionCookie } from "@/lib/auth";
import { FacilityType, UserRole } from "@prisma/client";

const registerSchema = z.object({
  facilityName: z.string().min(2),
  facilityType: z.enum(["AGE_CARE", "CHILD_CARE"]),
  address: z.string().min(5),
  region: z.string().min(2),
  contactName: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = registerSchema.safeParse(json);  
    if (!parsed.success) {     
      return NextResponse.json(
        { error: 'Input errors - check registerSchema', details: z.flattenError(parsed.error) },
        { status: 400 },
      );
    }

    const {
      facilityName,
      facilityType,
      address,
      region,
      contactName,
      email,
      password,
    } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const facility = await tx.facility.create({
        data: {
          name: facilityName,
          type: facilityType as FacilityType,
          address,
          region,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: UserRole.FACILITY,
          facilityId: facility.id,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: "Facility",
          entityId: facility.id,
          action: "FACILITY_REGISTERED",
          details: `Facility registered by ${contactName}`,
          userId: user.id,
        },
      });

      return { user };
    });

    await createSessionCookie({ userId: result.user.id, role: result.user.role });

    return NextResponse.json(
      { id: result.user.id, role: result.user.role },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in register:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

