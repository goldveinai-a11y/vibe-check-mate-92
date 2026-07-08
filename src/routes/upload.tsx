import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Upload as UploadIcon, Sparkles, ShieldCheck } from "lucide-react";
import { createAnalysis } from "@/lib/vibecheck.functions";
import { getAnonId, rememberOwnedAnalysis, captureRefCode } from "@/lib/anon-id";
import { SiteHeader } from "@/components/SiteHeader";
import { AnalyzingOverlay } from "@/components/AnalyzingOverlay";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload your chat — VibeCheck" },
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

function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<Prepared[]>([]);
  const [error, setError] = useState<string | null>(null);
  // holds the analysis id once the API call resolves, but we don't navigate
  // immediately — we let AnalyzingOverlay play its "burn to ash" beat first
  // so the (true) claim that screenshots are deleted actually lands visually.
  const [readyId, setReadyId] = useState<string | null>(null);

  // Safety net for Wingman referral links that point straight at /upload
  // instead of the landing page — captureRefCode() is a no-op if a code
  // was already stored.
  useEffect(() => {
    captureRefCode();
  }, []);

  const onDrop = useCallback(async (accepted: File[]) => {
    setError(null);
    try {
      const prepared = await Promise.all(accepted.slice(0, 6 - files.length).map(fileToPrepared));
      setFiles((cur) => [...cur, ...prepared].slice(0, 6));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read files");
    }
  }, [files.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [], "image/jpeg": [], "image/webp": [], "image/gif": [] },
    maxFiles: 6,
    maxSize: 6 * 1024 * 1024,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const ownerAnonId = getAnonId();
      const result = await createAnalysis({
        data: {
          ownerAnonId,
          images: files.map((f) => ({ mediaType: f.mediaType, base64: f.base64 })),
        },
      });
      if ("error" in result) throw new Error(result.error);
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

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader />
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
              Drop in a few screenshots of your conversation and we'll read the vibe. The more context, the better the insights.
            </p>
            <p className="mt-1 max-w-lg text-xs text-ink/50">
              2-5 screenshots is the sweet spot — enough context for a sharp read, up to 6 max per upload.
            </p>
          </div>

          <div className="mt-10 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-8">
            <div
              {...getRootProps()}
              className={`flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                isDragActive ? "border-pink bg-pink-soft/40" : "border-purple-soft bg-purple-soft/25"
              }`}
            >
              <input {...getInputProps()} />
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-pink text-white shadow-sm">
                <UploadIcon className="h-6 w-6" />
              </div>
              <h3 className="font-serif mt-5 text-xl sm:text-2xl">Drag &amp; drop your screenshots here</h3>
              <p className="mt-2 text-sm text-ink/60">or tap to browse — PNG, JPG, HEIC accepted</p>
              <span className="mt-6 inline-flex items-center rounded-full bg-pink px-6 py-3 text-sm font-medium text-white shadow-sm">
                Choose images
              </span>
            </div>

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
                          ×
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
                Zero receipts kept: encrypted in transit, read once, deleted the second your report's ready. Never stored, never shared, never used to train anything.
              </p>
            </div>

            {mutation.isError && (
              // Never render mutation.error's raw message — it's whatever
              // internal exception string createAnalysis threw (a Zod
              // validation error once rendered here verbatim, as literal
              // JSON, in production). Fixed, friendly copy only.
              <p className="mt-4 text-sm text-destructive">
                Something went sideways reading that one. Try again — if it keeps happening, swap in a clearer screenshot.
              </p>
            )}

            <button
              onClick={() => mutation.mutate()}
              disabled={files.length === 0 || mutation.isPending}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink px-6 py-4 text-base font-medium text-white shadow-md transition hover:opacity-90 disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />
              {mutation.isPending ? "Analyzing…" : "Analyze the vibe"}
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