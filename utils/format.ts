export function money(value?: number) {
  if (!value) return "$0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function compact(value?: number) {
  if (!value) return "0";

  return Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

// Harga token crypto (terutama meme coin baru) biasanya sangat kecil,
// misalnya $0.00000012. toFixed(6) polos akan menampilkan "$0.000000"
// (kelihatan seperti nol / rusak). Formatter ini otomatis menambah
// jumlah desimal untuk angka kecil, dan tetap ringkas untuk angka besar.
export function formatPrice(value?: number) {
  const num = Number(value ?? 0);
  if (!num) return "$0.00";

  if (num >= 1) {
    return `$${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })}`;
  }

  // Hitung berapa banyak nol di depan angka signifikan pertama,
  // supaya harga sekecil apa pun tetap menampilkan digit yang berarti.
  const leadingZeros = Math.max(0, -Math.floor(Math.log10(num)) - 1);
  const decimals = Math.min(12, leadingZeros + 4);

  return `$${num.toFixed(decimals)}`;
}

export function shortAddress(address?: string) {
  if (!address) return "-";
  if (address.length <= 12) return address;

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Link eksplorer wallet Solana. Token ini di chain Solana (lihat
// TOKEN_ADDRESS di lib/helius.ts & badge "Solana" di HeroCard), jadi
// pakai Solscan.
export function explorerUrl(address?: string) {
  if (!address) return "#";

  return `https://solscan.io/account/${address}`;
}