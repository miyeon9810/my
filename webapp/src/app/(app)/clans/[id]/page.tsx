import { GroupDetail } from "@/components/GroupDetail";

export default async function ClanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GroupDetail kind="clan" id={id} />;
}
