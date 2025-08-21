'use client';

import { GlassCard } from "./GlassCard";

export function ComparisonSection() {
  const comparisonData = [
    {
      feature: "Fractional ownership",
      traditional: false,
      ens: false,
      densofi: true,
    },
    {
      feature: "Instant liquidity",
      traditional: false,
      ens: "Partial",
      densofi: true,
    },
    {
      feature: "Cross-chain support",
      traditional: false,
      ens: "Partial",
      densofi: true,
    },
    {
      feature: "DeFi integration",
      traditional: false,
      ens: true,
      densofi: true,
    },
    {
      feature: "Subdomain monetization",
      traditional: false,
      ens: "Limited",
      densofi: true,
    },
    {
      feature: "Price discovery via LP",
      traditional: false,
      ens: false,
      densofi: true,
    },
  ];

  const renderCell = (value: boolean | string) => {
    if (value === true) {
      return <span className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.7)]">✓</span>;
    }
    if (value === false) {
      return <span className="text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]">✗</span>;
    }
    return <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]">{value}</span>;
  };

  return (
    <div className="container mx-auto px-4 mt-16">
      <GlassCard className="max-w-5xl mx-auto p-4 md:p-8">
        <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
          Why Choose <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Densofi</span>?
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-2 text-sm md:p-4 md:text-base font-medium text-gray-300">Feature</th>
                <th className="p-2 text-sm md:p-4 md:text-base font-medium text-center text-gray-300">Traditional Domains</th>
                <th className="p-2 text-sm md:p-4 md:text-base font-medium text-center text-gray-300">ENS</th>
                <th className="p-2 text-sm md:p-4 md:text-base font-medium text-center text-blue-400">Densofi</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, index) => (
                <tr key={index} className="border-t border-white/5 transition-colors duration-300">
                  <td className="p-2 text-sm md:p-4 md:text-base text-gray-300">{row.feature}</td>
                  <td className="p-2 text-sm md:p-4 md:text-base text-center">{renderCell(row.traditional)}</td>
                  <td className="p-2 text-sm md:p-4 md:text-base text-center">{renderCell(row.ens)}</td>
                  <td className="p-2 text-sm md:p-4 md:text-base text-center">{renderCell(row.densofi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}