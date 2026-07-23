"use client";

import { useState } from "react";
import { Activity, Flame, Menu, X } from "lucide-react";

const LINKS = [
  { label: "Home", href: "#top" },
  { label: "Holder Checker", href: "#holder-checker" },
  { label: "Leaderboard", href: "#leaderboard" },
  { label: "Holder Flow", href: "#holder-flow" },
  { label: "About TBB", href: "#about" },
];

export default function Navbar({ onLogoClick }: { onLogoClick?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-orange-500/10 bg-[#09090B]/90 backdrop-blur-xl">
      <div className="flex h-16 sm:h-20 items-center justify-between px-4 sm:px-8">
        {/* Logo */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-3 sm:gap-4 text-left"
        >
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-orange-500/15 border border-orange-500/20">
            <Flame className="text-orange-400" size={24} />
          </div>

          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white leading-tight">
              TBB Analytics
            </h1>
            <p className="hidden sm:block text-xs text-zinc-500">
              Solana Intelligence Terminal
            </p>
          </div>
        </button>

        {/* Nav links (desktop) */}
        <nav className="hidden lg:flex items-center gap-6">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-400 transition-colors hover:text-orange-400"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2">
            <Activity size={16} className="text-green-400" />
            <span className="text-sm text-green-400">LIVE</span>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="lg:hidden rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-orange-400 hover:bg-zinc-800"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Nav links (mobile) */}
      {open && (
        <nav className="lg:hidden flex flex-col gap-1 border-t border-orange-500/10 px-4 py-3">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-orange-400"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
