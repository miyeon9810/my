import { redirect } from "next/navigation";
import { getRole } from "@/lib/role";

export default async function RootPage() {
  const role = await getRole();
  redirect(role === "owner" ? "/owner" : role === "employee" ? "/employee" : "/role");
}
