import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { PrivyClient } from "@privy-io/node";
import { vcaasRequest } from "@/lib/vcaas-server";

const SESSION_COOKIE = "loomspace_privy_token";

/**
 * Usage & credits — mirrors the reference platform's usage dashboard.
 * Auth: the Privy session is verified server-side before any upstream call.
 * The upstream key stays server-side; the browser never sees it.
 */
export async function GET(request: NextRequest) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
  const appSecret = process.env.PRIVY_APP_SECRET ?? "";
  if (!token || !appId || !appSecret) {
    return NextResponse.json({ ok: false, error: "Sign in is required.", code: "AUTH_REQUIRED" }, { status: 401 });
  }
  try {
    const client = new PrivyClient({ appId, appSecret });
    await client.utils().auth().verifyAuthToken(token);
  } catch {
    return NextResponse.json({ ok: false, error: "Session expired. Connect again.", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const to = new Date();
  const days = Number(request.nextUrl.searchParams.get("days") ?? 30);
  const windowDays = Number.isFinite(days) && days >= 1 && days <= 90 ? Math.floor(days) : 30;
  const from = new Date(to.getTime() - windowDays * 864e5);
  const query = `from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&groupBy=day`;

  const response = await vcaasRequest(`/usage?${query}`, { method: "GET" });
  const json = (await response.json()) as { errors: unknown; data: unknown };
  if (json.errors) {
    return NextResponse.json({ ok: false, error: "Usage is unavailable right now.", code: "USAGE_UPSTREAM" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, data: json.data }, { status: 200 });
}
