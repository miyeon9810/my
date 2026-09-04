import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { jsonError, zodErrorResponse } from "@/lib/api-utils";
import { joinByCodeSchema } from "@/lib/validation";
import { joinPartyByCode, PartyServiceError } from "@/lib/party-service";

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);

  const parsed = joinByCodeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const party = await joinPartyByCode(userId, parsed.data.inviteCode);
    return NextResponse.json({ party });
  } catch (err) {
    if (err instanceof PartyServiceError) return jsonError(err.message, err.status);
    throw err;
  }
}
