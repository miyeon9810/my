import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { isFirebaseConfigured } from "@/lib/firebase";
import { SetupRequired } from "@/pages/SetupRequired";
import { Landing } from "@/pages/Landing";
import { Dashboard } from "@/pages/Dashboard";
import { Parties } from "@/pages/Parties";
import { PartyDetail } from "@/pages/PartyDetail";
import { Clans } from "@/pages/Clans";
import { ClanDetail } from "@/pages/ClanDetail";
import { Focus } from "@/pages/Focus";
import { Achievements } from "@/pages/Achievements";

// HashRouter (routes as /#/dashboard) so the built app works from any
// path/subfolder on GitHub Pages without server-side rewrite rules.
export default function App() {
  if (!isFirebaseConfigured) return <SetupRequired />;

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/parties" element={<Parties />} />
            <Route path="/parties/:id" element={<PartyDetail />} />
            <Route path="/clans" element={<Clans />} />
            <Route path="/clans/:id" element={<ClanDetail />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/achievements" element={<Achievements />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
