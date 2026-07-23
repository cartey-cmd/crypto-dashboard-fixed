export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function aggregateCandles(
  candles: Candle[],
  size: number
): Candle[] {

  if (size <= 1) return candles;

  const result: Candle[] = [];

  for (let i = 0; i < candles.length; i += size) {

    const group = candles.slice(i, i + size);

    if (!group.length) continue;

    result.push({
      timestamp: group[0].timestamp,

      open: group[0].open,

      close: group[group.length - 1].close,

      high: Math.max(...group.map(c => c.high)),

      low: Math.min(...group.map(c => c.low)),

      volume: group.reduce((a, b) => a + b.volume, 0),
    });

  }

  return result;
}