import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  Building2,
  Check,
  Download,
  Headphones,
  LayoutGrid,
  Pause,
  Play,
  Plug,
  Search,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  AGENTS,
  CALLS,
  CLIENTS,
  type Call,
  type Client,
  agentOf,
  clientOf,
  fmtTime,
  mmss,
  sentLabel,
} from "@/lib/service-secure-data";
import { cn } from "@/lib/utils";
import { Chip, Kpi, SentimentDot, TierBadge } from "./primitives";

type Screen =
  | "summary"
  | "explorer"
  | "agents"
  | "agentDetail"
  | "accounts"
  | "accountDetail"
  | "detail"
  | "integrations"
  | "notifications";

const NAV: Array<{ key: Screen; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "summary", label: "Summary", icon: LayoutGrid },
  { key: "explorer", label: "Call Explorer", icon: Search },
  { key: "agents", label: "Agent Scorecards", icon: Headphones },
  { key: "accounts", label: "Account Health", icon: Building2 },
  { key: "integrations", label: "Integrations", icon: Plug },
  { key: "notifications", label: "Notifications", icon: Bell },
];

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const esc = (v: unknown) => {
    const s = String(v == null ? "" : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function callsToRows(calls: Call[]): (string | number)[][] {
  const head = ["Time", "Account", "Tier", "Caller", "Booking for", "Agent", "Topic", "Sentiment", "Duration", "Outcome"];
  const body = calls.map((c) => [
    c.time.toISOString(),
    c.acct || "Unmatched",
    clientOf(c.acct)?.tier ?? "",
    c.caller || "",
    c.passenger || "",
    c.agent,
    c.topic,
    sentLabel(c.sent).txt,
    mmss(c.dur),
    c.follow,
  ]);
  return [head, ...body];
}

export type FollowUp = { agent: string; due: string; note: string; createdAt: Date };

export default function ServiceSecureApp() {
  const [screen, setScreen] = useState<Screen>("summary");
  const [sel, setSel] = useState<Call | null>(null);
  const [acctSel, setAcctSel] = useState<Client | null>(null);
  const [agentSel, setAgentSel] = useState<string | null>(null);
  const [range, setRange] = useState("Today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [fAgent, setFAgent] = useState("All");
  const [fAcct, setFAcct] = useState("All");
  const [fSent, setFSent] = useState("All");
  const [q, setQ] = useState("");
  const [resolved, setResolved] = useState<Set<number>>(new Set());
  const [followUps, setFollowUps] = useState<Record<number, FollowUp>>({});

  const toggleResolved = (id: number) =>
    setResolved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const assignFollowUp = (id: number, fu: FollowUp) =>
    setFollowUps((prev) => ({ ...prev, [id]: fu }));

  const open = (c: Call) => {
    setSel(c);
    setScreen("detail");
  };
  const openAcct = (cl: Client) => {
    setAcctSel(cl);
    setScreen("accountDetail");
  };

  const filtered = useMemo(
    () =>
      CALLS.filter((c) => {
        if (fAgent !== "All" && c.agent !== fAgent) return false;
        if (fAcct !== "All" && c.acct !== fAcct) return false;
        if (fSent === "Negative" && c.sent >= -0.1) return false;
        if (fSent === "Positive" && c.sent <= 0.1) return false;
        if (fSent === "Neutral" && (c.sent < -0.1 || c.sent > 0.1)) return false;
        if (q && !`${c.acct} ${c.agent} ${c.topic} ${c.summary}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [fAgent, fAcct, fSent, q],
  );

  const total = CALLS.length;
  const pos = CALLS.filter((c) => c.sent > 0.1).length;
  const neg = CALLS.filter((c) => c.sent < -0.1).length;
  const unmatched = CALLS.filter((c) => c.flag === "unmatched").length;
  const todosNeg = CALLS.filter((c) => c.flag === "at-risk" || c.flag === "negative").sort(
    (a, b) => (clientOf(a.acct)?.tier ?? 9) - (clientOf(b.acct)?.tier ?? 9),
  );
  const todosPos = CALLS.filter((c) => c.flag === "positive");

  const screenLabel = NAV.find((n) => n.key === screen)?.label ?? "";

  return (
    <div className="flex min-h-screen text-foreground">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[230px] shrink-0 flex-col border-r border-border bg-surface/60 px-4 py-6 backdrop-blur lg:flex">
        <div className="px-2">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-brand)] text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="font-display text-[19px] leading-none">Service Secure</div>
              <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Call Intelligence
              </div>
            </div>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-0.5">
          {NAV.map(({ key, label, icon: Icon }) => {
            const active = screen === key || (key === "accounts" && screen === "accountDetail");
            return (
              <button
                key={key}
                onClick={() => setScreen(key)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all",
                  active
                    ? "bg-surface-2 text-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.04)]"
                    : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-primary shadow-[0_0_8px_var(--primary)]" />
                )}
                <Icon className={cn("h-4 w-4", active ? "text-primary" : "")} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-border bg-surface-2/60 p-3">
          <div className="flex items-center gap-2 text-[11px] font-medium text-pos">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pos opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-pos" />
            </span>
            RingCentral connected
          </div>
          <div className="mt-2 font-mono text-xs text-muted-foreground">
            <div className="text-foreground">412 calls today</div>
            <div>{unmatched} unmatched · 8 flagged</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1 px-6 py-6 lg:px-10 lg:py-8">
        {screen !== "detail" && screen !== "accountDetail" && (
          <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Wednesday · Jun 3, 2026
              </div>
              <h1 className="font-display mt-1 text-[34px] leading-none tracking-tight">{screenLabel}</h1>
            </div>
            {screen !== "integrations" && screen !== "notifications" && <RangePicker range={range} set={setRange} />}
          </header>
        )}

        {screen === "summary" && (
          <SummaryView
            total={total}
            pos={pos}
            neg={neg}
            unmatched={unmatched}
            range={range}
            todosNeg={todosNeg}
            todosPos={todosPos}
            resolved={resolved}
            followUps={followUps}
            onOpen={open}
          />
        )}
        {screen === "explorer" && (
          <ExplorerView
            filtered={filtered}
            q={q}
            setQ={setQ}
            fSent={fSent}
            setFSent={setFSent}
            fAgent={fAgent}
            setFAgent={setFAgent}
            fAcct={fAcct}
            setFAcct={setFAcct}
            onOpen={open}
            onExport={() => downloadCSV("calls.csv", callsToRows(filtered))}
          />
        )}
        {screen === "agents" && <AgentsView />}
        {screen === "accounts" && <AccountsView unmatched={unmatched} onOpen={openAcct} />}
        {screen === "accountDetail" && acctSel && (
          <AccountDetail cl={acctSel} onBack={() => setScreen("accounts")} onCall={open} />
        )}
        {screen === "detail" && sel && (
          <CallDetail
            c={sel}
            onBack={() => setScreen("explorer")}
            resolved={resolved.has(sel.id)}
            followUp={followUps[sel.id]}
            onToggleResolved={() => toggleResolved(sel.id)}
            onAssignFollowUp={(fu) => assignFollowUp(sel.id, fu)}
          />
        )}
        {screen === "integrations" && <IntegrationsView />}
        {screen === "notifications" && <NotificationsView />}
      </main>
    </div>
  );
}

/* ---------------- Range picker ---------------- */
function RangePicker({ range, set }: { range: string; set: (v: string) => void }) {
  const options = ["Today", "7 days", "30 days", "Custom"];
  return (
    <div className="flex gap-1 rounded-lg border border-border bg-surface/60 p-1 backdrop-blur">
      {options.map((r) => (
        <button
          key={r}
          onClick={() => set(r)}
          className={cn(
            "rounded-md px-3 py-1.5 text-[12.5px] font-medium transition",
            range === r ? "bg-surface-2 text-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.05)]" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Summary ---------------- */
function SummaryView({
  total,
  pos,
  neg,
  unmatched,
  range,
  todosNeg,
  todosPos,
  resolved,
  followUps,
  onOpen,
}: {
  total: number;
  pos: number;
  neg: number;
  unmatched: number;
  range: string;
  todosNeg: Call[];
  todosPos: Call[];
  resolved: Set<number>;
  followUps: Record<number, FollowUp>;
  onOpen: (c: Call) => void;
}) {
  const [tab, setTab] = useState<"review" | "sentiment">("review");
  const openReview = todosNeg.filter((c) => !resolved.has(c.id));

  return (
    <div className="space-y-7">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total calls" value={total} sub={range} />
        <Kpi label="Positive" value={`${Math.round((pos / total) * 100)}%`} sub={`${pos} calls`} tone="pos" />
        <Kpi label="Negative" value={`${Math.round((neg / total) * 100)}%`} sub={`${neg} calls`} tone="neg" accent />
        <Kpi label="Unmatched" value={unmatched} sub="need linking" tone="neu" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { k: "review" as const, label: "To review", count: openReview.length, icon: AlertTriangle },
          { k: "sentiment" as const, label: "Sentiment", count: undefined as number | undefined, icon: BarChart3 },
        ].map(({ k, label, count, icon: Icon }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13.5px] font-medium transition",
              tab === k
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {count != null && count > 0 && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-mono text-[10.5px]",
                  tab === k ? "bg-neg/15 text-neg" : "bg-surface-2 text-muted-foreground",
                )}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "review" && (
        <ReviewFeed
          todosNeg={todosNeg}
          todosPos={todosPos}
          resolved={resolved}
          followUps={followUps}
          onOpen={onOpen}
        />
      )}
      {tab === "sentiment" && <SentimentTab />}
    </div>
  );
}

/* ---------------- Review feed tab ---------------- */
function ReviewFeed({
  todosNeg,
  todosPos,
  resolved,
  followUps,
  onOpen,
}: {
  todosNeg: Call[];
  todosPos: Call[];
  resolved: Set<number>;
  followUps: Record<number, FollowUp>;
  onOpen: (c: Call) => void;
}) {
  const [filter, setFilter] = useState<"open" | "resolved" | "positive">("open");
  const openItems = todosNeg.filter((c) => !resolved.has(c.id));
  const resolvedItems = todosNeg.filter((c) => resolved.has(c.id));
  const list = filter === "open" ? openItems : filter === "resolved" ? resolvedItems : todosPos;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">
            {filter === "positive" ? "Positive standouts" : "Calls to review"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {filter === "open" && "Sorted by account tier · highest priority first"}
            {filter === "resolved" && "Already handled"}
            {filter === "positive" && "Worth recognizing"}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-surface/60 p-1">
          {(
            [
              ["open", `Open · ${openItems.length}`],
              ["resolved", `Resolved · ${resolvedItems.length}`],
              ["positive", `Positive · ${todosPos.length}`],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[12px] font-medium transition",
                filter === k
                  ? "bg-surface-2 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3">
        {list.map((c) => (
          <Brief
            key={c.id}
            c={c}
            onClick={() => onOpen(c)}
            resolved={resolved.has(c.id)}
            followUp={followUps[c.id]}
          />
        ))}
        {!list.length && (
          <div className="surface-card p-10 text-center text-sm text-muted-foreground">
            {filter === "open" ? "All caught up. Nothing needs attention." : "Nothing here yet."}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- Sentiment tab ---------------- */
function SentimentTab() {
  const [mode, setMode] = useState<"agent" | "account">("agent");
  const groups =
    mode === "agent"
      ? AGENTS.map((a) => ({
          key: a.name,
          title: a.name,
          subtitle: a.role,
          calls: CALLS.filter((c) => c.agent === a.name),
        }))
      : CLIENTS.map((cl) => ({
          key: cl.name,
          title: cl.name,
          subtitle: `Tier ${cl.tier}`,
          calls: CALLS.filter((c) => c.acct === cl.name),
        }));

  return (
    <div className="surface-card p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Overall sentiment
          </div>
          <div className="font-display mt-1 text-xl">
            {mode === "agent" ? "By employee" : "By company"}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-1 rounded-lg border border-border bg-surface/60 p-1">
            {(
              [
                ["agent", "By employee"],
                ["account", "By company"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setMode(k)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[12px] font-medium transition",
                  mode === k ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="hidden items-center gap-3 text-[11px] text-muted-foreground sm:flex">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-pos" />positive</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-neu" />neutral</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-neg" />negative</span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {groups.map((g) => {
          if (!g.calls.length) return null;
          const p = g.calls.filter((c) => c.sent > 0.1).length;
          const n = g.calls.filter((c) => c.sent < -0.1).length;
          const ne = g.calls.length - p - n;
          return (
            <div key={g.key} className="flex items-center gap-4">
              <div className="w-44 text-[13px]">
                <div className="truncate font-medium">{g.title}</div>
                <div className="text-[11px] text-muted-foreground">{g.subtitle}</div>
              </div>
              <div className="flex h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div className="bg-pos transition-all" style={{ width: `${(p / g.calls.length) * 100}%` }} />
                <div className="bg-neu transition-all" style={{ width: `${(ne / g.calls.length) * 100}%` }} />
                <div className="bg-neg transition-all" style={{ width: `${(n / g.calls.length) * 100}%` }} />
              </div>
              <div className="w-10 text-right font-mono text-xs tabular-nums text-muted-foreground">
                {g.calls.length}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Brief({
  c,
  onClick,
  resolved,
  followUp,
}: {
  c: Call;
  onClick: () => void;
  resolved?: boolean;
  followUp?: FollowUp;
}) {
  const sl = sentLabel(c.sent);
  const cl = clientOf(c.acct);
  return (
    <button
      onClick={onClick}
      className={cn(
        "group surface-card relative w-full overflow-hidden p-5 text-left transition-all hover:border-border-strong hover:shadow-[0_0_0_1px_var(--border-strong),0_8px_30px_-12px_oklch(0_0_0/0.4)]",
        resolved && "opacity-70",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-[3px] transition-all",
          resolved ? "bg-pos" : sl.tone === "neg" ? "bg-neg" : sl.tone === "pos" ? "bg-pos" : "bg-neu",
        )}
      />
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-semibold tracking-tight">{c.acct || "Unmatched caller"}</span>
          {cl && <TierBadge t={cl.tier} />}
          <Chip tone={sl.tone}>{sl.txt}</Chip>
          <Chip>{c.topic}</Chip>
          {resolved && (
            <Chip tone="pos">
              <Check className="h-3 w-3" /> Resolved
            </Chip>
          )}
          {!resolved && followUp && (
            <Chip tone="primary">
              <UserPlus className="h-3 w-3" /> Follow-up · {followUp.agent}
            </Chip>
          )}
          {!resolved && !followUp && c.follow === "Needs follow-up" && (
            <Chip tone="neu">Needs follow-up</Chip>
          )}
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {fmtTime(c.time)} · {mmss(c.dur)}
        </span>
      </div>
      <p className="text-[13.5px] leading-relaxed text-muted-foreground">{c.summary}</p>
      <div className="mt-3 text-[11.5px] text-muted-foreground">
        Handled by <span className="text-foreground">{c.agent}</span>
        {agentOf(c.agent) ? ` · ${agentOf(c.agent)!.role}` : ""}
        {followUp && (
          <>
            {" · "}follow-up due <span className="text-foreground">{followUp.due}</span>
          </>
        )}
      </div>
    </button>
  );
}

/* ---------------- Explorer ---------------- */
function ExplorerView({
  filtered,
  q,
  setQ,
  fSent,
  setFSent,
  fAgent,
  setFAgent,
  fAcct,
  setFAcct,
  onOpen,
  onExport,
}: {
  filtered: Call[];
  q: string;
  setQ: (v: string) => void;
  fSent: string;
  setFSent: (v: string) => void;
  fAgent: string;
  setFAgent: (v: string) => void;
  fAcct: string;
  setFAcct: (v: string) => void;
  onOpen: (c: Call) => void;
  onExport: () => void;
}) {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search transcript, account, topic…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-[13px] outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Sel v={fSent} set={setFSent} opts={["All", "Negative", "Neutral", "Positive"]} label="Sentiment" />
        <Sel v={fAgent} set={setFAgent} opts={["All", ...AGENTS.map((a) => a.name)]} label="Agent" />
        <Sel v={fAcct} set={setFAcct} opts={["All", ...CLIENTS.map((c) => c.name)]} label="Account" />
        <button
          onClick={onExport}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-[12.5px] font-medium transition hover:border-border-strong hover:bg-surface-2"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      <div className="surface-card overflow-hidden p-0">
        <div className="grid grid-cols-[70px_1.5fr_1.3fr_1fr_70px_1fr] border-b border-border bg-surface-2/40 px-5 py-3 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <div>Time</div>
          <div>Account</div>
          <div>Agent</div>
          <div>Topic</div>
          <div>Dur</div>
          <div>Sentiment</div>
        </div>
        {filtered.map((c) => {
          const sl = sentLabel(c.sent);
          const cl = clientOf(c.acct);
          return (
            <button
              key={c.id}
              onClick={() => onOpen(c)}
              className="grid w-full grid-cols-[70px_1.5fr_1.3fr_1fr_70px_1fr] items-center border-b border-border px-5 py-3.5 text-[13px] text-left transition hover:bg-surface-2/60"
            >
              <div className="font-mono text-muted-foreground">{fmtTime(c.time)}</div>
              <div className="flex items-center gap-2 font-medium">
                {c.acct || <span className="text-neu">Unmatched</span>}
                {cl && <TierBadge t={cl.tier} />}
              </div>
              <div className="text-muted-foreground">{c.agent}</div>
              <div>{c.topic}</div>
              <div className="font-mono text-muted-foreground">{mmss(c.dur)}</div>
              <div className="flex items-center gap-2">
                <SentimentDot s={c.sent} />
                <span className={sl.cls}>{sl.txt}</span>
              </div>
            </button>
          );
        })}
        {!filtered.length && <div className="p-8 text-center text-sm text-muted-foreground">No calls match.</div>}
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        {filtered.length} of {CALLS.length} calls
      </div>
    </div>
  );
}

function Sel({ v, set, opts, label }: { v: string; set: (v: string) => void; opts: string[]; label: string }) {
  return (
    <select
      value={v}
      onChange={(e) => set(e.target.value)}
      className="h-10 rounded-lg border border-border bg-surface px-3 text-[13px] outline-none transition focus:border-primary/60"
    >
      {opts.map((o) => (
        <option key={o} value={o} className="bg-surface">
          {o === "All" ? `${label}: All` : o}
        </option>
      ))}
    </select>
  );
}

/* ---------------- Agents ---------------- */
function AgentsView() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {AGENTS.map((a) => {
        const cs = CALLS.filter((c) => c.agent === a.name);
        const avg = cs.length ? cs.reduce((s, c) => s + c.sent, 0) / cs.length : 0;
        const sl = sentLabel(avg);
        return (
          <div key={a.name} className="surface-card p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-surface-3 font-mono text-sm font-medium text-foreground">
                {a.name.split(" ").map((p) => p[0]).join("")}
              </div>
              <div>
                <div className="text-[15px] font-semibold">{a.name}</div>
                <div className="text-xs text-muted-foreground">
                  {a.role} · <span className="font-mono">{a.ext}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Calls</div>
                <div className="font-mono text-2xl">{cs.length}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Avg sentiment</div>
                <div className="mt-1 flex items-center justify-end gap-2">
                  {cs.length > 0 && <SentimentDot s={avg} />}
                  <span className={cn("text-sm font-medium", cs.length ? sl.cls : "text-muted-foreground")}>
                    {cs.length ? sl.txt : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Accounts ---------------- */
function AccountsView({ unmatched, onOpen }: { unmatched: number; onOpen: (c: Client) => void }) {
  return (
    <div className="space-y-6">
      {unmatched > 0 && (
        <div className="rounded-xl border border-neu/40 bg-neu/10 p-5">
          <div className="mb-1 flex items-center gap-2 text-[14px] font-semibold text-neu">
            <AlertTriangle className="h-4 w-4" /> Unmatched calls — {unmatched} need linking
          </div>
          <p className="mb-4 text-[13px] text-muted-foreground">
            The caller's number isn't on any client's record. Link it once and future calls auto-match.
          </p>
          {CALLS.filter((c) => c.flag === "unmatched").map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 border-t border-border py-3 first:border-t-0"
            >
              <div className="text-[13px]">
                <span className="font-mono text-foreground">{c.from}</span>
                <span className="text-muted-foreground"> · {fmtTime(c.time)} · {c.topic}</span>
              </div>
              <select className="h-9 rounded-md border border-border bg-surface px-2 text-xs">
                <option>Link to client…</option>
                {CLIENTS.map((cl) => (
                  <option key={cl.name}>{cl.name}</option>
                ))}
                <option>+ New client</option>
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{CLIENTS.length} clients · ranked by tier</p>
        <button
          onClick={() => {
            const rows: (string | number)[][] = [["Account", "Tier", "Calls", "Positive", "Negative", "Avg sentiment"]];
            CLIENTS.forEach((cl) => {
              const cs = CALLS.filter((c) => c.acct === cl.name);
              const p = cs.filter((c) => c.sent > 0.1).length;
              const n = cs.filter((c) => c.sent < -0.1).length;
              const avg = cs.length ? cs.reduce((s, c) => s + c.sent, 0) / cs.length : 0;
              rows.push([cl.name, cl.tier, cs.length, p, n, avg.toFixed(2)]);
            });
            downloadCSV("accounts.csv", rows);
          }}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs hover:bg-surface-2"
        >
          <Download className="h-3.5 w-3.5" /> Export accounts
        </button>
      </div>

      <div className="grid gap-3">
        {[...CLIENTS]
          .sort((a, b) => a.tier - b.tier)
          .map((cl) => {
            const cs = CALLS.filter((c) => c.acct === cl.name);
            const p = cs.filter((c) => c.sent > 0.1).length;
            const n = cs.filter((c) => c.sent < -0.1).length;
            const nu = cs.length - p - n;
            const avg = cs.length ? cs.reduce((s, c) => s + c.sent, 0) / cs.length : 0;
            const sl = sentLabel(avg);
            const risk = avg <= -0.4;
            return (
              <button
                key={cl.name}
                onClick={() => onOpen(cl)}
                className="surface-card grid w-full grid-cols-[2fr_1fr_2fr_140px] items-center gap-4 p-5 text-left transition hover:border-border-strong"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold">{cl.name}</span>
                    <TierBadge t={cl.tier} />
                    {risk && <Chip tone="neg">At risk</Chip>}
                  </div>
                  <div className="mt-1 text-[11.5px] text-muted-foreground">
                    {cl.numbers.length} number{cl.numbers.length > 1 ? "s" : ""} · {cl.contacts.length} contacts
                  </div>
                </div>
                <div className="font-mono text-2xl tabular-nums">{cs.length}</div>
                <div>
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2">
                    {cs.length > 0 && (
                      <>
                        <div className="bg-pos" style={{ width: `${(p / cs.length) * 100}%` }} />
                        <div className="bg-neu" style={{ width: `${(nu / cs.length) * 100}%` }} />
                        <div className="bg-neg" style={{ width: `${(n / cs.length) * 100}%` }} />
                      </>
                    )}
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    {p} pos · {nu} neu · {n} neg
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Sentiment</div>
                  <div className={cn("mt-0.5 text-sm font-medium", cs.length ? sl.cls : "text-muted-foreground")}>
                    {cs.length ? sl.txt : "—"}
                  </div>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}

/* ---------------- Account Detail ---------------- */
function AccountDetail({ cl, onBack, onCall }: { cl: Client; onBack: () => void; onCall: (c: Call) => void }) {
  const [tab, setTab] = useState<"kpis" | "calls" | "contacts">("kpis");
  const cs = CALLS.filter((c) => c.acct === cl.name);
  const p = cs.filter((c) => c.sent > 0.1).length;
  const n = cs.filter((c) => c.sent < -0.1).length;
  const nu = cs.length - p - n;
  const avg = cs.length ? cs.reduce((s, c) => s + c.sent, 0) / cs.length : 0;
  const sl = sentLabel(avg);
  const risk = avg <= -0.4;
  const TABS: Array<["kpis" | "calls" | "contacts", string]> = [
    ["kpis", "Overview"],
    ["calls", `Calls (${cs.length})`],
    ["contacts", `Contacts (${cl.contacts.length})`],
  ];

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Account Health
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display flex items-center gap-3 text-3xl tracking-tight">
            {cl.name}
            <TierBadge t={cl.tier} />
            {risk && <Chip tone="neg">AT RISK</Chip>}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cl.numbers.length} number{cl.numbers.length > 1 ? "s" : ""} on file · {cl.contacts.length} known contacts
          </p>
        </div>
        <button
          onClick={() => downloadCSV(`${cl.name.replace(/\s+/g, "-").toLowerCase()}-calls.csv`, callsToRows(cs))}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs hover:bg-surface-2"
        >
          <Download className="h-3.5 w-3.5" /> Export calls
        </button>
      </div>

      <div className="my-6 flex gap-1 border-b border-border">
        {TABS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-[13.5px] font-medium transition",
              tab === k
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "kpis" && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Total calls" value={cs.length} sub="this window" />
            <Kpi label="Positive" value={cs.length ? `${Math.round((p / cs.length) * 100)}%` : "—"} sub={`${p} calls`} tone="pos" />
            <Kpi label="Negative" value={cs.length ? `${Math.round((n / cs.length) * 100)}%` : "—"} sub={`${n} calls`} tone="neg" />
            <Kpi label="Avg sentiment" value={sl.txt} sub={avg.toFixed(2)} tone={sl.tone} />
          </div>
          <div className="surface-card p-6">
            <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Sentiment split</div>
            <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-surface-2">
              {cs.length > 0 && (
                <>
                  <div className="bg-pos" style={{ width: `${(p / cs.length) * 100}%` }} />
                  <div className="bg-neu" style={{ width: `${(nu / cs.length) * 100}%` }} />
                  <div className="bg-neg" style={{ width: `${(n / cs.length) * 100}%` }} />
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {p} positive · {nu} neutral · {n} negative
            </div>
          </div>
        </div>
      )}

      {tab === "calls" && (
        <div className="grid gap-3">
          {cs.length === 0 && <div className="text-sm text-muted-foreground">No calls in this window.</div>}
          {cs.map((c) => (
            <Brief key={c.id} c={c} onClick={() => onCall(c)} />
          ))}
        </div>
      )}

      {tab === "contacts" && (
        <div className="grid gap-3">
          {cl.contacts.map((ct) => {
            const csl = sentLabel(ct.lastSent);
            return (
              <div
                key={ct.name}
                className="surface-card flex items-center justify-between p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-surface-3 font-mono text-xs">
                    {ct.name.split(" ").map((p) => p[0]).join("")}
                  </div>
                  <div>
                    <div className="font-semibold">{ct.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {ct.role} · {ct.calls} call{ct.calls > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">last call</span>
                  <SentimentDot s={ct.lastSent} />
                  <span className={csl.cls}>{csl.txt}</span>
                </div>
              </div>
            );
          })}
          <button className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground transition hover:border-border-strong hover:text-foreground">
            + Add contact
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Call Detail ---------------- */
function CallDetail({
  c,
  onBack,
  resolved,
  followUp,
  onToggleResolved,
  onAssignFollowUp,
}: {
  c: Call;
  onBack: () => void;
  resolved: boolean;
  followUp?: FollowUp;
  onToggleResolved: () => void;
  onAssignFollowUp: (fu: FollowUp) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const sl = sentLabel(c.sent);
  const cl = clientOf(c.acct);
  const ag = agentOf(c.agent);
  const moments =
    c.flag === "at-risk"
      ? [
          { at: 0.62, kind: "neg", label: "Churn threat — other providers" },
          { at: 0.18, kind: "neg", label: "Complaint — driver 40 min late" },
        ]
      : c.sent > 0.4
      ? [{ at: 0.3, kind: "pos", label: "Praise — handled multi-stop" }]
      : [{ at: 0.5, kind: "neu", label: "Key moment" }];

  const transcript = [
    { who: "Agent", t: "Good evening, thank you for calling. How can I help?" },
    { who: "Caller", t: "Hi, this is David Chen, I'm calling for Greenhill, I book the cars for Mr. Okafor." },
    { who: "Caller", t: "Your driver was supposed to be at the hotel at five and showed up at quarter to six.", s: "neg" },
    { who: "Caller", t: "We had an executive miss his check-in because of this. Not the first time.", s: "neg" },
    { who: "Agent", t: "I'm sorry to hear that. Let me pull up the trip." },
    { who: "Caller", t: "If this keeps happening we'll have to look at other providers for the corporate account.", s: "neg" },
  ];

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Back
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display flex items-center gap-3 text-3xl tracking-tight">
            {c.acct || "Unmatched caller"}
            {cl && <TierBadge t={cl.tier} />}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {c.caller
              ? `${c.caller}${c.passenger && c.passenger !== "Self" && c.passenger !== "N/A (billing call)" ? ` · booking for ${c.passenger}` : ""}`
              : "Caller not identified"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip tone={sl.tone}>{sl.txt}</Chip>
            <Chip>{c.topic}</Chip>
            <Chip tone={c.match === "phone" ? "pos" : c.match === "name" ? "neu" : "neg"}>
              {c.match === "phone" ? "Matched by number" : c.match === "name" ? "Matched by name (confirm)" : "Unmatched"}
            </Chip>
          </div>
        </div>
        <div className="text-right font-mono text-xs text-muted-foreground">
          <div className="text-foreground">{fmtTime(c.time)} · {mmss(c.dur)}</div>
          <div>{c.from}</div>
          <div>
            {c.agent}
            {ag ? ` · ${ag.role}` : ""}
          </div>
        </div>
      </div>

      {/* Player */}
      <div className="surface-card my-6 p-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPlaying(!playing)}
            className="grid h-11 w-11 place-items-center rounded-full bg-[image:var(--gradient-brand)] text-primary-foreground shadow-[0_0_24px_oklch(0.7_0.16_255/0.4)] transition hover:scale-105"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
          <div className="relative flex h-12 flex-1 items-center gap-[2px]">
            {Array.from({ length: 80 }).map((_, i) => {
              const h = 18 + Math.abs(Math.sin(i * 0.55) * 80);
              const active = i < 22;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-sm transition-all",
                    active ? "bg-primary" : "bg-border-strong",
                  )}
                  style={{ height: `${h}%` }}
                />
              );
            })}
            {moments.map((m, i) => (
              <div
                key={i}
                title={m.label}
                className={cn(
                  "absolute -bottom-1 -top-1 w-[3px] rounded-full",
                  m.kind === "neg" ? "bg-neg shadow-[0_0_8px_var(--neg)]" : m.kind === "pos" ? "bg-pos" : "bg-neu",
                )}
                style={{ left: `${m.at * 100}%` }}
              />
            ))}
          </div>
          <span className="font-mono text-xs text-muted-foreground">{mmss(c.dur)}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {moments.map((m, i) => (
            <button
              key={i}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11.5px] font-medium",
                m.kind === "neg"
                  ? "border-neg/40 bg-neg/10 text-neg"
                  : m.kind === "pos"
                  ? "border-pos/40 bg-pos/10 text-pos"
                  : "border-neu/40 bg-neu/10 text-neu",
              )}
            >
              <Play className="h-3 w-3" />
              {Math.floor((m.at * c.dur) / 60)}:{String(Math.round(m.at * c.dur) % 60).padStart(2, "0")} · {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface-card p-4">
          <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Caller</div>
          <div className="mt-2 font-semibold">{c.caller || "Not stated"}</div>
          <div className="text-xs text-muted-foreground">{c.callerRole}</div>
          <div className="mt-3">
            {c.callerKnown ? <Chip tone="pos">Known contact</Chip> : <Chip tone="neu">New contact · add to account</Chip>}
          </div>
        </div>
        <div className="surface-card p-4">
          <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Booking for</div>
          <div className="mt-2 font-semibold">{c.passenger || "—"}</div>
          <div className="text-xs text-muted-foreground">passenger</div>
        </div>
        <div className="surface-card p-4">
          <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Handled by</div>
          <div className="mt-2 font-semibold">{c.agent}</div>
          <div className="text-xs text-muted-foreground">{ag ? `${ag.role} · ${ag.ext}` : ""}</div>
        </div>
      </div>

      {/* Transcript + Summary */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h3 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Transcript</h3>
          <div className="grid gap-3">
            {transcript.map((l, i) => (
              <div
                key={i}
                className={cn(
                  "border-l-2 pl-4 py-1",
                  l.who === "Caller" ? (l.s === "neg" ? "border-neg" : "border-border-strong") : "border-primary",
                )}
              >
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{l.who}</div>
                <div className="mt-0.5 text-[14px] leading-relaxed">{l.t}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> AI Summary
            </h3>
            <div className="surface-card p-4 text-[13.5px] leading-relaxed">{c.summary}</div>
          </div>
          <div>
            <h3 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Extracted</h3>
            <dl className="surface-card grid gap-2 p-4 text-[13px] leading-relaxed">
              <Row k="Account" v={`${c.acct || "—"}${cl ? ` (Tier ${cl.tier})` : ""}`} />
              <Row k="Caller" v={`${c.caller || "Not stated"}${c.callerRole && c.callerRole !== "unknown" ? ` · ${c.callerRole}` : ""}`} />
              <Row k="Booking for" v={c.passenger || "—"} />
              <Row k="Topic" v={c.topic} />
              <Row k="Outcome" v={c.follow} />
              <Row k="Churn signal" v={c.flag === "at-risk" ? "Yes — provider switch mentioned" : "No"} />
            </dl>
          </div>
          {(resolved || followUp) && (
            <div className="rounded-lg border border-border bg-surface-2/50 p-3 text-[12.5px]">
              {resolved && (
                <div className="flex items-center gap-2 text-pos">
                  <Check className="h-3.5 w-3.5" /> Marked resolved
                </div>
              )}
              {followUp && (
                <div className="mt-1 text-muted-foreground">
                  <UserPlus className="mr-1.5 inline h-3.5 w-3.5 text-primary" />
                  Follow-up assigned to{" "}
                  <span className="font-medium text-foreground">{followUp.agent}</span>
                  {" · due "}
                  <span className="text-foreground">{followUp.due}</span>
                  {followUp.note && (
                    <div className="mt-1 italic">"{followUp.note}"</div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={onToggleResolved}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-medium transition",
                resolved
                  ? "border border-pos/40 bg-pos/10 text-pos hover:bg-pos/15"
                  : "bg-[image:var(--gradient-brand)] text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.7_0.16_255/0.6)] hover:brightness-110",
              )}
            >
              {resolved ? "Resolved ✓ Undo" : "Mark resolved"}
            </button>
            <button
              onClick={() => setShowAssign(true)}
              className="flex-1 rounded-lg border border-border bg-surface py-2.5 text-sm font-medium transition hover:bg-surface-2"
            >
              {followUp ? "Edit follow-up" : "Assign follow-up"}
            </button>
          </div>
        </div>
      </div>
      {showAssign && (
        <AssignFollowUpModal
          c={c}
          initial={followUp}
          onClose={() => setShowAssign(false)}
          onSave={(fu) => {
            onAssignFollowUp(fu);
            setShowAssign(false);
          }}
        />
      )}
    </div>
  );
}

function AssignFollowUpModal({
  c,
  initial,
  onClose,
  onSave,
}: {
  c: Call;
  initial?: FollowUp;
  onClose: () => void;
  onSave: (fu: FollowUp) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultDue = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();
  const [agent, setAgent] = useState(initial?.agent ?? c.agent);
  const [due, setDue] = useState(initial?.due ?? defaultDue);
  const [note, setNote] = useState(
    initial?.note ?? (c.flag === "at-risk" ? "Call the account back and offer a recovery gesture." : ""),
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-[oklch(0_0_0/0.55)] p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="surface-card w-full max-w-[460px] p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Follow-up
            </div>
            <h3 className="font-display mt-1 text-xl">Assign this call</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {c.acct || "Unmatched caller"} · {c.topic}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Assign to
            </label>
            <select
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-primary/60"
            >
              {AGENTS.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name} · {a.role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Due
            </label>
            <input
              type="date"
              value={due}
              min={today}
              onChange={(e) => setDue(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="What should happen on the follow-up?"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary/60"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border bg-surface py-2.5 text-sm font-medium hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ agent, due, note: note.trim(), createdAt: new Date() })}
            className="flex-1 rounded-lg bg-[image:var(--gradient-brand)] py-2.5 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.7_0.16_255/0.6)] transition hover:brightness-110"
          >
            Assign follow-up
          </button>
        </div>
      </div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

/* ---------------- Integrations ---------------- */
function IntegrationsView() {
  const items = [
    { n: "RingCentral", d: "Call recordings, caller ID, agent extensions", on: true },
    { n: "Salesforce", d: "Sync client roster, contacts + account tiers", on: false },
    { n: "HubSpot", d: "Sync client roster + contact numbers", on: false },
  ];
  return (
    <div>
      <p className="-mt-3 mb-6 text-sm text-muted-foreground">Data sources that feed calls and account info into Service Secure.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <div key={i.n} className="surface-card p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[15px] font-semibold">{i.n}</div>
              <Chip tone={i.on ? "pos" : "muted"}>{i.on ? "Connected" : "Not connected"}</Chip>
            </div>
            <div className="mb-4 min-h-10 text-[13px] text-muted-foreground">{i.d}</div>
            <button
              className={cn(
                "w-full rounded-lg py-2 text-[13px] font-medium transition",
                i.on
                  ? "border border-border bg-transparent text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                  : "bg-[image:var(--gradient-brand)] text-primary-foreground hover:brightness-110",
              )}
            >
              {i.on ? "Manage" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Notifications ---------------- */
function NotificationsView() {
  const channels = [
    { n: "Slack", d: "Real-time alerts to #ops channel", on: true },
    { n: "Email digest", d: "Daily summary to chosen recipients", on: true },
    { n: "SMS (Twilio)", d: "Text the COO on at-risk calls only", on: false },
  ];
  const rules = [
    { t: "Very negative call", d: "Sentiment below -0.5", ch: "Slack + SMS", on: true },
    { t: "Churn signal detected", d: "Caller mentions leaving / other providers", ch: "Slack + SMS", on: true },
    { t: "Tier 1 negative call", d: "Any negative call from a Key account", ch: "Slack", on: true },
    { t: "Repeat complaint", d: "Same account, 2nd negative call in 7 days", ch: "Slack", on: true },
    { t: "Positive standout", d: "Sentiment above 0.7 (for recognition)", ch: "Daily digest", on: false },
  ];
  return (
    <div className="space-y-8">
      <p className="-mt-3 text-sm text-muted-foreground">Where alerts go, and what triggers them. Channels are separate from data sources.</p>

      <section>
        <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Channels</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((i) => (
            <div key={i.n} className="surface-card p-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[15px] font-semibold">{i.n}</div>
                <Chip tone={i.on ? "pos" : "muted"}>{i.on ? "On" : "Off"}</Chip>
              </div>
              <div className="mb-4 min-h-10 text-[13px] text-muted-foreground">{i.d}</div>
              <button
                className={cn(
                  "w-full rounded-lg py-2 text-[13px] font-medium transition",
                  i.on
                    ? "border border-border bg-transparent text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    : "bg-[image:var(--gradient-brand)] text-primary-foreground hover:brightness-110",
                )}
              >
                {i.on ? "Configure" : "Turn on"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Alert rules</div>
        <div className="surface-card overflow-hidden p-0">
          {rules.map((r, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center justify-between gap-4 px-5 py-4",
                i ? "border-t border-border" : "",
              )}
            >
              <div>
                <div className="text-[13.5px] font-medium">{r.t}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{r.d}</div>
              </div>
              <div className="flex items-center gap-3">
                <Chip tone="primary">{r.ch}</Chip>
                <div
                  className={cn(
                    "relative h-[22px] w-[40px] rounded-full transition",
                    r.on ? "bg-pos shadow-[0_0_12px_oklch(0.72_0.16_152/0.5)]" : "bg-border-strong",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white transition-all",
                      r.on ? "left-[20px]" : "left-[2px]",
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
