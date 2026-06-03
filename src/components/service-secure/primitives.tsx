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
      <div className={cn("mt-3 font-mono text-3xl font-medium tabular-nums", valueTone)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
