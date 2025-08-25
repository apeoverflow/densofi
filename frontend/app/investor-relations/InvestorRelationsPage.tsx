'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Globe, 
  BarChart3, 
  Target,
  Wallet,
  Lock,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink
} from 'lucide-react';
import MetricCard from './components/MetricCard';
import TractionChart from './components/TractionChart';
import PricingTable from './components/PricingTable';
import ContactSection from './components/ContactSection';
import { investorMetrics } from './data/metrics';

export default function InvestorRelationsPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Investor Relations
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Transforming the $2.4B domain name industry through fractional tokenization, 
              unlocking liquidity and democratizing access to premium digital assets.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-200"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Contact Us
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 border border-gray-600 hover:border-gray-500 text-white rounded-lg font-semibold transition-colors duration-200"
                onClick={() => window.open('https://densofi.com', '_blank')}
              >
                Live Platform
                <ExternalLink className="inline ml-2 w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Metrics Overview */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white text-center mb-12"
          >
            Key Investment Metrics
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              icon={<Globe className="w-8 h-8" />}
              title="Total Addressable Market"
              value={investorMetrics.tam.value}
              subtitle={investorMetrics.tam.subtitle}
              uncertainty={investorMetrics.tam.uncertainty}
              description={investorMetrics.tam.description}
            />
            <MetricCard
              icon={<Lock className="w-8 h-8" />}
              title="Total Value Locked"
              value={investorMetrics.tvl.value}
              subtitle={investorMetrics.tvl.subtitle}
              uncertainty={investorMetrics.tvl.uncertainty}
              description={investorMetrics.tvl.description}
            />
            <MetricCard
              icon={<Wallet className="w-8 h-8" />}
              title="Assets Under Management"
              value={investorMetrics.aum.value}
              subtitle={investorMetrics.aum.subtitle}
              uncertainty={investorMetrics.aum.uncertainty}
              description={investorMetrics.aum.description}
            />
            <MetricCard
              icon={<Users className="w-8 h-8" />}
              title="Active Users"
              value={investorMetrics.activeUsers.value}
              subtitle={investorMetrics.activeUsers.subtitle}
              uncertainty={investorMetrics.activeUsers.uncertainty}
              description={investorMetrics.activeUsers.description}
            />
          </div>
        </div>
      </section>

      {/* Traction Section */}
      <section className="py-16 px-4 bg-black/20">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Platform Traction</h2>
            <p className="text-gray-300 text-lg">
              Real metrics demonstrating our growth and market validation
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TractionChart />
            
            <div className="space-y-6">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Growth Milestones
                </h3>
                <div className="space-y-4">
                  {investorMetrics.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      <div>
                        <p className="text-white font-medium">{milestone.title}</p>
                        <p className="text-gray-400 text-sm">{milestone.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Market Opportunity
                </h3>
                <p className="text-gray-300 mb-4">
                  The domain name industry represents a $2.4B market with significant inefficiencies:
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full mt-2" />
                    Limited price discovery mechanisms
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full mt-2" />
                    Lack of liquidity for premium domains
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full mt-2" />
                    High barriers to entry for investors
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Model & Pricing */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Revenue Model</h2>
            <p className="text-gray-300 text-lg">
              Multiple revenue streams with scalable fee structures
            </p>
          </motion.div>
          
          <PricingTable />
        </div>
      </section>

      {/* Expandable Sections */}
      <section className="py-16 px-4 bg-black/20">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Detailed Information
          </h2>
          
          <div className="space-y-4">
            {[
              {
                id: 'technology',
                title: 'Technology Stack & Security',
                content: (
                  <div className="space-y-4">
                    <p className="text-gray-300">
                      Built on proven blockchain infrastructure with enterprise-grade security:
                    </p>
                    <ul className="space-y-2 text-gray-300">
                      <li>• Superchain ERC20 tokens for cross-chain compatibility</li>
                      <li>• Multi-signature smart contracts with comprehensive testing</li>
                      <li>• DNS TXT record verification for domain ownership</li>
                      <li>• Bonding curve mechanics for price discovery</li>
                      <li>• Integration with Uniswap V3 for liquidity</li>
                    </ul>
                  </div>
                )
              },
              {
                id: 'competitive',
                title: 'Competitive Advantages',
                content: (
                  <div className="space-y-4">
                    <p className="text-gray-300">
                      Densofi differentiates through innovation and execution:
                    </p>
                    <ul className="space-y-2 text-gray-300">
                      <li>• First-mover advantage in domain tokenization</li>
                      <li>• Cross-chain deployment (Ethereum, Flow, World Chain)</li>
                      <li>• Automated liquidity provisioning through bonding curves</li>
                      <li>• Revenue sharing with domain owners</li>
                      <li>• Subdomain rights for large token holders</li>
                    </ul>
                  </div>
                )
              },
              {
                id: 'roadmap',
                title: 'Growth Strategy & Roadmap',
                content: (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-white font-semibold mb-2">Phase 1 (Completed)</h4>
                      <p className="text-gray-300 text-sm mb-2">Core infrastructure and MVP launch</p>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">Phase 2 (Current)</h4>
                      <p className="text-gray-300 text-sm mb-2">User acquisition and feature expansion</p>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">Phase 3 (Q2 2025)</h4>
                      <p className="text-gray-300 text-sm">Enterprise partnerships and DAO governance</p>
                    </div>
                  </div>
                )
              }
            ].map((section) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-700/30 transition-colors duration-200"
                >
                  <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                  {expandedSection === section.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {expandedSection === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-6"
                  >
                    {section.content}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <ContactSection />
    </div>
  );
}