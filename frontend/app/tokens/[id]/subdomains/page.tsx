import { Metadata } from 'next';
import { TokenSubdomainsClient } from './client-page';

export const metadata: Metadata = {
  title: 'Register Subdomains | Denso.fi',
  description: 'Register subdomains by staking your domain tokens',
};

interface PageParams {
  params: Promise<{ id: string }> | { id: string };
}

export default async function TokenSubdomainsPage({ params }: PageParams) {
  const resolvedParams = await params;
  return <TokenSubdomainsClient id={resolvedParams.id} />;
}