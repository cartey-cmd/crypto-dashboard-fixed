export interface TokenOverview {
  address: string;
  symbol: string;
  name: string;

  price: number;
  marketCap: number;

  liquidity: number;

  holder: number;

  volume24h: number;

  logoURI: string;
}

export interface HolderItem {
  owner: string;

  amount: number;

  percentage: number;

  valueUsd: number;

  rank: number;
}

export interface ChartPoint {
  unixTime: number;

  value: number;
}