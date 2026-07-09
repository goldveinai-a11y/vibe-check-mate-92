import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { getChatMessages, sendChatMessage, type ChatMessage } from "@/lib/vibecheck.functions";

const STARTERS = [
  "why is my interest score what it is?",
  "what should i actually do next?",
  "are the red flags dealbreakers?",
];

type Props = { analysisId: string; ownerAnonId: string };

// The chat API (Claude) writes plain markdown — **bold**, and \n\n between
// paragraphs — but replies were rendered as a raw string, so answers came
// out with literal asterisks ("Your **interest score is 78**…") instead of
// bold text. Minimal parser, not a full markdown lib: just the two things
// the model actually uses here.
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

export function ReportChat({ analysisId, ownerAnonId }: Props) {
  const qc = useQueryClient();
  const queryKey = ["report-chat", analysisId, ownerAnonId] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getChatMessages({ data: { id: analysisId, ownerAnonId } }),
  });

  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ChatMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = data?.messages ?? [];
  const limit = data?.limit ?? 10;
  const locked = data?.locked ?? false;
  const used = Math.ceil(messages.length / 2) + (pending ? 1 : 0);
  const remaining = Math.max(0, limit - used);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending]);

  const mutation = useMutation({
    mutationFn: (message: string) =>
      sendChatMessage({ data: { id: analysisId, ownerAnonId, message } }),
    onMutate: (message) => {
      setError(null);
      setPending({ role: "user", content: message, createdAt: new Date().toISOString() });
    },
    onSettled: () => setPending(null),
    onSuccess: (res) => {
      if ("error" in res) {
        if (res.error === "limit_reached") setError("You've hit the fair-use limit on this report — try again shortly.");
        else if (res.error === "locked") setError("Unlock the full report to chat.");
        else setError(res.error || "Chat failed. Try again.");
        return;
      }
      qc.invalidateQueries({ queryKey });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Chat failed. Try again."),
  });

  if (locked || isLoading) return null;

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || mutation.isPending || remaining <= 0) return;
    mutation.mutate(trimmed);
    setInput("");
  };

  return (
    <section className="mt-12 rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-purple-soft">
          <MessageCircle className="h-5 w-5 text-purple-deep" aria-hidden />
        </div>
        <div>
          {/* Was "Ask the report" — read as talking to a static document
              rather than an AI, per live user feedback. Also dropped the
              "X of N left" counter that used to sit up here: the paywall
              sells this as unlimited AI chat on monthly/annual plans, so
              surfacing a running countdown contradicted that promise. The
              underlying `remaining` gate still exists as a fair-use safety
              net (see the limit_reached branch below) — it's just no longer
              flaunted as a number up front. */}
          <h3 className="font-serif text-2xl leading-tight">Ask the AI Analyst</h3>
          <p className="mt-1 text-sm text-ink/60">
            Follow-up questions, grounded in your data.
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mt-6 flex max-h-[420px] min-h-[120px] flex-col gap-3 overflow-y-auto pr-1"
      >
        {messages.length === 0 && !pending && (
          <div className="text-sm text-ink/60">
            Ask anything about this report — scores, flags, patterns, next moves.
          </div>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {pending && <Bubble role="user" content={pending.content} />}
        {mutation.isPending && (
          <div className="max-w-[80%] self-start rounded-2xl bg-purple-soft/60 px-4 py-2 text-sm text-ink/70">
            <span className="inline-flex gap-1">
              <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
            </span>
          </div>
        )}
      </div>

      {messages.length === 0 && !pending && (
        <div className="mt-4 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setInput(s)}
              className="rounded-full border border-border/70 bg-cream px-3 py-1.5 text-xs text-ink/80 transition hover:bg-purple-soft/60"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-4 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          maxLength={400}
          rows={1}
          placeholder={remaining <= 0 ? "You've hit the fair-use limit for now." : "Ask a follow-up…"}
          disabled={mutation.isPending || remaining <= 0}
          className="min-h-[44px] flex-1 resize-none rounded-2xl border border-border/60 bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-purple-deep focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={mutation.isPending || remaining <= 0 || !input.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-pink text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </form>

      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </section>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  if (role === "user") {
    return (
      <div className="max-w-[85%] self-end rounded-2xl bg-pink px-4 py-2 text-sm text-white shadow-sm">
        {content}
      </div>
    );
  }
  return (
    <div className="max-w-[85%] self-start rounded-2xl bg-purple-soft/60 px-4 py-2 text-sm text-ink">
      {renderChatMarkdown(content)}
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-ink/50"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}
