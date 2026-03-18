import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionCookie } from "@/lib/auth";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    // request should have { email, password } in the body, which we validate with zod and loginSchema (above)
    const json = await request.json();
    const parsed = loginSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, password } = parsed.data;
    // We look up the user by email and include the facility and phu relationships so we can return that info in the response if needed (e.g. for role-based redirects on the frontend)
    const user = await prisma.user.findUnique({
      where: { email },
      include: { facility: true, phu: true },
    });
    
    // user object has user information then keys facility and phu which are either null or objects with the related info. We can use this to determine the user's role and redirect them accordingly on the frontend
    //console.log(user)

    if (!user || !user.passwordHash || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    await createSessionCookie({ userId: user.id, role: user.role });

    return NextResponse.json({ id: user.id, role: user.role }, { status: 200 });
  } catch (error) {
    console.error("Error in login:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
