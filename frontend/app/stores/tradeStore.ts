import { create } from 'zustand';

export interface Tick {
  price: number;
  time: number; // Unix timestamp in seconds
}

interface TradingState {
  currentPrice: number | null;
  ticks: Tick[];
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
      ticks: [...state.ticks, { price, time: Math.floor(Date.now() / 1000) }],
      currentPrice: price,
    })),

  setOrders: (orders: any[]) => set({ orders }),

  setWallet: (wallet: any) => set({ wallet }),

  triggerOrderRefresh: () =>
    set((state) => ({
      orderRefreshTrigger: state.orderRefreshTrigger + 1,
    })),
}));