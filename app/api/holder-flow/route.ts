import { NextRequest, NextResponse } from "next/server";
import {
  getMintTransactions,
  extractSwap,
  TOKEN_ADDRESS,
  SwapPoint,
} from "@/lib/helius";

// ===============================
// HOLDER FLOW
// ===============================
// Endpoint ini TIDAK memakai Birdeye sama sekali -- semua datanya diambil
// dari Helius Enhanced Transactions API untuk address mint token. Idenya:
// tiap transaksi bertipe SWAP yang menyentuh mint kita diklasifikasikan
// jadi BUY (wallet menerima token kita) atau SELL (wallet melepas token
// kita), lalu dikelompokkan per periode waktu supaya bisa digambar sebagai
// grafik "arus" wallet yang masuk (beli) vs keluar (jual) -- bukan lagi
// bubble per-holder seperti sebelumnya. Logika ekstraksi swap-nya sendiri
// ada di lib/helius.ts (extractSwap) supaya bisa dipakai bareng oleh
// /api/transactions.
//
// Arti tiap timeframe SEKARANG merujuk ke ukuran 1 bar/bucket di chart
// (bukan rentang tanggal seperti sebelumnya): "1H" = 1 bar mewakili 1 jam
// aktivitas, "4H" = 1 bar mewakili 4 jam, dst -- sama seperti candle di
// chart harga. rangeMs (seberapa jauh ke belakang) dihitung dari
// bucketMs x barCount, supaya tiap timeframe tetap menampilkan jumlah bar
// yang enak dilihat.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const FIXED_TIMEFRAMES: Record<
  string,
  { bucketMs: number; barCount: number; maxPages: number }
> = {
  // 1 bar = 1 jam, 24 bar -> nampilin 24 jam terakhir
  "1H": { bucketMs: HOUR, barCount: 24, maxPages: 10 },
  // 1 bar = 4 jam, 24 bar -> nampilin 4 hari terakhir
  "4H": { bucketMs: 4 * HOUR, barCount: 24, maxPages: 25 },
  // 1 bar = 12 jam, 20 bar -> nampilin 10 hari terakhir
  "12H": { bucketMs: 12 * HOUR, barCount: 20, maxPages: 40 },
  // 1 bar = 1 hari, 30 bar -> nampilin 30 hari terakhir
  "1D": { bucketMs: DAY, barCount: 30, maxPages: 80 },
};

// "ALL" beda dari timeframe lain di atas: bukan rentang tetap, tapi
// benar-benar dari transaksi PERTAMA mint ini (dekat dengan waktu token
// dibuat) sampai sekarang. Caranya: telusuri mundur (pakai cursor
// `before`) sampai Helius mengembalikan halaman yang lebih pendek dari
// limit (artinya itu halaman terakhir/tertua yang ada) -- itulah titik
// mint ini "lahir". Karena token yang sudah lama & ramai transaksi bisa
// punya puluhan ribu transaksi, ada batas aman ALL_MAX_PAGES supaya
// request ini tidak jalan tanpa henti / timeout. Kalau batas itu kena
// duluan sebelum ketemu transaksi paling awal, `reachedGenesis: false`
// dikirim di meta supaya UI/pemakai tahu chart-nya belum benar-benar
// menampilkan seluruh histori (baru sejauh yang berhasil ditelusuri).
const ALL_MAX_PAGES = 300; // sampai ~30.000 transaksi ditelusuri
const ALL_TARGET_BARS = 48; // target jumlah bar biar chart tetap enak dibaca

// Daftar ukuran bucket "rapi" buat ALL, dari yang terkecil ke terbesar.
// Dipilih otomatis berdasarkan seberapa jauh histori token ini (supaya
// token yang baru lahir kemarin tetap dapat bucket kecil/jam-an, sedangkan
// token yang sudah setahun dapat bucket mingguan/bulanan).
const ALL_BUCKET_CANDIDATES = [
  HOUR,
  4 * HOUR,
  12 * HOUR,
  DAY,
  3 * DAY,
  7 * DAY,
  14 * DAY,
  30 * DAY,
];

function pickAllBucketMs(rangeMs: number): number {
  for (const candidate of ALL_BUCKET_CANDIDATES) {
    if (rangeMs / candidate <= ALL_TARGET_BARS) return candidate;
  }
  return ALL_BUCKET_CANDIDATES[ALL_BUCKET_CANDIDATES.length - 1];
}

export async function GET(req: NextRequest) {
  try {
    const tf = req.nextUrl.searchParams.get("timeframe") || "1H";

    if (tf !== "ALL" && !FIXED_TIMEFRAMES[tf]) {
      return NextResponse.json(
        { success: false, error: `Unknown timeframe: ${tf}`, data: [] },
        { status: 400 }
      );
    }

    const swaps: SwapPoint[] = [];
    let before: string | undefined;
    let txScanned = 0;
    let cutoff: number;
    let bucketMs: number;
    let reachedGenesis = true;

    if (tf === "ALL") {
      // Telusuri mundur sampai halaman tertua ATAU sampai ALL_MAX_PAGES,
      // sambil mencatat timestamp transaksi paling lama yang ditemukan.
      let oldestTimestamp = Date.now();

      pageLoopAll: for (let page = 0; page < ALL_MAX_PAGES; page++) {
        const txs = await getMintTransactions(TOKEN_ADDRESS, {
          before,
          limit: 100,
        });
        if (!txs.length) break;

        txScanned += txs.length;

        for (const tx of txs) {
          const ts = (tx.timestamp || 0) * 1000;
          if (ts > 0 && ts < oldestTimestamp) oldestTimestamp = ts;

          const swap = extractSwap(tx, TOKEN_ADDRESS);
          if (swap) swaps.push(swap);
        }

        const last = txs[txs.length - 1];
        before = last?.signature;

        if (!before || txs.length < 100) {
          // halaman lebih pendek dari limit / tidak ada cursor lagi ->
          // ini sudah halaman paling tua yang tersedia (genesis tercapai)
          break pageLoopAll;
        }

        if (page === ALL_MAX_PAGES - 1) {
          // kena batas aman sebelum ketemu halaman paling tua
          reachedGenesis = false;
        }
      }

      cutoff = oldestTimestamp;
      bucketMs = pickAllBucketMs(Math.max(Date.now() - cutoff, HOUR));
    } else {
      const cfg = FIXED_TIMEFRAMES[tf];
      cutoff = Date.now() - cfg.bucketMs * cfg.barCount;
      bucketMs = cfg.bucketMs;

      pageLoop: for (let page = 0; page < cfg.maxPages; page++) {
        const txs = await getMintTransactions(TOKEN_ADDRESS, {
          before,
          limit: 100,
        });
        if (!txs.length) break;

        txScanned += txs.length;

        for (const tx of txs) {
          const ts = (tx.timestamp || 0) * 1000;

          // Helius mengembalikan transaksi dari yang terbaru -> terlama,
          // begitu ketemu satu yang lebih tua dari cutoff, semua sisanya
          // (di halaman ini & halaman berikutnya) pasti juga lebih tua ->
          // berhenti total, tidak perlu lanjut fetch.
          if (ts < cutoff) break pageLoop;

          const swap = extractSwap(tx, TOKEN_ADDRESS);
          if (swap) swaps.push(swap);
        }

        const last = txs[txs.length - 1];
        before = last?.signature;
        if (!before) break;
      }
    }

    // ===============================
    // BUCKETING
    // ===============================
    // Bagi rentang waktu [cutoff, now] jadi bucket-bucket berukuran sama
    // (bucketMs), lalu masukkan tiap swap ke bucket yang sesuai.

    const now = Date.now();
    const bucketCount = Math.max(1, Math.ceil((now - cutoff) / bucketMs));

    const buckets = Array.from({ length: bucketCount }, (_, i) => {
      const bucketStart = cutoff + i * bucketMs;
      return {
        bucketStart,
        buyVolume: 0,
        sellVolume: 0,
        buyWallets: new Set<string>(),
        sellWallets: new Set<string>(),
      };
    });

    for (const swap of swaps) {
      if (swap.timestamp < cutoff) continue;

      let idx = Math.floor((swap.timestamp - cutoff) / bucketMs);
      idx = Math.min(Math.max(idx, 0), bucketCount - 1);

      const bucket = buckets[idx];
      if (swap.direction === "BUY") {
        bucket.buyVolume += swap.amount;
        if (swap.wallet) bucket.buyWallets.add(swap.wallet);
      } else {
        bucket.sellVolume += swap.amount;
        if (swap.wallet) bucket.sellWallets.add(swap.wallet);
      }
    }

    const isDaily = bucketMs >= DAY;
    const isMultiHour = bucketMs >= HOUR;

    const data = buckets.map((b) => {
      const date = new Date(b.bucketStart);
      const time = isDaily
        ? date.toLocaleDateString([], { day: "2-digit", month: "short" })
        : isMultiHour
        ? date.toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit" })
        : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const buyers = b.buyWallets.size;
      const sellers = b.sellWallets.size;

      return {
        time,
        bucketStart: b.bucketStart,
        buyers,
        sellers,
        netHolders: buyers - sellers,
        buyVolume: Number(b.buyVolume.toFixed(2)),
        sellVolume: Number(b.sellVolume.toFixed(2)),
        netVolume: Number((b.buyVolume - b.sellVolume).toFixed(2)),
      };
    });

    return NextResponse.json({
      success: true,
      data,
      meta: {
        timeframe: tf,
        bucketMs,
        txScanned,
        swapsFound: swaps.length,
        source: "helius",
        ...(tf === "ALL" ? { reachedGenesis } : {}),
      },
    });
  } catch (error: any) {
    console.error("HOLDER FLOW ERROR:", error.message);

    return NextResponse.json(
      { success: false, error: error.message, data: [] },
      { status: 500 }
    );
  }
}
