export type TierId = "sovereign" | "catalyst" | "vanguard" | "believer";

export interface Tier {
  id: TierId;
  name: string;
  subtitle: string;
  image?: string; // dipakai sebagai poster/fallback, dan kalau video kosong ini yang ditampilkan
  video?: string; // animasi shimmer kartu (mp4), diprioritaskan di atas image kalau ada
  accent: string; // hex, dipakai untuk glow/border/badge
  accentSoft: string; // rgba, dipakai untuk background strip
  minPercentage: number; // ambang minimum % supply (inclusive)
  description: string;
}

// Pembagian tier berdasarkan % dari total supply yang dipegang wallet,
// BUKAN posisi rank -- supaya berlaku untuk SEMUA holder, bukan cuma
// Top 20/50 yang datanya bisa kita ambil dari Helius. Urutan array
// harus dari threshold tertinggi ke terendah karena getTierForPercentage
// mengambil kecocokan pertama.
export const TIERS: Tier[] = [
  {
    id: "sovereign",
    name: "The Sovereign",
    subtitle: "Legendary Access",
    image: "/cards/sovereign.jpg",
    video: "/cards/sovereign.mp4",
    accent: "#facc15",
    accentSoft: "rgba(250, 204, 21, 0.15)",
    minPercentage: 1,
    description: "Whale tier — holding 1%+ of total $TBB supply.",
  },
  {
    id: "catalyst",
    name: "The Catalyst",
    subtitle: "Legendary Access",
    image: "/cards/catalyst.jpg",
    video: "/cards/catalyst.mp4",
    accent: "#e5e7eb",
    accentSoft: "rgba(229, 231, 235, 0.15)",
    minPercentage: 0.25,
    description: "Major holder — top-tier conviction in $TBB.",
  },
  {
    id: "vanguard",
    name: "The Vanguard",
    subtitle: "Legendary Access",
    image: "/cards/vanguard.jpg",
    video: "/cards/vanguard.mp4",
    accent: "#f97316",
    accentSoft: "rgba(249, 115, 22, 0.15)",
    minPercentage: 0.05,
    description: "Notable holder — a real believer in the Bitcoin Bull.",
  },
  {
    id: "believer",
    name: "The Believer",
    subtitle: "Community Access",
    image: "/cards/believer.jpg",
    video: "/cards/believer.mp4",
    accent: "#fb923c",
    accentSoft: "rgba(251, 146, 60, 0.12)",
    minPercentage: 0,
    description: "Verified $TBB holder — part of the bull army.",
  },
];

export function getTierForPercentage(percentage: number): Tier {
  return (
    TIERS.find((t) => percentage >= t.minPercentage) ?? TIERS[TIERS.length - 1]
  );
}
