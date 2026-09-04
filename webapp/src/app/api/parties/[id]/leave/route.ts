import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { jsonError } from "@/lib/api-utils";
import { leaveParty, PartyServiceError } from "@/lib/party-service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);
  const { id } = await params;

  try {
    await leaveParty(userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof PartyServiceError) return jsonError(err.message, err.status);
    throw err;
  }
}
