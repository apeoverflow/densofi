import { Metadata } from 'next';
import { TokenSubdomainsClient } from './client-page';

export const metadata: Metadata = {
  title: 'Register Subdomains | Denso.fi',
  description: 'Register subdomains by staking your domain tokens',
};

export default function TokenSubdomainsPage({ params }: { params: { id: string } }) {
  return <TokenSubdomainsClient id={params.id} />;
}