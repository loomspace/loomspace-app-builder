import { NextResponse } from "next/server";
import { authFailed, resolveVcaasContext } from "@/app/api/vcaas/_shared";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/** Lists only workspaces where the caller is a member (Supabase membership table). */
export async function GET() {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  const db = getSupabaseAdmin();
  const { data: memberships, error } = await db.from("workspace_members").select("role, workspaces(id,name,created_at)").eq("privy_did", auth.ctx.accountUserId);
  if (error) return NextResponse.json({ ok: false, error: "Workspace is temporarily unavailable." }, { status: 503 });
  const data = (memberships ?? []).flatMap((row) => {
    const ws = row.workspaces as unknown as { id: string; name: string; created_at: string } | null;
    return ws ? [{ id: ws.id, name: ws.name, role: row.role as string, created_at: ws.created_at }] : [];
  });
  return NextResponse.json({ ok: true, data }, { headers: { "Cache-Control": "no-store" } });
}
