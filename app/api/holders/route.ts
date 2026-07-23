import { NextResponse } from "next/server";
import { getTopHolders, getTokenSupply, TOKEN_ADDRESS } from "@/lib/helius";

// Sama seperti /api/top-holders, dipindah dari Birdeye ke Helius (DAS
// getTokenAccounts untuk daftar holder + getTokenSupply untuk total supply
// asli yang dipakai menghitung percentage).
export async function GET() {
  try {
    const [{ accounts }, supply] = await Promise.all([
      getTopHolders(TOKEN_ADDRESS, { limit: 10 }),
      getTokenSupply(TOKEN_ADDRESS),
    ]);

    const decimals = supply.decimals;
    const totalSupplyRaw = Number(supply.amount || 0);

    const data = accounts.map((acc, index) => {
      const amount = decimals > 0 ? acc.amount / 10 ** decimals : acc.amount;

      const percent =
        totalSupplyRaw > 0 ? (acc.amount / totalSupplyRaw) * 100 : 0;

      return {
        rank: index + 1,
        owner: acc.owner,
        amount,
        percent,
      };
    });

    return NextResponse.json(data);
  } catch (e: any) {
    console.error(e);

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
