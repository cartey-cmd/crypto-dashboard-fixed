"use client";

import { useRouter } from "next/navigation";
import LandingHero from "@/components/landing/LandingHero";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white">
      <LandingHero onOpenDashboard={() => router.push("/dashboard")} />
    </main>
  );
}
