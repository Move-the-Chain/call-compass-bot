
## Summary page — two-pane assistant (soft glassy modern)

Rebuild the Summary tab as a two-pane workspace matching the selected direction. Left = Claude/ChatGPT-style feed with greeting, AI briefing, suggestion chips, chat turns, and pinned composer. Right = sticky rail of aggregate "focus for today" cards. Nothing existing is deleted — the KPI numbers, "to review" queue, unmatched calls, follow-ups, and sentiment split all live inside the rail.

```text
┌──────────────────────────────────────────┬─────────────────────────┐
│  Good morning, Milan.                    │  FOCUS FOR TODAY        │
│  Wednesday · Jun 3                       │                         │
│                                          │  ┌───────────────────┐  │
│  ┌── Overnight briefing ──────────────┐  │  │ Calls to review   │  │
│  │ 412 calls · 64% positive ·        │  │  │ 12  ACTION REQ.   │  │
│  │ 27% negative · 1 unmatched.       │  │  │ · Greenhill       │  │
│  │ Standouts: Greenhill, Voss,       │  │  │ · Voss Pharma     │  │
│  │ Atlas Legal.                      │  │  │ · Atlas Legal     │  │
│  │ [chip] [chip] [chip]              │  │  │ +9 more →         │  │
│  └───────────────────────────────────┘  │  └───────────────────┘  │
│                                          │  ┌───────────────────┐  │
│  … chat turns scroll here …             │  │ 1 unmatched call  │  │
│                                          │  └───────────────────┘  │
│                                          │  ┌───────────────────┐  │
│  ┌── Composer ──────────────────────┐   │  │ Open follow-ups 3 │  │
│  │ Ask a follow-up…              ↵ │   │  └───────────────────┘  │
│  └──────────────────────────────────┘   │  ┌───────────────────┐  │
│                                          │  │ At-risk accts   2 │  │
│                                          │  └───────────────────┘  │
│                                          │  ┌───────────────────┐  │
│                                          │  │ Sentiment (dark)  │  │
│                                          │  └───────────────────┘  │
└──────────────────────────────────────────┴─────────────────────────┘
```

### Visual direction
Copy the selected prototype's tokens verbatim:
- Page bg: `#f8fafc` with two soft radial gradients top-left and top-right.
- Left pane: `bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl`.
- Briefing card: `bg-white/60 backdrop-blur-md border border-white rounded-2xl` with a `w-2 h-6 bg-blue-500 rounded-full` accent bar next to the "Overnight briefing" label.
- Suggestion chips: `bg-white border border-slate-200 rounded-full`, hover `border-blue-400`.
- User bubble: `bg-white/80 rounded-2xl rounded-tl-none`. Assistant: `bg-blue-50/50 border border-blue-100 rounded-2xl rounded-tl-none` with markdown.
- Composer: `bg-white/90 backdrop-blur-md rounded-2xl shadow-lg`, submit `bg-slate-900 text-white rounded-xl`.
- Right rail cards: `bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl`, tinted variants for unmatched (amber) / at-risk (rose), and one dark `bg-slate-900` sentiment card at the bottom with 3 bars.
- Inter font (already loaded globally). Colored spans in the briefing use `text-emerald-600` / `text-rose-600` / `text-amber-600` / rose underline decoration.
- Only Tailwind `backdrop-blur-*` utilities; no hand-written `-webkit-backdrop-filter`.

### Left pane behavior
- Greeting: "Good morning, Milan." + today's date from `NOW` in `service-secure-data.ts` (Wed · Jun 3, 2026).
- Briefing is always the first turn, pinned at top, scrolls with the thread. It's built from real filtered data — the total, positive %, negative %, unmatched count, and the top 3 "to review" account names come from `filterCalls()` / the existing "to review" derivation, not the placeholder numbers in the prototype.
- Four suggestion chips: "Why is Greenhill unhappy?", "Show all negative calls today", "Chart sentiment last 7 days", "Compare agent performance". Clicking fills the composer, does not auto-send.
- Chat turns render below with `message.parts` rendering; markdown supported via `react-markdown` (already common). User right-aligned bubble, assistant left-aligned plain-ish bubble with the blue tint.
- Composer pinned at bottom of the left pane. Textarea, Enter sends, Shift+Enter newline, autofocus on load / after send. Disabled while `status` is `submitted | streaming`.
- Chat history: in-memory only for this design pass (no persistence, no threads).

### Right pane cards
All counts derive from existing helpers in `src/lib/service-secure-data.ts`:
1. **Calls to review** — headline count = length of the "to review" list for the current range (currently 3 today, 12 over 7 days depending on selector). Lists top 3 client names + "+N more →" linking to the existing Call Explorer.
2. **Unmatched call** — count of `flag === "unmatched"` in range. Amber tint. "Link now" CTA.
3. **Open follow-ups** — count of `follow === "Needs follow-up"` in range.
4. **At-risk accounts** — distinct accounts with a very-negative call in range (tier chip inline). Rose tint.
5. **Sentiment snapshot** — dark card with 3 bars (pos / neu / neg) heights = actual % from `filterCalls`.

Range selector (Today / 7 / 30 / Custom) + "Download CSV" sit above the rail as a small header row, driving both panes.

### Data & AI
- Numbers/lists come only from existing helpers — no new data sources or tables.
- Chat backend: new `askAssistant` server function in `src/lib/assistant.functions.ts` using the AI SDK + Lovable AI Gateway helper (`createLovableAiGatewayProvider` from `@/lib/ai-gateway.server`). Model: `google/gemini-3.5-flash`. System prompt is a compact JSON snapshot of the current filtered range (totals, top negative calls with summary/handler/timestamp, top accounts) so the model can answer "why is Greenhill unhappy?" without tool calls. One-shot response (no streaming this pass), rendered as markdown.
- If `LOVABLE_API_KEY` is missing at build time, use `ai_gateway--create` to provision it.
- Also add `src/lib/ai-gateway.server.ts` (gateway provider helper) if it doesn't already exist.

### Files

**New**
- `src/components/service-secure/summary/GreetingHeader.tsx`
- `src/components/service-secure/summary/BriefingMessage.tsx` — briefing card + suggestion chips
- `src/components/service-secure/summary/ConversationFeed.tsx` — transcript + composer (AI Elements `Conversation`, `Message`, `MessageResponse`, `PromptInput` where they fit; if AI Elements don't match the glass aesthetic cleanly, wrap them for style, do not replace)
- `src/components/service-secure/summary/FocusRail.tsx` — 5 cards
- `src/components/service-secure/summary/SummaryWorkspace.tsx` — two-column layout, owns range state + chat state
- `src/lib/assistant.functions.ts` — `askAssistant` server function
- `src/lib/ai-gateway.server.ts` — Lovable AI Gateway provider helper (if not present)

**Edited**
- `src/components/service-secure/ServiceSecureApp.tsx` — on the Summary tab, replace the current KPI-tile grid + "To review / Sentiment" tabs with `<SummaryWorkspace />`. Other tabs (Call Explorer, Agent Scorecards, Account Health, etc.) untouched.
- `src/routes/__root.tsx` — no font change (Inter is close enough via existing Manrope/Sora; keep current fonts to avoid drift).

**Packages**
- `ai`, `@ai-sdk/react`, `@ai-sdk/openai-compatible`, `zod`, `react-markdown` (add whichever are missing).

### Out of scope
- Persisting chat history across reloads.
- Streaming responses, tool calls, or chart generation inside chat.
- Redesigning other routes, sidebar, or auth.
- New backend tables.

### Verification
Playwright at `/`: confirm greeting renders, briefing card shows real numbers (412 / 64% / 27% / 1 for the current seed), right rail shows 5 cards with correct counts, typing in the composer + Enter appends a user turn and an assistant reply rendered as markdown, and switching range selector updates both panes.
