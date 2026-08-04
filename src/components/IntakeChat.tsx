import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, ArrowUp, ImagePlus, X, AlertCircle, Loader2 } from "lucide-react";
import { getAnonId } from "@/lib/anon-id";
import { trackEvent } from "@/lib/analytics";

// Mirrored locally rather than imported from intake.server.ts. It's a
// type-only import so it would almost certainly be erased — but "almost
// certainly" isn't the standard for a module that reads
// process.env.ANTHROPIC_API_KEY. Duplicating twelve optional strings is the
// cheaper side of that trade.
type IntakeSlots = {
  situation?: string;
  relationship?: string;
  duration?: string;
  whoTextsFirst?: string;
  replySpeed?: string;
  frustration?: string;
  theirName?: string;
  specificIncident?: string;
  herReaction?: string;
  afterConflict?: string;
  realQuestion?: string;
  pastedMessages?: string;
};

// The real intake chat.
//
// What was here before was a chat-shaped decoration: an AI bubble, three
// canned reply chips, and a text box — all of which navigated to a
// six-question form. It looked like a conversation and wasn't one, which is
// worse than an honest form, because the first thing the product did was
// make a promise it broke two seconds later.
//
// This is the conversation. She can type anything, paste an entire argument,
// attach screenshots at any point, answer in one word or five sentences. The
// model leads and adapts. The structure that the seven scores depend on is
// carried invisibly in the slot list (see intake.server.ts) rather than
// imposed as a form.
//
// Three input methods are advertised on the landing page — talk, paste,
// screenshot — and all three land here in the same box.

type Msg = { role: "user" | "assistant"; content: string };
type Pending = { file: File; url: string };

const OPENER =
  "What's going on? Tell me as much or as little as you want — or paste the messages and I'll read them myself.";

async function fileToBase64(file: File): Promise<{ mediaType: string; base64: string }> {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return { mediaType: file.type, base64: btoa(binary) };
}

export function IntakeChat({ seed, onStarted }: { seed?: string; onStarted?: () => void }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: OPENER }]);
  const [slots, setSlots] = useState<IntakeSlots>({});
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);
  const [handingOff, setHandingOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safety, setSafety] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  // A reply tapped on the landing hero before this component mounted gets
  // replayed as her first message, so tapping "I walk on eggshells" reads
  // as having said it rather than as having picked it off a menu.
  useEffect(() => {
    if (seed && !seededRef.current) {
      seededRef.current = true;
      void send(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const handOff = async (finalSlots: IntakeSlots, images: Array<{ mediaType: string; base64: string }>) => {
    setHandingOff(true);
    try {
      const { createAnalysis, runAnalysis } = await import("@/lib/vibecheck.functions");
      const anonId = getAnonId();
      const created = await createAnalysis({ data: { ownerAnonId: anonId } });

      const quiz = {
        situation: finalSlots.situation ?? "not stated",
        relationship: finalSlots.relationship ?? "not stated",
        duration: finalSlots.duration ?? "not stated",
        whoTextsFirst: finalSlots.whoTextsFirst ?? "not stated",
        replySpeed: finalSlots.replySpeed ?? "not stated",
        frustration: finalSlots.frustration,
        theirName: finalSlots.theirName,
        specificIncident: finalSlots.specificIncident,
        herReaction: finalSlots.herReaction,
        afterConflict: finalSlots.afterConflict,
        realQuestion: finalSlots.realQuestion,
        pastedMessages: finalSlots.pastedMessages,
      };

      // Fired WITHOUT await, exactly like the old quiz handoff: the read
      // takes 40-90s and holding the request open for it is what used to
      // make half of all analyses look like failures.
      void runAnalysis({
        data: { id: created.id, ownerAnonId: anonId, quiz, images: images.length ? images : undefined },
      }).catch(() => {});

      trackEvent("intake_completed", {
        turns: messages.filter((m) => m.role === "user").length,
        with_screenshots: images.length > 0,
        pasted: Boolean(finalSlots.pastedMessages),
      });

      void navigate({ to: "/analyzing/$id", params: { id: created.id } });
    } catch (err) {
      setHandingOff(false);
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.toLowerCase().includes("limit")
          ? "You've used your free reads on this device."
          : "Couldn't start the read. Try again in a moment.",
      );
    }
  };

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if ((!text && pending.length === 0) || busy) return;

    if (messages.filter((m) => m.role === "user").length === 0) onStarted?.();

    const images = await Promise.all(pending.map((p) => fileToBase64(p.file)));
    const shown = text || (images.length === 1 ? "📎 screenshot" : `📎 ${images.length} screenshots`);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: shown }]);
    setInput("");
    pending.forEach((p) => URL.revokeObjectURL(p.url));
    setPending([]);
    setBusy(true);
    setError(null);

    try {
      const { intakeTurn } = await import("@/lib/vibecheck.functions");
      const res = await intakeTurn({
        data: { history, message: text, slots, images: images.length ? images : undefined },
      });

      setSlots(res.slots);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);

      if (res.safetyConcern) {
        setSafety(true);
        trackEvent("intake_safety_triggered", {});
        return;
      }
      if (res.ready) {
        // Let her read the closing line before the screen changes.
        setTimeout(() => void handOff(res.slots, images), 1600);
      }
    } catch {
      setError("That didn't send. Try again.");
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send();
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 6 - pending.length)
      .map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPending((p) => [...p, ...next]);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg">
      <div className="flex items-center gap-2.5 border-b border-border/50 px-5 py-3.5">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-soft">
          <Sparkles className="h-4 w-4 text-purple-deep" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight text-ink">VibeCheck</p>
          <p className="text-xs leading-tight text-ink/50">Reads the pattern, not your mood</p>
        </div>
      </div>

      <div className="max-h-[52vh] min-h-[280px] space-y-3 overflow-y-auto px-5 py-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-pink px-4 py-2.5 text-sm leading-relaxed text-white"
                : "w-fit max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-muted/60 px-4 py-2.5 text-sm leading-relaxed text-ink/85"
            }
          >
            {m.content}
          </div>
        ))}

        {(busy || handingOff) && (
          <div className="flex w-fit items-center gap-2 rounded-2xl rounded-bl-md bg-muted/60 px-4 py-3">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40" />
          </div>
        )}

        {safety && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              This is past what I'm for
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">
              A domestic abuse helpline in your country can actually help with this. I read conversations — that's
              not the same thing, and pretending otherwise would waste your time.
            </p>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
        <div ref={endRef} />
      </div>

      {!safety && (
        <form onSubmit={onSubmit} className="border-t border-border/50 px-4 py-3">
          {pending.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-2">
              {pending.map((p, i) => (
                <div key={p.url} className="relative">
                  <img src={p.url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(p.url);
                      setPending((prev) => prev.filter((_, j) => j !== i));
                    }}
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-white"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy || handingOff || pending.length >= 6}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink/50 transition hover:bg-muted hover:text-ink disabled:opacity-40"
              aria-label="Attach screenshots"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              maxLength={1500}
              disabled={handingOff}
              placeholder="Type, or paste the messages…"
              className="max-h-32 min-h-[40px] flex-1 resize-none rounded-2xl border border-border/60 bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-pink/40 focus:outline-none"
            />

            <button
              type="submit"
              disabled={(!input.trim() && pending.length === 0) || busy || handingOff}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pink text-white transition disabled:opacity-30"
              aria-label="Send"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>

          <p className="mt-2 text-center text-[11px] text-ink/40">
            Screenshots are read once, then deleted. Nothing is ever sent to anyone.
          </p>
        </form>
      )}
    </div>
  );
}
