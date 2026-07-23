"use client";

import { ReactNode } from "react";
import { Users, CreditCard, Trophy, Gift } from "lucide-react";
import HolderFlowChart from "../charts/HolderFlowChart";
import PriceChart from "../charts/PriceChart";
import HolderChecker from "../cards/HolderChecker";
import TopHolders from "../cards/TopHolders";
import ActivityFeed from "../cards/ActivityFeed";
import StatsSection from "./StatsSection";
import useDashboard from "@/hooks/useDashboard";

export default function MainSection() {
  const { loading, error } = useDashboard();

  if (loading) {
    return (
      <section id="top" className="scroll-mt-28 mt-8 flex h-[600px] items-center justify-center">
        <div className="text-lg text-zinc-400 animate-pulse">
          Loading Dashboard...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="top" className="scroll-mt-28 mt-8 flex h-[600px] items-center justify-center">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-400">
          Failed to load dashboard data.
        </div>
      </section>
    );
  }

  return (
    <section id="top" className="scroll-mt-28 space-y-5 sm:space-y-6">
      {/* STATS */}
      <StatsSection />

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* LEFT: Hero Checker */}
        <div className="lg:col-span-4 xl:col-span-3 h-full">
          <HolderChecker />
        </div>

        {/* CENTER: Holder Flow + Price Chart */}
        <div className="lg:col-span-8 xl:col-span-6 h-full flex flex-col gap-5 sm:gap-6">
          <HolderFlowChart />
          <div className="flex-1 flex flex-col">
            <PriceChart />
          </div>
        </div>

        {/* RIGHT: Leaderboard + Activity */}
        <div
          id="leaderboard"
          className="scroll-mt-28 lg:col-span-12 xl:col-span-3 h-full flex flex-col gap-5 sm:gap-6"
        >
          <TopHolders />
          <div className="flex-1 flex flex-col min-h-[280px]">
            <ActivityFeed />
          </div>
        </div>
      </div>

      {/* FEATURE CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <FeatureCard
          icon={<Users size={20} />}
          title="Holder Flow"
          desc="Track wallets buying and selling in real time."
          href="#holder-flow"
        />
        <FeatureCard
          icon={<CreditCard size={20} />}
          title="Holder Card"
          desc="Get your exclusive TBB Holder Card."
          href="#holder-checker"
        />
        <FeatureCard
          icon={<Trophy size={20} />}
          title="Leaderboard"
          desc="See the top bulls in the arena."
          href="#leaderboard"
        />
        <FeatureCard
          icon={<Gift size={20} />}
          title="Community"
          id="community"
          desc="Stronger together, bullish forever."
          href="#top"
        />
      </div>

      {/* ABOUT / FOOTER */}
      <div
        id="about"
        className="scroll-mt-28 flex flex-col gap-4 border-t border-zinc-900 pt-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="text-sm text-zinc-600">
          © 2026 TBB. All rights reserved.
        </p>

        <div className="flex gap-6 text-sm text-zinc-500">
          <a href="#" className="hover:text-orange-400">
            Disclaimer
          </a>
          <a href="#" className="hover:text-orange-400">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-orange-400">
            Terms of Use
          </a>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  href,
  id,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  href: string;
  id?: string;
}) {
  return (
    <a
      id={id}
      href={href}
      className="scroll-mt-28 rounded-2xl border border-orange-500/10 bg-[#111111] p-5 transition-colors hover:border-orange-500/40"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-white">
        {title}
      </h3>
      <p className="mt-1 text-xs text-zinc-500">{desc}</p>
    </a>
  );
}
