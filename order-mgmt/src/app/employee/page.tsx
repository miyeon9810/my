import { redirect } from "next/navigation";
import { getRole } from "@/lib/role";
import { NavBar } from "@/components/NavBar";
import { EmployeeBoard } from "@/components/EmployeeBoard";

export default async function EmployeePage() {
  const role = await getRole();
  if (role !== "employee") redirect(role === "owner" ? "/owner" : "/role");

  return (
    <>
      <NavBar title="발주 관리 · 직원" />
      <EmployeeBoard />
    </>
  );
}
