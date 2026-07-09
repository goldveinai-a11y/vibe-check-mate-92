import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
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

const QUICK_QUESTIONS = [
  "Why did my Interest Score end up this way?",
  "Is this actually a red flag, or am I overthinking it?",
  "What does my attachment style prediction mean?",
];

export function ReportChat({ analysisId, ownerAnonId }: { analysisId: string; ownerAnonId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [limit, setLimit] = useState(20);
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const historyQuery = useQuery({
    queryKey: ["report-chat", analysisId, ownerAnonId],
    queryFn: () => getChatMessages({ data: { id: analysisId, ownerAnonId } }),
    enabled: !!ownerAnonId,
  });

  useEffect(() => {
    if (historyQuery.data && !hydrated) {
      setMessages(historyQuery.data.messages);
      setLimit(historyQuery.data.limit);
      setHydrated(true);
    }
  }, [historyQuery.data, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

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

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-soft text-purple-deep">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-serif text-xl sm:text-2xl">Ask About Your Report</h2>
          <p className="text-xs text-ink/50">{hydrated ? `${remaining} question${remaining === 1 ? "" : "s"} left on this report` : "Loading…"}</p>
        </div>
      </div>

      {messages.length === 0 && hydrated && (
        <div className="mt-5 flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              disabled={mutation.isPending || atLimit}
              className="rounded-full border border-border/60 bg-muted/40 px-4 py-2 text-left text-xs text-ink/75 transition hover:bg-muted disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

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

      {errorResult === "limit_reached" && (
        <p className="mt-4 rounded-2xl bg-muted/50 p-3 text-center text-xs text-ink/60">
          You've used all {limit} questions on this report.
        </p>
      )}
      {errorResult && errorResult !== "limit_reached" && errorResult !== "locked" && (
        <p className="mt-4 rounded-2xl bg-destructive/10 p-3 text-center text-xs text-destructive">
          Something went wrong — try again in a moment.
        </p>
      )}

      {!atLimit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="mt-4 flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something about your report…"
            maxLength={400}
            disabled={mutation.isPending || !hydrated}
            className="w-full min-w-0 rounded-full border border-border bg-cream px-4 py-2.5 text-sm outline-none transition focus:border-pink disabled:opacity-60"
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
