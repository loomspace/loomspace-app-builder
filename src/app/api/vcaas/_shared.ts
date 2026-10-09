import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrivyClient } from "@privy-io/node";
import { userOwnsProject } from "@/lib/loomspace-ownership";

export { isRoutableProjectSlug } from "@/lib/project-slug";

const SESSION_COOKIE = "loomspace_privy_token";

export interface VcaasContext {
  accountUserId: string;
}

export interface VcaasAuthOk {
  ok: true;
  ctx: VcaasContext;
  team: { userId: string };
}

export type VcaasAuthResult = VcaasAuthOk | { ok: false; response: NextResponse };
export type VcaasAuthFailed = Extract<VcaasAuthResult, { ok: false }>;

export function authFailed(result: VcaasAuthResult): result is VcaasAuthFailed {
  return result.ok === false;
}

export async function resolveVcaasContext(): Promise<VcaasAuthResult> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
  const appSecret = process.env.PRIVY_APP_SECRET ?? "";
  if (!token || !appId || !appSecret) {
    return { ok: false, response: NextResponse.json({ ok: false, error: "Sign in is required.", code: "AUTH_REQUIRED" }, { status: 401 }) };
  }
  try {
    const client = new PrivyClient({ appId, appSecret });
    const claim = await client.utils().auth().verifyAuthToken(token);
    const userId = claim.user_id;
    if (!userId) throw new Error("Privy token has no user identity");
    return { ok: true, ctx: { accountUserId: userId }, team: { userId } };
  } catch {
    return { ok: false, response: NextResponse.json({ ok: false, error: "Session expired. Connect again.", code: "AUTH_REQUIRED" }, { status: 401 }) };
  }
}

export async function enforceProjectScope(team: { userId: string }, _method: string, path: string[]): Promise<NextResponse | null> {
  const projectId = path[1];
  if (!projectId || !(await userOwnsProject(team.userId, projectId))) {
    return NextResponse.json({ ok: false, error: "Project not found.", code: "NOT_FOUND" }, { status: 404 });
  }
  return null;
}
