import { NextResponse } from "next/server";
import { getTopHolders, getTokenSupply, TOKEN_ADDRESS } from "@/lib/helius";

// Sebelumnya endpoint ini 100% Birdeye (`/defi/v3/token/holder` +
// `/defi/token_overview`). Sekarang:
// - daftar holder & amount -> Helius DAS `getTokenAccounts` (lib/helius.ts:
//   getTopHolders), diurutkan manual di sisi kita karena Helius tidak
//   mengurutkan hasilnya berdasarkan amount.
// - total supply asli (buat hitung percentage) -> `getTokenSupply`, method
//   RPC Solana standar yang jauh lebih akurat daripada menurunkan dari
//   marketCap / price seperti sebelumnya.
export async function GET() {
  try {
    const [{ accounts }, supply] = await Promise.all([
      getTopHolders(TOKEN_ADDRESS, { limit: 20 }),
      getTokenSupply(TOKEN_ADDRESS),
    ]);

    if (!accounts.length) {
      return NextResponse.json({
        success: true,
        holders: [],
      });
    }

    const decimals = supply.decimals;
    const totalSupplyRaw = Number(supply.amount || 0);

    const holders = accounts.map((acc, index) => {
      const balance = decimals > 0 ? acc.amount / 10 ** decimals : acc.amount;

      const percentageNum =
        totalSupplyRaw > 0 ? (acc.amount / totalSupplyRaw) * 100 : 0;

      return {
        rank: index + 1,
        address: acc.owner,
        balance: balance.toLocaleString("en-US", {
          maximumFractionDigits: 2,
        }),
        // nilai numerik mentah, dipakai BubbleChart untuk menentukan
        // ukuran bubble secara proporsional
        balanceRaw: balance,
        percentage: percentageNum.toFixed(2),
        percentageRaw: percentageNum,
      };
    });

    return NextResponse.json({
      success: true,
      holders,
    });
  } catch (error: any) {
    console.error("TOP HOLDERS ERROR:", error.message);

    return NextResponse.json({
      success: false,
      holders: [],
      error: error.message,
    });
  }
}
