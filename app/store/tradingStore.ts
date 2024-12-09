import { create } from 'zustand';

interface Position {
  spot: number;
  long: number;
  short: number;
  total: number;
}

interface TradingStore {
  positions: Record<string, Position>;
  connectionStatus: {
    spot: boolean;
    futures: boolean;
  };
  lastUpdate: Date | null;
  symbols: string[];

  updatePositions: (data: Record<string, Position>) => void;
  setConnectionStatus: (status: { spot?: boolean; futures?: boolean }) => void;
  getTotalSpotBalance: () => number;
  getTotalFuturesExposure: () => number;
  getNetExposure: () => number;
  updateListSymbols: (symbols: string[]) => void;
}

export const useTradingStore = create<TradingStore>((set, get) => ({
  positions: {},
  connectionStatus: {
    spot: false,
    futures: false,
  },
  lastUpdate: null,
  symbols: [],
  
  updatePositions: (data) =>
    set({
      positions: data,
      lastUpdate: new Date(),
    }),

  setConnectionStatus: (status) =>
    set((state) => ({
      connectionStatus: { ...state.connectionStatus, ...status },
    })),

    getTotalSpotBalance: () => {
      const { positions } = get();
      return Object.values(positions).reduce((acc, pos) => acc + pos.spot, 0);
    },

    getTotalFuturesExposure: () => {
      const { positions } = get();
      return Object.values(positions).reduce(
      (acc, pos) => acc + pos.long + pos.short, 
      0
    );
  },

  getNetExposure: () => {
    const { positions } = get();
    return Object.values(positions).reduce(
      (acc, pos) => acc + pos.total,
      0
    );
  },

  updateListSymbols: (symbols) => set({ symbols: symbols }),  
}));