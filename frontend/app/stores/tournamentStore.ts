// ==========================================
// TOURNAMENT STORE - TOURNAMENT STATE
// ==========================================

import { create } from 'zustand';
import { Tournament } from '../types';
import { api } from '../services/api';

interface TournamentState {
  tournaments: Tournament[];
  activeTournament: Tournament | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTournaments: () => Promise<void>;
  fetchTournamentDetails: (id: number) => Promise<void>;
  joinTournament: (id: number) => Promise<{ message: string; tournament_id: number; initial_balance: number }>;  // CHANGED: Return type
  setActiveTournament: (tournament: Tournament | null) => void;
  clearError: () => void;
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  tournaments: [],
  activeTournament: null,
  isLoading: false,
  error: null,

  fetchTournaments: async () => {
    set({ isLoading: true, error: null });
    try {
      const tournaments = await api.getTournaments();
      set({ tournaments, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch tournaments',
        isLoading: false,
      });
    }
  },

  fetchTournamentDetails: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const tournament = await api.getTournament(id);
      set({ activeTournament: tournament, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch tournament details',
        isLoading: false,
      });
    }
  },

  joinTournament: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.joinTournament(id);
      
      // Update tournament in list to reflect joined status
      const tournaments = get().tournaments.map((t: Tournament) =>  // CHANGED: Added type
        t.id === id ? { ...t, is_active: true } : t
      );
      
      set({ tournaments, isLoading: false });
      
      // Return response
      return response;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to join tournament',
        isLoading: false,
      });
      throw error;
    }
  },

  setActiveTournament: (tournament: Tournament | null) => {
    set({ activeTournament: tournament });
  },

  clearError: () => {
    set({ error: null });
  },
}));