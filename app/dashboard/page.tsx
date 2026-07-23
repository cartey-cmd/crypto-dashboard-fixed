"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import MainSection from "@/components/dashboard/MainSection";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar onLogoClick={() => router.push("/")} />

      <div className="max-w-[1500px] mx-auto px-3 py-5 sm:px-6 sm:py-8">
        <MainSection />
      </div>
    </main>
  );
}
