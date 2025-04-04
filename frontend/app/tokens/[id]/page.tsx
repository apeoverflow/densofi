import { TokenPageClient } from './client-page';

// @ts-expect-error - Params type conflict
export default function TokenPage({ params }: any) {
  return <TokenPageClient id={params.id} />;
}