"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { Flame, Users, CreditCard, Trophy, Gift, ChevronDown } from "lucide-react";
import useDashboard from "@/hooks/useDashboard";
import { useCountUp } from "@/hooks/useCountUp";
import { compact, formatPrice } from "@/utils/format";
import { TIERS } from "@/lib/tiers";

export default function LandingHero({ onOpenDashboard }: { onOpenDashboard: () => void }) {
  const { dashboard, loading } = useDashboard();

  const price = useCountUp(loading ? undefined : dashboard?.price ?? 0);
  const marketCap = useCountUp(loading ? undefined : dashboard?.marketCap ?? 0);
  const holders = useCountUp(loading ? undefined : dashboard?.holders ?? 0);
  const volume24h = useCountUp(loading ? undefined : dashboard?.volume24h ?? 0);

  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const observedRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = entry.target.getAttribute("data-reveal-key");
            if (key) {
              setRevealed((prev) => new Set(prev).add(key));
            }
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    observedRefs.current.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  const registerRef = (key: string) => (el: HTMLElement | null) => {
    if (el) observedRefs.current.set(key, el);
  };

  const featureIcons: Record<string, ReactNode> = {
    "Holder Growth": <Users size={18} />,
    "Holder Card": <CreditCard size={18} />,
    Leaderboard: <Trophy size={18} />,
    Community: <Gift size={18} />,
  };

  const features = [
    { title: "Holder Growth", desc: "Track community growth every day with the holder flow chart." },
    { title: "Holder Card", desc: "Claim your exclusive TBB Holder Card based on your tier." },
    { title: "Leaderboard", desc: "See who the top bulls in the community arena are." },
    { title: "Community", desc: "Stronger together, bullish forever." },
  ];

  return (
    <div
      className="relative bg-black text-[#f4ede1]"
      style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
    >
      {/* ambient ember glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 20% 10%, rgba(249,115,22,0.10), transparent 40%), radial-gradient(circle at 85% 70%, rgba(250,204,21,0.06), transparent 45%)",
        }}
      />

      {/* ---------- HERO ---------- */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-7 flex h-16 w-16 animate-[pulse-glow_2.6s_ease-in-out_infinite] items-center justify-center rounded-[20px] border border-orange-500/35 bg-gradient-to-br from-orange-500/20 to-orange-500/5">
          <Flame className="text-orange-500" size={30} fill="#f97316" strokeWidth={0} />
        </div>

        <div className="mb-4 text-xs tracking-[0.35em] text-zinc-500 uppercase">
          SOLANA <span className="text-orange-500">·</span> INTELLIGENCE TERMINAL
        </div>

        <h1
          className="bg-gradient-to-b from-white via-[#d8d2c4] to-[#8a8578] bg-clip-text text-transparent"
          style={{
            fontFamily: "var(--font-archivo-black), sans-serif",
            fontSize: "clamp(42px, 9vw, 108px)",
            lineHeight: 0.94,
            letterSpacing: "-0.01em",
          }}
        >
          ARE YOU
          <br />
          A BELIEVER?
        </h1>

        <p className="mt-6 max-w-xl text-zinc-400" style={{ fontSize: "clamp(15px, 2.2vw, 20px)" }}>
          One dashboard for all your $TBB data — price, holders, whale movement, all real-time.
        </p>

        {/* LIVE ticker */}
        <div className="mt-14 w-full max-w-2xl overflow-hidden rounded-2xl border border-orange-500/20 bg-white/[0.02]">
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5 text-[11px] tracking-[0.15em] text-zinc-500 uppercase">
            <span className="h-[7px] w-[7px] animate-[blink_1.6s_ease-in-out_infinite] rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
            LIVE
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4">
            <TickerStat label="TBB Price" value={formatPrice(price)} />
            <TickerStat label="Market Cap" value={`$${compact(marketCap)}`} />
            <TickerStat label="Holders" value={compact(holders)} />
            <TickerStat label="24H Volume" value={`$${compact(volume24h)}`} />
          </div>
        </div>

        <button
          onClick={onOpenDashboard}
          className="absolute bottom-8 flex flex-col items-center gap-1 text-[11px] tracking-[0.2em] text-zinc-500 uppercase transition-colors hover:text-orange-400"
        >
          open dashboard
          <ChevronDown size={14} className="animate-bounce" />
        </button>
      </section>

      {/* ---------- TIERS ---------- */}
      <section className="relative z-10 flex flex-col items-center px-6 py-24">
        <div className="mb-14 max-w-xl text-center">
          <div className="mb-3 text-xs tracking-[0.35em] text-zinc-500 uppercase">HOLDER CARD</div>
          <h2
            style={{ fontFamily: "var(--font-archivo-black), sans-serif", fontSize: "clamp(30px, 5.5vw, 54px)" }}
          >
            CHECK YOUR TIER
          </h2>
          <p className="mt-3 text-sm text-zinc-500">Which whale class does your wallet belong to?</p>
        </div>

        <div className="grid w-full max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
          {TIERS.map((tier, i) => {
            const key = `tier-${tier.id}`;
            const isIn = revealed.has(key);
            return (
              <div
                key={tier.id}
                ref={registerRef(key)}
                data-reveal-key={key}
                className="relative overflow-hidden rounded-2xl border p-6 transition-all duration-700"
                style={{
                  borderColor: `${tier.accent}4d`,
                  background: "linear-gradient(160deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
                  opacity: isIn ? 1 : 0,
                  transform: isIn ? "translateY(0) scale(1)" : "translateY(30px) scale(0.96)",
                  transitionDelay: `${i * 90}ms`,
                }}
              >
                <div
                  aria-hidden
                  className="absolute -inset-x-[40%] -top-[40%] h-[140%] opacity-35 blur-3xl"
                  style={{ background: tier.accent }}
                />
                <div className="relative">
                  <span
                    className="mb-4 inline-block rounded-full border px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase"
                    style={{ color: tier.accent, borderColor: `${tier.accent}59`, background: tier.accentSoft }}
                  >
                    {tier.subtitle}
                  </span>
                  <div className="mb-1 text-lg font-bold sm:text-xl">{tier.name}</div>
                  <div className="text-xs text-zinc-500" style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                    {tier.minPercentage > 0 ? `≥ ${tier.minPercentage}% supply` : "Verified holder"}
                  </div>
                  <p className="mt-3.5 text-[12.5px] leading-relaxed text-zinc-500">{tier.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="relative z-10 flex flex-col items-center px-6 py-24">
        <div className="mb-14 text-center">
          <div className="mb-3 text-xs tracking-[0.35em] text-zinc-500 uppercase">FEATURES</div>
          <h2
            style={{ fontFamily: "var(--font-archivo-black), sans-serif", fontSize: "clamp(30px, 5.5vw, 54px)" }}
          >
            EVERYTHING IN ONE SCREEN
          </h2>
        </div>

        <div className="grid w-full max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
          {features.map((f, i) => {
            const key = `feat-${f.title}`;
            const isIn = revealed.has(key);
            return (
              <div
                key={f.title}
                ref={registerRef(key)}
                data-reveal-key={key}
                className="rounded-2xl border border-orange-500/10 bg-[#111111] p-5 transition-all duration-500"
                style={{
                  opacity: isIn ? 1 : 0,
                  transform: isIn ? "translateY(0)" : "translateY(20px)",
                  transitionDelay: `${i * 90}ms`,
                }}
              >
                <div className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-[11px] bg-orange-500/15 text-orange-400">
                  {featureIcons[f.title]}
                </div>
                <h3 className="mb-1.5 text-[12.5px] font-bold tracking-wide uppercase">{f.title}</h3>
                <p className="text-xs leading-relaxed text-zinc-500">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative z-10 flex flex-col items-center px-6 py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] border border-orange-500/35 bg-gradient-to-br from-orange-500/20 to-orange-500/5">
          <Flame className="text-orange-500" size={30} fill="#f97316" strokeWidth={0} />
        </div>
        <h2
          style={{ fontFamily: "var(--font-archivo-black), sans-serif", fontSize: "clamp(34px, 7vw, 80px)", lineHeight: 1 }}
        >
          STRONGER TOGETHER.
          <br />
          <span className="text-orange-500">BULLISH FOREVER.</span>
        </h2>
        <p className="mt-5 mb-9 text-zinc-500">TBB Analytics — check your wallet now.</p>
        <button
          onClick={onOpenDashboard}
          className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 px-9 py-4 text-sm font-bold tracking-wide text-black shadow-[0_8px_30px_rgba(249,115,22,0.35)] transition-transform hover:scale-[1.03]"
          style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
        >
          OPEN DASHBOARD →
        </button>
        <div className="mt-16 text-[11px] tracking-[0.1em] text-zinc-700 uppercase">© 2026 TBB Analytics</div>
      </section>

      <style jsx global>{`
        @keyframes pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 30px rgba(249, 115, 22, 0.18);
          }
          50% {
            box-shadow: 0 0 60px rgba(249, 115, 22, 0.5);
          }
        }
        @keyframes blink {
          50% {
            opacity: 0.35;
          }
        }
      `}</style>
    </div>
  );
}

function TickerStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-white/5 px-3 py-4 text-center last:border-r-0 sm:[&:nth-child(2)]:border-r">
      <div className="text-[9px] tracking-[0.12em] text-zinc-500 uppercase">{label}</div>
      <div
        className="mt-1.5 text-orange-500"
        style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "clamp(14px, 3vw, 20px)", fontWeight: 700 }}
      >
        {value}
      </div>
    </div>
  );
}
