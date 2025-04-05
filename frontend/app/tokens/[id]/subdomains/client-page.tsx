'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from '@tabler/icons-react';

export function TokenSubdomainsClient({ id }: { id: string }) {
  const [isClient, setIsClient] = useState(false);
  const [subdomainName, setSubdomainName] = useState('');
  const [stakingAmount, setStakingAmount] = useState('');
  
  // Mock user token balance
  const userTokenBalance = 250;
  
  // Mock active subdomains
  const activeSubdomains = [
    { name: 'app.domain123.eth', stakedAmount: 100, registrationDate: 'April 28, 2025' },
    { name: 'blog.domain123.eth', stakedAmount: 75, registrationDate: 'April 30, 2025' },
  ];
  
  // Mock domain data
  const domainData = {
    name: `domain${id}.eth`,
    minimumStake: 50,
  };
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Don't render anything during SSR
  if (!isClient) {
    return null;
  }
  
  const handleSubdomainRegistration = () => {
    if (!subdomainName || !stakingAmount) {
      alert('Please enter both subdomain name and staking amount');
      return;
    }
    
    if (parseInt(stakingAmount) < domainData.minimumStake) {
      alert(`Minimum staking amount is ${domainData.minimumStake} tokens`);
      return;
    }
    
    if (parseInt(stakingAmount) > userTokenBalance) {
      alert('You do not have enough tokens to stake this amount');
      return;
    }
    
    alert(`Subdomain ${subdomainName}.${domainData.name} registered successfully with ${stakingAmount} tokens staked!`);
    setSubdomainName('');
    setStakingAmount('');
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 to-black overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/3 w-1/3 h-1/3 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      <main className="relative z-10 flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with back button */}
          <div className="mb-8">
            <Link href={`/tokens/${id}`} className="inline-flex items-center text-gray-400 hover:text-white mb-4">
              <IconArrowLeft size={16} className="mr-1" />
              Back to Token
            </Link>
            <h1 className="text-3xl font-bold text-white">Register Subdomain</h1>
            <p className="text-gray-400 mt-2">
              Stake your {domainData.name} tokens to register and use subdomains
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Token Info */}
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Your Token Balance</h2>
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <p className="text-gray-400 mb-1">Available Tokens</p>
                <p className="text-2xl font-bold text-white">{userTokenBalance} {domainData.name}</p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-gray-400 text-sm">
                  To register a subdomain, you need to stake a minimum of {domainData.minimumStake} tokens. 
                  These tokens will be locked while your subdomain is active.
                </p>
              </div>
            </GlassCard>
            
            {/* Registration Form */}
            <GlassCard className="p-6 border border-white/10 relative overflow-hidden">
              {/* Animated gradient border effect */}
              <div className="absolute inset-[1px] bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 animate-pulse opacity-15 blur-lg"></div>
              
              <div className="relative">
                <h2 className="text-xl font-bold text-white mb-4">Register New Subdomain</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Subdomain Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={subdomainName}
                        onChange={(e) => setSubdomainName(e.target.value)}
                        placeholder="mysubdomain"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        .{domainData.name}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Tokens to Stake</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={stakingAmount}
                        onChange={(e) => setStakingAmount(e.target.value)}
                        placeholder={domainData.minimumStake.toString()}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        Tokens
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">Minimum: {domainData.minimumStake} tokens</p>
                  </div>
                  
                  <Button
                    className="w-full py-3 mt-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:brightness-110 text-white"
                    onClick={handleSubdomainRegistration}
                  >
                    Register Subdomain
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>
          
          {/* Active Subdomains Section */}
          <GlassCard className="p-6 mt-6">
            <h2 className="text-xl font-bold text-white mb-4">Your Active Subdomains</h2>
            {activeSubdomains.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-white/10">
                      <th className="px-4 py-3">Subdomain</th>
                      <th className="px-4 py-3">Staked Amount</th>
                      <th className="px-4 py-3">Registration Date</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSubdomains.map((subdomain, index) => (
                      <tr key={index} className="border-b border-white/5 text-white">
                        <td className="px-4 py-4">{subdomain.name}</td>
                        <td className="px-4 py-4">{subdomain.stakedAmount} tokens</td>
                        <td className="px-4 py-4">{subdomain.registrationDate}</td>
                        <td className="px-4 py-4">
                          <Button variant="outline" size="sm" className="text-xs">
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                You don't have any active subdomains yet.
              </div>
            )}
          </GlassCard>
        </div>
      </main>
    </div>
  );
}