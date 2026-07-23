const PAIR =
  process.env.NEXT_PUBLIC_PAIR_ADDRESS ||
  "6unnG2hL8udPjDpu3TchvAtptu3dq8AS7tymrWDN2LLC";

// PENTING: endpoint `/latest/dex/pairs/{chainId}/{pairId}` DexScreener
// mengembalikan array `pairs` (bisa lebih dari satu kalau pairId ambigu),
// BUKAN objek tunggal `pair`. Field `json.pair` (singular) sebelumnya di
// sini SELALU undefined -> `pair.priceUsd` dkk error/NaN, itu sebabnya
// price, marketCap, liquidity, volume di seluruh dashboard sebelumnya
// ngaco. Dok resmi: https://docs.dexscreener.com/api/reference
export async function getTokenData() {
  const res = await fetch(
    `https://api.dexscreener.com/latest/dex/pairs/solana/${PAIR}`,
    {
      next: {
        revalidate: 10,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed fetch DexScreener");
  }

  const json = await res.json();

  const pair = json.pairs?.[0];

  if (!pair) {
    throw new Error("Pair not found on DexScreener");
  }

  return {
    priceUsd: pair.priceUsd,
    marketCap: pair.marketCap,
    liquidity: pair.liquidity,
    volume: pair.volume,
    priceChange: pair.priceChange,
    fdv: pair.fdv,
    txns: pair.txns,
    pairAddress: pair.pairAddress,
    baseToken: pair.baseToken,
    quoteToken: pair.quoteToken,
  };
}