"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import useHolderFlow from "@/hooks/useHolderFlow";

const TIMEFRAMES = ["1H", "4H", "12H", "1D", "ALL"];

export default function HolderFlowChart() {
  const [timeframe, setTimeframe] = useState("1H");
  const { data, error, isLoading } = useHolderFlow(timeframe);

  // The "sellers" bar is drawn as a negative value so it drops below
  // the 0 axis (diverging bar chart) -- the underlying data (wallet
  // count) stays positive, it's just flipped for visual purposes.
  const chartData = useMemo(
    () => data.map((d) => ({ ...d, sellersNeg: -d.sellers })),
    [data]
  );

  const totals = useMemo(() => {
    return data.reduce(
      (acc, d) => ({
        buyers: acc.buyers + d.buyers,
        sellers: acc.sellers + d.sellers,
      }),
      { buyers: 0, sellers: 0 }
    );
  }, [data]);

  return (
    <div
      id="holder-flow"
      className="scroll-mt-28 bg-[#111] rounded-2xl border border-orange-500/20 p-4 sm:p-6"
    >
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Holder Flow</h2>
          <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">
            Buyer vs seller wallets per period &middot; on-chain data via Helius
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                timeframe === tf
                  ? "bg-orange-500 text-black"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-orange-500/10 relative min-h-[300px] sm:min-h-[420px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#171717] text-sm text-zinc-500">
            Loading holder flow...
          </div>
        )}

        {!isLoading && error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#171717]">
            <p className="text-sm text-red-400 px-4 text-center">{String(error)}</p>
          </div>
        )}

        {!isLoading && !error && chartData.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#171717] text-sm text-zinc-500 px-4 text-center">
            No swap activity in this period yet.
          </div>
        )}

        {!isLoading && !error && chartData.length > 0 && (
          <div className="h-[300px] sm:h-[420px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="time"
                  stroke="#3f3f46"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={28}
                />

                <YAxis
                  stroke="#3f3f46"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  allowDecimals={false}
                />

                <ReferenceLine y={0} stroke="#3f3f46" />

                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #333",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#a1a1aa" }}
                  formatter={(value: number, name: string, item: any) => {
                    if (name === "Buyers") return [`${value} wallet`, "Buyers"];
                    if (name === "Sellers") return [`${Math.abs(value)} wallet`, "Sellers"];
                    return [value, name];
                  }}
                />

                <Legend
                  wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }}
                  formatter={(value) => (
                    <span style={{ color: "#a1a1aa" }}>{value}</span>
                  )}
                />

                <Bar dataKey="buyers" name="Buyers" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Bar dataKey="sellersNeg" name="Sellers" fill="#ef4444" radius={[0, 0, 3, 3]} maxBarSize={28} />
                <Line
                  type="monotone"
                  dataKey="netHolders"
                  name="Net Flow"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-between gap-2 text-zinc-500 text-xs sm:text-sm">
        <span>
          Green = buyer wallets ({totals.buyers}) &middot; Red = seller wallets ({totals.sellers})
        </span>
        <span>Orange line = net holder flow (buyers &minus; sellers)</span>
      </div>
    </div>
  );
}
