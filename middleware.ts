import { NextResponse, type NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const SESSION_COOKIE_NAME = "session";

const PROTECTED_FACILITY_PREFIX = "/facility";
const PROTECTED_PHU_PREFIX = "/phu";
const PROTECTED_ADMIN_PREFIX = "/admin";

type SessionPayload = {
  userId: number;
  role: "FACILITY" | "PHU" | "ADMIN";
};

function getAuthSecret(): string | null {
  return process.env.AUTH_SECRET ?? null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isFacilityRoute = pathname.startsWith(PROTECTED_FACILITY_PREFIX);
  const isPhuRoute = pathname.startsWith(PROTECTED_PHU_PREFIX);
  const isAdminRoute = pathname.startsWith(PROTECTED_ADMIN_PREFIX);

  if (!isFacilityRoute && !isPhuRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const secret = getAuthSecret();

  if (!token || !secret) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const decoded = jwt.verify(token, secret) as SessionPayload;

    if (isFacilityRoute && decoded.role !== "FACILITY") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isPhuRoute && decoded.role !== "PHU" && decoded.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isAdminRoute && decoded.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/facility/:path*", "/phu/:path*", "/admin/:path*"],
};

