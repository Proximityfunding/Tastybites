import { auth } from "@/auth";
import { NextResponse } from "next/server";

const STAFF_PREFIXES = [
  "/dashboard",
  "/pos",
  "/orders",
  "/inventory",
  "/products",
  "/suppliers",
  "/expenses",
  "/deliveries",
  "/reports",
  "/pnl",
  "/users",
  "/customers",
  "/audit",
  "/kitchen",
];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isStaffRoute = STAFF_PREFIXES.some(
    (p) => nextUrl.pathname === p || nextUrl.pathname.startsWith(`${p}/`)
  );

  if (isStaffRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (nextUrl.pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
