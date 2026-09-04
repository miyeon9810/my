import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { jsonError, zodErrorResponse } from "@/lib/api-utils";
import { startFocusSessionSchema } from "@/lib/validation";
import { startFocusSession, FocusServiceError } from "@/lib/focus-service";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);

  const [active, recent] = await Promise.all([
    prisma.focusSession.findFirst({ where: { userId, endedAt: null } }),
    prisma.focusSession.findMany({
      where: { userId, endedAt: { not: null } },
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        party: { select: { id: true, name: true } },
        clan: { select: { id: true, name: true } },
        quest: { select: { id: true, title: true } },
      },
    }),
  ]);

  return NextResponse.json({ active, recent });
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);

  const parsed = startFocusSessionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const session = await startFocusSession(userId, parsed.data);
    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    if (err instanceof FocusServiceError) return jsonError(err.message, err.status);
    throw err;
  }
}
