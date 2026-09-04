import { GroupDetail } from "@/components/GroupDetail";

export default async function PartyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GroupDetail kind="party" id={id} />;
}
