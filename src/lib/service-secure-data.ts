export type Agent = { name: string; role: string; ext: string };
export type Contact = { name: string; role: string; calls: number; lastSent: number };
export type Client = {
  name: string;
  tier: 1 | 2 | 3;
  numbers: string[];
  contacts: Contact[];
};
export type Call = {
  id: number;
  time: Date;
  acct: string | null;
  agent: string;
  topic: string;
  sent: number;
  dur: number;
  flag: "at-risk" | "negative" | "positive" | "neutral" | "unmatched";
  match: "phone" | "name" | "none";
  from: string;
  caller: string;
  callerRole: string;
  callerKnown: boolean;
  passenger: string;
  summary: string;
  follow: string;
  h: number;
};

export const AGENTS: Agent[] = [
  { name: "Marcus Reed", role: "Dispatch", ext: "x201" },
  { name: "Lena Cho", role: "Dispatch", ext: "x202" },
  { name: "Ravi Patel", role: "Reservationist", ext: "x310" },
  { name: "Tomas Vidal", role: "Night Desk", ext: "x205" },
  { name: "Priya Nair", role: "Reservationist", ext: "x312" },
];

export const CLIENTS: Client[] = [
  { name: "Greenhill Capital", tier: 1, numbers: ["+1 212 555 0148", "+1 212 555 0149"], contacts: [{ name: "David Chen", role: "Exec Assistant", calls: 6, lastSent: -0.4 }, { name: "Maria Santos", role: "Office Manager", calls: 2, lastSent: 0.3 }] },
  { name: "Voss Pharma", tier: 1, numbers: ["+1 617 555 0210"], contacts: [{ name: "Sarah Lindqvist", role: "Office Manager", calls: 4, lastSent: -0.2 }, { name: "Nina Patel", role: "New contact", calls: 1, lastSent: 0.64 }] },
  { name: "Meridian Bank", tier: 1, numbers: ["+1 212 555 0455"], contacts: [{ name: "James Okonkwo", role: "Travel Coordinator", calls: 9, lastSent: 0.5 }] },
  { name: "Atlas Legal", tier: 2, numbers: ["+1 312 555 0733"], contacts: [{ name: "Robert Vance", role: "Accounts Payable", calls: 3, lastSent: -0.34 }] },
  { name: "Kessler Group", tier: 3, numbers: ["+1 408 555 0911"], contacts: [{ name: "Amy Tran", role: "Exec Assistant", calls: 2, lastSent: 0.31 }] },
];

const NOW = new Date("2026-06-03T15:43:00");

const TODAY_SEED: Omit<Call, "id" | "time">[] = [
  { acct: "Greenhill Capital", agent: "Tomas Vidal", topic: "Late pickup", sent: -0.82, dur: 521, flag: "at-risk", match: "phone", from: "+1 212 555 0148", caller: "David Chen", callerRole: "Exec Assistant", callerKnown: true, passenger: "Mr. Okafor (CFO)", summary: "Repeat caller. Driver 40 min late to a 5:00 AM airport run; exec missed an earlier check-in. Threatened to move the corporate account. No recovery offered on the call.", follow: "Needs follow-up", h: 11 },
  { acct: "Voss Pharma", agent: "Priya Nair", topic: "Driver behavior", sent: -0.71, dur: 362, flag: "negative", match: "phone", from: "+1 617 555 0210", caller: "Sarah Lindqvist", callerRole: "Office Manager", callerKnown: true, passenger: "Self", summary: "Passenger reported the driver was on a personal call most of the ride and took a longer route. Calm but firm. Asked for a different driver next time.", follow: "Needs follow-up", h: 9 },
  { acct: "Meridian Bank", agent: "Marcus Reed", topic: "Praise", sent: 0.88, dur: 134, flag: "positive", match: "phone", from: "+1 212 555 0455", caller: "James Okonkwo", callerRole: "Travel Coordinator", callerKnown: true, passenger: "Ms. Reyes (MD)", summary: "Praised driver (unit 21) for a smooth last-minute multi-stop. Wants the same driver on a recurring exec route.", follow: "Resolved", h: 6 },
  { acct: "Atlas Legal", agent: "Lena Cho", topic: "Billing dispute", sent: -0.34, dur: 687, flag: "negative", match: "phone", from: "+1 312 555 0733", caller: "Robert Vance", callerRole: "Accounts Payable", callerKnown: true, passenger: "N/A (billing call)", summary: "Dispute over a wait-time surcharge. Tense but not hostile. Billing team to review and call back.", follow: "Needs follow-up", h: 7 },
  { acct: "Kessler Group", agent: "Ravi Patel", topic: "New booking", sent: 0.31, dur: 290, flag: "neutral", match: "phone", from: "+1 408 555 0911", caller: "Amy Tran", callerRole: "Exec Assistant", callerKnown: true, passenger: "Mr. Kessler", summary: "Booked three airport transfers next week. Mentioned they're comparing vendors on price.", follow: "-", h: 5 },
  { acct: "Greenhill Capital", agent: "Lena Cho", topic: "Route change", sent: 0.12, dur: 189, flag: "neutral", match: "phone", from: "+1 212 555 0149", caller: "David Chen", callerRole: "Exec Assistant", callerKnown: true, passenger: "Mr. Okafor (CFO)", summary: "Mid-trip route change handled smoothly.", follow: "-", h: 4 },
  { acct: null, agent: "Tomas Vidal", topic: "New booking", sent: -0.05, dur: 240, flag: "unmatched", match: "none", from: "+1 646 555 0182", caller: "David", callerRole: "unknown", callerKnown: false, passenger: "unclear", summary: "Caller said 'this is David from the Hartwell account' but number is unknown and no Hartwell client on file. Needs a human to confirm and link.", follow: "Needs match", h: 2 },
  { acct: "Voss Pharma", agent: "Marcus Reed", topic: "VIP airport", sent: 0.64, dur: 333, flag: "positive", match: "name", from: "+1 617 555 0299", caller: "Nina Patel", callerRole: "new contact", callerKnown: false, passenger: "Dr. Halvorsen", summary: "Coordinated a VIP meet-and-greet. Matched by name (new number, auto-linked, pending confirm). Appreciated proactive flight tracking.", follow: "Resolved", h: 3 },
];

// Deterministic pseudo-random generator so seed data is stable
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TOPICS = ["New booking", "Late pickup", "Route change", "Driver behavior", "Billing dispute", "VIP airport", "Praise", "Cancellation", "Schedule change"];
const SUMMARIES = [
  "Routine booking confirmed with no issues.",
  "Brief discussion about pickup window. Resolved on call.",
  "Caller asked for a different driver next time.",
  "Praised our handling of a last-minute change.",
  "Disputed a small surcharge. Pleasant tone.",
  "Standard airport pickup confirmation.",
  "Schedule change for next week, no complaints.",
  "Caller mentioned comparing vendors on price.",
];

function genHistorical(): Omit<Call, "id" | "time">[] {
  const rnd = mulberry32(7);
  const out: Omit<Call, "id" | "time">[] = [];
  // Spread calls across last 30 days (day 1 = yesterday). ~3-7 per day, deterministic.
  for (let day = 1; day <= 30; day++) {
    const count = 3 + Math.floor(rnd() * 5);
    for (let i = 0; i < count; i++) {
      const cl = CLIENTS[Math.floor(rnd() * CLIENTS.length)];
      const ag = AGENTS[Math.floor(rnd() * AGENTS.length)];
      // Sentiment: skew toward neutral/positive
      const r = rnd();
      const sent = r < 0.15 ? -0.6 + rnd() * 0.4 : r < 0.35 ? -0.2 + rnd() * 0.3 : r < 0.55 ? -0.05 + rnd() * 0.2 : 0.2 + rnd() * 0.7;
      const dur = 90 + Math.floor(rnd() * 600);
      const topic = TOPICS[Math.floor(rnd() * TOPICS.length)];
      const contact = cl.contacts[Math.floor(rnd() * cl.contacts.length)];
      const hourOfDay = 6 + Math.floor(rnd() * 14); // 06:00–20:00
      const h = day * 24 - hourOfDay; // hours ago from NOW (approx)
      const flag: Call["flag"] = sent <= -0.5 ? "at-risk" : sent < -0.1 ? "negative" : sent > 0.5 ? "positive" : "neutral";
      out.push({
        acct: cl.name,
        agent: ag.name,
        topic,
        sent: Math.round(sent * 100) / 100,
        dur,
        flag,
        match: "phone",
        from: cl.numbers[0],
        caller: contact.name,
        callerRole: contact.role,
        callerKnown: true,
        passenger: "—",
        summary: SUMMARIES[Math.floor(rnd() * SUMMARIES.length)],
        follow: sent < -0.3 ? "Needs follow-up" : sent > 0.6 ? "Resolved" : "-",
        h,
      });
    }
  }
  return out;
}

const SEED = [...TODAY_SEED, ...genHistorical()];

export const CALLS: Call[] = SEED.map((x, i) => ({
  id: i + 1,
  time: new Date(NOW.getTime() - x.h * 3600e3),
  ...x,
}));

export const clientOf = (n: string | null) => CLIENTS.find((c) => c.name === n);
export const agentOf = (n: string) => AGENTS.find((a) => a.name === n);

export type SentLabel = { txt: string; tone: "pos" | "neg" | "neu"; cls: string };
export const sentLabel = (s: number): SentLabel => {
  if (s <= -0.5) return { txt: "Very negative", tone: "neg", cls: "text-neg" };
  if (s < -0.1) return { txt: "Negative", tone: "neg", cls: "text-neg" };
  if (s <= 0.1) return { txt: "Neutral", tone: "neu", cls: "text-neu" };
  if (s < 0.5) return { txt: "Positive", tone: "pos", cls: "text-pos" };
  return { txt: "Very positive", tone: "pos", cls: "text-pos" };
};

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
export const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
export const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const tierColor = (t: number) => (t === 1 ? "tier-1" : t === 2 ? "tier-2" : "tier-3");

/* --------- Range filtering --------- */
export type RangeKey = "Today" | "7 days" | "30 days" | "Custom";

export function rangeBounds(range: string, customStart?: string, customEnd?: string): { start: Date; end: Date; days: number } {
  const end = new Date(NOW);
  if (range === "Custom" && customStart && customEnd) {
    const s = new Date(customStart + "T00:00:00");
    const e = new Date(customEnd + "T23:59:59");
    const days = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (24 * 3600e3)));
    return { start: s, end: e, days };
  }
  const days = range === "7 days" ? 7 : range === "30 days" ? 30 : 1;
  const start = new Date(end.getTime() - days * 24 * 3600e3);
  // For "Today", anchor start at midnight of NOW
  if (range === "Today" || range !== "7 days" && range !== "30 days" && range !== "Custom") {
    const s = new Date(NOW);
    s.setHours(0, 0, 0, 0);
    return { start: s, end, days: 1 };
  }
  return { start, end, days };
}

export function inRange(c: Call, range: string, customStart?: string, customEnd?: string): boolean {
  const { start, end } = rangeBounds(range, customStart, customEnd);
  return c.time >= start && c.time <= end;
}

export function filterCalls(range: string, customStart?: string, customEnd?: string): Call[] {
  return CALLS.filter((c) => inRange(c, range, customStart, customEnd));
}

/** Group calls by calendar day. Returns array of { date, count, pos, neg, neu } from start..end inclusive. */
export function dailyBuckets(calls: Call[], range: string, customStart?: string, customEnd?: string) {
  const { start, days } = rangeBounds(range, customStart, customEnd);
  const out: { date: Date; key: string; count: number; pos: number; neg: number; neu: number }[] = [];
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(s.getTime() + i * 24 * 3600e3);
    out.push({ date: d, key: d.toISOString().slice(0, 10), count: 0, pos: 0, neg: 0, neu: 0 });
  }
  const map = new Map(out.map((b) => [b.key, b]));
  calls.forEach((c) => {
    const key = c.time.toISOString().slice(0, 10);
    const b = map.get(key);
    if (!b) return;
    b.count++;
    if (c.sent > 0.1) b.pos++;
    else if (c.sent < -0.1) b.neg++;
    else b.neu++;
  });
  return out;
}

/** Bucket calls by hour for a single-day range, by day otherwise. */
export function volumeBuckets(
  calls: Call[],
  range: string,
  customStart?: string,
  customEnd?: string,
) {
  const { days, start } = rangeBounds(range, customStart, customEnd);
  const out: { label: string; sub?: string; count: number; pos: number; neg: number; neu: number }[] = [];
  const tally = (b: (typeof out)[number], c: Call) => {
    b.count++;
    if (c.sent > 0.1) b.pos++;
    else if (c.sent < -0.1) b.neg++;
    else b.neu++;
  };
  if (days <= 1) {
    // Hourly buckets (24)
    for (let h = 0; h < 24; h++) {
      const hr12 = ((h + 11) % 12) + 1;
      const ampm = h < 12 ? "a" : "p";
      out.push({ label: `${hr12}${ampm}`, count: 0, pos: 0, neg: 0, neu: 0 });
    }
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const end = new Date(s.getTime() + 24 * 3600e3);
    calls.forEach((c) => {
      if (c.time < s || c.time >= end) return;
      tally(out[c.time.getHours()], c);
    });
    return out;
  }
  // Daily buckets
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const dayBuckets: { date: Date; b: (typeof out)[number] }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(s.getTime() + i * 24 * 3600e3);
    const b = {
      label: d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
      count: 0,
      pos: 0,
      neg: 0,
      neu: 0,
    };
    out.push(b);
    dayBuckets.push({ date: d, b });
  }
  const map = new Map(dayBuckets.map((x) => [x.date.toISOString().slice(0, 10), x.b]));
  calls.forEach((c) => {
    const b = map.get(c.time.toISOString().slice(0, 10));
    if (b) tally(b, c);
  });
  return out;
}
