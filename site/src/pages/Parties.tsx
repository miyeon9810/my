import { GroupList } from "@/components/GroupList";

export function Parties() {
  return (
    <GroupList
      kind="party"
      emoji="🤝"
      title="파티"
      description="같은 사이드 목표를 향해 함께 가는 사람들. 인생엔 여러 목표가 있으니, 목표마다 파티를 따로 맺어도 돼."
    />
  );
}
