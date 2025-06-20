// Environment configuration for DensoFi frontend

const config = {
  // API Configuration
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  
  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Endpoints
  endpoints: {
    health: '/health',
    domains: '/api/domains',
    status: '/api/status',
    gameXP: '/api/game/xp',
    walletAuth: '/api/wallet/auth'
  }
};

// Helper functions
export const getApiUrl = (endpoint: string = '') => {
  return `${config.apiBaseUrl}${endpoint}`;
};

export const getBackendUrl = (path: string = '') => {
  return `${config.backendUrl}${path}`;
};

export const getFullApiUrl = (endpoint: string) => {
  return `${config.apiUrl}${endpoint}`;
};

export default config; 