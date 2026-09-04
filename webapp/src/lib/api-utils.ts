import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function zodErrorResponse(error: ZodError) {
  const message = error.issues[0]?.message ?? "입력값이 올바르지 않아";
  return jsonError(message, 400);
}
