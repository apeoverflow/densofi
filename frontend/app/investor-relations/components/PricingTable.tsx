'use client';

import { motion } from 'framer-motion';
import { Check, DollarSign } from 'lucide-react';
import { investorMetrics } from '../data/metrics';

export default function PricingTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="space-y-8"
    >
      {/* Revenue Model Overview */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-green-400" />
          <h3 className="text-xl font-semibold text-white">Revenue Streams</h3>
        </div>
        <p className="text-gray-300 mb-6">
          Multiple fee structures ensure sustainable revenue growth while providing value to all stakeholders.
        </p>
        
        {/* Revenue breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-700/30 rounded-lg">
            <p className="text-2xl font-bold text-green-400">~$1K?</p>
            <p className="text-gray-400 text-sm">Monthly Revenue</p>
          </div>
          <div className="text-center p-4 bg-gray-700/30 rounded-lg">
            <p className="text-2xl font-bold text-blue-400">1-3%</p>
            <p className="text-gray-400 text-sm">Fee Range</p>
          </div>
          <div className="text-center p-4 bg-gray-700/30 rounded-lg">
            <p className="text-2xl font-bold text-purple-400">4</p>
            <p className="text-gray-400 text-sm">Revenue Streams</p>
          </div>
          <div className="text-center p-4 bg-gray-700/30 rounded-lg">
            <p className="text-2xl font-bold text-yellow-400">85%</p>
            <p className="text-gray-400 text-sm">Gross Margin</p>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {investorMetrics.pricingTiers.map((tier, index) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 ${
              tier.name === 'Trading Fees' ? 'ring-2 ring-blue-500/20' : ''
            }`}
          >
            {/* Tier Header */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                {tier.name}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {tier.description}
              </p>
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {tier.fee}
              </div>
              {tier.name === 'Trading Fees' && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                  Primary Revenue
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-3">
              {tier.details.map((detail, detailIndex) => (
                <div key={detailIndex} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{detail}</span>
                </div>
              ))}
            </div>

            {/* Additional info for key tiers */}
            {tier.name === 'Trading Fees' && (
              <div className="mt-4 p-3 bg-blue-600/10 rounded-lg border border-blue-600/20">
                <p className="text-blue-300 text-xs">
                  <strong>Revenue Share:</strong> 50% to domain owners, 50% to platform
                </p>
              </div>
            )}

            {tier.name === 'DEX Launch Fee' && (
              <div className="mt-4 p-3 bg-purple-600/10 rounded-lg border border-purple-600/20">
                <p className="text-purple-300 text-xs">
                  <strong>Trigger:</strong> Automatic at $75K market cap threshold
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Fee Structure Details */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Fee Structure Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-2">For Domain Owners</h4>
            <ul className="space-y-1 text-gray-300 text-sm">
              <li>• Earn 50% of trading fees from their domain tokens</li>
              <li>• Low upfront costs ($1 registration fee)</li>
              <li>• Passive income through fee collection vaults</li>
              <li>• Maintain ownership and control</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">For Platform Growth</h4>
            <ul className="space-y-1 text-gray-300 text-sm">
              <li>• Sustainable revenue model with multiple streams</li>
              <li>• Aligned incentives with user success</li>
              <li>• Scalable fee structure grows with volume</li>
              <li>• Network effects drive organic growth</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}