"use client";

import useSWR from "swr";

export interface ChartPoint {
  time: string;
  price: number;
}

interface ChartResponse {
  success: boolean;
  data: ChartPoint[];
  error?: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useChart(timeframe: string) {
  const { data, error, isLoading } = useSWR<ChartResponse>(
    `/api/chart?timeframe=${timeframe}`,
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
    }
  );

  return {
    data: data?.data ?? [],
    // request gagal (network) ATAU API balas success:false -> keduanya
    // dianggap error supaya UI tidak diam-diam kosong
    error: error || (data && data.success === false ? data.error : undefined),
    isLoading,
  };
}
