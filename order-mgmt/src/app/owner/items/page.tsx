import Link from "next/link";
import { redirect } from "next/navigation";
import { getRole } from "@/lib/role";
import { NavBar } from "@/components/NavBar";
import { VendorItemsManager } from "@/components/VendorItemsManager";

export default async function OwnerItemsPage() {
  const role = await getRole();
  if (role !== "owner") redirect(role === "employee" ? "/employee" : "/role");

  return (
    <>
      <NavBar title="발주 관리 · 품목/거래처" />
      <div className="mx-auto max-w-2xl px-4 pt-4 sm:px-6">
        <Link href="/owner" className="text-sm text-blue-600 hover:underline">
          ← 발주 체크리스트로
        </Link>
      </div>
      <VendorItemsManager />
    </>
  );
}
