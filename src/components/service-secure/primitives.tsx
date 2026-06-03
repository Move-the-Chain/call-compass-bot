import { sentLabel, tierColor } from "@/lib/service-secure-data";
import { cn } from "@/lib/utils";

export function Chip({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: "muted" | "pos" | "neg" | "neu" | "primary" | "tier-1" | "tier-2" | "tier-3";
  className?: string;
}) {
  const toneMap: Record<string, string> = {
    muted: "text-muted-foreground border-border bg-surface-2",
    pos: "text-pos border-pos/40 bg-pos/10",
    neg: "text-neg border-neg/40 bg-neg/10",
    neu: "text-neu border-neu/40 bg-neu/10",
    primary: "text-primary border-primary/40 bg-primary/10",
    "tier-1": "text-tier-1 border-tier-1/40 bg-tier-1/10",
    "tier-2": "text-tier-2 border-tier-2/40 bg-tier-2/10",
    "tier-3": "text-tier-3 border-tier-3/40 bg-tier-3/10",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-tight whitespace-nowrap",
        toneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SentimentDot({ s, className }: { s: number; className?: string }) {
  const tone = sentLabel(s).tone;
  const bg = tone === "pos" ? "bg-pos" : tone === "neg" ? "bg-neg" : "bg-neu";
  return (
    <span className={cn("relative inline-block h-2.5 w-2.5 rounded-full", bg, className)}>
      <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", bg)} />
    </span>
  );
}

export function TierBadge({ t }: { t: 1 | 2 | 3 }) {
  return <Chip tone={tierColor(t) as "tier-1" | "tier-2" | "tier-3"}>Tier {t}</Chip>;
}

export function Kpi({
  label,
  value,
  sub,
  tone,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "pos" | "neg" | "neu";
  accent?: boolean;
}) {
  const valueTone =
    tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : tone === "neu" ? "text-neu" : "text-foreground";
  return (
    <div className={cn("surface-card relative overflow-hidden p-5", accent && "glow-ring")}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-strong to-transparent" />
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-3 font-display text-3xl font-semibold tabular-nums", valueTone)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

/**
 * Diverging horizontal bar centered on zero. Negative goes left in coral,
 * positive goes right in brand indigo. Avg sentiment marker on top.
 */
export function DivergingBar({
  avg,
  pos,
  neg,
  total,
  height = 10,
}: {
  avg: number;
  pos: number;
  neg: number;
  total: number;
  height?: number;
}) {
  if (!total) {
    return <div className="h-2.5 w-full rounded-full bg-surface-2" />;
  }
  const negPct = (neg / total) * 50; // left half
  const posPct = (pos / total) * 50; // right half
  // marker position 0..100 from avg in [-1, 1]
  const mark = 50 + Math.max(-1, Math.min(1, avg)) * 50;
  return (
    <div className="relative w-full" style={{ height }}>
      {/* track */}
      <div className="absolute inset-0 rounded-full bg-surface-2" />
      {/* center axis */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-border-strong/60" />
      {/* negative fill (left of center) */}
      <div
        className="absolute top-0 bottom-0 rounded-l-full"
        style={{
          right: "50%",
          width: `${negPct}%`,
          background: "linear-gradient(90deg, var(--neg), color-mix(in oklab, var(--neg) 70%, transparent))",
        }}
      />
      {/* positive fill (right of center) */}
      <div
        className="absolute top-0 bottom-0 rounded-r-full"
        style={{
          left: "50%",
          width: `${posPct}%`,
          background: "linear-gradient(90deg, color-mix(in oklab, var(--primary) 75%, transparent), var(--primary))",
        }}
      />
      {/* avg marker */}
      <div
        className="absolute -top-1 h-[calc(100%+8px)] w-[2px] rounded-full bg-foreground/80"
        style={{ left: `calc(${mark}% - 1px)` }}
        title={`avg ${avg.toFixed(2)}`}
      />
    </div>
  );
}

/** Tiny sparkline of daily call counts. */
export function Sparkline({
  values,
  width = 90,
  height = 28,
  stroke = "var(--primary)",
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (!values.length) return <svg width={width} height={height} />;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values.map((v, i) => `${i * step},${height - (v / max) * (height - 4) - 2}`).join(" ");
  const area = `0,${height} ${points} ${width},${height}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={area}
        fill="color-mix(in oklab, var(--primary) 14%, transparent)"
        stroke="none"
      />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Stacked bar chart: pos/neu/neg per day. */
export function DailyStackedBars({
  data,
  height = 140,
}: {
  data: { date: Date; count: number; pos: number; neg: number; neu: number }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.count / max) * (height - 18);
        const pH = d.count ? (d.pos / d.count) * h : 0;
        const uH = d.count ? (d.neu / d.count) * h : 0;
        const nH = d.count ? (d.neg / d.count) * h : 0;
        const showLabel = data.length <= 14 || i % Math.ceil(data.length / 10) === 0;
        return (
          <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
            <div
              className="flex w-full flex-col-reverse overflow-hidden rounded-sm bg-surface-2"
              style={{ height: Math.max(h, 2) }}
              title={`${d.date.toLocaleDateString()} · ${d.count} calls (${d.pos} pos, ${d.neu} neu, ${d.neg} neg)`}
            >
              <div style={{ height: pH, background: "var(--primary)" }} />
              <div style={{ height: uH, background: "var(--neu)" }} />
              <div style={{ height: nH, background: "var(--neg)" }} />
            </div>
            <span className="font-mono text-[9px] text-muted-foreground">
              {showLabel ? d.date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }) : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Heatmap of agents × days for call volume. */
export function AgentDayHeatmap({
  rows,
  days,
}: {
  rows: { name: string; counts: number[] }[];
  days: Date[];
}) {
  const max = Math.max(1, ...rows.flatMap((r) => r.counts));
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex items-center gap-2 pb-2 pl-[120px] text-[9px] text-muted-foreground">
          {days.map((d, i) => (
            <div key={i} className="w-5 text-center font-mono">
              {i % Math.max(1, Math.floor(days.length / 12)) === 0 ? d.getDate() : ""}
            </div>
          ))}
        </div>
        {rows.map((r) => (
          <div key={r.name} className="mb-1 flex items-center gap-2">
            <div className="w-[120px] truncate text-[11.5px] font-medium">{r.name}</div>
            <div className="flex gap-[2px]">
              {r.counts.map((c, i) => {
                const intensity = c === 0 ? 0 : 0.18 + (c / max) * 0.82;
                return (
                  <div
                    key={i}
                    title={`${days[i]?.toLocaleDateString?.()} · ${c} calls`}
                    className="h-5 w-5 rounded-sm"
                    style={{
                      background:
                        c === 0
                          ? "var(--surface-2)"
                          : `color-mix(in oklab, var(--primary) ${Math.round(intensity * 100)}%, transparent)`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
