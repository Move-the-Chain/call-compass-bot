import { useMemo } from "react";
import { clientOf, fmtTime, type Call } from "@/lib/service-secure-data";
import { GreetingHeader } from "./GreetingHeader";
import { ConversationFeed } from "./ConversationFeed";
import { FocusRail, type FocusData } from "./FocusRail";

type Props = {
  rangeCalls: Call[];
  total: number;
  pos: number;
  neg: number;
  unmatched: number;
  todosNeg: Call[];
  resolved: Set<number>;
  onViewAll: () => void;
};

export function SummaryWorkspace({
  rangeCalls,
  total,
  pos,
  neg,
  unmatched,
  todosNeg,
  resolved,
  onViewAll,
}: Props) {
  const openReview = useMemo(() => todosNeg.filter((c) => !resolved.has(c.id)), [todosNeg, resolved]);

  const posPct = total ? Math.round((pos / total) * 100) : 0;
  const negPct = total ? Math.round((neg / total) * 100) : 0;
  const neuPct = Math.max(0, 100 - posPct - negPct);

  const toReviewAccounts = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of openReview) {
      const name = c.acct ?? "Unmatched";
      if (!seen.has(name)) {
        seen.add(name);
        out.push(name);
      }
    }
    return out;
  }, [openReview]);

  const followUpsCount = useMemo(
    () => rangeCalls.filter((c) => c.follow === "Needs follow-up").length,
    [rangeCalls],
  );

  const atRisk = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of rangeCalls) {
      if (c.acct && c.sent <= -0.5) {
        map.set(c.acct, (map.get(c.acct) ?? 0) + 1);
      }
    }
    const sorted = [...map.entries()].sort(([, a], [, b]) => b - a);
    return { count: sorted.length, accounts: sorted.map(([n]) => n) };
  }, [rangeCalls]);

  const focus: FocusData = {
    toReview: { count: openReview.length, topAccounts: toReviewAccounts },
    unmatched,
    followUps: followUpsCount,
    atRisk,
    sentiment: { total, posPct, negPct, neuPct },
  };

  const snapshot = useMemo(() => {
    const topNegative = openReview.slice(0, 6).map((c) => ({
      account: c.acct,
      tier: clientOf(c.acct)?.tier ?? null,
      time: fmtTime(c.time),
      agent: c.agent,
      topic: c.topic,
      sentiment: c.sent,
      caller: c.caller,
      summary: c.summary,
      follow: c.follow,
    }));
    return JSON.stringify(
      {
        date: "Wednesday, June 3, 2026",
        admin: "Milan",
        totals: { calls: total, positivePct: posPct, negativePct: negPct, unmatched },
        toReviewCount: openReview.length,
        openFollowUps: followUpsCount,
        atRiskAccounts: atRisk.accounts,
        topFlaggedCalls: topNegative,
      },
      null,
      2,
    );
  }, [openReview, total, posPct, negPct, unmatched, followUpsCount, atRisk.accounts]);

  const suggestions = [
    toReviewAccounts[0] ? `Why is ${toReviewAccounts[0]} unhappy?` : "Show me today's negative calls",
    "Summarize the overnight negative calls",
    "Which agent handled the most flagged calls?",
    "Draft a recovery message for the top at-risk account",
  ];

  return (
    <div
      className="relative -mx-6 -my-6 min-h-[calc(100vh-40px)] px-6 py-6 lg:-mx-10 lg:-my-8 lg:px-10 lg:py-8"
      style={{
        backgroundColor: "#f8fafc",
        backgroundImage:
          "radial-gradient(at 0% 0%, rgba(147,197,253,0.25) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(203,213,225,0.4) 0px, transparent 50%)",
      }}
    >
      <div className="mb-6">
        <GreetingHeader dateLabel="Wednesday · June 3, 2026" />
      </div>
      <div className="flex gap-6">
        <ConversationFeed
          briefing={{
            total,
            posPct,
            negPct,
            unmatched,
            standouts: toReviewAccounts.slice(0, 3),
          }}
          suggestions={suggestions}
          snapshot={snapshot}
        />
        <FocusRail data={focus} onViewAll={onViewAll} />
      </div>
    </div>
  );
}
