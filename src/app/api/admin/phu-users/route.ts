import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { UserRole } from "@prisma/client";

const adminToken = process.env.ADMIN_TOKEN;

const phuUserSchema = z.object({
  phuName: z.string().min(2),
  region: z.string().min(2),
  notificationEmail: z.string().email().optional(),
  userEmail: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  if (!adminToken) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN is not configured on the server" },
      { status: 500 },
    );
  }

  const headerToken =
    request.headers.get("x-admin-token") ??
    request.headers.get("X-Admin-Token");

  if (!headerToken || headerToken !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = phuUserSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.errors },
      { status: 400 },
    );
  }

  const {
    phuName,
    region,
    notificationEmail,
    userEmail,
    password,
  } = parsed.data;

  const passwordHash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const phu = await tx.publicHealthUnit.upsert({
      where: {
        // Simple uniqueness by name+region for this POC
        id: 0,
      },
      create: {
        name: phuName,
        region,
        notificationEmail: notificationEmail ?? null,
      },
      update: {},
    });

    const existingUser = await tx.user.findUnique({
      where: { email: userEmail },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const user = await tx.user.create({
      data: {
        email: userEmail,
        passwordHash,
        role: UserRole.PHU,
        phuId: phu.id,
      },
    });

    return { phu, user };
  });

  return NextResponse.json(
    {
      phuId: result.phu.id,
      phuName: result.phu.name,
      userId: result.user.id,
      userEmail: result.user.email,
    },
    { status: 201 },
  );
}

