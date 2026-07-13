import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1),
  snapshot: z.string().min(1),
});

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-2.5-flash");

    const systemPrompt = [
      "You are Milan's morning briefing assistant for Service Secure, an AI call-intelligence dashboard for a chauffeur/dispatch business.",
      "Answer concisely and directly, in a warm but professional tone. Use light markdown (short lists, bold for key numbers).",
      "Base your answers strictly on the JSON snapshot below. If a question can't be answered from it, say so briefly.",
      "Snapshot of the currently filtered range (JSON):",
      data.snapshot,
    ].join("\n\n");

    try {
      const { text } = await generateText({
        model,
        system: systemPrompt,
        messages: data.messages.map((m) => ({ role: m.role, content: m.content })),
      });
      return { text };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (/429/.test(msg)) {
        return { text: "I'm rate-limited right now — try again in a moment.", error: "rate_limited" as const };
      }
      if (/402/.test(msg)) {
        return { text: "AI credits are exhausted for this workspace.", error: "credits" as const };
      }
      return { text: `Sorry, I couldn't answer that. (${msg})`, error: "unknown" as const };
    }
  });
