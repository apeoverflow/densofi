'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import { investorMetrics } from '../data/metrics';

type ChartType = 'users' | 'volume';

export default function TractionChart() {
  const [activeChart, setActiveChart] = useState<ChartType>('users');

  const chartData = {
    users: {
      title: 'Monthly Active Users',
      icon: <Users className="w-5 h-5" />,
      data: investorMetrics.tractionData.userGrowth,
      color: 'bg-blue-500',
      gradientColor: 'from-blue-500/20 to-blue-500/5'
    },
    volume: {
      title: 'Monthly Volume (USD)',
      icon: <DollarSign className="w-5 h-5" />,
      data: investorMetrics.tractionData.volumeGrowth,
      color: 'bg-green-500',
      gradientColor: 'from-green-500/20 to-green-500/5'
    }
  };

  const currentChart = chartData[activeChart];
  const maxValue = Math.max(...currentChart.data.map(d => activeChart === 'users' ? d.users : d.volume));

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
    >
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Platform Traction</h3>
        </div>
        
        {/* Chart Type Selector */}
        <div className="flex gap-2">
          {Object.entries(chartData).map(([key, chart]) => (
            <button
              key={key}
              onClick={() => setActiveChart(key as ChartType)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeChart === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              {chart.icon}
              <span className="hidden sm:inline">
                {key === 'users' ? 'Users' : 'Volume'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <h4 className="text-lg font-medium text-white">{currentChart.title}</h4>
          <div className="flex items-center gap-1 text-green-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Growing</span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="space-y-3">
          {currentChart.data.map((item, index) => {
            const value = activeChart === 'users' ? item.users : item.volume;
            const percentage = (value / maxValue) * 100;
            const isProjected = item.month.includes('2025');

            return (
              <motion.div
                key={item.month}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm font-medium">
                    {item.month}
                    {isProjected && (
                      <span className="text-yellow-400 text-xs ml-1">(Projected)</span>
                    )}
                  </span>
                  <span className="text-white font-semibold">
                    {activeChart === 'users' 
                      ? value.toLocaleString() 
                      : `$${value.toLocaleString()}`
                    }
                  </span>
                </div>
                
                <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className={`h-full ${currentChart.color} relative`}
                  >
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${currentChart.gradientColor}`} />
                    
                    {/* Projected data pattern */}
                    {isProjected && (
                      <div className="absolute inset-0 bg-yellow-400/20 bg-[length:8px_8px] bg-[linear-gradient(45deg,transparent_25%,currentColor_25%,currentColor_50%,transparent_50%,transparent_75%,currentColor_75%)] opacity-30" />
                    )}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-700/50">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {investorMetrics.tractionData.domains.registered}?
            </p>
            <p className="text-gray-400 text-xs">Domains Registered</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {investorMetrics.tractionData.domains.tokenized}?
            </p>
            <p className="text-gray-400 text-xs">Tokenized</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {investorMetrics.tractionData.domains.launched}?
            </p>
            <p className="text-gray-400 text-xs">DEX Launched</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}