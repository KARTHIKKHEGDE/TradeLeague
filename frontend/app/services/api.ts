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
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearAuthToken() {
    this.token = null;
    localStorage.removeItem(TOKEN_KEY);
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
        detail: 'Something went wrong. Please try again.',
      }));
      throw new ApiServiceError(
        error.detail || `HTTP ${response.status}: ${response.statusText}`
      );
    }
    return response.json();
  }

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const result = await this.handleResponse<AuthResponse>(response);
    this.setAuthToken(result.access_token);
    return result;
  }

  async signup(username: string, email: string, password: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username, email, password }),
    });

    return this.handleResponse<User>(response);
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
    return this.handleResponse(response);
  }

  async getTournament(id: number): Promise<Tournament> {
    const response = await fetch(`${API_BASE_URL}/api/tournaments/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async joinTournament(id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/tournaments/${id}/join`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getLeaderboard(
    tournamentId: number,
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/tournaments/${tournamentId}/leaderboard?limit=${limit}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse(response);
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
    return this.handleResponse(response);
  }

  async getTradeHistory(
    tournamentId: number
  ): Promise<{ trades: Trade[] }> {
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
    return this.handleResponse(response);
  }
}

// Export single instance
export const api = new ApiService();

// Old compatibility exports
export const login = (email: string, password: string) =>
  api.login(email, password);
export const signup = (username: string, email: string, password: string) =>
  api.signup(username, email, password);
export const getTournaments = () => api.getTournaments();
export const getTournament = (id: number) => api.getTournament(id);
export const joinTournament = (id: number) => api.joinTournament(id);
export const getUserProfile = () => api.getMe();
