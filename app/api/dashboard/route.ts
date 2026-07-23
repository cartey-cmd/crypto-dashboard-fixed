import { NextResponse } from "next/server";
import { getTokenData } from "@/lib/dexscreener";
import { getHolderCount, TOKEN_ADDRESS } from "@/lib/helius";

// Sebelumnya endpoint ini 100% Birdeye (overview + holder list) dan bikin
// seluruh dashboard gagal total begitu Birdeye balas Unauthorized. Sekarang
// tidak ada Birdeye sama sekali di sini:
// - price / marketCap / liquidity / volume24h -> DexScreener (gratis, tanpa
//   API key, lib/dexscreener.ts sudah ada sebelumnya tapi belum dipakai).
// - total holder -> Helius (jumlah token account yang punya saldo untuk
//   mint ini, lewat getHolderCount di lib/helius.ts).
export async function GET() {
  try {
    const [token, holderCount] = await Promise.all([
      getTokenData(),
      getHolderCount(TOKEN_ADDRESS),
    ]);

    return NextResponse.json({
      overview: {
        symbol: token.baseToken?.symbol || "TBB",
        name: token.baseToken?.name || "",
        logo: "",
        price: Number(token.priceUsd || 0),
        marketCap: Number(token.marketCap ?? token.fdv ?? 0),
        liquidity: Number(token.liquidity?.usd || 0),
        holders: holderCount,
        volume24h: Number(token.volume?.h24 || 0),
      },
      // Daftar holder mentah dari respons ini sudah tidak dipakai di
      // manapun (Top Holders punya endpoint sendiri: /api/top-holders) --
      // dipertahankan sebagai array kosong biar bentuk respons tetap sama
      // kalau ada pemakai lain nanti.
      holders: [],
    });
  } catch (e: any) {
    console.error("DASHBOARD ERROR:", e.message);

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
