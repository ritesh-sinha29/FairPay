import { ArkivJobDetail } from "@/components/arkiv-job-detail";

export default async function ArkivJobPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  return <ArkivJobDetail entityKey={decodeURIComponent(key)} />;
}

