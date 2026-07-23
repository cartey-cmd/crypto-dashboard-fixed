"use client";

import { useEffect, useState } from "react";

export type Holder = {
  rank: number;
  owner: string;
  amount: number;
  percent: number;
};

export default function useHolders() {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/holders", {
        cache: "no-store",
      });

      const json = await res.json();

      setHolders(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const interval = setInterval(load, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    holders,
    loading,
  };
}