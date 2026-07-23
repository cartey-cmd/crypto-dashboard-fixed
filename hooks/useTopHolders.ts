"use client";

import { useCallback, useEffect, useState } from "react";

export interface Holder {
  rank: number;
  address: string;
  balance: string;
  balanceRaw: number;
  percentage: string;
  percentageRaw: number;
}

export default function useTopHolders() {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/top-holders", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setHolders(data.holders);
      } else {
        setError(data.error || "Failed to load holder data.");
      }
    } catch (e) {
      console.log(e);
      setError("Failed to load holder data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    holders,
    loading,
    error,
    retry: load,
  };
}
