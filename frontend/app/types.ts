// ==========================================
// TYPE DEFINITIONS FOR THE APPLICATION
// ==========================================

// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  is_admin?: boolean;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

// Tournament Types
export interface Tournament {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  entry_fee: number;
  prize_pool: number;
  participant_count: number;
  max_participants: number;
  status: 'upcoming' | 'active' | 'completed';
  initial_balance: number;
  is_active?: boolean;
}

// Trade Types
export interface Trade {
  id: string;
  user_id: string;
  tournament_id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
  pnl?: number;
}

export interface TradeRequest {
  tournament_id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
}

export interface TradeResponse {
  trade: Trade;
  balance: number;
  message: string;
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  balance: number;
  pnl: number;
  pnl_percentage: number;
  total_trades: number;
}

// PNL Types
export interface PNLData {
  total_pnl: number;
  total_pnl_percentage: number;
  current_balance: number;
  initial_balance: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
}

// API Error Response
export interface ApiError {
  detail: string;
  status_code?: number;
}