import type { ReactNode } from "react";
import { NavBar } from "@/components/NavBar";
import { RewardToastProvider } from "@/components/reward-toast";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RewardToastProvider>
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </RewardToastProvider>
  );
}
