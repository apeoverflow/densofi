import { TokenPageClient } from './client-page';

interface PageParams {
  params: Promise<{ id: string }> | { id: string };
}

export default async function TokenPage({ params }: PageParams) {
  const resolvedParams = await params;
  return <TokenPageClient id={resolvedParams.id} />;
}