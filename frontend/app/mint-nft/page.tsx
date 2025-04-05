import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mint Domain NFT | Denso.fi",
  description: "Mint domain NFTs on Denso.fi",
};

export default function MintNFTPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gradient-to-b from-gray-900 to-black text-white">
      <h1 className="text-3xl font-bold mb-8 mt-12">Mint Domain NFT</h1>
      <div className="w-full max-w-md">
        <ClientComponent />
      </div>
    </main>
  );
}

// This is a placeholder component that will be replaced by the client component
function ClientComponent() {
  return <div>Loading NFT minter...</div>;
}