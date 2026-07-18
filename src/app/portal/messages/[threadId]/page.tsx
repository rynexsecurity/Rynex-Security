import { redirect } from "next/navigation";

interface Params {
  threadId: string;
}

export default async function ThreadRedirectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { threadId } = await params;
  redirect(`/portal/messages?threadId=${threadId}`);
}
