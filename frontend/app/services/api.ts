// ==========================================
// API SERVICE - ALL HTTP REQUESTS
// ==========================================

import { 
  AuthResponse, 
  LoginRequest, 
  SignupRequest, 
  User, 
  Tournament,
  TradeRequest,
  TradeResponse,
  LeaderboardEntry,
  PNLData,
  Trade,
} from '../types';
import { TOKEN_KEY, API_BASE_URL } from '../constants';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

class ApiServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiServiceError';
  }
}

class ApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  setAuthToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  clearAuthToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        detail: 'An unknown error occurred' 
      }));
      throw new ApiServiceError(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  async login(email: string, password: string): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append('email', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const result = await this.handleResponse<AuthResponse>(response);
    this.setAuthToken(result.access_token);
    return result;
  }

  async signup(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const result = await this.handleResponse<AuthResponse>(response);
    this.setAuthToken(result.access_token);
    return result;
  }

  async getMe(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<User>(response);
  }

  // ==========================================
  // TOURNAMENT ENDPOINTS
  // ==========================================

  async getTournaments(): Promise<Tournament[]> {
    const response = await fetch(`${API_BASE_URL}/api/tournaments`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<Tournament[]>(response);
  }

  async getTournament(id: number): Promise<Tournament> {
    const response = await fetch(`${API_BASE_URL}/api/tournaments/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<Tournament>(response);
  }

  async joinTournament(id: number): Promise<{ message: string; tournament_id: number; initial_balance: number }> {
    const response = await fetch(`${API_BASE_URL}/api/tournaments/${id}/join`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getLeaderboard(tournamentId: number, limit: number = 50): Promise<LeaderboardEntry[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/tournaments/${tournamentId}/leaderboard?limit=${limit}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse<LeaderboardEntry[]>(response);
  }

  // ==========================================
  // TRADE ENDPOINTS
  // ==========================================

  async executeTrade(data: TradeRequest): Promise<TradeResponse> {
    const response = await fetch(`${API_BASE_URL}/api/trades`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<TradeResponse>(response);
  }

  async getTradeHistory(tournamentId: number): Promise<{ trades: Trade[] }> {
    const response = await fetch(
      `${API_BASE_URL}/api/trades/history?tournament_id=${tournamentId}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse(response);
  }

  async getPNL(tournamentId: number): Promise<PNLData> {
    const response = await fetch(
      `${API_BASE_URL}/api/trades/pnl?tournament_id=${tournamentId}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse<PNLData>(response);
  }
}

export const api = new ApiService();

// Export convenience functions for backward compatibility
export const login = (email: string, password: string) => api.login(email, password);
export const signup = (name: string, email: string, password: string) => api.signup(name, email, password);
export const getTournaments = () => api.getTournaments();
export const getTournament = (id: number) => api.getTournament(id);
export const joinTournament = (id: number) => api.joinTournament(id);
export const getUserProfile = () => api.getMe();