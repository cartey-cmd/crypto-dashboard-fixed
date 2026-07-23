"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, ShieldCheck, ShieldAlert } from "lucide-react";
import { getTierForPercentage } from "@/lib/tiers";
import HolderCard from "./HolderCard";

type Status = "idle" | "loading" | "eligible" | "ineligible" | "error";

interface Result {
  address: string;
  rank: number | null;
  percentage: string;
  percentageRaw: number;
  balance: string;
}

export default function HolderChecker() {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleCheck() {
    const address = wallet.trim();
    if (!address) return;

    setStatus("loading");
    setResult(null);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `/api/holder-check?wallet=${encodeURIComponent(address)}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (!data.success) {
        setErrorMsg(data.error || "Failed to check wallet.");
        setStatus("error");
        return;
      }

      if (!data.eligible) {
        setStatus("ineligible");
        return;
      }

      setResult({
        address: data.address,
        rank: data.rank,
        percentage: data.percentage,
        percentageRaw: data.percentageRaw,
        balance: data.balance,
      });
      setStatus("eligible");
    } catch {
      setErrorMsg("Failed to check wallet. Please try again.");
      setStatus("error");
    }
  }

  const tier = result ? getTierForPercentage(result.percentageRaw) : null;

  return (
    <div
      id="holder-checker"
      className="scroll-mt-28 h-full flex flex-col rounded-2xl border border-orange-500/20 bg-[#111111] p-5 sm:p-6 lg:p-8"
    >
      <h2 className="text-3xl font-black leading-tight text-white text-center lg:text-left sm:text-4xl">
        TBB
        <br />
        HOLDER
        <br />
        CARD
        <br />
        <span className="text-orange-400">CHECKER</span>
      </h2>

      <p className="mt-4 max-w-sm text-sm text-zinc-400 text-center lg:text-left mx-auto lg:mx-0">
        Check your wallet and see your exclusive TBB Holder Card. You are not
        just a holder, you are part of the bull army.
      </p>

      <div className="relative mt-6 mx-auto lg:mx-0 h-36 w-36 sm:h-40 sm:w-40 overflow-hidden rounded-full border-2 border-orange-500/40 shadow-[0_0_40px_-10px_rgba(249,115,22,0.6)]">
        <Image
          src="/cards/bull-hero.jpg"
          alt="The Bitcoin Bull"
          fill
          sizes="160px"
          className="object-contain object-center"
        />
      </div>

      <div className="mt-6 flex gap-2">
        <input
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCheck()}
          placeholder="Enter your Solana wallet address"
          className="w-full rounded-xl bg-zinc-900 p-4 outline-none border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/50"
        />
      </div>
      <p className="mt-2 text-xs text-zinc-600">
        Example: 7xKX...9r2e
      </p>

      <button
        onClick={handleCheck}
        disabled={status === "loading" || !wallet.trim()}
        className="w-full mt-5 flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 font-bold text-black hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        {status === "loading" ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Checking...
          </>
        ) : (
          <>
            <Search size={18} />
            Check Holder Card
          </>
        )}
      </button>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <ShieldCheck size={16} className="shrink-0 text-green-400" />
        <p className="text-xs text-zinc-400">
          Verified by community — 100% on-chain, transparent, bullish.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {status === "eligible" && result && tier && (
          <motion.div
            key="card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6"
          >
            <HolderCard
              tier={tier}
              address={result.address}
              rank={result.rank}
              percentage={result.percentage}
              balance={result.balance}
            />
          </motion.div>
        )}

        {status === "ineligible" && (
          <motion.div
            key="ineligible"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
          >
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-orange-400" />
            <p className="text-sm text-zinc-400">
              This wallet doesn&apos;t hold any $TBB yet. Grab a bag to unlock
              your Holder Card.
            </p>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
          >
            {errorMsg || "Failed to check holder status. Please try again."}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1" />
    </div>
  );
}
