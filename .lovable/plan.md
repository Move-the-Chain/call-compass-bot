## Goal

Bring back the earlier light two-pane Summary layout (assistant chat feed on the left, focus rail on the right) and evolve it so it feels like an assistant — named **Mila** — actually speaking to you, with an emphasized greeting and an optional audio briefing.

## Step 1 — Restore the prior draft

The cleanest restore is via History (my rebuild from memory keeps drifting). Once reverted to the two-pane version, I layer the changes below on top of it.

If you'd rather not revert, I'll reconstruct the same layout from the existing `SummaryWorkspace` / `ConversationFeed` / `FocusRail` files instead of restarting.

## Step 2 — Meet Mila (agent identity)

- Agent name: **Mila**. Small avatar mark (generated, not a Sparkles icon) shown next to every assistant message and in the greeting.
- One-line tagline under her name: "Your service intelligence assistant."
- Assistant messages render with no bubble background; user messages get a filled primary bubble (per chat UI contract).

## Step 3 — Emphasized greeting

Top of the left pane, before the chat:

- Large display heading: **"Good morning, Milan."** (time-of-day aware: morning/afternoon/evening)
- Sub-line in muted tone: "Mila here — I went through last night's calls."
- Then the briefing message (real numbers from `service-secure-data.ts`: 412 calls, 64% pos / 27% neg, 1 unmatched, Greenhill/Voss/Atlas standouts).
- Suggestion chips right below the briefing (fill composer, don't auto-send).
- Composer pinned at the bottom of the left pane.

## Step 4 — Voice briefing (read vs. listen)

A small control row sits on the briefing card:

- Toggle: **Read** / **Listen** (default Read).
- When Listen is selected: a play/pause button streams Mila reading the briefing aloud; a thin progress bar shows position. Toggling back to Read stops playback.
- Voice generated via Lovable AI TTS (`openai/gpt-4o-mini-tts`, voice `alloy`, SSE streaming, PCM). No file storage — streamed and played in-memory. Cached per-session so replaying the same briefing text doesn't re-bill.
- Server route: `src/routes/api/briefing-voice.ts` (POST `{ text }` → SSE audio stream). Uses `LOVABLE_API_KEY`; no client-side key exposure.

Out of scope for now: voice input (mic → Mila), full voice conversation on chat replies. Only the briefing has audio in this pass — happy to extend chat replies to audio next if you like it.

## Step 5 — Right pane (unchanged from prior draft)

Keep the "Focus for today" sticky rail with the aggregate count cards: calls to review, unmatched, open follow-ups, at-risk accounts, sentiment snapshot. Range selector (Today / 7d / 30d / Custom) drives both panes.

## Files

**Restored / reused from prior draft:**
`SummaryWorkspace.tsx`, `ConversationFeed.tsx`, `FocusRail.tsx`, `BriefingMessage.tsx`, `GreetingHeader.tsx`, `assistant.functions.ts`, `ai-gateway.server.ts`

**New / edited:**
- `GreetingHeader.tsx` — larger greeting, Mila intro line, avatar
- `BriefingMessage.tsx` — adds Read/Listen toggle + play control
- `src/components/service-secure/summary/BriefingAudio.tsx` — new, handles SSE PCM playback
- `src/routes/api/briefing-voice.ts` — new server route for TTS
- `src/assets/mila-avatar.png` — generated small avatar mark

**Not touched:** other routes, sidebar, backend tables, auth.

## Verification

Playwright at `/`: confirm the large greeting reads "Good morning, Milan." with Mila's intro; briefing shows real numbers; Read/Listen toggle appears and Listen starts audio (network shows `/api/briefing-voice` SSE); right rail cards render with real counts; composer sends and gets a reply.

## Open question (non-blocking)

Should chat replies from Mila also be listenable (a small speaker icon on each assistant message), or keep audio limited to the briefing for now?