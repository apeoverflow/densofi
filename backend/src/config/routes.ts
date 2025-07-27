export const ROUTES = {
  // Health and Status
  HEALTH: '/health',
  STATUS: '/api/status',

  // Debug Routes
  DEBUG_STATUS: '/api/debug/status',
  DEBUG_EVENT_LISTENERS: '/api/debug/event-listeners/status',
  DEBUG_PROCESS_PENDING: '/api/debug/process-pending',

  // Domain Management
  DOMAINS: '/api/domains',
  DOMAIN_BY_NAME: '/api/domains/:name',
  DOMAIN_STATUS: '/api/domains/:name/status',
  DOMAIN_VERIFY: '/api/domains/:name/:walletAddress/verify',
  NFTS: '/api/nfts/:address',
  PROCESS_PENDING: '/api/process-pending',
  EVENT_LISTENERS_STATUS: '/api/event-listeners/status',

  // Authentication
  AUTH_STATUS: '/api/auth/status',
  AUTH_REQUEST_MESSAGE: '/api/auth/request-message',
  AUTH_VERIFY_SIGNATURE: '/api/auth/verify-signature',
  AUTH_WALLET_INFO: '/api/auth/wallet/:address',
  AUTH_WALLETS_BY_IP: '/api/auth/ip/:ip/wallets',
  AUTH_STATS: '/api/auth/stats',

  // Game
  GAME_SUBMIT_XP: '/api/game/submit-xp',
  GAME_LEADERBOARD: '/api/game/leaderboard',
  GAME_STATS: '/api/game/stats',
  GAME_STATS_BY_ADDRESS: '/api/game/stats/:address',
  GAME_HISTORY: '/api/game/history/:address',
  DEBUG_GAME_STATS: '/api/debug/game/stats',
  DEBUG_GAME_HISTORY: '/api/debug/game/history/:address'
} as const;

export const ROUTE_DESCRIPTIONS = {
  // Health and Status
  [ROUTES.HEALTH]: 'Health check',
  [ROUTES.STATUS]: 'Service connection status',

  // Debug Routes
  [ROUTES.DEBUG_STATUS]: 'Debug service status',
  [ROUTES.DEBUG_EVENT_LISTENERS]: 'Get event listener status',
  [ROUTES.DEBUG_PROCESS_PENDING]: 'Manually process pending events (debug)',

  // Domain Management
  [ROUTES.DOMAINS]: 'Get all registered domains',
  [ROUTES.DOMAIN_BY_NAME]: 'Get specific domain',
  [ROUTES.DOMAIN_STATUS]: 'Check domain registration status',
  [ROUTES.DOMAIN_VERIFY]: 'Verify domain ownership via DNS',
  [ROUTES.NFTS]: 'Get NFTs owned by address',
  [ROUTES.PROCESS_PENDING]: 'Manually process pending events',
  [ROUTES.EVENT_LISTENERS_STATUS]: 'Get event listener status',

  // Authentication
  [ROUTES.AUTH_STATUS]: 'Get authentication status',
  [ROUTES.AUTH_REQUEST_MESSAGE]: 'Request signature message',
  [ROUTES.AUTH_VERIFY_SIGNATURE]: 'Verify wallet signature',
  [ROUTES.AUTH_WALLET_INFO]: 'Get wallet information',
  [ROUTES.AUTH_WALLETS_BY_IP]: 'Get wallets by IP',
  [ROUTES.AUTH_STATS]: 'Get authentication statistics',

  // Game
  [ROUTES.GAME_SUBMIT_XP]: 'Submit game XP score',
  [ROUTES.GAME_LEADERBOARD]: 'Get player XP leaderboard',
  [ROUTES.GAME_STATS]: 'Get overall game statistics',
  [ROUTES.GAME_STATS_BY_ADDRESS]: 'Get player statistics',
  [ROUTES.GAME_HISTORY]: 'Get player game history'
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];
