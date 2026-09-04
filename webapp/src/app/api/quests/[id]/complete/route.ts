import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { jsonError } from "@/lib/api-utils";
import { completeQuest, QuestServiceError } from "@/lib/quest-service";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);
  const { id } = await params;

  try {
    const result = await completeQuest(id, userId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof QuestServiceError) return jsonError(err.message, err.status);
    throw err;
  }
}
