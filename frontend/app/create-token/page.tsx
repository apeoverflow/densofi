import { Metadata } from "next";
import TokenMinterClient from "./client-page";

export const metadata: Metadata = {
  title: "Create Token | Denso.fi",
  description: "Create ERC20 tokens from domain NFTs on Denso.fi",
};

export default function CreateTokenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gradient-to-b from-gray-900 to-black text-white">
      <h1 className="text-3xl font-bold mb-8 mt-12">Create ERC20 Token</h1>
      <div className="w-full max-w-md">
        <TokenMinterClient />
      </div>
    </main>
  );
}
