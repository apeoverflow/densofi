import { config } from 'dotenv';
config();

export const ENV = {
  // Server Configuration
  PORT: parseInt(process.env.PORT || '8000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Authentication
  ADMIN_API_KEY: process.env.ADMIN_API_KEY,

  // MongoDB Configuration
  MONGO_URL: process.env.MONGO_URL,
  MONGO_DB: process.env.MONGO_DB || 'densofi_domains',

  MONGOHOST: process.env.MONGOHOST,
  MONGOPORT: process.env.MONGOPORT,
  MONGOUSER: process.env.MONGOUSER,
  MONGOPASSWORD: process.env.MONGOPASSWORD,
  
  // Blockchain Configuration
  RPC_URL: process.env.RPC_URL || 'https://rpc2.sepolia.org',
  CHAIN_ID: process.env.CHAIN_ID || '11155111',
  
  // Contract Addresses
  DOMAIN_REGISTRATION_CONTRACT: process.env.DOMAIN_REGISTRATION_CONTRACT || '0x640b66a1cd9D2e3c4F118B9Bb58479c0Ca439f42',
  
  // Event Listening Configuration
  ENABLE_EVENT_LISTENERS: process.env.ENABLE_EVENT_LISTENERS !== 'false',
  POLLING_INTERVAL: parseInt(process.env.POLLING_INTERVAL || '60000', 10),
  EVENT_BATCH_SIZE: parseInt(process.env.EVENT_BATCH_SIZE || '200', 10),
  
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  
} as const;

// Validation
if (!ENV.RPC_URL) {
  throw new Error('RPC_URL environment variable is required');
}

// Authentication validation
if (!ENV.ADMIN_API_KEY) {
  console.warn('⚠️  ADMIN_API_KEY not set. Some endpoints will be disabled for security.');
  console.warn('   Set ADMIN_API_KEY in your .env file to enable protected endpoints.');
}

// Event listeners validation
if (!ENV.ENABLE_EVENT_LISTENERS) {
  console.warn('⚠️  Event listeners are DISABLED (ENABLE_EVENT_LISTENERS=false)');
  console.warn('   Domain and NFT event listeners will not start');
  console.warn('   Processing loop will not run');
}

// MongoDB validation
if (!ENV.MONGO_URL && !(ENV.MONGOHOST && ENV.MONGOPORT && ENV.MONGOUSER && ENV.MONGOPASSWORD)) {
  console.warn('⚠️  MongoDB configuration missing. Please set either:');
  console.warn('   Option 1: MONGO_URL (e.g., mongodb://username:password@host:port/database)');
  console.warn('   Option 2: Individual variables (MONGOHOST, MONGOPORT, MONGOUSER, MONGOPASSWORD)');
  console.warn('   Also set: MONGO_DB (database name)');
}



export default ENV; 
