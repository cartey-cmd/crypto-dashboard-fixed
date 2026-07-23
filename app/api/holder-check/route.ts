import { NextRequest, NextResponse } from "next/server";
import {
  getOwnerTokenAmount,
  getTokenSupply,
  getTopHolders,
  TOKEN_ADDRESS,
} from "@/lib/helius";

// Catatan penting:
// Sebelumnya endpoint ini menelusuri daftar holder Birdeye (`/defi/v3/token/
// holder`) untuk mencari satu wallet sekaligus dapat rank-nya. Sekarang:
// - eligible / balance / percentage -> Helius DAS `getTokenAccounts`
//   di-filter langsung by `owner` + `mint` (getOwnerTokenAmount), jadi cuma
//   1 request buat 1 wallet, tidak perlu menelusuri semua holder.
// - percentage dihitung dari total supply asli (getTokenSupply, method RPC
//   Solana standar), bukan lagi dari marketCap/price.
// - rank tetap dicari dengan menelusuri top holder (getTopHolders) sampai
//   batas wajar (MAX_RANK_SCAN) -- kalau wallet ada di luar situ, rank
//   ditampilkan null ("Unranked" di UI). Tier/eligibility TIDAK bergantung
//   pada rank ini, cuma percentage, jadi ini aman.

const MAX_RANK_SCAN = 2000;

export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get("wallet")?.trim();

    if (!wallet || wallet.length < 32 || wallet.length > 44) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Solana wallet address.",
        },
        { status: 400 }
      );
    }

    const [balanceRaw, supply] = await Promise.all([
      getOwnerTokenAmount(TOKEN_ADDRESS, wallet),
      getTokenSupply(TOKEN_ADDRESS),
    ]);

    if (balanceRaw <= 0) {
      // Wallet tidak punya saldo token ini -> tidak eligible.
      return NextResponse.json({
        success: true,
        eligible: false,
      });
    }

    const decimals = supply.decimals;
    const totalSupplyRaw = Number(supply.amount || 0);

    const balance = decimals > 0 ? balanceRaw / 10 ** decimals : balanceRaw;
    const percentageRaw =
      totalSupplyRaw > 0 ? (balanceRaw / totalSupplyRaw) * 100 : 0;

    // cari rank di antara top holder (dibatasi MAX_RANK_SCAN supaya tidak
    // menelusuri seluruh holder cuma buat nomor urut kosmetik)
    let rank: number | null = null;

    try {
      const { accounts } = await getTopHolders(TOKEN_ADDRESS, {
        limit: MAX_RANK_SCAN,
        maxPages: Math.ceil(MAX_RANK_SCAN / 1000),
      });

      const idx = accounts.findIndex(
        (a) => a.owner.toLowerCase() === wallet.toLowerCase()
      );

      if (idx !== -1) rank = idx + 1;
    } catch (rankError: any) {
      // rank cuma kosmetik -- kalau gagal, biarkan null, jangan gagalkan
      // seluruh response.
      console.error("HOLDER RANK LOOKUP ERROR:", rankError.message);
    }

    return NextResponse.json({
      success: true,
      eligible: true,
      address: wallet,
      rank,
      balance: balance.toLocaleString("en-US", {
        maximumFractionDigits: 2,
      }),
      percentage:
        percentageRaw > 0 && percentageRaw < 0.0001
          ? "<0.0001"
          : percentageRaw.toFixed(4),
      percentageRaw,
    });
  } catch (error: any) {
    console.error("HOLDER CHECK ERROR:", error.message);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
