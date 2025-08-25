import { Metadata } from 'next';
import InvestorRelationsPage from './InvestorRelationsPage';

export const metadata: Metadata = {
  title: 'Investor Relations - Densofi',
  description: 'Investment opportunity in the $2.4B domain tokenization market. View our traction, TAM, and growth metrics for potential investors and strategic partners.',
  keywords: [
    'densofi investor relations',
    'domain tokenization investment',
    'blockchain startup funding',
    'defi investment opportunity',
    'domain market TAM',
    'tokenization metrics'
  ],
  openGraph: {
    title: 'Investor Relations - Densofi',
    description: 'Investment opportunity in the $2.4B domain tokenization market. View our traction, TAM, and growth metrics.',
    type: 'website',
  },
};

export default function Page() {
  return <InvestorRelationsPage />;
}