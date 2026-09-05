import { NextRequest, NextResponse } from "next/server";
import { setRole, clearRole } from "@/lib/role";
import { jsonError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (body?.role !== "employee" && body?.role !== "owner") {
    return jsonError("역할을 선택해줘", 400);
  }
  await setRole(body.role);
  return NextResponse.json({ role: body.role });
}

export async function DELETE() {
  await clearRole();
  return NextResponse.json({ ok: true });
}
