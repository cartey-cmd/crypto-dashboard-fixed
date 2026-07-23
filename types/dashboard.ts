export interface Overview {

  symbol: string;

  name: string;

  logo: string;

  price: number;

  marketCap: number;

  liquidity: number;

  holders: number;

  volume24h: number;
}

export interface Holder {

  owner: string;

  amount: number;

  percentage: number;

  valueUsd: number;

  rank: number;
}

export interface ChartPoint {

  time: string;

  price: number;
}

export interface DashboardResponse {

  overview: Overview;

  chart: ChartPoint[];

  holders: Holder[];
}