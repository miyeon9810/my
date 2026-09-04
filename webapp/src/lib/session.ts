import { auth } from "@/lib/auth";

// Returns the signed-in user's session, or null.
export async function getSession() {
  return auth();
}

// For API routes: resolves the current user id or returns null so the
// caller can respond with 401.
export async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
