"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Flame } from "lucide-react";
import { Tier } from "@/lib/tiers";
import { shortAddress } from "@/utils/format";

interface HolderCardProps {
  tier: Tier;
  address: string;
  rank: number | null;
  percentage: string;
  balance: string;
}

export default function HolderCard({
  tier,
  address,
  rank,
  percentage,
  balance,
}: HolderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: tier.accent,
        boxShadow: `0 0 30px -8px ${tier.accent}80`,
      }}
    >
      {/* Artwork */}
      {tier.video ? (
        <div className="relative aspect-[3/2] w-full bg-black">
          <video
            src={tier.video}
            poster={tier.image}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      ) : tier.image ? (
        <div className="relative aspect-[3/2] w-full bg-black">
          <Image
            src={tier.image}
            alt={tier.name}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
            priority
          />
        </div>
      ) : (
        // Fallback panel custom untuk tier yang belum punya artwork
        // dedicated, tetap konsisten dengan identitas TBB.
        <div
          className="relative flex aspect-[3/2] w-full flex-col items-center justify-center gap-3 bg-black"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(251,146,60,0.25), #0a0a0a 70%)",
          }}
        >
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full border-2"
            style={{ borderColor: tier.accent, boxShadow: `0 0 24px ${tier.accent}66` }}
          >
            <Flame size={36} style={{ color: tier.accent }} />
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              $TBB Card ID
            </p>
            <p className="text-2xl font-black uppercase text-white">
              {tier.name}
            </p>
          </div>
        </div>
      )}

      {/* Holder stats strip */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3"
        style={{ backgroundColor: tier.accentSoft }}
      >
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">
            Holder
          </p>
          <p className="font-mono text-sm font-semibold text-white">
            {shortAddress(address)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">
            Rank / Supply
          </p>
          <p className="text-sm font-semibold" style={{ color: tier.accent }}>
            {rank ? `#${rank}` : "Unranked"} · {percentage}%
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 pt-1">
        <p className="text-xs text-zinc-500">
          Holding {balance} $TBB — {tier.description}
        </p>
        <p className="mt-2 text-xs font-medium" style={{ color: tier.accent }}>
          Thank you for your conviction — the Bull Army is stronger with you in it. 🔥
        </p>
      </div>
    </motion.div>
  );
}
