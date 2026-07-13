type Props = {
  total: number;
  posPct: number;
  negPct: number;
  unmatched: number;
  standouts: string[];
  suggestions: string[];
  onSuggest: (s: string) => void;
};

export function BriefingMessage({ total, posPct, negPct, unmatched, standouts, suggestions, onSuggest }: Props) {
  const [a, b, c] = standouts;
  return (
    <div className="rounded-2xl border border-white bg-white/60 p-8 shadow-sm backdrop-blur-md">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-6 w-2 rounded-full bg-blue-500" />
        <span className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Overnight briefing
        </span>
      </div>
      <p className="text-lg leading-relaxed text-slate-700">
        We processed <span className="font-bold text-slate-900">{total} calls</span> overnight.
        Sentiment is <span className="font-semibold text-emerald-600">{posPct}% positive</span> with{" "}
        <span className="font-semibold text-rose-600">{negPct}% negative</span>.
        {unmatched > 0 && (
          <>
            {" "}
            <span className="text-amber-600">
              {unmatched} unmatched {unmatched === 1 ? "call needs" : "calls need"} linking
            </span>
            .
          </>
        )}
        {standouts.length > 0 && (
          <>
            {" "}
            Standouts today:{" "}
            {a && <span className="font-semibold italic text-slate-900">{a}</span>}
            {b && (
              <>
                , <span className="font-semibold italic text-slate-900">{b}</span>
              </>
            )}
            {c && (
              <>
                , and <span className="font-semibold italic text-slate-900">{c}</span>
              </>
            )}
            .
          </>
        )}
      </p>
      {suggestions.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggest(s)}
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-400"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
