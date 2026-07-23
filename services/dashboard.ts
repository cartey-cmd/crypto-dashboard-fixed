import { getTokenData } from "@/lib/dexscreener";
import { getHolderCount, getTopHolders, getTokenSupply, TOKEN_ADDRESS } from "@/lib/helius";

// Catatan: tidak dipakai komponen manapun saat ini (dead code), tapi tetap
// dipindah dari Birdeye ke DexScreener + Helius biar konsisten dan tidak
// menyesatkan kalau dipakai lagi nanti.
export async function getDashboard() {
  const [token, holderCount, { accounts }, supply] = await Promise.all([
    getTokenData(),
    getHolderCount(TOKEN_ADDRESS),
    getTopHolders(TOKEN_ADDRESS, { limit: 100 }),
    getTokenSupply(TOKEN_ADDRESS),
  ]);

  const decimals = supply.decimals;
  const totalSupplyRaw = Number(supply.amount || 0);

  const holders = accounts.map((acc, index) => ({
    rank: index + 1,
    owner: acc.owner,
    amount: decimals > 0 ? acc.amount / 10 ** decimals : acc.amount,
    percentage: totalSupplyRaw > 0 ? (acc.amount / totalSupplyRaw) * 100 : 0,
  }));

  return {
    overview: {
      symbol: token.baseToken?.symbol || "TBB",
      name: token.baseToken?.name || "",
      price: Number(token.priceUsd || 0),
      marketCap: Number(token.marketCap ?? token.fdv ?? 0),
      liquidity: Number(token.liquidity?.usd || 0),
      holders: holderCount,
      volume24h: Number(token.volume?.h24 || 0),
    },
    holders,
  };
}
