/**
 * Investor Relations Metrics Data
 * 
 * This file contains all the key metrics and data points for the investor relations page.
 * Update these values as the platform grows and new data becomes available.
 * 
 * Note: Values marked with '?' indicate estimates or projections that should be 
 * verified with actual data when available.
 */

import type { 
  InvestorMetrics, 
  MetricData, 
  Milestone, 
  PricingTier,
  TractionData 
} from '../types';

export const investorMetrics: InvestorMetrics = {
  // Total Addressable Market - Domain name industry size
  tam: {
    value: "$2.4B",
    subtitle: "Domain Name Market Size",
    uncertainty: false, // This is based on industry reports
    description: "Global domain name industry market size, representing the total opportunity for domain tokenization and fractional ownership solutions."
  } as MetricData,

  // Total Value Locked - Current value locked in the platform
  tvl: {
    value: "$50K?", 
    subtitle: "Platform TVL",
    uncertainty: true, // Estimate - needs real data
    description: "Total value of assets currently locked in our smart contracts across all supported chains (Flow, Ethereum Sepolia)."
  } as MetricData,

  // Assets Under Management - Domains and tokens managed
  aum: {
    value: "$125K?",
    subtitle: "Domains + Tokens",
    uncertainty: true, // Estimate - needs real data
    description: "Combined value of all domain NFTs and their corresponding tokens managed through our platform."
  } as MetricData,

  // Active Users - Monthly active users
  activeUsers: {
    value: "250?",
    subtitle: "Monthly Active Users",
    uncertainty: true, // Estimate - needs analytics data
    description: "Number of unique users who have interacted with the platform in the last 30 days across all features."
  } as MetricData,

  // Platform milestones and achievements
  milestones: [
    {
      title: "Multi-chain deployment completed",
      date: "Q4 2024",
      description: "Successfully deployed on Flow Mainnet and Ethereum Sepolia"
    },
    {
      title: "First domain tokenization",
      date: "Q4 2024", 
      description: "Successfully tokenized first premium domain"
    },
    {
      title: "Bonding curve integration",
      date: "Q4 2024",
      description: "Implemented automated price discovery mechanism"
    },
    {
      title: "Uniswap V3 liquidity launch",
      date: "Q1 2025?", // Future milestone
      description: "First token graduated from bonding curve to DEX"
    }
  ] as Milestone[],

  // Revenue model and pricing structure
  pricingTiers: [
    {
      name: "Domain Registration",
      description: "Verify and register domain ownership",
      fee: "$1 USD",
      details: [
        "DNS TXT record verification",
        "Domain NFT minting",
        "Ownership validation",
        "Admin review process"
      ]
    },
    {
      name: "Token Creation",
      description: "Convert domain NFT to tradeable tokens",
      fee: "1% of supply",
      details: [
        "1M ERC20 tokens created",
        "Bonding curve initialization", 
        "Cross-chain compatibility",
        "Automated market making"
      ]
    },
    {
      name: "Trading Fees",
      description: "Revenue from all platform transactions",
      fee: "1% per trade",
      details: [
        "Buy/sell transactions",
        "Bonding curve trades",
        "Revenue sharing with domain owners",
        "Platform sustainability fund"
      ]
    },
    {
      name: "DEX Launch Fee",
      description: "Graduation to Uniswap V3 liquidity",
      fee: "3% of raised",
      details: [
        "Triggered at $75K market cap",
        "Automatic liquidity provision",
        "LP token distribution",
        "Fee collection vault setup"
      ]
    }
  ] as PricingTier[],

  // Key performance indicators for charts
  tractionData: {
    // Monthly user growth (estimated data - replace with real analytics)
    userGrowth: [
      { month: 'Oct 2024', users: 50 },
      { month: 'Nov 2024', users: 120 },
      { month: 'Dec 2024', users: 250 },
      { month: 'Jan 2025', users: 400 }, // Projected
    ],
    
    // Monthly transaction volume (estimated - replace with real data)
    volumeGrowth: [
      { month: 'Oct 2024', volume: 5000 },
      { month: 'Nov 2024', volume: 15000 },
      { month: 'Dec 2024', volume: 35000 },
      { month: 'Jan 2025', volume: 60000 }, // Projected
    ],

    // Domain tokenization metrics
    domains: {
      registered: 25, // Estimated
      tokenized: 12,  // Estimated
      launched: 3     // Estimated
    }
  }
};

/**
 * Helper function to format currency values
 */
export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  } else {
    return `$${value}`;
  }
};

/**
 * Helper function to check if a metric needs verification
 */
export const needsVerification = (metric: MetricData): boolean => {
  return metric.uncertainty === true;
};