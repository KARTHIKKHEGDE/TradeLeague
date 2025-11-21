// ==========================================
// APPLICATION CONSTANTS
// ==========================================

export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  DASHBOARD: '/dashboard',
  TOURNAMENT: '/dashboard/tournament',
  ADMIN: '/admin',
} as const;

export const TRADE_SIDES = {
  BUY: 'BUY',
  SELL: 'SELL',
} as const;

export const TOURNAMENT_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;