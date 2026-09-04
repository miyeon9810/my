import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { jsonError, zodErrorResponse } from "@/lib/api-utils";
import { createPartySchema } from "@/lib/validation";
import { createParty, PartyServiceError } from "@/lib/party-service";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);

  const memberships = await prisma.partyMember.findMany({
    where: { userId },
    include: {
      party: {
        include: {
          members: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json({ parties: memberships.map((m) => m.party) });
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);

  const parsed = createPartySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const party = await createParty(userId, parsed.data);
    return NextResponse.json({ party }, { status: 201 });
  } catch (err) {
    if (err instanceof PartyServiceError) return jsonError(err.message, err.status);
    throw err;
  }
}
