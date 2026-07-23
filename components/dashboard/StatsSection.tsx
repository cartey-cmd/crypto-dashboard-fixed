"use client";

import StatCard from "../cards/StatCard";
import useDashboard from "@/hooks/useDashboard";
import { compact, formatPrice } from "@/utils/format";

export default function StatsSection() {
  const { dashboard, loading } = useDashboard();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
      <StatCard
        title="TBB PRICE"
        loading={loading}
        value={loading ? "" : formatPrice(dashboard?.price)}
      />

      <StatCard
        title="MARKET CAP"
        loading={loading}
        value={loading ? "" : `$${compact(dashboard?.marketCap)}`}
      />

      <StatCard
        title="TOTAL HOLDERS"
        loading={loading}
        value={loading ? "" : compact(dashboard?.holders)}
      />

      <StatCard
        title="24H VOLUME"
        loading={loading}
        value={loading ? "" : `$${compact(dashboard?.volume24h)}`}
      />
    </div>
  );
}
