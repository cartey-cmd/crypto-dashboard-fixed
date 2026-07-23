"use client";

import useSWR from "swr";

export interface HolderFlowPoint {
  time: string;
  bucketStart: number;
  buyers: number;
  sellers: number;
  netHolders: number;
  buyVolume: number;
  sellVolume: number;
  netVolume: number;
}

interface HolderFlowResponse {
  success: boolean;
  data: HolderFlowPoint[];
  error?: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function useHolderFlow(timeframe: string) {
  const { data, error, isLoading } = useSWR<HolderFlowResponse>(
    `/api/holder-flow?timeframe=${timeframe}`,
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
