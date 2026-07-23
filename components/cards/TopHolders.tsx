"use client";

import { useState } from "react";
import { Crown } from "lucide-react";
import useTopHolders from "@/hooks/useTopHolders";
import { explorerUrl } from "@/utils/format";

const COLLAPSED_COUNT = 5;

export default function TopHolders() {
  const { holders, loading, error, retry } = useTopHolders();
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? holders : holders.slice(0, COLLAPSED_COUNT);

  return (
    <div className="rounded-2xl border border-orange-500/20 bg-[#111111] p-4 sm:p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold text-white">
          <Crown size={18} className="text-orange-400" />
          Top Holders
        </h2>
        <span className="text-xs text-zinc-500">
          {holders.length > 0 ? `${holders.length} wallets` : ""}
        </span>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: COLLAPSED_COUNT }).map((_, i) => (
            <div
              key={i}
              className="h-11 animate-pulse rounded-lg bg-zinc-900/80"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={retry}
            className="mt-3 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && holders.length === 0 && (
        <p className="text-sm text-zinc-500">No holders found</p>
      )}

      {!loading && !error && holders.length > 0 && (
        <>
          <div
            className={
              expanded
                ? "scroll-thin max-h-[360px] space-y-1 overflow-y-auto pr-1"
                : "space-y-1"
            }
          >
            {visible.map((holder) => (
              <div
                key={holder.address}
                className="flex items-center justify-between gap-2 rounded-lg border-b border-white/5 px-2 py-2.5 last:border-b-0 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 shrink-0 text-sm font-bold text-orange-400">
                    #{holder.rank}
                  </span>
                  <a
                    href={explorerUrl(holder.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate font-mono text-sm text-zinc-300 hover:text-orange-400 hover:underline"
                  >
                    {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                  </a>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-white">
                    {holder.balance}
                  </p>
                  <p className="text-xs text-orange-400">
                    {holder.percentage}%
                  </p>
                </div>
              </div>
            ))}
          </div>

          {holders.length > COLLAPSED_COUNT && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-4 w-full rounded-xl bg-orange-500/10 py-2.5 text-sm font-semibold text-orange-400 hover:bg-orange-500/20 transition-colors"
            >
              {expanded ? "Show Less" : "View All Top Holders"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
