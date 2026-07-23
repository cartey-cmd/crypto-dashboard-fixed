"use client";

import useSWR from "swr";
import { TOKEN_MINT, REFRESH_INTERVAL } from "@/lib/constants";

const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed");
  }

  return res.json();
};

export function useToken() {
  return useSWR(
    `/api/overview?address=${TOKEN_MINT}`,
    fetcher,
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: true,
    }
  );
}