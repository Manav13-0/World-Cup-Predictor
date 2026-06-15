import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const protectedRoutes = ["/dashboard", "/history", "/leagues", "/matches"];
const adminRoutes = ["/admin"];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const session = request.auth;

  if (adminRoutes.some((route) => pathname.startsWith(route)) && session?.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/history/:path*", "/leagues/:path*", "/matches/:path*", "/admin/:path*"]
};
