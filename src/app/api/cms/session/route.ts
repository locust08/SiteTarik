import { NextResponse } from "next/server";
import {
  cmsSessionCookieName,
  cmsSessionMaxAgeSeconds,
  createCmsSessionValue,
  isCmsPasswordConfigured,
  verifyCmsPassword,
} from "@/lib/cms-auth";

export const runtime = "nodejs";

type SessionRequestBody = {
  password?: unknown;
};

export async function POST(request: Request) {
  if (!isCmsPasswordConfigured()) {
    return NextResponse.json({ error: "CMS password is not configured." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as SessionRequestBody | null;
  const password = typeof body?.password === "string" ? body.password : "";

  if (!verifyCmsPassword(password)) {
    return NextResponse.json({ error: "Password incorrect. Please try again." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set(cmsSessionCookieName, createCmsSessionValue(), {
    httpOnly: true,
    maxAge: cmsSessionMaxAgeSeconds,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set(cmsSessionCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
