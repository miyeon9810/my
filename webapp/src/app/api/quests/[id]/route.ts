import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { jsonError, zodErrorResponse } from "@/lib/api-utils";
import { updateQuestSchema } from "@/lib/validation";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);
  const { id } = await params;

  const existing = await prisma.quest.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return jsonError("퀘스트를 찾을 수 없어", 404);

  const parsed = updateQuestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  const quest = await prisma.quest.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.difficulty !== undefined ? { difficulty: data.difficulty } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
  });

  return NextResponse.json({ quest });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return jsonError("로그인이 필요해", 401);
  const { id } = await params;

  const existing = await prisma.quest.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return jsonError("퀘스트를 찾을 수 없어", 404);

  await prisma.quest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
