import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type FocusData = {
  toReview: { count: number; topAccounts: string[] };
  unmatched: number;
  followUps: number;
  atRisk: { count: number; accounts: string[] };
  sentiment: { total: number; posPct: number; negPct: number; neuPct: number };
};

export function FocusRail({ data, onViewAll }: { data: FocusData; onViewAll: () => void }) {
  return (
    <aside className="flex w-[380px] shrink-0 flex-col gap-4 overflow-y-auto pr-1">
      <div className="sticky top-0 z-10 pb-2">
        <h2 className="px-1 text-xl font-bold text-slate-900">Focus for today</h2>
      </div>

      {/* Calls to review */}
      <button
        type="button"
        onClick={onViewAll}
        className="group rounded-2xl border border-white/80 bg-white/60 p-5 text-left shadow-sm backdrop-blur-md transition hover:border-blue-200 hover:shadow-md"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Calls to review</p>
            <h3 className="text-3xl font-bold tracking-tight text-slate-900">{data.toReview.count}</h3>
          </div>
          {data.toReview.count > 0 && (
            <span className="rounded bg-amber-50 px-2 py-1 text-xs font-bold uppercase tracking-tighter text-amber-700">
              Action required
            </span>
          )}
        </div>
        <ul className="space-y-2">
          {data.toReview.topAccounts.slice(0, 3).map((n) => (
            <li key={n} className="flex items-center gap-2 text-sm text-slate-600">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              {n}
            </li>
          ))}
          {data.toReview.count > 3 && (
            <li className="flex items-center gap-1 pl-3.5 text-xs font-semibold text-blue-600 group-hover:underline">
              +{data.toReview.count - 3} more <ArrowRight className="h-3 w-3" />
            </li>
          )}
          {data.toReview.count === 0 && (
            <li className="pl-3.5 text-xs text-slate-500">All caught up.</li>
          )}
        </ul>
      </button>

      {/* Unmatched */}
      <div
        className={cn(
          "rounded-2xl border p-5 shadow-sm backdrop-blur-md",
          data.unmatched > 0 ? "border-amber-100 bg-amber-50/50" : "border-white/80 bg-white/60",
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={cn("text-sm font-medium", data.unmatched > 0 ? "text-amber-800" : "text-slate-500")}>
              Unmatched
            </p>
            <h3 className={cn("text-xl font-bold", data.unmatched > 0 ? "text-amber-950" : "text-slate-900")}>
              {data.unmatched} {data.unmatched === 1 ? "needs linking" : "need linking"}
            </h3>
          </div>
          {data.unmatched > 0 && (
            <button type="button" className="text-xs font-bold text-amber-700 hover:underline">
              Link now
            </button>
          )}
        </div>
      </div>

      {/* Open follow-ups */}
      <div className="rounded-2xl border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-md">
        <p className="text-sm font-medium text-slate-500">Open follow-ups</p>
        <h3 className="text-2xl font-bold text-slate-900">{data.followUps}</h3>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-slate-400 transition-all"
            style={{ width: `${Math.min(100, data.followUps * 15)}%` }}
          />
        </div>
      </div>

      {/* At-risk */}
      <div
        className={cn(
          "rounded-2xl border p-5 shadow-sm backdrop-blur-md",
          data.atRisk.count > 0 ? "border-rose-100 bg-rose-50/50" : "border-white/80 bg-white/60",
        )}
      >
        <p className={cn("text-sm font-medium", data.atRisk.count > 0 ? "text-rose-800" : "text-slate-500")}>
          At-risk accounts
        </p>
        <h3 className={cn("text-2xl font-bold", data.atRisk.count > 0 ? "text-rose-950" : "text-slate-900")}>
          {data.atRisk.count}
        </h3>
        {data.atRisk.accounts.length > 0 && (
          <p className="mt-2 text-xs font-medium text-rose-700">
            {data.atRisk.accounts.slice(0, 3).join(" · ")}
          </p>
        )}
      </div>

      {/* Sentiment snapshot */}
      <div className="rounded-2xl bg-slate-900 p-5 shadow-xl">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-slate-400">Sentiment</p>
          <span className="font-mono text-xs text-slate-500">{data.sentiment.total} calls</span>
        </div>
        <div className="mt-4 flex h-12 items-end gap-1">
          <div
            className="w-full rounded-t-sm bg-emerald-500"
            style={{ height: `${Math.max(4, data.sentiment.posPct)}%` }}
          />
          <div
            className="w-full rounded-t-sm bg-slate-700"
            style={{ height: `${Math.max(4, data.sentiment.neuPct)}%` }}
          />
          <div
            className="w-full rounded-t-sm bg-rose-500"
            style={{ height: `${Math.max(4, data.sentiment.negPct)}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-[10px] font-bold uppercase">
          <span className="text-emerald-400">{data.sentiment.posPct}% pos</span>
          <span className="text-slate-400">{data.sentiment.neuPct}% neu</span>
          <span className="text-rose-400">{data.sentiment.negPct}% neg</span>
        </div>
      </div>
    </aside>
  );
}
