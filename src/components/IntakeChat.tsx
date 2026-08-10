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
  "What's going on? Tell me as much or as little as you want. You can paste the messages or send screenshots too — I'll read them myself.";

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

  // She has no way out of the conversation except waiting for the model to
  // decide it has enough. Over two days of paid traffic, thirteen people
  // started a chat, the median stopped at three replies, and exactly one
  // reached a read. The gate was never the interesting part of the product —
  // the read is — so from turn three she can take it whenever she wants.
  const userTurns = messages.filter((m) => m.role === "user").length;

  // Analytics state. The chat is now the whole top of the funnel and the
  // drop-off inside it was invisible — we knew it started and knew when it
  // finished, and nothing in between, which is exactly where people leave.
  const turnRef = useRef(0);
  const askedForScreensRef = useRef(false);
  const startedRef = useRef(false);

  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const seededRef = useRef(false);

  // Screenshots accumulate across the whole conversation.
  //
  // They used to reach the report only if they happened to be attached on
  // the same turn the model declared itself ready. A thread sent at turn two
  // and a handoff at turn five produced a read with no evidence in it at
  // all — the model then wrote the report off her description alone while
  // the product had the actual messages sitting in memory. Two of the three
  // screenshot uploads we have ever received were lost this way.
  const evidenceRef = useRef<Array<{ mediaType: string; base64: string }>>([]);
  const metaRef = useRef<{ tier?: "T0" | "T1" | "T2" | "T3"; loop?: boolean }>({});

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  // Arriving on #chat should put the cursor in the box, not just scroll near
  // it. On the landing page the header CTA used to be a link to the page you
  // were already on, so it did nothing at all; from anywhere else it dropped
  // you at the top of the page with the chat mostly below the fold.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const focusIfTargeted = () => {
      if (window.location.hash !== "#chat") return;
      document.getElementById("chat")?.scrollIntoView({ behavior: "smooth", block: "center" });
      // Deliberately not on mobile: focusing throws up the keyboard and
      // hides the conversation she came to read.
      if (window.matchMedia("(min-width: 640px)").matches) taRef.current?.focus();
    };
    focusIfTargeted();
    window.addEventListener("hashchange", focusIfTargeted);
    return () => window.removeEventListener("hashchange", focusIfTargeted);
  }, []);

  // Grow with the text. One of the three advertised ways in is "paste the
  // messages", and a pasted argument is long — showing it through a slot the
  // height of one line makes the thing we asked her to do feel unwelcome.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 176) + "px";
  }, [input]);

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

  // The tier travels with the handoff. The intake decides per turn whether
  // it may name what she is doing to sustain the dynamic, and on T1/T2 it
  // may not — but the report generator used to be told none of that and
  // printed the self-mirror anyway.
  const handOff = async (
    finalSlots: IntakeSlots,
    images: Array<{ mediaType: string; base64: string }>,
    tier?: "T0" | "T1" | "T2" | "T3",
    loop?: boolean,
  ) => {
    setHandingOff(true);
    try {
      const { createAnalysis, runAnalysis } = await import("@/lib/vibecheck.functions");
      const anonId = getAnonId();
      const created = await createAnalysis({ data: { ownerAnonId: anonId } });
      if (!("id" in created)) {
        throw new Error(created.code === "free_limit_reached" ? "limit" : created.error);
      }

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
      trackEvent("analysis_run_started", {
        report_id: created.id,
        with_screenshots: images.length > 0,
      });

      void runAnalysis({
        data: {
        id: created.id,
        ownerAnonId: anonId,
        quiz,
        images: images.length ? images : undefined,
        ...(tier ? { tier } : {}),
        ...(loop ? { loop } : {}),
      },
      })
        .then(() => {
          trackEvent("analysis_run_returned", { report_id: created.id });
        })
        .catch((e: unknown) => {
          // This used to be .catch(() => {}) — the single most expensive
          // empty block in the product. The read is fired from here and the
          // page navigates away in the same tick, so if the request dies
          // (backgrounded tab on mobile, dropped connection, cold start) the
          // row sits at "processing" forever with nothing to flip it and
          // nothing anywhere recording why. Three of the three analyses
          // started during the first two days of paid traffic ended up in
          // exactly that state, and this swallowed every explanation.
          trackEvent("analysis_run_error", {
            report_id: created.id,
            message: e instanceof Error ? e.message.slice(0, 120) : "unknown",
          });
        });

      trackEvent("chat_finished", {
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

    if (messages.filter((m) => m.role === "user").length === 0) {
      onStarted?.();
      if (!startedRef.current) {
        startedRef.current = true;
        trackEvent("chat_started", { seeded: Boolean(textOverride) });
      }
    }

    const images = await Promise.all(pending.map((p) => fileToBase64(p.file)));
    if (images.length) {
      evidenceRef.current = [...evidenceRef.current, ...images].slice(-6);
    }
    const shown = text || (images.length === 1 ? "📎 screenshot" : `📎 ${images.length} screenshots`);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: shown }]);
    setInput("");
    pending.forEach((p) => URL.revokeObjectURL(p.url));
    setPending([]);
    setBusy(true);
    setError(null);
    const sentAt = Date.now();

    try {
      const { intakeTurn } = await import("@/lib/vibecheck.functions");
      const res = await intakeTurn({
        data: { history, message: text, slots, images: images.length ? images : undefined },
      });

      turnRef.current += 1;
      const turn = turnRef.current;
      const resTier = ("tier" in res ? res.tier : undefined) as
        | "T0"
        | "T1"
        | "T2"
        | "T3"
        | undefined;

      metaRef.current = { tier: resTier, loop: res.loop };

      trackEvent("chat_reply", {
        turn_number: turn,
        tier: resTier ?? "T0",
        has_image: images.length > 0,
        chars: text.length,
      });

      // Time to the FIRST answer is its own metric: everything after it is
      // spent by someone who has already decided the thing is worth talking
      // to. Everything before it is spent deciding.
      if (turn === 1) {
        trackEvent("chat_first_reply", { latency_ms: Date.now() - sentAt, tier: resTier ?? "T0" });
      }

      if (resTier && resTier !== "T0") {
        trackEvent("chat_tier_detected", { tier: resTier, turn_number: turn });
      }

      if (images.length > 0) {
        trackEvent("chat_got_screenshots", { turn_number: turn, count: images.length });
      }

      // Pasted text counts as evidence exactly like a screenshot does, and
      // it is the path that needs no trip to the photo gallery — worth
      // knowing separately from the upload path.
      if (!images.length && text.length > 400) {
        trackEvent("chat_messages_pasted", { chars: text.length });
      }

      // Did the model actually make the ask? Measured against
      // chat_got_screenshots this is the conversion rate on the one request
      // that decides whether the report can quote him at all.
      if (!askedForScreensRef.current && /show me the thread|paste the messages|screenshot/i.test(res.reply)) {
        askedForScreensRef.current = true;
        trackEvent("chat_asked_screenshots", { turn_number: turn });
      }

      if (res.capped) trackEvent("chat_capped", { turns: turn });

      setSlots(res.slots);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);

      if (res.safetyConcern) {
        setSafety(true);
        trackEvent("chat_safety_triggered", { tier: resTier ?? "T3", turn_number: turnRef.current });
        return;
      }
      if (res.ready) {
        // Let her read the closing line before the screen changes.
        setTimeout(() => void handOff(res.slots, evidenceRef.current, res.tier, res.loop), 1600);
      }
    } catch {
      trackEvent("chat_error", { stage: "reply", turn_number: turnRef.current });
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
    <div
      id="chat"
      className="scroll-mt-24 flex flex-col overflow-hidden rounded-3xl border-2 border-pink/25 bg-card shadow-xl"
    >
      <div className="flex items-center gap-2.5 border-b border-border/50 px-5 py-3.5">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-soft">
          <Sparkles className="h-4 w-4 text-purple-deep" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight text-ink">VibeCheck</p>
          <p className="text-xs leading-tight text-ink/50">Reads the pattern, not your mood</p>
        </div>
      </div>

      <div className="max-h-[62vh] min-h-[400px] space-y-3 overflow-y-auto px-4 py-5 sm:max-h-[56vh] sm:min-h-[440px] sm:px-6 sm:py-6">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-pink px-4 py-2.5 text-[15px] leading-relaxed text-white sm:max-w-[75%]"
                : "w-fit max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-muted/60 px-4 py-2.5 text-[15px] leading-relaxed text-ink/85 sm:max-w-[85%]"
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
        <form onSubmit={onSubmit} className="border-t-2 border-pink/20 bg-pink-soft/25 px-3 py-3 sm:px-4">
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

          {userTurns >= 3 && !handingOff && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                trackEvent("chat_read_requested", {
                  turns: userTurns,
                  with_screenshots: evidenceRef.current.length > 0,
                });
                void handOff(slots, evidenceRef.current, metaRef.current.tier, metaRef.current.loop);
              }}
              className="mb-2.5 w-full rounded-2xl border-2 border-pink/50 bg-card px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-pink-soft/60 disabled:opacity-40"
            >
              That&rsquo;s enough &mdash; read it now
            </button>
          )}

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy || handingOff || pending.length >= 6}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-ink/50 transition hover:bg-muted hover:text-ink disabled:opacity-40 sm:h-10 sm:w-10"
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
              ref={taRef} rows={2}
              aria-label="Your message"
              maxLength={1500}
              disabled={handingOff}
              placeholder="Type here — or paste the messages…"
              className="max-h-44 min-h-[60px] flex-1 resize-none rounded-2xl border-2 border-pink/35 bg-card px-4 py-3 text-base leading-relaxed text-ink shadow-sm placeholder:text-ink/50 focus:border-pink focus:outline-none sm:min-h-[52px] sm:text-sm"
            />

            <button
              type="submit"
              disabled={(!input.trim() && pending.length === 0) || busy || handingOff}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-pink text-white transition disabled:opacity-30 sm:h-10 sm:w-10"
              aria-label="Send"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
            </button>
          </div>

          <p className="mt-2 text-center text-[11px] text-ink/40">
            Type, paste the messages, or tap the image icon to add screenshots — read once, then deleted.
          </p>
        </form>
      )}
    </div>
  );
}
