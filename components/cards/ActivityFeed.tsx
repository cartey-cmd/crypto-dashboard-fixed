"use client";

import { useEffect, useState } from "react";
import { explorerUrl } from "@/utils/format";

type Tx = {
  type: "BUY" | "SELL";
  wallet: string;
  walletAddress?: string | null;
  tokenAmount?: string | null;
  amount: string;
  time: string;
};

export default function ActivityFeed() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTx() {
      try {
        const res = await fetch("/api/transactions");
        const json = await res.json();
        setTxs(json.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadTx();

    const interval = setInterval(loadTx, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col rounded-2xl border border-orange-500/20 bg-[#111111] p-4 sm:p-5 shadow-xl">
      <h2 className="mb-4 text-base sm:text-lg font-bold text-white">
        Latest Activity
      </h2>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-zinc-900/80" />
          ))}
        </div>
      )}

      {!loading && txs.length === 0 && (
        <p className="text-sm text-zinc-500">No transaction</p>
      )}

      {!loading && txs.length > 0 && (
        <div className="scroll-thin flex-1 min-h-0 space-y-1 overflow-y-auto pr-1">
          {txs.map((tx, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 rounded-lg border-b border-white/5 px-2 py-2.5 last:border-b-0 hover:bg-white/[0.03] transition-colors"
            >
              <div className="min-w-0">
                <span
                  className={`text-sm font-semibold ${
                    tx.type === "BUY" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {tx.type === "BUY" ? "● BUY" : "● SELL"}
                </span>
                {tx.walletAddress ? (
                  <a
                    href={explorerUrl(tx.walletAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate font-mono text-xs text-zinc-500 hover:text-orange-400 hover:underline"
                  >
                    {tx.wallet}
                  </a>
                ) : (
                  <p className="truncate font-mono text-xs text-zinc-500">
                    {tx.wallet}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-white">{tx.amount}</p>
                <p className="text-xs text-zinc-500">
                  {tx.tokenAmount ? `${tx.tokenAmount} TBB · ` : ""}
                  {tx.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
