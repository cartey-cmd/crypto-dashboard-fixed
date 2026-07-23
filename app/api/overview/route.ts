import { NextResponse } from "next/server";
import { getTokenData } from "@/lib/dexscreener";
import { getHolderCount, TOKEN_ADDRESS } from "@/lib/helius";

// Sama seperti /api/dashboard: dipindah dari Birdeye ke DexScreener + Helius
// (endpoint ini sendiri sebenarnya belum dipakai komponen manapun saat ini,
// tapi diperbaiki juga biar konsisten dan tidak menyesatkan kalau dipakai
// lagi nanti).
export async function GET() {
  try {
    const [token, holderCount] = await Promise.all([
      getTokenData(),
      getHolderCount(TOKEN_ADDRESS),
    ]);

    return NextResponse.json({
      symbol: token.baseToken?.symbol || "TBB",
      name: token.baseToken?.name || "",
      logo: "",
      price: Number(token.priceUsd || 0),
      marketCap: Number(token.marketCap ?? token.fdv ?? 0),
      liquidity: Number(token.liquidity?.usd || 0),
      holders: holderCount,
      volume24h: Number(token.volume?.h24 || 0),
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e.message,
      },
      {
        status: 500,
      }
    );
  }
}
