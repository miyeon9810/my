import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { jsonError } from "@/lib/api-utils";
import { stopFocusSession, FocusServiceError } from "@/lib/focus-service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);
  const { id } = await params;

  try {
    const result = await stopFocusSession(userId, id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof FocusServiceError) return jsonError(err.message, err.status);
    throw err;
  }
}
