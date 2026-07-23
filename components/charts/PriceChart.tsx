"use client";

import { useState } from "react";
import { useChart } from "@/hooks/useChart";
import { formatPrice } from "@/utils/format";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TIMEFRAMES = ["1H", "4H", "12H", "1D", "ALL"];

export default function PriceChart() {
  const [timeframe, setTimeframe] = useState("1H");

  const { data, error, isLoading } = useChart(timeframe);

  // Domain Y-axis dengan sedikit padding di atas/bawah supaya garis harga
  // tidak menempel di tepi chart (dataMin/dataMax mentah bikin chart
  // terlihat "kepotong").
  const prices = data.map((d) => d.price).filter((p) => Number.isFinite(p));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const pad = (maxPrice - minPrice) * 0.1 || maxPrice * 0.05 || 1;

  return (
    <div className="h-full flex flex-col rounded-2xl border border-orange-500/20 bg-[#111111] p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Price Chart
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            GeckoTerminal realtime chart
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

      {isLoading && (
        <div className="flex flex-1 min-h-[280px] sm:min-h-[360px] items-center justify-center text-sm text-zinc-500">
          Loading chart...
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-1 min-h-[280px] sm:min-h-[360px] flex-col items-center justify-center gap-3 text-sm text-red-400">
          <p>Failed to load chart data.</p>
        </div>
      )}

      {!isLoading && !error && data.length === 0 && (
        <div className="flex flex-1 min-h-[280px] sm:min-h-[360px] items-center justify-center text-sm text-zinc-500">
          No chart data available for this timeframe.
        </div>
      )}

      {!isLoading && !error && data.length > 0 && (
        <div className="flex-1 min-h-[280px] sm:min-h-[360px] -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff7b00" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#ff7b00" stopOpacity={0} />
                </linearGradient>
              </defs>

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
                width={78}
                domain={[minPrice - pad, maxPrice + pad]}
                tickFormatter={(v: number) => formatPrice(v)}
              />

              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #333",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#a1a1aa" }}
                formatter={(v: number) => [formatPrice(v), "Price"]}
              />

              <Area
                type="monotone"
                dataKey="price"
                stroke="#ff8800"
                strokeWidth={2.5}
                fill="url(#priceFill)"
                dot={false}
                activeDot={{ r: 5 }}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
