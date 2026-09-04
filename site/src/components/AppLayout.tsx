import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { RewardToastProvider } from "./reward-toast";
import { NavBar } from "./NavBar";

export function AppLayout() {
  const { effectiveUser, loading } = useAuth();

  if (loading) return null;
  if (!effectiveUser) return <Navigate to="/" replace />;

  return (
    <RewardToastProvider>
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </RewardToastProvider>
  );
}
