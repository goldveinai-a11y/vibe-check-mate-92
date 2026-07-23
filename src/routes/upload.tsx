import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useDropzone } from "react-dropzone";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Upload as UploadIcon, Sparkles, ShieldCheck, ExternalLink, Share2, Check, Copy } from "lucide-react";
import { createAnalysis } from "@/lib/vibecheck.functions";
import { getAnonId, rememberOwnedAnalysis, captureRefCode } from "@/lib/anon-id";
import { SiteHeader } from "@/components/SiteHeader";
import { AnalyzingOverlay } from "@/components/AnalyzingOverlay";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload your chat - VibeCheck" },
      { name: "description", content: "Drop 1-5 screenshots of a conversation and get a brutally honest AI breakdown." },
    ],
  }),
  component: UploadPage,
});

type Prepared = { mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif"; base64: string; previewUrl: string; name: string };

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

// Visually hidden, but NOT display:none - some locked-down in-app webviews
// (TikTok, Instagram, Facebook) refuse to open the native file picker for
// an input with display:none, even though the click itself is a real,
// user-initiated <label for> click. Off-screen clip keeps it invisible
// without triggering that restriction.
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

// TikTok's (and Instagram/Facebook's) in-app browser is a locked-down
// WebView that on some app versions never implements the OS file-picker
// delegate at all - no amount of web-side code can open a picker that the
// host app itself never wired up. Detecting it lets us show a small,
// non-blocking way out (open in the real browser) instead of a dead button
// with zero feedback, which is what happens today.
function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /musical_ly|TikTok|BytedanceWebview|FBAN|FBAV|Instagram|Line\//i.test(navigator.userAgent);
}

// Thrown by mutationFn instead of a generic Error when createAnalysis
// returns code: "free_limit_reached" (see vibecheck.functions.ts) - lets
// the render below tell "your one free try is used up, here's your report,
// go unlock it" apart from an actual failure ("that screenshot didn't
// read, try again"), which need very different copy and a different CTA.
class FreeLimitError extends Error {
  existingAnalysisId: string;
  constructor(message: string, existingAnalysisId: string) {
    super(message);
    this.existingAnalysisId = existingAnalysisId;
  }
}

function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<Prepared[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [readyId, setReadyId] = useState<string | null>(null);
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    captureRefCode();
    trackEvent("upload_started");
    setInAppBrowser(isInAppBrowser());
  }, []);

  const onDrop = useCallback(async (accepted: File[]) => {
    setError(null);
    try {
      const prepared = await Promise.all(accepted.slice(0, 6 - files.length).map(fileToPrepared));
      setFiles((cur) => [...cur, ...prepared].slice(0, 6));
      trackEvent("screenshots_uploaded", { image_count: prepared.length });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read files");
    }
  }, [files.length]);

  // noClick: the click-to-open behavior now comes from a real <label
  // htmlFor> wrapping the drop zone instead of dropzone's own
  // input.current.click() proxy - see the label/input below. A native
  // label click is browser-native behavior; a JS-dispatched .click() is
  // exactly the kind of programmatic trigger that strict in-app WebViews
  // are most likely to silently swallow. Drag-and-drop (desktop) and the
  // onDrop handler are unaffected by this - only the click-to-open path
  // changes.
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [], "image/jpeg": [], "image/webp": [], "image/gif": [] },
    maxFiles: 6,
    maxSize: 6 * 1024 * 1024,
    noClick: true,
    noKeyboard: true,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      trackEvent("analysis_started");
      const ownerAnonId = getAnonId();
      const result = await createAnalysis({
        data: {
          ownerAnonId,
          images: files.map((f) => ({ mediaType: f.mediaType, base64: f.base64 })),
        },
      });
      if ("error" in result) {
        if (result.code === "free_limit_reached" && result.existingAnalysisId) {
          throw new FreeLimitError(result.error, result.existingAnalysisId);
        }
        throw new Error(result.error);
      }
      rememberOwnedAnalysis(result.id);
      return result.id;
    },
    onSuccess: (id) => {
      setReadyId(id);
    },
  });

  useEffect(() => {
    if (!readyId) return;
    const t = setTimeout(() => {
      navigate({ to: "/analyzing/$id", params: { id: readyId } });
    }, 2200);
    return () => clearTimeout(t);
  }, [readyId, navigate]);

  const pageUrl = typeof window !== "undefined" ? window.location.href : "https://vibecheckapp.app/upload";
  // Cast, not a bare navigator.share call - matches the pattern already
  // used in ShareCard.tsx, since Web Share isn't in every TS lib target.
  const shareNav = typeof navigator !== "undefined" ? (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }) : undefined;
  const canShare = typeof shareNav?.share === "function";

  // TikTok's in-app browser has been confirmed (real device test) to block
  // BOTH the file picker (even via native <label> click) and, in some
  // builds, the Clipboard API - so a JS clipboard write can silently no-op
  // with zero feedback, which is exactly why the old version felt "broken."
  // This now always shows a visible result, and the raw URL is also always
  // rendered as a plain, long-press-selectable text field below as a
  // zero-JS-dependent fallback that works even if every button here fails.
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 2500);
  };

  // Web Share triggers the OS-level native share sheet (an Android/iOS
  // system Activity), which in practice is far less likely to be blocked
  // by a restrictive in-app WebView than either the file-input picker or
  // the Clipboard API, since it hands off to the OS instead of running
  // inside the webview's own JS sandbox. Tapping "Chrome"/"Safari" in that
  // sheet reopens this exact page in the real browser.
  const handleShare = async () => {
    try {
      await shareNav?.share?.({ title: "VibeCheck", url: pageUrl });
    } catch {
      // user cancelled the share sheet, or it's not actually supported
      // despite the feature check - nothing to do, the fallback link field
      // below still works.
    }
  };

  return (
    <main className="min-h-screen bg-cream text-ink">
      {/* No report exists yet on this page, so there's nothing to "unlock" -
          showing the button here just links back to /upload itself (a dead
          click). Same reasoning already applied on analyzing.$id.tsx and
          my-reports.tsx. */}
      <SiteHeader showUnlock={false} />
      <section className="px-5 pt-4 pb-16 sm:pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-purple-soft px-4 py-2 text-xs font-medium text-purple-deep sm:text-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Step 2 of 3
            </span>
            <h1 className="font-serif mt-6 text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
              Upload your chat screenshots
            </h1>
            <p className="mt-4 max-w-lg text-base text-ink/70">
              Drop in a few screenshots of your conversation and we will read the vibe. The more context, the better the insights.
            </p>
            <p className="mt-1 max-w-lg text-xs text-ink/50">
              2-5 screenshots is the sweet spot - enough context for a sharp read, up to 6 max per upload.
            </p>
          </div>

          {/* Non-blocking escape hatch for TikTok/Instagram/Facebook's
              in-app browser - only shown when detected. Confirmed on a real
              TikTok in-app browser that the picker stays blocked even with
              the native <label> click fix, and clipboard writes can fail
              silently - so this leads with TikTok's own native "Open in
              browser" menu, offers the OS share sheet as a second route,
              and always shows the raw link as a plain, long-press-copyable
              text field that has zero JS dependency as a last resort. */}
          {inAppBrowser && (
            <div className="mt-6 rounded-2xl border border-purple/20 bg-purple-soft/50 p-4 text-sm text-ink/80">
              <div className="flex items-start gap-3">
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-purple-deep" />
                <p className="min-w-0">
                  This in-app browser blocks photo uploads. Tap the{" "}
                  <span className="font-medium">••• menu</span> in the top corner and choose{" "}
                  <span className="font-medium">Open in Browser</span> (or Safari/Chrome) to continue there.
                </p>
              </div>

              {canShare && (
                <button
                  onClick={handleShare}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-purple-deep px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
                >
                  <Share2 className="h-4 w-4" />
                  Share this page to open it
                </button>
              )}

              <p className="mt-3 text-xs font-medium text-ink/60">Or copy the link manually:</p>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  readOnly
                  value={pageUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 truncate rounded-full border border-purple/20 bg-white px-3 py-2 text-xs text-ink/70"
                />
                <button
                  onClick={handleCopyLink}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-medium text-purple-deep shadow-sm"
                >
                  {copyState === "copied" ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>
              {copyState === "failed" && (
                <p className="mt-1.5 text-xs text-destructive">
                  Couldn't copy automatically here - tap and hold the link above, then choose "Select all" and "Copy."
                </p>
              )}
            </div>
          )}

          <div className="mt-10 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-8">
            <label
              {...getRootProps({ htmlFor: "vibecheck-upload-input" })}
              className={`flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                isDragActive ? "border-pink bg-pink-soft/40" : "border-purple-soft bg-purple-soft/25"
              }`}
            >
              <input {...getInputProps({ id: "vibecheck-upload-input", style: VISUALLY_HIDDEN_INPUT })} />
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-pink text-white shadow-sm">
                <UploadIcon className="h-6 w-6" />
              </div>
              <h3 className="font-serif mt-5 text-xl sm:text-2xl">Drag &amp; drop your screenshots here</h3>
              <p className="mt-2 text-sm text-ink/60">or tap to browse - PNG, JPG, HEIC accepted</p>
              <span className="mt-6 inline-flex items-center rounded-full bg-pink px-6 py-3 text-sm font-medium text-white shadow-sm">
                Choose images
              </span>
            </label>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="mt-6 flex items-center justify-between text-sm">
                    <span className="font-medium">Your uploads</span>
                    <button
                      onClick={() => setFiles([])}
                      className="text-xs text-ink/50 hover:text-ink"
                    >
                      Remove any before analyzing
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {files.map((f, i) => (
                      <div key={i} className="relative aspect-[3/5] overflow-hidden rounded-2xl bg-muted">
                        <img src={f.previewUrl} alt={f.name} className="h-full w-full object-cover" />
                        <button
                          onClick={() => setFiles((cur) => cur.filter((_, idx) => idx !== i))}
                          className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white"
                          aria-label="Remove"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-mint-soft/60 p-4 text-sm text-ink/80">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-mint text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="min-w-0">
                Zero receipts kept: encrypted in transit, read once, deleted the second your report is ready. Never stored, never shared, never used to train anything.
              </p>
            </div>

            {mutation.isError && mutation.error instanceof FreeLimitError ? (
              <div className="mt-4 rounded-2xl border border-purple/20 bg-purple-soft/50 p-4 text-sm text-ink/80">
                <p>
                  You've already used your free VibeCheck on this device - your first read is still sitting there
                  waiting to be unlocked.
                </p>
                <Link
                  to="/paywall/$id"
                  params={{ id: mutation.error.existingAnalysisId }}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-purple-deep px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
                >
                  Go to my report
                </Link>
              </div>
            ) : (
              mutation.isError && (
                <p className="mt-4 text-sm text-destructive">
                  Something went sideways reading that one. Try again - if it keeps happening, swap in a clearer screenshot.
                </p>
              )
            )}

            <button
              onClick={() => mutation.mutate()}
              disabled={files.length === 0 || mutation.isPending || (mutation.isError && mutation.error instanceof FreeLimitError)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink px-6 py-4 text-base font-medium text-white shadow-md transition hover:opacity-90 disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />
              {mutation.isPending ? "Analyzing..." : "Analyze the vibe"}
            </button>
          </div>
        </div>
      </section>
      <AnimatePresence>
        {(mutation.isPending || readyId) && (
          <AnalyzingOverlay
            thumbs={files.map((f) => ({ previewUrl: f.previewUrl, name: f.name }))}
            done={!!readyId}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
