import { useMemo, useState, type FormEvent } from "react";
import { Target, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { getAnonId } from "@/lib/anon-id";
import { predictionDueDate, formatPredictionDate } from "@/lib/vibecheck-schema";
import { trackEvent } from "@/lib/analytics";

export type PredictionData = { claim: string; window_days: number; falsifier: string };
export type SafetyData = { concern: boolean; categories: string[]; note: string };
export type SelfMirrorData = { title: string; observation: string; mechanic: string };

// The prediction beat — what a report now ends on instead of "Loop closed".
//
// The old ending told the reader, in as many words, that the question was
// settled and she could stop thinking about it. Emotionally that's the
// kindest possible sentence. Commercially it was the most expensive one on
// the site: /science cites the Zeigarnik effect as the reason unfinished
// things stay in mind, and the report was using it in reverse — deliberately
// closing the only loop that brings anyone back.
//
// A dated claim inverts that without a single dark pattern. Nothing is
// withheld and nothing is teased; the read stays complete. What's added is
// a question with a date on it that only she can answer — which is also the
// one thing that makes the analysis accountable rather than merely
// confident. A model that can never be publicly wrong can always agree with
// you, and this product's entire positioning is that it won't.
//
// Lives in components/ rather than inside the report page because it
// renders on BOTH the free preview and the paid report, and the free one is
// the one that matters: everybody who pays already hands over an address at
// checkout, so the paid page can only ever collect emails we already have.
export function PredictionBeat({
  prediction,
  createdAt,
  id,
  surface,
}: {
  prediction: PredictionData;
  createdAt: string;
  id: string;
  surface: "free_preview" | "full_report";
}) {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const due = useMemo(
    () => formatPredictionDate(predictionDueDate(createdAt, prediction.window_days)),
    [createdAt, prediction.window_days],
  );

  // Email is asked for here and nowhere else in the free flow. That's
  // deliberate: everywhere else the ask is "give us your address so we can
  // reach you", which is a tax on the user paid for our benefit. Here the
  // address IS the mechanism — there is no way to be told whether the
  // prediction held without one. Same input field, completely different
  // trade.
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setSaving(true);
    setError(null);
    try {
      const { saveEmail } = await import("@/lib/vibecheck.functions");
      const res = await saveEmail({ data: { id, email: value, ownerAnonId: getAnonId() } });
      if (!res.ok) {
        setError("Couldn't attach that to this report. Try opening it on the device you ran it from.");
        return;
      }
      setSaved(true);
      trackEvent("prediction_email_saved", { surface, window_days: prediction.window_days });
    } catch {
      setError("That didn't save. Check the address and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-lg sm:p-8">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/50">
        <Target className="h-4 w-4" />
        On the record
      </div>

      <p className="mt-4 text-sm leading-relaxed text-white/70">
        Here's the part most of these tools won't do. I'm going to commit to something you can check.
      </p>

      <h3 className="font-serif mt-4 text-2xl leading-tight sm:text-3xl">{prediction.claim}</h3>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/10 p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/50">Check by</p>
          <p className="font-serif mt-1 text-xl leading-none">{due}</p>
        </div>
        <div className="rounded-2xl bg-white/10 p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/50">I'm wrong if</p>
          <p className="mt-1 text-sm leading-snug text-white/85">{prediction.falsifier}</p>
        </div>
      </div>

      {saved ? (
        <div className="mt-5 flex items-start gap-2 rounded-2xl bg-mint/20 p-4">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
          <p className="text-sm leading-relaxed text-white/85">
            Done. I'll write on {due} and ask you one question: did it happen? If I got this wrong, I'll say so and
            show you what I misread.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-5">
          <label htmlFor={`prediction-email-${id}`} className="text-sm leading-relaxed text-white/70">
            Leave an address and I'll come back on {due} to tell you whether I was right.
          </label>
          <div className="mt-3 flex gap-2">
            <input
              id={`prediction-email-${id}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!email.trim() || saving}
              className="shrink-0 rounded-full bg-white px-5 py-3 text-sm font-medium text-ink transition disabled:opacity-40"
            >
              {saving ? "…" : "Hold me to it"}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-white/70">{error}</p>}
          <p className="mt-2 text-xs text-white/40">One email about this prediction. Nothing else.</p>
        </form>
      )}
    </div>
  );
}

// Duluth Power & Control routing, rendered above everything else.
//
// When this fires the product stops selling. No score framing, no award, no
// pop-culture joke sitting next to someone describing coercion — the page
// hides the whole viral layer and leads with this instead. A scoring engine
// that hands someone a "Toxicity 74%" badge and a shareable medal while
// she's describing being threatened is doing active harm, and no footnote
// fixes that.
export function SafetyBanner({ safety }: { safety: SafetyData }) {
  return (
    <div className="mb-6 rounded-3xl border-2 border-destructive/40 bg-destructive/5 p-6">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-destructive">
        <AlertCircle className="h-4 w-4" />
        Read this first
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink/85">{safety.note}</p>
      {safety.categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {safety.categories.map((c) => (
            <span key={c} className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
              {c}
            </span>
          ))}
        </div>
      )}
      <p className="mt-4 text-sm leading-relaxed text-ink/70">
        The rest of this still works, but it's an analysis of a conversation — it isn't a safety assessment and it
        isn't a substitute for talking to someone who does this for a living. If any of the above is your situation, a
        domestic abuse helpline in your country is the right call, not an app.
      </p>
    </div>
  );
}

// The second line of analysis: her, not him.
//
// Sits directly above the prediction because that's the emotional low point
// of the report and the highest-trust moment in it — a product that says
// something the reader didn't want to hear, and is right, has earned the
// right to be believed about everything else.
//
// Never rendered when the safety router fires. sanitizeReportShape strips
// the field in code for the same reason, so this is belt and braces:
// "here's what you're doing that keeps this going" is a useful mirror in a
// bad dynamic and straightforward victim-blaming in an abusive one.
export function SelfMirrorCard({ mirror }: { mirror: SelfMirrorData }) {
  return (
    <div className="rounded-3xl border border-purple/25 bg-purple-soft/50 p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-purple-deep">
        <Eye className="h-4 w-4" />
        The part about you
      </div>
      <h3 className="font-serif mt-3 text-2xl leading-tight">{mirror.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-ink/80">{mirror.observation}</p>
      <p className="mt-3 text-sm leading-relaxed text-ink/80">{mirror.mechanic}</p>
      <p className="mt-4 text-xs text-ink/50">
        Not a verdict on you. Half of any pattern is what the other person's behaviour is being met with — and that
        half is the only one you control.
      </p>
    </div>
  );
}
