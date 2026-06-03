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
const SEED: Omit<Call, "id" | "time">[] = [
  { acct: "Greenhill Capital", agent: "Tomas Vidal", topic: "Late pickup", sent: -0.82, dur: 521, flag: "at-risk", match: "phone", from: "+1 212 555 0148", caller: "David Chen", callerRole: "Exec Assistant", callerKnown: true, passenger: "Mr. Okafor (CFO)", summary: "Repeat caller. Driver 40 min late to a 5:00 AM airport run; exec missed an earlier check-in. Threatened to move the corporate account. No recovery offered on the call.", follow: "Needs follow-up", h: 11 },
  { acct: "Voss Pharma", agent: "Priya Nair", topic: "Driver behavior", sent: -0.71, dur: 362, flag: "negative", match: "phone", from: "+1 617 555 0210", caller: "Sarah Lindqvist", callerRole: "Office Manager", callerKnown: true, passenger: "Self", summary: "Passenger reported the driver was on a personal call most of the ride and took a longer route. Calm but firm. Asked for a different driver next time.", follow: "Needs follow-up", h: 9 },
  { acct: "Meridian Bank", agent: "Marcus Reed", topic: "Praise", sent: 0.88, dur: 134, flag: "positive", match: "phone", from: "+1 212 555 0455", caller: "James Okonkwo", callerRole: "Travel Coordinator", callerKnown: true, passenger: "Ms. Reyes (MD)", summary: "Praised driver (unit 21) for a smooth last-minute multi-stop. Wants the same driver on a recurring exec route.", follow: "Resolved", h: 6 },
  { acct: "Atlas Legal", agent: "Lena Cho", topic: "Billing dispute", sent: -0.34, dur: 687, flag: "negative", match: "phone", from: "+1 312 555 0733", caller: "Robert Vance", callerRole: "Accounts Payable", callerKnown: true, passenger: "N/A (billing call)", summary: "Dispute over a wait-time surcharge. Tense but not hostile. Billing team to review and call back.", follow: "Needs follow-up", h: 7 },
  { acct: "Kessler Group", agent: "Ravi Patel", topic: "New booking", sent: 0.31, dur: 290, flag: "neutral", match: "phone", from: "+1 408 555 0911", caller: "Amy Tran", callerRole: "Exec Assistant", callerKnown: true, passenger: "Mr. Kessler", summary: "Booked three airport transfers next week. Mentioned they're comparing vendors on price.", follow: "-", h: 5 },
  { acct: "Greenhill Capital", agent: "Lena Cho", topic: "Route change", sent: 0.12, dur: 189, flag: "neutral", match: "phone", from: "+1 212 555 0149", caller: "David Chen", callerRole: "Exec Assistant", callerKnown: true, passenger: "Mr. Okafor (CFO)", summary: "Mid-trip route change handled smoothly.", follow: "-", h: 4 },
  { acct: null, agent: "Tomas Vidal", topic: "New booking", sent: -0.05, dur: 240, flag: "unmatched", match: "none", from: "+1 646 555 0182", caller: "David", callerRole: "unknown", callerKnown: false, passenger: "unclear", summary: "Caller said 'this is David from the Hartwell account' but number is unknown and no Hartwell client on file. Needs a human to confirm and link.", follow: "Needs match", h: 2 },
  { acct: "Voss Pharma", agent: "Marcus Reed", topic: "VIP airport", sent: 0.64, dur: 333, flag: "positive", match: "name", from: "+1 617 555 0299", caller: "Nina Patel", callerRole: "new contact", callerKnown: false, passenger: "Dr. Halvorsen", summary: "Coordinated a VIP meet-and-greet. Matched by name (new number, auto-linked, pending confirm). Appreciated proactive flight tracking.", follow: "Resolved", h: 3 },
];

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

export const tierColor = (t: number) => (t === 1 ? "tier-1" : t === 2 ? "tier-2" : "tier-3");
