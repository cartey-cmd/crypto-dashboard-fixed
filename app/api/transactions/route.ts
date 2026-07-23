import { NextResponse } from "next/server";
import { getMintTransactions, extractSwap, TOKEN_ADDRESS } from "@/lib/helius";
import { getTokenData } from "@/lib/dexscreener";

// Sebelumnya endpoint ini 100% Birdeye (`/defi/txs/token`, yang juga
// langsung ngasih nilai USD per transaksi lewat field volumeUSD). Sekarang:
// - daftar transaksi swap -> Helius Enhanced Transactions API
//   (getMintTransactions), diklasifikasikan BUY/SELL pakai `extractSwap`
//   yang sama dipakai /api/holder-flow.
// - nilai USD per transaksi -> Helius TIDAK mengembalikan harga historis
//   per transaksi, jadi didekati dari (jumlah token di transaksi) x (harga
//   TBB saat ini dari DexScreener). Ini estimasi, bukan harga persis di
//   detik transaksi terjadi -- cukup akurat untuk transaksi yang baru
//   terjadi beberapa menit/detik lalu seperti yang ditampilkan di sini.
//
// Catatan: cache in-memory ini hanya bertahan selama instance server/lambda
// masih hidup (warm). Di lingkungan serverless (mis. Vercel), instance bisa
// di-reset kapan saja sehingga fallback ini tidak selalu tersedia — kalau
// butuh fallback yang persisten di semua kondisi, ganti dengan penyimpanan
// eksternal (KV/Redis/dll).
let lastData: any[] = [];

export async function GET() {
  try {
    const [txs, token] = await Promise.all([
      getMintTransactions(TOKEN_ADDRESS, { limit: 20 }),
      getTokenData().catch(() => null),
    ]);

    const priceUsd = Number(token?.priceUsd || 0);

    const data = txs
      .map((tx) => extractSwap(tx, TOKEN_ADDRESS))
      .filter((swap): swap is NonNullable<typeof swap> => swap !== null)
      .slice(0, 10)
      .map((swap) => {
        const volumeUsd = priceUsd > 0 ? swap.amount * priceUsd : null;

        return {
          type: swap.direction,
          wallet: swap.wallet
            ? `${swap.wallet.slice(0, 5)}...${swap.wallet.slice(-4)}`
            : "-",
          walletAddress: swap.wallet || null,
          tokenAmount: swap.amount.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          }),
          amount:
            volumeUsd != null
              ? `$${volumeUsd.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}`
              : "$0",
          time: new Date(swap.timestamp).toLocaleTimeString(),
        };
      });

    // simpan data terakhir sebagai fallback kalau request berikutnya gagal
    if (data.length) {
      lastData = data;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.log("TRANSACTION FALLBACK:", error.message);

    return NextResponse.json({
      success: true,
      cached: true,
      data: lastData,
    });
  }
}
