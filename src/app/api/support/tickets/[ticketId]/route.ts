import { NextResponse } from "next/server";
import { z } from "zod";
import { authFailed, resolveVcaasContext } from "@/app/api/vcaas/_shared";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const Reply = z.object({ body: z.string().trim().min(1).max(12_000) });

/** Returns the ticket only when it belongs to the caller's personal workspace. */
async function ownTicket(ticketId: string, ownerDid: string) {
  const db = getSupabaseAdmin();
  const { data: workspace, error: wsError } = await db.from("workspaces").select("id").eq("owner_did", ownerDid).eq("name", "Personal workspace").maybeSingle();
  if (wsError) throw new Error(wsError.message);
  if (!workspace) return null;
  const { data, error } = await db.from("support_tickets").select("id,subject,status,created_at,updated_at").eq("id", ticketId).eq("workspace_id", workspace.id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function GET(_request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  const { ticketId } = await params;
  if (!UUID.test(ticketId)) return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Ticket not found." }, { status: 404 });
  const ticket = await ownTicket(ticketId, auth.ctx.accountUserId);
  if (!ticket) return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Ticket not found." }, { status: 404 });
  const { data: messages, error } = await getSupabaseAdmin().from("support_messages").select("id,author_role,body,created_at").eq("ticket_id", ticketId).order("created_at", { ascending: true }).limit(200);
  if (error) return NextResponse.json({ ok: false, code: "SUPPORT_UNAVAILABLE", error: "Support is temporarily unavailable." }, { status: 503 });
  return NextResponse.json({ ok: true, data: { ticket, messages } }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  const { ticketId } = await params;
  if (!UUID.test(ticketId)) return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Ticket not found." }, { status: 404 });
  const parsed = Reply.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_MESSAGE", error: "Message is required." }, { status: 400 });
  const ownerDid = auth.ctx.accountUserId;
  const ticket = await ownTicket(ticketId, ownerDid);
  if (!ticket) return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Ticket not found." }, { status: 404 });
  const db = getSupabaseAdmin();
  const { data, error } = await db.from("support_messages").insert({ ticket_id: ticketId, author_did: ownerDid, author_role: "user", body: parsed.data.body }).select("id,author_role,body,created_at").single();
  if (error) return NextResponse.json({ ok: false, code: "SUPPORT_UNAVAILABLE", error: "Support is temporarily unavailable." }, { status: 503 });
  await db.from("support_tickets").update({ updated_at: new Date().toISOString(), status: "open" }).eq("id", ticketId);
  return NextResponse.json({ ok: true, data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
