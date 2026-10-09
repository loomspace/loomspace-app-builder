import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/node";

const COOKIE = "loomspace_privy_token";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
  const appSecret = process.env.PRIVY_APP_SECRET ?? "";
  if (!accessToken || !appId || !appSecret) return NextResponse.json({ ok: false, error: "Authentication is not configured" }, { status: 401 });
  try {
    const client = new PrivyClient({ appId, appSecret });
    await client.utils().auth().verifyAuthToken(accessToken);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE, accessToken, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 });
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "Privy token verification failed" }, { status: 401 });
  }
}

export function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
  return response;
}
