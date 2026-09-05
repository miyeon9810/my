import { cookies } from "next/headers";

export type Role = "employee" | "owner";

const ROLE_COOKIE = "role";

export async function getRole(): Promise<Role | null> {
  const store = await cookies();
  const value = store.get(ROLE_COOKIE)?.value;
  return value === "employee" || value === "owner" ? value : null;
}

export async function setRole(role: Role) {
  const store = await cookies();
  store.set(ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearRole() {
  const store = await cookies();
  store.delete(ROLE_COOKIE);
}
