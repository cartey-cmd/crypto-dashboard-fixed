import { NextResponse } from "next/server";
import { getHolderCount, getTokenSupply, TOKEN_ADDRESS } from "@/lib/helius";
import { getTokenData } from "@/lib/dexscreener";

// Endpoint diagnostik sederhana buat mengecek koneksi ke Helius +
// DexScreener sekaligus (sebelumnya cuma test ke Birdeye token_overview).
export async function GET() {
  try {
    const [token, holderCount, supply] = await Promise.all([
      getTokenData(),
      getHolderCount(TOKEN_ADDRESS),
      getTokenSupply(TOKEN_ADDRESS),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        dexscreener: token,
        helius: {
          holderCount,
          supply,
        },
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e.message,
      },
      {
        status: 500,
      }
    );
  }
}
