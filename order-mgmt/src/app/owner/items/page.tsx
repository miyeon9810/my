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
      <NavBar title="품목 · 거래처 관리" />
      <div className="mx-auto max-w-2xl px-4 pt-4 sm:px-6">
        <Link href="/owner" className="text-sm font-semibold text-stone-600 underline">
          ← 발주 확인으로
        </Link>
      </div>
      <VendorItemsManager />
    </>
  );
}
