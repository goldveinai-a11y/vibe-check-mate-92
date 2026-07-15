import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Send, Sparkles, Lock } from "lucide-react";
import { getChatMessages, sendChatMessage, type ChatMessage } from "@/lib/vibecheck.functions";

// The chat API (Claude) writes plain markdown — **bold**, and \n\n between
// paragraphs — but this box was rendering m.content as a raw string, so
// replies came out with literal asterisks ("Your **interest score is
// 78**…") instead of bold text. Minimal parser, not a full markdown lib:
// just the two things the model actually uses here.
function renderChatMarkdown(content: string) {
  const paragraphs = content.split(/\n{2,}/);
  return paragraphs.map((para, pi) => (
    <p key={pi} className={pi > 0 ? "mt-2" : undefined}>
      {para.split(/(\*\*[^*]+\*\*)/g).map((chunk, ci) =>
        chunk.startsWith("**") && chunk.endsWith("**") ? (
          <strong key={ci}>{chunk.slice(2, -2)}</strong>
        ) : (
          <span key={ci}>{chunk}</span>
        ),
      )}
    </p>
  ));
}

export type ReportChatContext = {
  hasRedFlags: boolean;
  trajectory: "rising" | "steady" | "cooling" | "nose-diving";
  delusionScore: number;
  hasSuggestedReplies: boolean;
};

type QuickChip = { emoji: string; label: string; question: string; prefill?: boolean };

// Base chips are always relevant regardless of what this specific report
// contains. Conditional chips only surface when the underlying report data
// actually supports the question - no point offering "is this a red flag"
// on a report with zero red flags. Modeled on Lucen's persistent,
// emoji-led suggestion-chip strip (shown after every reply, not just once
// before the first message), but the content is grounded in VibeCheck's
// own report fields instead of a static, generic list.
function buildQuickChips(ctx?: ReportChatContext): QuickChip[] {
  const chips: QuickChip[] = [];

  // prefill (not auto-send): the old version fired a generic "suggest a
  // reply" question with no message to reply to, so the model could only
  // guess at context already in the report. Prefilling instead lets the
  // user paste the actual message they received, so the suggestion is for
  // THAT message - not a generic one. See buildSystemPrompt in
  // vibecheck-chat.server.ts for the matching "2-3 distinct tones" instruction.
  if (ctx?.hasSuggestedReplies) {
    chips.push({
      emoji: "💬",
      label: "Suggest a reply",
      question: "Suggest 2-3 different ways I could reply to this message they just sent me: ",
      prefill: true,
    });
  }
  chips.push({ emoji: "❤️", label: "Do they like me?", question: "Based on my scores, do they actually like me?" });
  chips.push({ emoji: "🤔", label: "Am I overthinking?", question: "Am I overthinking this, or is my read fair?" });

  if (ctx?.hasRedFlags) {
    chips.push({ emoji: "🚩", label: "Is this a red flag?", question: "Is this actually a red flag, or am I overreacting?" });
  }
  if (ctx && (ctx.trajectory === "cooling" || ctx.trajectory === "nose-diving")) {
    chips.push({ emoji: "📉", label: "Why is it fading?", question: "Why is my Vibe Decay Trajectory going down?" });
  }
  if (ctx && ctx.delusionScore >= 60) {
    chips.push({ emoji: "😅", label: "Am I delusional?", question: "Be honest - is my Delusion Level score fair?" });
  }

  chips.push({ emoji: "🔮", label: "What happens next?", question: "Where is this heading, based on my Future Outlook?" });
  chips.push({ emoji: "🆘", label: "I'm spiraling, help", question: "I'm spiraling a bit - give me the honest, grounded read." });

  return chips;
}

export function ReportChat({
  analysisId,
  ownerAnonId,
  context,
}: {
  analysisId: string;
  ownerAnonId: string;
  context?: ReportChatContext;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [limit, setLimit] = useState(20);
  // "monthly"/"yearly" is marketed as "Unlimited AI chat" on the paywall
  // (see paywall.$id.tsx TIERS copy) - there IS still a 100/report safety-net
  // cap under the hood (see chatLimitForPlan in vibecheck-chat.server.ts),
  // but showing a countdown to a subscriber who was sold "unlimited"
  // undercuts that promise for no product reason. So plan drives two
  // separate things below: the cap itself (server-enforced, unconditional)
  // and whether the UI ever surfaces a number to the user (single tier
  // only - that's also the only tier where hitting the cap should prompt
  // an upgrade, since monthly/yearly are already the upgrade).
  const [plan, setPlan] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const quickChips = buildQuickChips(context);

  const historyQuery = useQuery({
    queryKey: ["report-chat", analysisId, ownerAnonId],
    queryFn: () => getChatMessages({ data: { id: analysisId, ownerAnonId } }),
    enabled: !!ownerAnonId,
  });

  useEffect(() => {
    if (historyQuery.data && !hydrated) {
      setMessages(historyQuery.data.messages);
      setLimit(historyQuery.data.limit);
      setPlan(historyQuery.data.plan);
      setHydrated(true);
    }
  }, [historyQuery.data, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // The input was a single-line pill <input> - fine for a short typed
  // question, but the "Suggest a reply" quick chip prefills a long
  // sentence (see buildQuickChips) that the user is meant to extend with
  // the pasted message. On a single line that text just scrolls sideways
  // instead of wrapping, so people couldn't see what they were about to
  // send and hit Send on an incomplete/empty paste without realizing it.
  // Auto-growing textarea so the full draft is always visible before
  // sending, capped so a very long paste scrolls internally instead of
  // pushing the send button and page around.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const isUnlimitedPlan = plan === "monthly" || plan === "yearly";
  const questionsUsed = Math.ceil(messages.length / 2);
  const remaining = Math.max(0, limit - questionsUsed);
  const atLimit = remaining <= 0 && hydrated;

  const mutation = useMutation({
    mutationFn: (question: string) => sendChatMessage({ data: { id: analysisId, ownerAnonId, message: question } }),
    onMutate: (question: string) => {
      setMessages((cur) => [...cur, { role: "user", content: question, createdAt: new Date().toISOString() }]);
    },
    onSuccess: (result) => {
      if ("error" in result) return;
      setMessages((cur) => [...cur, { role: "assistant", content: result.reply, createdAt: new Date().toISOString() }]);
    },
  });

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || mutation.isPending || atLimit) return;
    setInput("");
    mutation.mutate(trimmed);
  };

  const errorResult = mutation.data && "error" in mutation.data ? mutation.data.error : null;

  const handleChipClick = (chip: QuickChip) => {
    if (chip.prefill) {
      setInput(chip.question);
      inputRef.current?.focus();
      return;
    }
    handleSend(chip.question);
  };

  return (
    // Visual accent (gradient + thicker border + stronger shadow) was added
    // in 4a68f86 to make this card stand out from the plain white
    // ReportSection cards around it - this is the featured, paid-differentiating
    // feature on the report page, not just another section. That accent got
    // silently reset to a plain card in acd3019's full-file rewrite (same
    // failure mode that dropped the chat counter - a full rewrite recreating
    // markup from scratch instead of diffing). Restoring it here.
    <div className="relative overflow-hidden rounded-3xl border-2 border-purple/25 bg-gradient-to-br from-purple-soft/50 via-card to-pink-soft/30 p-5 shadow-md sm:p-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-soft text-purple-deep">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-serif text-xl sm:text-2xl">Ask About Your Report</h2>
          <p className="text-xs text-ink/50">
            {!hydrated
              ? "Loading…"
              : isUnlimitedPlan
                ? "Unlimited questions with Premium"
                : `${remaining} question${remaining === 1 ? "" : "s"} left on this report`}
          </p>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="mt-5 max-h-96 space-y-3 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user" ? "bg-pink text-white" : "bg-muted/60 text-ink/85"
                  }`}
                >
                  {m.role === "assistant" ? renderChatMarkdown(m.content) : m.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {mutation.isPending && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-muted/60 px-4 py-2.5 text-sm text-ink/50">Thinking…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* limit_reached messaging branches by plan:
          - Single: this IS the intended upsell moment - the whole point of
            capping this tier at 10 is to make "unlimited AI chat" a real
            reason to upgrade, so show the count plus a direct CTA to the
            paywall (monthly/yearly plans).
          - Monthly/Yearly: this only fires if someone somehow burns through
            the 100-message safety net in one report - a real edge case, not
            a marketed limit. No number, no upgrade pitch (they're already on
            the top tier) - just a soft "try again later" so "Unlimited"
            never reads as a lie. */}
      {errorResult === "limit_reached" && !isUnlimitedPlan && (
        <div className="mt-4 rounded-2xl bg-pink-soft p-4 text-center">
          <p className="text-xs text-ink/70">
            You've used all {limit} questions on this report - Single Report includes {limit}, Premium gets unlimited.
          </p>
          <Link
            to="/paywall/$id"
            params={{ id: analysisId }}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-pink px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:opacity-90"
          >
            <Lock className="h-3.5 w-3.5" />
            Upgrade for unlimited AI chat
          </Link>
        </div>
      )}
      {errorResult === "limit_reached" && isUnlimitedPlan && (
        <p className="mt-4 rounded-2xl bg-muted/50 p-3 text-center text-xs text-ink/60">
          You've hit today's chat limit for this report - give it a bit and try again.
        </p>
      )}
      {errorResult && errorResult !== "limit_reached" && errorResult !== "locked" && (
        <p className="mt-4 rounded-2xl bg-destructive/10 p-3 text-center text-xs text-destructive">
          Something went wrong — try again in a moment.
        </p>
      )}

      {/* Quick-suggestion chips: shown after every response (not just once
          before the first message like the old QUICK_QUESTIONS list), as a
          horizontally-scrollable emoji-chip strip — same interaction
          pattern as Lucen's suggestion row, but content is dynamic per
          report via buildQuickChips(). */}
      {!atLimit && hydrated && (
        <div className="mt-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {quickChips.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleChipClick(chip)}
              disabled={mutation.isPending}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border/60 bg-muted/40 px-4 py-2 text-xs text-ink/75 transition hover:bg-muted disabled:opacity-50"
            >
              <span aria-hidden="true">{chip.emoji}</span>
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {!atLimit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="mt-4 flex items-end gap-2"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Ask something about your report…"
            maxLength={400}
            rows={1}
            disabled={mutation.isPending || !hydrated}
            className="max-h-40 w-full min-w-0 resize-none overflow-y-auto rounded-2xl border border-border bg-cream px-4 py-2.5 text-sm leading-relaxed outline-none transition focus:border-pink disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={mutation.isPending || !hydrated || !input.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pink text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}
