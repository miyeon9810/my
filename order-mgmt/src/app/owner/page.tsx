import Link from "next/link";
import { redirect } from "next/navigation";
import { getRole } from "@/lib/role";
import { NavBar } from "@/components/NavBar";
import { OwnerChecklist } from "@/components/OwnerChecklist";

export default async function OwnerPage() {
  const role = await getRole();
  if (role !== "owner") redirect(role === "employee" ? "/employee" : "/role");

  return (
    <>
      <NavBar title="발주 관리 · 사장님" />
      <div className="mx-auto flex max-w-2xl justify-end px-4 pt-4 sm:px-6">
        <Link href="/owner/items" className="text-sm text-blue-600 hover:underline">
          품목/거래처 관리
        </Link>
      </div>
      <OwnerChecklist />
    </>
  );
}
