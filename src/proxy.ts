import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();
  const url = request.nextUrl.clone();

  if (host === "cms.sitetarik.com" && !url.pathname.startsWith("/cms")) {
    url.pathname = "/cms";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|icon.png|.*\\..*).*)"],
};

