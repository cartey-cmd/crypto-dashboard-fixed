import { NextRequest, NextResponse } from "next/server";
import { geckoFetch } from "@/lib/gecko";

const NETWORK = process.env.GECKO_NETWORK!;
const POOL = process.env.GECKO_POOL!;

// Timeframe disederhanakan jadi 5 pilihan sesuai granularity candle-nya
// sendiri (bukan rentang tanggal): 1H = candle per jam, 4H = candle per
// 4 jam, 12H = candle per 12 jam, 1D = candle per hari, ALL = seluruh
// histori yang tersedia (candle per hari, limit maksimum GeckoTerminal).
// Catatan: GeckoTerminal cuma menerima aggregate 1/4/12 untuk unit "hour"
// (dan cuma 1 untuk unit "day"), jadi "12H" pakai unit hour aggregate 12,
// bukan unit day.
const CONFIG: Record<
  string,
  { unit: "minute" | "hour" | "day"; aggregate: number; limit: number }
> = {
  // 1H  = candle 1 jam asli, 48 candle -> ~2 hari terakhir
  "1H": { unit: "hour", aggregate: 1, limit: 48 },
  // 4H  = candle 4 jam asli, 42 candle -> ~7 hari terakhir
  "4H": { unit: "hour", aggregate: 4, limit: 42 },
  // 12H = candle 12 jam asli, 60 candle -> ~30 hari terakhir
  "12H": { unit: "hour", aggregate: 12, limit: 60 },
  // 1D  = candle 1 hari asli, 90 candle -> ~3 bulan terakhir
  "1D": { unit: "day", aggregate: 1, limit: 90 },
  // ALL = candle 1 hari asli, limit maksimum GeckoTerminal (1000)
  //       supaya benar-benar menampilkan seluruh histori yang tersedia
  "ALL": { unit: "day", aggregate: 1, limit: 1000 },
};

export async function GET(req: NextRequest) {
  try {
    const tf = req.nextUrl.searchParams.get("timeframe") || "1H";
    const cfg = CONFIG[tf];

    if (!cfg) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown timeframe: ${tf}`,
        },
        { status: 400 }
      );
    }

    const json = await geckoFetch(
      `/networks/${NETWORK}/pools/${POOL}/ohlcv/${cfg.unit}?aggregate=${cfg.aggregate}&limit=${cfg.limit}`
    );

    const list = json.data?.attributes?.ohlcv_list ?? [];

    // Label sumbu-X disesuaikan dengan granularity tiap timeframe: candle
    // harian ("1D"/"ALL") cukup ditampilkan tanggalnya saja, sedangkan
    // candle per jam ("1H"/"4H") menampilkan tanggal + jam supaya tidak
    // ambigu ketika rentangnya melewati lebih dari satu hari.
    const isDaily = cfg.unit === "day";

    const chart = list
      .map((c: any[]) => {
        const date = new Date(c[0] * 1000);

        const time = isDaily
          ? date.toLocaleDateString([], {
              day: "2-digit",
              month: "short",
            })
          : date.toLocaleString([], {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });

        return {
          time,
          price: Number(c[4]), // close
        };
      })
      .reverse();

    // Bug lama: sukses mengembalikan array mentah (`[...]`) sedangkan gagal
    // mengembalikan object (`{success:false,...}`) -- bentuk respons yang
    // tidak konsisten ini membuat sisi client tidak bisa membedakan
    // "berhasil tapi kosong" vs "gagal", jadi chart kadang tidak muncul
    // sama sekali walau requestnya sukses. Sekarang selalu membungkus
    // dengan bentuk yang sama: { success, data }.
    return NextResponse.json({
      success: true,
      data: chart,
    });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      {
        success: false,
        error: e.message,
        data: [],
      },
      {
        status: 500,
      }
    );
  }
}
