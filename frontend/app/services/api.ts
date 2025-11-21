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
import { useUserStore } from '../stores/userStore';

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
      // Try Zustand store first, fallback to localStorage
      try {
        const zustandToken = useUserStore.getState().token;
        if (zustandToken) {
          this.token = zustandToken;
        } else {
          this.token = localStorage.getItem(TOKEN_KEY);
        }
      } catch (e) {
        this.token = localStorage.getItem(TOKEN_KEY);
      }
    }
  }

  setAuthToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      try {
        useUserStore.getState().setToken(token);
      } catch (e) {
        console.log('Zustand store not ready, token saved to localStorage');
      }
    }
  }

  clearAuthToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      try {
        useUserStore.getState().logout();
      } catch (e) {
        console.log('Zustand store not ready, token cleared from localStorage');
      }
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
      let errorMessage = 'Something went wrong. Please try again.';
      try {
        const error = await response.json();
        errorMessage = error.detail || error.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new ApiServiceError(errorMessage);
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

  // ==========================================
  // GENERIC HTTP METHODS
  // ==========================================

  async get<T = any>(url: string): Promise<{ data: T }> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const data = await this.handleResponse<T>(response);
    return { data };
  }

  async post<T = any>(url: string, body: any): Promise<{ data: T }> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await this.handleResponse<T>(response);
    return { data };
  }

  async delete<T = any>(url: string): Promise<{ data: T }> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await this.handleResponse<T>(response);
    return { data };
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