export interface SpotBalance {
  symbol: string;
  free: number;
  locked: number;
  total: number;
  lastUpdate: Date;
}

export interface FuturesPosition {
  symbol: string;
  positionSize: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  side: 'LONG' | 'SHORT';
  lastUpdate: Date;
}

export interface ContractDetails {
  symbol: string;
  contractSize: number;
  pricePrecision: number;
  underlyingAsset: string;
  fundingRate?: number;
  expirationDate?: Date;
}