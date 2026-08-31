import { NextRequest, NextResponse } from "next/server";

const AUTH_ROUTES = ["/", "/auth/phone", "/auth/profile"];
const PROTECTED_PREFIXES = [
  "/home",
  "/search",
  "/booking",
  "/tracking",
  "/bookings",
  "/advanced",
  "/profile",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(request.cookies.get("booklan_session")?.value);

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
