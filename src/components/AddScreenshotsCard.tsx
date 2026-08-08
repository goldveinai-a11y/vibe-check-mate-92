import { useCallback, useState, type CSSProperties } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Upload as UploadIcon, ScanLine } from "lucide-react";
import { runAnalysis, reopenForScreenshots } from "@/lib/vibecheck.functions";
import { getAnonId } from "@/lib/anon-id";
import { readQuizForAnalysis } from "@/lib/quiz";
import { trackEvent } from "@/lib/analytics";

// Shown on a PRELIMINARY report - one generated from quiz answers only,
// with no screenshots. This is the single most valuable action such a user
// can take, and the reason quiz-only exists at all: someone who arrived
// through TikTok's in-app browser physically could not open a file picker,
// so she got a read from her answers instead. This card is the moment she
// can finally upgrade it - typically after opening the link in a real
// browser.
//
// Deliberately free and not counted against the free-preview cap: it's the
// same conversation being sharpened, not a second one. Charging for it, or
// making it burn her remaining free run, would defeat the entire point.

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

// Visually hidden but NOT display:none - strict in-app webviews refuse to
// open the picker for a display:none input even on a genuine label click.
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

export function AddScreenshotsCard({ id }: { id: string }) {
  const navigate = useNavigate();
  const [files, setFiles] = useState<Prepared[]>([]);
  const [error, setError] = useState<string | null>(null);

  // The original quiz answers live in localStorage on the device that ran
  // the quiz (see lib/quiz.ts for why they aren't persisted server-side).
  // Without them we can't re-run the analysis, which happens if this link
  // was opened on a different device or storage was cleared.
  const quiz = readQuizForAnalysis(id);

  const onDrop = useCallback(async (accepted: File[]) => {
    setError(null);
    try {
      const prepared = await Promise.all(accepted.slice(0, 6).map(fileToPrepared));
      setFiles((cur) => [...cur, ...prepared].slice(0, 6));
      trackEvent("screenshots_uploaded", { image_count: prepared.length, context: "upgrade" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read files");
    }
  }, []);

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
      if (!quiz) throw new Error("missing_quiz");
      const ownerAnonId = getAnonId();

      trackEvent("analysis_upgraded", { report_id: id, image_count: files.length });

      // Flip the row back to "processing" first - runAnalysis deliberately
      // no-ops on anything that isn't in that state, which is what keeps a
      // stray call from burning tokens on an already-finished report.
      const reopened = await reopenForScreenshots({ data: { id, ownerAnonId } });
      if ("error" in reopened) throw new Error(reopened.error);

      // Not awaited, same as everywhere else: /analyzing/$id polls for the
      // result, so this request dying mid-flight doesn't cost the user
      // anything.
      void runAnalysis({
        data: {
          id,
          ownerAnonId,
          quiz,
          images: files.map((f) => ({ mediaType: f.mediaType, base64: f.base64 })),
        },
      }).catch(() => {
        // Failure UI lives on /analyzing/$id.
      });

      return id;
    },
    onSuccess: (analysisId) => {
      navigate({ to: "/analyzing/$id", params: { id: analysisId } });
    },
  });

  return (
    <div className="mt-5 rounded-3xl border border-purple/25 bg-purple-soft/40 p-6 shadow-sm">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-purple-deep">
        <ScanLine className="h-4 w-4" />
        Preliminary read
      </div>
      <h3 className="font-serif mt-3 text-2xl leading-tight">This one's based on your answers only</h3>
      <p className="mt-2 text-sm text-ink/75">
        Add a few screenshots and we'll re-run it against their actual messages - real quotes, what they meant, and
        exactly what to send back. Free, and it doesn't use up another check.
      </p>

      {quiz ? (
        <>
          <label
            {...getRootProps({ htmlFor: `vibecheck-upgrade-${id}` })}
            className={`mt-5 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition ${
              isDragActive ? "border-pink bg-pink-soft/40" : "border-purple/30 bg-white/60"
            }`}
          >
            <input {...getInputProps({ id: `vibecheck-upgrade-${id}`, style: VISUALLY_HIDDEN_INPUT })} />
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-pink text-white shadow-sm">
              <UploadIcon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-sm font-medium">Tap to add screenshots</p>
            <p className="mt-1 text-xs text-ink/55">2-5 is the sweet spot</p>
          </label>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          {files.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative aspect-[3/5] overflow-hidden rounded-xl bg-muted">
                  <img src={f.previewUrl} alt="" className="h-full w-full object-cover" />
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

          <button
            onClick={() => mutation.mutate()}
            disabled={files.length === 0 || mutation.isPending}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-purple-deep px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            {mutation.isPending ? "Re-reading..." : "Sharpen this read"}
          </button>

          {mutation.isError && (
            <p className="mt-3 text-sm text-destructive">
              Couldn't re-run that one. Give it another go in a moment.
            </p>
          )}
        </>
      ) : (
        // Opened on a different device (or storage was cleared), so the
        // original answers are gone and there's nothing to re-run against.
        // Offer a fresh start rather than a button that can only fail.
        <Link
          to="/quiz"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-purple-deep px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" />
          Run a fresh check with screenshots
        </Link>
      )}
    </div>
  );
}
