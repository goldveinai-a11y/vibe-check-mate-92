import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useDropzone } from "react-dropzone";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import {
  Upload as UploadIcon,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Check,
  Zap,
} from "lucide-react";
import { createAnalysis, runAnalysis } from "@/lib/vibecheck.functions";
import { getAnonId, rememberOwnedAnalysis, captureRefCode } from "@/lib/anon-id";
import {
  QUIZ_STEP_ONE,
  QUIZ_STEPS_REST,
  TOTAL_QUIZ_STEPS,
  readQuizDraft,
  saveQuizDraft,
  clearQuizDraft,
  rememberQuizForAnalysis,
  isQuizComplete,
  type QuizAnswers,
  type QuizStep,
} from "@/lib/quiz";
import { SiteHeader } from "@/components/SiteHeader";
import { AnalyzingOverlay } from "@/components/AnalyzingOverlay";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Your VibeCheck - a few quick questions" },
      { name: "description", content: "Six quick questions, then an honest read on where you actually stand." },
    ],
  }),
  component: QuizPage,
});

type Prepared = {
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
  base64: string;
  previewUrl: string;
  name: string;
};

function fileToPrepared(file: File): Promise<Prepared> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [meta, base64] = dataUrl.split(",");
      const match = meta.match(/data:(image\/[a-z]+);base64/);
      const mime = match?.[1] as Prepared["mediaType"] | undefined;
      if (!mime || !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(mime)) {
        reject(new Error(`Unsupported image type: ${mime ?? "unknown"}`));
        return;
      }
      resolve({ mediaType: mime, base64, previewUrl: dataUrl, name: file.name });
    };
    reader.readAsDataURL(file);
  });
}

// Visually hidden but NOT display:none - some locked-down in-app webviews
// refuse to open the native picker for a display:none input even on a real
// user-initiated <label for> click. Same reasoning as the old upload page.
const VISUALLY_HIDDEN_INPUT: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

function QuizPage() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [freeText, setFreeText] = useState("");
  const [showScreenshots, setShowScreenshots] = useState(false);
  const [files, setFiles] = useState<Prepared[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  // Normally question 1 was already answered inline on the landing page and
  // this route picks up at question 2. But /quiz is also reachable directly
  // - the closing CTA on the landing page, a shared link, a back-button
  // return after storage was cleared - and in those cases question 1 has no
  // answer. Rather than bouncing the user back to the landing page (which
  // would make the closing CTA a loop that never opens the quiz), the route
  // just prepends question 1 and runs the whole thing itself.
  const [steps, setSteps] = useState<QuizStep[]>(QUIZ_STEPS_REST);
  const [stepsBehind, setStepsBehind] = useState(1);

  useEffect(() => {
    captureRefCode();
    const draft = readQuizDraft();
    setAnswers(draft);
    if (draft.frustration) setFreeText(draft.frustration);
    if (!draft.situation) {
      setSteps([QUIZ_STEP_ONE, ...QUIZ_STEPS_REST]);
      setStepsBehind(0);
    }
    trackEvent("quiz_opened", { answered: Object.keys(draft).length });
  }, []);

  const step = steps[stepIndex];
  const displayStep = showScreenshots ? TOTAL_QUIZ_STEPS + 1 : stepsBehind + stepIndex + 1;
  const progressPct = Math.round((displayStep / (TOTAL_QUIZ_STEPS + 1)) * 100);

  const commit = (key: keyof QuizAnswers, value: string) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    saveQuizDraft({ [key]: value });
    trackEvent("quiz_step_answered", { step: displayStep, question: key });

    if (stepIndex + 1 < steps.length) {
      setStepIndex(stepIndex + 1);
    } else {
      setShowScreenshots(true);
      trackEvent("quiz_completed");
    }
  };

  const goBack = () => {
    if (showScreenshots) {
      setShowScreenshots(false);
      setStepIndex(steps.length - 1);
      return;
    }
    if (stepIndex === 0) {
      navigate({ to: "/" });
      return;
    }
    setStepIndex(stepIndex - 1);
  };

  const onDrop = useCallback(
    async (accepted: File[]) => {
      setFileError(null);
      try {
        const prepared = await Promise.all(accepted.slice(0, 6 - files.length).map(fileToPrepared));
        setFiles((cur) => [...cur, ...prepared].slice(0, 6));
        trackEvent("screenshots_uploaded", { image_count: prepared.length });
      } catch (e) {
        setFileError(e instanceof Error ? e.message : "Failed to read files");
      }
    },
    [files.length],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [], "image/jpeg": [], "image/webp": [], "image/gif": [] },
    maxFiles: 6,
    maxSize: 6 * 1024 * 1024,
    noClick: true,
    noKeyboard: true,
  });

  const mutation = useMutation({
    mutationFn: async (withScreenshots: boolean) => {
      const quiz = { ...answers, frustration: freeText.trim() || undefined };
      if (!isQuizComplete(quiz)) throw new Error("Quiz is incomplete");

      trackEvent("analysis_started", {
        has_screenshots: withScreenshots && files.length > 0,
        image_count: withScreenshots ? files.length : 0,
      });

      const ownerAnonId = getAnonId();
      const created = await createAnalysis({ data: { ownerAnonId } });
      if ("error" in created) throw new Error(created.error);

      rememberOwnedAnalysis(created.id);
      rememberQuizForAnalysis(created.id, quiz);
      clearQuizDraft();

      // Not awaited - see upload.tsx for the full reasoning. The user is
      // navigated to /analyzing/$id immediately and the poll there owns the
      // outcome, so this request dying mid-flight costs nothing.
      void runAnalysis({
        data: {
          id: created.id,
          ownerAnonId,
          quiz,
          images: withScreenshots
            ? files.map((f) => ({ mediaType: f.mediaType, base64: f.base64 }))
            : undefined,
        },
      }).catch(() => {
        // /analyzing/$id surfaces failures; nothing useful to do here.
      });

      return created.id;
    },
    onSuccess: (id) => {
      navigate({ to: "/analyzing/$id", params: { id } });
    },
  });

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />

      <section className="px-5 pt-4 pb-16">
        <div className="mx-auto max-w-xl">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border/60 text-ink/60 transition hover:text-ink"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                animate={{ width: `${progressPct}%` }}
                transition={{ ease: "easeOut", duration: 0.35 }}
                className="h-full bg-pink"
              />
            </div>
            <span className="shrink-0 text-xs font-medium text-ink/50">
              {displayStep}/{TOTAL_QUIZ_STEPS + 1}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {!showScreenshots ? (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="mt-10"
              >
                <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{step.question}</h1>

                {step.options ? (
                  <div className="mt-8 grid gap-3">
                    {step.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => commit(step.key, opt)}
                        className="w-full rounded-2xl border border-border/60 bg-card px-5 py-4 text-left text-base shadow-sm transition hover:border-pink hover:bg-pink-soft/30"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-8">
                    <textarea
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value)}
                      placeholder={step.placeholder}
                      maxLength={400}
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-border/60 bg-card px-5 py-4 text-base shadow-sm outline-none focus:border-pink"
                    />
                    <button
                      onClick={() => commit(step.key, freeText.trim())}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink px-6 py-4 text-base font-medium text-white shadow-md transition hover:opacity-90"
                    >
                      {freeText.trim() ? "Continue" : "Skip this one"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="screenshots"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="mt-10"
              >
                <h1 className="font-serif text-3xl leading-tight sm:text-4xl">Almost there.</h1>
                <p className="mt-3 text-base text-ink/70">
                  Adding screenshots lets us read their actual messages - what they meant, and exactly what to say
                  back. Skip it and you'll still get a read based on your answers.
                </p>

                <div className="mt-8 rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
                  <label
                    {...getRootProps({ htmlFor: "vibecheck-quiz-upload" })}
                    className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                      isDragActive ? "border-pink bg-pink-soft/40" : "border-purple-soft bg-purple-soft/25"
                    }`}
                  >
                    <input {...getInputProps({ id: "vibecheck-quiz-upload", style: VISUALLY_HIDDEN_INPUT })} />
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-pink text-white shadow-sm">
                      <UploadIcon className="h-5 w-5" />
                    </div>
                    <h3 className="font-serif mt-4 text-lg">Add your screenshots</h3>
                    <p className="mt-1 text-sm text-ink/60">2-5 is the sweet spot - PNG or JPG</p>
                  </label>

                  {fileError && <p className="mt-3 text-sm text-destructive">{fileError}</p>}

                  {files.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {files.map((f, i) => (
                        <div key={i} className="relative aspect-[3/5] overflow-hidden rounded-xl bg-muted">
                          <img src={f.previewUrl} alt={f.name} className="h-full w-full object-cover" />
                          <button
                            onClick={() => setFiles((cur) => cur.filter((_, idx) => idx !== i))}
                            className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-xs text-white"
                            aria-label="Remove"
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 flex items-start gap-3 rounded-2xl bg-mint-soft/60 p-4 text-sm text-ink/80">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-mint text-white">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <p className="min-w-0">
                      Zero receipts kept: read once, deleted the second your report is ready.
                    </p>
                  </div>

                  <button
                    onClick={() => mutation.mutate(true)}
                    disabled={files.length === 0 || mutation.isPending}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink px-6 py-4 text-base font-medium text-white shadow-md transition hover:opacity-90 disabled:opacity-40"
                  >
                    <Sparkles className="h-4 w-4" />
                    {mutation.isPending ? "Starting..." : "Get the precise read"}
                  </button>
                </div>

                {/* The skip is a real, dignified option rather than a
                    grey afterthought. For anyone in TikTok's in-app browser
                    the picker above simply will not open, and this is the
                    only path that still ends in a report. */}
                <button
                  onClick={() => mutation.mutate(false)}
                  disabled={mutation.isPending}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/60 bg-card px-6 py-3.5 text-sm font-medium text-ink/75 transition hover:text-ink disabled:opacity-40"
                >
                  <Zap className="h-4 w-4" />
                  Skip - read my answers instead
                </button>

                {mutation.isError && (
                  <p className="mt-4 text-sm text-destructive">
                    Couldn't start that one. Give it another go in a moment.
                  </p>
                )}

                <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-ink/45">
                  <Check className="h-3.5 w-3.5 text-mint" />
                  Your first read is free
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <AnimatePresence>
        {mutation.isPending && (
          <AnalyzingOverlay
            thumbs={files.map((f) => ({ previewUrl: f.previewUrl, name: f.name }))}
            done={false}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
