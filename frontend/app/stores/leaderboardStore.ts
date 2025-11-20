import { create } from 'zustand';

interface LeaderboardState {
  rankings: any[];
  setRankings: (rankings: any[]) => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  rankings: [],
  setRankings: (rankings) => set({ rankings }),
}));
