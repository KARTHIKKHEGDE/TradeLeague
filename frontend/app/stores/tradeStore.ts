import { create } from 'zustand';

interface TradingState {
  currentPrice: number | null;
  ticks: number[];
  orders: any[];
  wallet: any;
  orderRefreshTrigger: number;
  
  setCurrentPrice: (price: number) => void;
  addTick: (price: number) => void;
  setOrders: (orders: any[]) => void;
  setWallet: (wallet: any) => void;
  triggerOrderRefresh: () => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  currentPrice: null,
  ticks: [],
  orders: [],
  wallet: null,
  orderRefreshTrigger: 0,

  setCurrentPrice: (price: number) => set({ currentPrice: price }),

  addTick: (price: number) =>
    set((state) => ({
      ticks: [...state.ticks.slice(-99), price], // Keep last 100 ticks
      currentPrice: price,
    })),

  setOrders: (orders: any[]) => set({ orders }),

  setWallet: (wallet: any) => set({ wallet }),

  triggerOrderRefresh: () =>
    set((state) => ({
      orderRefreshTrigger: state.orderRefreshTrigger + 1,
    })),
}));