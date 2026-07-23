"use client";

import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json());

export function useOverview() {
  const { data, error, isLoading } = useSWR(
    "/api/overview",
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000,
    }
  );

  return {
    data,
    error,
    isLoading,
  };
}