import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/404") {
    return NextResponse.rewrite(new URL("/page-not-found", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/404"],
};
