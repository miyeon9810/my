import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { jsonError, zodErrorResponse } from "@/lib/api-utils";
import { createClanSchema } from "@/lib/validation";
import { createClan, ClanServiceError } from "@/lib/clan-service";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);

  const memberships = await prisma.clanMember.findMany({
    where: { userId },
    include: {
      clan: {
        include: {
          members: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json({ clans: memberships.map((m) => m.clan) });
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);

  const parsed = createClanSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const clan = await createClan(userId, parsed.data);
    return NextResponse.json({ clan }, { status: 201 });
  } catch (err) {
    if (err instanceof ClanServiceError) return jsonError(err.message, err.status);
    throw err;
  }
}
