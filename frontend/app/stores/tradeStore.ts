import { create } from 'zustand';

interface TradeState {
  trades: any[];
  addTrade: (trade: any) => void;
}

export const useTradeStore = create<TradeState>((set) => ({
  trades: [],
  addTrade: (trade) => set((state) => ({ trades: [...state.trades, trade] })),
}));
