'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import dynamic from 'next/dynamic';
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { IconArrowDown, IconArrowUp, IconTrendingUp, IconLoader } from '@tabler/icons-react';
import { ComingSoonModal } from "@/components/ui/ComingSoonModal";
import { useToken } from "@/hooks/useTokens";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export function TokenPageClient({ id }: { id: string }) {
  // Client-side only flag
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  // Modal state
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
  
  // Fetch token data from database
  const { token, loading, error } = useToken(decodeURIComponent(id));

  useEffect(() => {
    // Show modal if token not found and not loading
    if (isClient && !loading && !token && !error) {
      setIsComingSoonModalOpen(true);
    }
  }, [isClient, loading, token, error]);

  // Generate mock chart data based on real token price
  const generateChartData = () => {
    if (!token) return [];
    
    const nowDate = new Date();
    const data = [];
    
    // Number of data points based on timeframe
    const dataPoints = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : timeframe === '30d' ? 720 : 1440;
    
    // Generate data for the specified timeframe
    for (let i = dataPoints; i >= 0; i--) {
      const time = new Date(nowDate.getTime() - i * 3600 * 1000);
      
      // Base price with random fluctuation (more volatile for shorter timeframes)
      const volatilityFactor = timeframe === '24h' ? 0.08 : timeframe === '7d' ? 0.05 : 0.03;
      const randomFactor = 1 + (Math.random() - 0.5) * volatilityFactor;
      
      // Create an upward trend for the chart based on 24h change
      const trendDirection = token.change24h >= 0 ? 1 : -1;
      const trendMagnitude = Math.abs(token.change24h) / 100;
      const trendFactor = 1 + (dataPoints - i) / dataPoints * trendDirection * trendMagnitude;
      
      // Combine factors for final price
      const price = token.currentPrice * randomFactor * trendFactor;
      
      data.push({
        x: time.getTime(),
        y: price.toFixed(6),
      });
    }
    
    return data;
  };

  const chartOptions = {
    chart: {
      type: 'area' as const,
      height: 350,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
      background: 'transparent',
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth' as const,
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 90, 100],
        colorStops: [
          {
            offset: 0,
            color: (token?.change24h ?? 0) >= 0 ? '#10B981' : '#EF4444',
            opacity: 0.4
          },
          {
            offset: 100,
            color: (token?.change24h ?? 0) >= 0 ? '#10B981' : '#EF4444',
            opacity: 0
          }
        ]
      }
    },
    colors: [(token?.change24h ?? 0) >= 0 ? '#10B981' : '#EF4444'],
    grid: {
      show: true,
      borderColor: '#333333',
      strokeDashArray: 3,
      position: 'back' as const,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      x: {
        format: 'dd MMM yyyy HH:mm'
      },
    },
    xaxis: {
      type: 'datetime' as const,
      labels: {
        style: {
          colors: '#9ca3af',
        },
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#9ca3af',
        },
        formatter: function(value: number) {
          return value.toFixed(6) + ' ETH';
        }
      },
    },
    theme: {
      mode: 'dark' as const,
    }
  };

  const series = [{
    name: 'Price',
    data: generateChartData()
  }];
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Don't render anything during SSR
  if (!isClient) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 to-black overflow-hidden">
        <div className="flex justify-center items-center min-h-screen">
          <div className="flex items-center space-x-3">
            <IconLoader className="animate-spin text-blue-500" size={32} />
            <span className="text-gray-300 text-lg">Loading token details...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 to-black overflow-hidden">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <p className="text-red-400 text-xl mb-4">Failed to load token</p>
            <p className="text-gray-400">{error}</p>
            <Link href="/tokens" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
              ← Back to tokens
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Token not found
  if (!token) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 to-black overflow-hidden">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-300 text-xl mb-4">Token not found</p>
            <p className="text-gray-400 mb-6">The domain token "{decodeURIComponent(id)}" does not exist.</p>
            <Link href="/tokens" className="text-blue-400 hover:text-blue-300">
              ← Back to tokens
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle buy/sell submission
  const handleTradeSubmit = () => {
    alert(`${activeTab.toUpperCase()} order submitted for ${amount} ${token.name} tokens`);
    setAmount('');
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
        <div className="max-w-6xl mx-auto">
          {/* Token Header Section */}
          <div className="flex flex-wrap items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {token.name}
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-white">{token.currentPrice.toFixed(6)} ETH</span>
                <span className={`flex items-center ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {token.change24h >= 0 ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />}
                  {Math.abs(token.change24h).toFixed(2)}%
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2 mt-4 sm:mt-0">
              <Link href={`/tokens/${id}/subdomains`}>
                <Button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:brightness-110 text-white">Register Subdomain</Button>
              </Link>
              <Button variant="outline" className="border-white/30 hover:bg-white/10">Share</Button>
            </div>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section - Takes up 2/3 of the space on desktop */}
            <div className="lg:col-span-2">
              <GlassCard className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Price Chart</h2>
                  <div className="flex space-x-2">
                    {(['24h', '7d', '30d', 'all'] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          timeframe === tf 
                            ? 'bg-white/10 text-white' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="h-[350px] w-full">
                  {isClient && (
                    <Chart
                      options={chartOptions}
                      series={series}
                      type="area"
                      height={350}
                    />
                  )}
                </div>
              </GlassCard>
              
              {/* Token Stats Section */}
              <GlassCard className="p-6 mt-6">
                <h2 className="text-xl font-bold text-white mb-4">Token Stats</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">Market Cap</p>
                    <p className="text-white font-medium">${token.marketCap.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">24h Volume</p>
                    <p className="text-white font-medium">{token.volume24h.toFixed(1)} ETH</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">Circulating Supply</p>
                    <p className="text-white font-medium">{token.circulatingSupply.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">Total Supply</p>
                    <p className="text-white font-medium">{token.totalSupply.toLocaleString()}</p>
                  </div>
                </div>
              </GlassCard>
            </div>
            
            {/* Trade Section - Takes up 1/3 of the space on desktop */}
            <div>
              <GlassCard className="p-6 border border-white/10 relative overflow-hidden">
                {/* Animated gradient border effect */}
                <div className="absolute inset-[1px] bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 animate-pulse opacity-15 blur-lg"></div>
                
                <div className="relative">
                  <h2 className="text-xl font-bold text-white mb-4">Trade Tokens</h2>
                  
                  {/* Buy/Sell Tab Selector */}
                  <div className="flex mb-6">
                    <button
                      className={`flex-1 py-2 text-center rounded-l-lg ${
                        activeTab === 'buy'
                          ? 'bg-emerald-500/20 text-emerald-400 border-t border-l border-b border-emerald-500/30'
                          : 'bg-white/5 text-gray-400 border-t border-l border-b border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => setActiveTab('buy')}
                    >
                      Buy
                    </button>
                    <button
                      className={`flex-1 py-2 text-center rounded-r-lg ${
                        activeTab === 'sell'
                          ? 'bg-red-500/20 text-red-400 border-t border-r border-b border-red-500/30'
                          : 'bg-white/5 text-gray-400 border-t border-r border-b border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => setActiveTab('sell')}
                    >
                      Sell
                    </button>
                  </div>
                  
                  {/* Trade Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Amount</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                          Tokens
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Estimated Cost</label>
                      <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white">
                        {amount ? (parseFloat(amount) * token.currentPrice).toFixed(6) : '0.00'} ETH
                      </div>
                    </div>
                    
                    <Button
                      className={`w-full py-3 mt-4 ${
                        activeTab === 'buy'
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white'
                          : 'bg-gradient-to-r from-red-600 to-red-500 hover:brightness-110 text-white'
                      }`}
                      onClick={handleTradeSubmit}
                    >
                      {activeTab === 'buy' ? 'Buy Tokens' : 'Sell Tokens'}
                    </Button>
                  </div>
                  
                  {/* Extra Trading Info */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Token Price</span>
                      <span className="text-white">{token.currentPrice.toFixed(6)} ETH</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Transaction Fee</span>
                      <span className="text-white">0.5%</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
              
              {/* Domain Info */}
              <GlassCard className="p-6 mt-6">
                <h2 className="text-xl font-bold text-white mb-4">Domain Information</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Domain Name</span>
                    <span className="text-white">{token.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Owner Address</span>
                    <span className="text-white text-xs font-mono">{`${token.ownerAddress.slice(0, 6)}...${token.ownerAddress.slice(-4)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Registration Date</span>
                    <span className="text-white">{token.registrationDate ? new Date(token.registrationDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expiration Date</span>
                    <span className="text-white">{new Date(token.expirationDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">NFT Token ID</span>
                    <span className="text-white">{token.nftTokenId || 'Not minted'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subdomains</span>
                    <span className="text-white">{token.subdomainCount} Active</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </main>
      
      {/* Trading Coming Soon Modal */}
      <ComingSoonModal 
        isOpen={isComingSoonModalOpen} 
        onClose={() => setIsComingSoonModalOpen(false)}
        title="Token Trading Coming Soon"
        description="Trading functionality is coming soon! For now, you can view detailed information about this domain token."
      />
    </div>
  );
}
