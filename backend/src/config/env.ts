import { config } from 'dotenv';
config();

export const ENV = {
  // Server Configuration
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // MongoDB Configuration
  MONGO_URL: process.env.MONGO_URL,
  MONGO_DB: process.env.MONGO_DB || 'densofi_domains',

  MONGOHOST: process.env.MONGOHOST,
  MONGOPORT: process.env.MONGOPORT,
  MONGOUSER: process.env.MONGOUSER,
  MONGOPASSWORD: process.env.MONGOPASSWORD,
  
  // Blockchain Configuration
  SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL || 'https://rpc2.sepolia.org',
  
  // Contract Addresses
  DOMAIN_REGISTRATION_CONTRACT: process.env.DOMAIN_REGISTRATION_CONTRACT || '0x640b66a1cd9D2e3c4F118B9Bb58479c0Ca439f42',
  
  // Event Listening Configuration
  POLLING_INTERVAL: parseInt(process.env.POLLING_INTERVAL || '5000', 10),
  EVENT_BATCH_SIZE: parseInt(process.env.EVENT_BATCH_SIZE || '100', 10),
  
} as const;

// Validation
if (!ENV.SEPOLIA_RPC_URL) {
  throw new Error('SEPOLIA_RPC_URL environment variable is required');
}

// MongoDB validation
if (!ENV.MONGO_URL && !(ENV.MONGOHOST && ENV.MONGOPORT && ENV.MONGOUSER && ENV.MONGOPASSWORD)) {
  console.warn('⚠️  MongoDB configuration missing. Please set either:');
  console.warn('   Option 1: MONGO_URL (e.g., mongodb://username:password@host:port/database)');
  console.warn('   Option 2: Individual variables (MONGOHOST, MONGOPORT, MONGOUSER, MONGOPASSWORD)');
  console.warn('   Also set: MONGO_DB (database name)');
}

export default ENV; 
