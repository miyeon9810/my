import { useParams } from "react-router-dom";
import { GroupDetail } from "@/components/GroupDetail";

export function ClanDetail() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <GroupDetail kind="clan" id={id} />;
}
