const BASE_URL = "https://api.helius.xyz";
const RPC_URL = "https://mainnet.helius-rpc.com";

export const TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_TOKEN_ADDRESS ||
  "42cXQvAAr7hcPBPWAS4ocVtDyeJ4Fa6gRR2uG4gppump";

const API_KEY = process.env.HELIUS_API_KEY;

// ===============================
// HELIUS CACHE
// ===============================
// Pola sama seperti lib/birdeye.ts: cache in-memory + dedupe request yang
// sedang berjalan + antrean supaya tidak nembak Helius secara bersamaan.
// Cache diperpanjang ke 5 menit (sejalan dengan refresh interval di semua
// hook) supaya tidak kena rate limit (429) dari Helius.

const cache = new Map<
  string,
  {
    data: any;
    timestamp: number;
  }
>();

const CACHE_TIME = 5 * 60 * 1000; // 5 menit

const inFlight = new Map<string, Promise<any>>();

let requestQueue: Promise<void> = Promise.resolve();
const MIN_GAP_MS = 300; // jarak minimum antar request Helius

function scheduleTurn(): Promise<void> {
  const myTurn = requestQueue.then(
    () => new Promise<void>((resolve) => setTimeout(resolve, MIN_GAP_MS))
  );
  requestQueue = myTurn;
  return myTurn;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// PENTING: api-key Helius dikirim sebagai query param (bukan header), jadi
// URL lengkap TIDAK BOLEH pernah di-log (bisa bocor ke console). Cache key
// tetap pakai URL lengkap (unik per kombinasi query), tapi semua log hanya
// menampilkan `label` yang sudah dibersihkan dari api-key.

export async function heliusFetch(
  path: string,
  params?: Record<string, string | number>,
  label?: string
) {
  if (!API_KEY) {
    throw new Error("Missing HELIUS_API_KEY environment variable");
  }

  const url = new URL(BASE_URL + path);
  url.searchParams.set("api-key", API_KEY);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const cacheKey = url.toString();
  const safeLabel = label || path;

  // ===============================
  // CHECK CACHE
  // ===============================

  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
    console.log("HELIUS CACHE HIT:", safeLabel);
    return cached.data;
  }

  const pending = inFlight.get(cacheKey);
  if (pending) {
    console.log("HELIUS DEDUPE (numpang request yang sedang jalan):", safeLabel);
    return pending;
  }

  const requestPromise = performRequest(cacheKey, safeLabel);
  inFlight.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlight.delete(cacheKey);
  }
}

async function performRequest(
  cacheKey: string,
  safeLabel: string,
  attempt = 0
): Promise<any> {
  await scheduleTurn();

  const res = await fetch(cacheKey, {
    headers: {
      accept: "application/json",
    },
  });

  // ===============================
  // RATE LIMIT (429) -> retry dengan backoff
  // ===============================
  if (res.status === 429 && attempt < 2) {
    const backoff = 800 * (attempt + 1);
    console.log(
      `HELIUS 429 RATE LIMITED, retry #${attempt + 1} dalam ${backoff}ms:`,
      safeLabel
    );
    await sleep(backoff);
    return performRequest(cacheKey, safeLabel, attempt + 1);
  }

  const text = await res.text();

  if (!text) {
    throw new Error("Empty response from Helius");
  }

  const json = JSON.parse(text);

  if (!res.ok) {
    console.log("Helius Response Error:", safeLabel, json);

    const oldCache = cache.get(cacheKey);
    if (oldCache) {
      console.log("USING OLD CACHE:", safeLabel);
      return oldCache.data;
    }

    if (res.status === 429) {
      throw new Error(
        "Helius is rate limiting requests right now. Please try again shortly."
      );
    }

    throw new Error(json?.error || json?.message || "Helius Error");
  }

  cache.set(cacheKey, {
    data: json,
    timestamp: Date.now(),
  });

  return json;
}

// ===============================
// ENHANCED TRANSACTIONS API
// ===============================
// Dipakai untuk fitur Holder Flow: mengambil transaksi terbaru yang
// menyentuh address mint token (Helius otomatis mengembalikan transaksi di
// mana mint tsb muncul, termasuk swap di DEX). Dokumentasi:
// https://docs.helius.dev/solana-apis/enhanced-transactions-api

export interface HeliusTokenAmount {
  userAccount?: string;
  tokenAccount?: string;
  mint?: string;
  tokenAmount?: number | string;
  rawTokenAmount?: {
    tokenAmount: string;
    decimals: number;
  };
}

export interface HeliusSwapEvent {
  nativeInput?: { account: string; amount: string } | null;
  nativeOutput?: { account: string; amount: string } | null;
  tokenInputs?: HeliusTokenAmount[];
  tokenOutputs?: HeliusTokenAmount[];
}

export interface HeliusTokenTransfer {
  fromUserAccount?: string;
  toUserAccount?: string;
  mint?: string;
  tokenAmount?: number;
}

export interface HeliusTransaction {
  signature: string;
  timestamp: number;
  type?: string;
  feePayer?: string;
  tokenTransfers?: HeliusTokenTransfer[];
  events?: {
    swap?: HeliusSwapEvent;
  };
}

export async function getMintTransactions(
  mint: string,
  opts: { before?: string; limit?: number } = {}
): Promise<HeliusTransaction[]> {
  const params: Record<string, string | number> = {
    limit: opts.limit ?? 100,
  };

  if (opts.before) {
    params.before = opts.before;
  }

  const json = await heliusFetch(
    `/v0/addresses/${mint}/transactions`,
    params,
    `getMintTransactions(before=${opts.before ?? "-"})`
  );

  return Array.isArray(json) ? json : [];
}

// ===============================
// RPC / DAS -- HOLDER COUNT
// ===============================
// Dipakai buat menggantikan field `overview.holder` dari Birdeye: total
// jumlah holder didekati dari jumlah token account (ATA) yang punya saldo
// untuk mint ini, lewat method `getTokenAccounts` (bagian dari DAS API
// Helius). Endpoint ini beda dari Enhanced Transactions API di atas (yang
// pakai REST), method DAS dipanggil lewat JSON-RPC ke RPC_URL.
// Dok: https://docs.helius.dev/compression-and-das-api/digital-asset-standard-das-api/get-token-accounts

async function performRpcRequest(
  endpoint: string,
  cacheKey: string,
  method: string,
  params: Record<string, any> | any[],
  safeLabel: string,
  attempt = 0
): Promise<any> {
  await scheduleTurn();

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "crypto-dashboard",
      method,
      params,
    }),
  });

  if (res.status === 429 && attempt < 2) {
    const backoff = 800 * (attempt + 1);
    console.log(
      `HELIUS RPC 429 RATE LIMITED, retry #${attempt + 1} dalam ${backoff}ms:`,
      safeLabel
    );
    await sleep(backoff);
    return performRpcRequest(endpoint, cacheKey, method, params, safeLabel, attempt + 1);
  }

  const text = await res.text();
  if (!text) throw new Error("Empty response from Helius RPC");

  const json = JSON.parse(text);

  if (!res.ok || json.error) {
    console.log("Helius RPC Error:", safeLabel, json.error || json);

    const oldCache = cache.get(cacheKey);
    if (oldCache) {
      console.log("USING OLD CACHE:", safeLabel);
      return oldCache.data;
    }

    throw new Error(json.error?.message || "Helius RPC Error");
  }

  cache.set(cacheKey, { data: json.result, timestamp: Date.now() });
  return json.result;
}

export async function heliusRpc(method: string, params: Record<string, any> | any[]) {
  if (!API_KEY) {
    throw new Error("Missing HELIUS_API_KEY environment variable");
  }

  const url = new URL(RPC_URL);
  url.searchParams.set("api-key", API_KEY);

  // cache key gabungan endpoint+method+params (bukan cuma URL, karena RPC
  // pakai satu endpoint yang sama buat semua method lewat POST body)
  const cacheKey = `${url.toString()}::${method}::${JSON.stringify(params)}`;
  const safeLabel = `rpc:${method}`;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
    console.log("HELIUS CACHE HIT:", safeLabel);
    return cached.data;
  }

  const pending = inFlight.get(cacheKey);
  if (pending) {
    console.log("HELIUS DEDUPE (numpang request yang sedang jalan):", safeLabel);
    return pending;
  }

  const requestPromise = performRpcRequest(url.toString(), cacheKey, method, params, safeLabel);
  inFlight.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlight.delete(cacheKey);
  }
}

export async function getHolderCount(mint: string): Promise<number> {
  // CATATAN: field `total` dari getTokenAccounts BUKAN total holder
  // sebenarnya -- itu cuma jumlah item di halaman ini (mengikuti `limit`
  // yang dikirim). Makanya sebelumnya dengan limit:1 hasilnya selalu 1.
  // Untuk hitungan akurat, kita tetap harus mem-paginasi semua token
  // account (sama seperti getAllTokenAccounts) dan hitung panjangnya.
  const { accounts } = await getAllTokenAccounts(mint);
  return accounts.length;
}

// ===============================
// TOKEN SUPPLY (standard Solana RPC method, bukan DAS)
// ===============================
// Menggantikan `overview.price` & `overview.marketCap` dari Birdeye yang
// sebelumnya dipakai untuk menurunkan total supply (marketCap / price).
// `getTokenSupply` adalah method RPC Solana standar (bukan endpoint khusus
// Helius), tapi tetap bisa dipanggil lewat RPC_URL yang sama karena Helius
// men-support seluruh method RPC standar juga. Hasilnya jauh lebih akurat
// daripada menurunkan dari price*marketCap.

export interface HeliusTokenSupply {
  amount: string; // raw amount (belum dibagi decimals)
  decimals: number;
  uiAmount: number;
}

export async function getTokenSupply(mint: string): Promise<HeliusTokenSupply> {
  const result = await heliusRpc("getTokenSupply", [mint]);
  const value = result?.value;

  return {
    amount: String(value?.amount ?? "0"),
    decimals: Number(value?.decimals ?? 0),
    uiAmount: Number(value?.uiAmount ?? 0),
  };
}

// ===============================
// TOP HOLDERS (DAS getTokenAccounts, dipaginasi lewat cursor)
// ===============================
// Menggantikan `/defi/v3/token/holder` dari Birdeye. `getTokenAccounts`
// TIDAK mengembalikan hasil terurut berdasarkan amount, jadi kita harus
// menelusuri beberapa halaman lebih dulu (dibatasi `maxPages`), baru urutkan
// sendiri di sisi kita dan ambil N teratas. `amount` yang dikembalikan
// adalah raw amount (belum dibagi decimals) -- pemanggil yang perlu
// menggabungkannya dengan decimals dari getTokenSupply.

export interface HeliusTokenAccount {
  address: string;
  mint: string;
  owner: string;
  amount: number;
}

export async function getAllTokenAccounts(
  mint: string,
  opts: { pageSize?: number; maxPages?: number } = {}
): Promise<{ accounts: HeliusTokenAccount[]; scannedAll: boolean }> {
  const pageSize = opts.pageSize ?? 1000;
  const maxPages = opts.maxPages ?? 5; // sampai ~5000 token account

  const accounts: HeliusTokenAccount[] = [];
  let cursor: string | undefined;
  let scannedAll = false;

  for (let page = 0; page < maxPages; page++) {
    const result = await heliusRpc("getTokenAccounts", {
      mint,
      limit: pageSize,
      cursor,
      options: { showZeroBalance: false },
    });

    const items: any[] = result?.token_accounts || [];

    for (const item of items) {
      const amount = Number(item.amount || 0);
      if (amount > 0 && item.owner) {
        accounts.push({
          address: item.address,
          mint: item.mint,
          owner: item.owner,
          amount,
        });
      }
    }

    if (!result?.cursor || items.length < pageSize) {
      scannedAll = true;
      break;
    }

    cursor = result.cursor;
  }

  return { accounts, scannedAll };
}

export async function getTopHolders(
  mint: string,
  opts: { limit?: number; maxPages?: number } = {}
): Promise<{ accounts: HeliusTokenAccount[]; scannedAll: boolean }> {
  const limit = opts.limit ?? 20;
  const { accounts, scannedAll } = await getAllTokenAccounts(mint, {
    maxPages: opts.maxPages,
  });

  accounts.sort((a, b) => b.amount - a.amount);

  return { accounts: accounts.slice(0, limit), scannedAll };
}

// ===============================
// SALDO 1 WALLET (dipakai fitur Holder Card Checker)
// ===============================
// Filter langsung by `owner` + `mint` sekaligus di DAS getTokenAccounts,
// jadi tidak perlu menelusuri seluruh daftar holder untuk cek satu wallet.
// Kalau owner punya lebih dari satu token account untuk mint yang sama
// (jarang terjadi, biasanya cuma 1 ATA), saldonya dijumlahkan.

export async function getOwnerTokenAmount(
  mint: string,
  owner: string
): Promise<number> {
  const result = await heliusRpc("getTokenAccounts", {
    mint,
    owner,
    limit: 100,
    options: { showZeroBalance: false },
  });

  const items: any[] = result?.token_accounts || [];
  return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

// ===============================
// SWAP EXTRACTION (dipakai bareng oleh /api/holder-flow & /api/transactions)
// ===============================
// Mengubah satu transaksi Helius jadi BUY/SELL sederhana untuk mint kita.
// Dipisah ke sini supaya kedua endpoint yang sama-sama butuh menandai
// swap mana yang BUY/SELL tidak duplikasi logika.

export interface SwapPoint {
  timestamp: number;
  direction: "BUY" | "SELL";
  amount: number;
  wallet: string | null;
}

export function toUiTokenAmount(entry: HeliusTokenAmount): number {
  if (entry.rawTokenAmount) {
    const raw = Number(entry.rawTokenAmount.tokenAmount || 0);
    const decimals = Number(entry.rawTokenAmount.decimals ?? 0);
    return decimals > 0 ? raw / 10 ** decimals : raw;
  }
  return Number(entry.tokenAmount || 0);
}

// Mengambil arah (BUY/SELL) + jumlah + wallet dari satu transaksi Helius.
// Return null kalau transaksi tidak relevan (bukan swap token kita).
export function extractSwap(
  tx: HeliusTransaction,
  mint: string
): SwapPoint | null {
  const swapEvent = tx.events?.swap;

  if (swapEvent) {
    const out = (swapEvent.tokenOutputs || []).find((t) => t.mint === mint);
    if (out) {
      const amount = toUiTokenAmount(out);
      if (amount > 0) {
        return {
          timestamp: tx.timestamp * 1000,
          direction: "BUY",
          amount,
          wallet: out.userAccount || tx.feePayer || null,
        };
      }
    }

    const inp = (swapEvent.tokenInputs || []).find((t) => t.mint === mint);
    if (inp) {
      const amount = toUiTokenAmount(inp);
      if (amount > 0) {
        return {
          timestamp: tx.timestamp * 1000,
          direction: "SELL",
          amount,
          wallet: inp.userAccount || tx.feePayer || null,
        };
      }
    }
  }

  // Fallback untuk swap yang tidak punya `events.swap` terstruktur (mis.
  // lewat aggregator/inner-program yang belum dikenali Helius sebagai
  // swap). Pakai tokenTransfers mentah: kalau fee payer (pembayar biaya tx
  // = wallet yang menginisiasi) net menerima mint kita -> BUY, net
  // mengirim keluar -> SELL.
  if (tx.type === "SWAP" && Array.isArray(tx.tokenTransfers) && tx.feePayer) {
    let net = 0;

    for (const t of tx.tokenTransfers) {
      if (t.mint !== mint) continue;
      const amt = Number(t.tokenAmount || 0);
      if (t.toUserAccount === tx.feePayer) net += amt;
      if (t.fromUserAccount === tx.feePayer) net -= amt;
    }

    if (net > 0) {
      return { timestamp: tx.timestamp * 1000, direction: "BUY", amount: net, wallet: tx.feePayer };
    }
    if (net < 0) {
      return { timestamp: tx.timestamp * 1000, direction: "SELL", amount: -net, wallet: tx.feePayer };
    }
  }

  return null;
}
