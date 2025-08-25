/**
 * TypeScript interfaces for the Investor Relations module
 * 
 * These types ensure type safety across all IR components and data structures.
 */

export interface MetricData {
  /** Display value (e.g., "$2.4B", "250?") */
  value: string;
  /** Subtitle/category (e.g., "Domain Name Market Size") */
  subtitle: string;
  /** Whether this value is estimated/uncertain */
  uncertainty?: boolean;
  /** Detailed description of the metric */
  description: string;
}

export interface Milestone {
  /** Achievement title */
  title: string;
  /** When it was achieved (e.g., "Q4 2024") */
  date: string;
  /** Optional detailed description */
  description?: string;
}

export interface PricingTier {
  /** Tier name (e.g., "Trading Fees") */
  name: string;
  /** Brief description of what this covers */
  description: string;
  /** Fee amount or percentage */
  fee: string;
  /** List of features/details included */
  details: string[];
}

export interface TractionDataPoint {
  /** Month label (e.g., "Oct 2024") */
  month: string;
  /** Number of users for this month */
  users: number;
  /** Trading volume for this month (USD) */
  volume: number;
}

export interface DomainMetrics {
  /** Total domains registered on platform */
  registered: number;
  /** Domains converted to tokens */
  tokenized: number;
  /** Tokens launched to DEX */
  launched: number;
}

export interface TractionData {
  /** Monthly user growth data */
  userGrowth: Omit<TractionDataPoint, 'volume'>[];
  /** Monthly volume growth data */
  volumeGrowth: Omit<TractionDataPoint, 'users'>[];
  /** Domain-specific metrics */
  domains: DomainMetrics;
}

export interface ContactMethod {
  /** Icon component */
  icon: React.ReactNode;
  /** Contact method title */
  title: string;
  /** Description of when to use this method */
  description: string;
  /** Display text for the contact */
  contact: string;
  /** URL or mailto link */
  action: string;
  /** Whether this is the primary contact method */
  primary: boolean;
}

export interface Resource {
  /** Icon component */
  icon: React.ReactNode;
  /** Resource title */
  title: string;
  /** Description of the resource */
  description: string;
  /** URL to the resource */
  action: string;
}

export interface InvestorMetrics {
  /** Total Addressable Market data */
  tam: MetricData;
  /** Total Value Locked data */
  tvl: MetricData;
  /** Assets Under Management data */
  aum: MetricData;
  /** Active Users data */
  activeUsers: MetricData;
  /** Platform milestones and achievements */
  milestones: Milestone[];
  /** Revenue model pricing tiers */
  pricingTiers: PricingTier[];
  /** Traction and growth data */
  tractionData: TractionData;
}

// Component Props Interfaces

export interface MetricCardProps {
  /** Icon to display */
  icon: React.ReactNode;
  /** Card title */
  title: string;
  /** Main display value */
  value: string;
  /** Subtitle text */
  subtitle: string;
  /** Whether value is uncertain/estimated */
  uncertainty?: boolean;
  /** Detailed description */
  description: string;
}

export interface ExpandableSection {
  /** Unique identifier for the section */
  id: string;
  /** Section title */
  title: string;
  /** Section content (JSX) */
  content: React.ReactNode;
}

// Chart Types

export type ChartType = 'users' | 'volume';

export interface ChartConfig {
  /** Chart title */
  title: string;
  /** Icon for chart selector */
  icon: React.ReactNode;
  /** Data array for the chart */
  data: any[];
  /** CSS class for bar color */
  color: string;
  /** CSS gradient class */
  gradientColor: string;
}

// Utility Types

export type MetricKey = keyof Pick<InvestorMetrics, 'tam' | 'tvl' | 'aum' | 'activeUsers'>;

export interface MetricUpdatePayload {
  key: MetricKey;
  updates: Partial<MetricData>;
}

// Form Types (if adding contact forms in the future)

export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  message: string;
  investmentRange?: string;
}

// API Response Types (for future backend integration)

export interface MetricsAPIResponse {
  success: boolean;
  data: {
    tvl: number;
    aum: number;
    activeUsers: number;
    monthlyVolume: number;
    domainsRegistered: number;
    domainsTokenized: number;
    domainsLaunched: number;
  };
  lastUpdated: string;
}

export interface TractionAPIResponse {
  success: boolean;
  data: {
    userGrowth: { month: string; count: number }[];
    volumeGrowth: { month: string; volume: number }[];
  };
  lastUpdated: string;
}