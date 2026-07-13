import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import { useServerFn } from "@tanstack/react-start";
import { Send } from "lucide-react";
import { askAssistant } from "@/lib/assistant.functions";
import { BriefingMessage } from "./BriefingMessage";

export type ChatTurn = { role: "user" | "assistant"; content: string };

type Props = {
  briefing: {
    total: number;
    posPct: number;
    negPct: number;
    unmatched: number;
    standouts: string[];
  };
  suggestions: string[];
  snapshot: string;
};

export function ConversationFeed({ briefing, suggestions, snapshot }: Props) {
  const ask = useServerFn(askAssistant);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    composerRef.current?.focus();
  }, []);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, pending]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    const next: ChatTurn[] = [...turns, { role: "user", content: trimmed }];
    setTurns(next);
    setInput("");
    setPending(true);
    try {
      const res = await ask({ data: { messages: next, snapshot } });
      setTurns((prev) => [...prev, { role: "assistant", content: res.text }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setTurns((prev) => [...prev, { role: "assistant", content: `Sorry — ${msg}` }]);
    } finally {
      setPending(false);
      requestAnimationFrame(() => composerRef.current?.focus());
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-140px)] min-h-[600px] flex-1 flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/40 shadow-2xl backdrop-blur-xl">
      <div className="flex-1 space-y-10 overflow-y-auto p-10">
        <BriefingMessage
          {...briefing}
          suggestions={suggestions}
          onSuggest={(s) => {
            setInput(s);
            composerRef.current?.focus();
          }}
        />

        {turns.map((t, i) => (
          <ChatBubble key={i} turn={t} />
        ))}

        {pending && (
          <div className="flex gap-4">
            <div className="h-8 w-8 flex-shrink-0 rounded-full bg-blue-600" />
            <div className="rounded-2xl rounded-tl-none border border-blue-100 bg-blue-50/50 px-5 py-4 text-slate-500">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
              </span>
            </div>
          </div>
        )}

        <div ref={feedEndRef} />
      </div>

      <div className="bg-gradient-to-t from-white/80 to-transparent p-6">
        <div className="relative flex items-center">
          <textarea
            ref={composerRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={pending}
            rows={2}
            placeholder="Ask a follow-up or request a chart..."
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white/90 p-4 pr-28 text-slate-800 shadow-lg backdrop-blur-md transition-all placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void send(input)}
            disabled={pending || !input.trim()}
            className="absolute right-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ turn }: { turn: ChatTurn }) {
  if (turn.role === "user") {
    return (
      <div className="flex justify-end gap-4">
        <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-slate-900 px-5 py-3 text-white shadow-sm">
          {turn.content}
        </div>
        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-slate-200" />
      </div>
    );
  }
  return (
    <div className="flex gap-4">
      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-blue-600" />
      <div className="prose prose-sm max-w-[85%] rounded-2xl rounded-tl-none border border-blue-100 bg-blue-50/50 px-5 py-4 text-slate-700 [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_strong]:text-slate-900">
        <ReactMarkdown>{turn.content}</ReactMarkdown>
      </div>
    </div>
  );
}
