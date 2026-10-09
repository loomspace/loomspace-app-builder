import { NextResponse } from "next/server";
import { z } from "zod";
import { authFailed, resolveVcaasContext } from "@/app/api/vcaas/_shared";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const CreateTicket = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(12_000),
});

async function workspaceIdFor(ownerDid: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin().from("workspaces").select("id").eq("owner_did", ownerDid).eq("name", "Personal workspace").maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.id as string | undefined) ?? null;
}

export async function GET() {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  const workspaceId = await workspaceIdFor(auth.ctx.accountUserId);
  if (!workspaceId) return NextResponse.json({ ok: true, data: [] }, { headers: { "Cache-Control": "no-store" } });
  const { data, error } = await getSupabaseAdmin().from("support_tickets").select("id,subject,status,created_at,updated_at").eq("workspace_id", workspaceId).order("updated_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ ok: false, code: "SUPPORT_UNAVAILABLE", error: "Support is temporarily unavailable." }, { status: 503 });
  return NextResponse.json({ ok: true, data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  const parsed = CreateTicket.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_TICKET", error: "Subject and message are required." }, { status: 400 });
  const ownerDid = auth.ctx.accountUserId;
  const db = getSupabaseAdmin();
  const { error: profileError } = await db.from("profiles").upsert({ privy_did: ownerDid, updated_at: new Date().toISOString() }, { onConflict: "privy_did" });
  if (profileError) return NextResponse.json({ ok: false, code: "SUPPORT_UNAVAILABLE", error: "Support is temporarily unavailable." }, { status: 503 });
  let workspaceId = await workspaceIdFor(ownerDid);
  if (!workspaceId) {
    const { data, error } = await db.from("workspaces").insert({ owner_did: ownerDid, name: "Personal workspace" }).select("id").single();
    if (error) return NextResponse.json({ ok: false, code: "SUPPORT_UNAVAILABLE", error: "Support is temporarily unavailable." }, { status: 503 });
    workspaceId = data.id as string;
    await db.from("workspace_members").upsert({ workspace_id: workspaceId, privy_did: ownerDid, role: "owner" }, { onConflict: "workspace_id,privy_did" });
  }
  const ticket = await db.from("support_tickets").insert({ workspace_id: workspaceId, created_by: ownerDid, subject: parsed.data.subject }).select("id,subject,status,created_at").single();
  if (ticket.error) return NextResponse.json({ ok: false, code: "SUPPORT_UNAVAILABLE", error: "Support is temporarily unavailable." }, { status: 503 });
  const message = await db.from("support_messages").insert({ ticket_id: ticket.data.id, author_did: ownerDid, author_role: "user", body: parsed.data.body });
  if (message.error) return NextResponse.json({ ok: false, code: "SUPPORT_UNAVAILABLE", error: "Support is temporarily unavailable." }, { status: 503 });
  return NextResponse.json({ ok: true, data: ticket.data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
