import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchGroupsByIds } from "@/lib/group-service";
import type { Group } from "@/types/game";
import { FocusTimer } from "@/components/FocusTimer";

export function Focus() {
  const { profile } = useAuth();
  const [parties, setParties] = useState<Group[]>([]);
  const [clans, setClans] = useState<Group[]>([]);

  useEffect(() => {
    fetchGroupsByIds("party", profile?.partyIds ?? []).then(setParties);
    fetchGroupsByIds("clan", profile?.clanIds ?? []).then(setClans);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.partyIds.join(","), profile?.clanIds.join(",")]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">⏱️ 집중 타이머</h1>
        <p className="mt-1 text-sm text-slate-500">
          타이머를 켜고 몰입해봐. 종료하면 분당 1XP를 얻고, 파티·클랜을 선택하면 그 집중 시간이 함께 쌓여.
        </p>
      </div>
      <FocusTimer groups={{ parties, clans }} />
    </div>
  );
}
