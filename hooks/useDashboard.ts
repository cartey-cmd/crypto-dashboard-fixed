"use client";

import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed fetching dashboard");
  }

  return res.json();
};

export default function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/dashboard",
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  return {
    dashboard: data?.overview,
    holders: data?.holders ?? [],
    loading: isLoading,
    error,
    refresh: mutate,
  };
}