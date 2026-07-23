type Props = {
  title: string;
  value: string;
  loading?: boolean;
};

export default function StatCard({ title, value, loading = false }: Props) {
  return (
    <div className="rounded-2xl bg-[#161616] border border-orange-500/20 p-4 sm:p-5 transition-colors hover:border-orange-500/40">
      <p className="text-zinc-400 text-xs sm:text-sm">{title}</p>

      {loading ? (
        <div className="mt-3 h-7 sm:h-8 w-24 sm:w-28 animate-pulse rounded bg-zinc-700" />
      ) : (
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 sm:mt-3 text-orange-400 truncate">
          {value}
        </h2>
      )}
    </div>
  );
}
