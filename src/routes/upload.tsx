import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { createAnalysis } from "@/lib/vibecheck.functions";
import { getAnonId, rememberOwnedAnalysis } from "@/lib/anon-id";

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
      navigate({ to: "/results/$id", params: { id } });
    },
  });

  if (mutation.isPending) return <AnalyzingScreen />;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-6 pb-16">
        <Link to="/" className="text-sm text-muted-foreground">← Back</Link>
        <h1 className="font-serif mt-6 text-4xl leading-tight">Drop your chat screenshots</h1>
        <p className="mt-2 text-sm text-muted-foreground">1 to 6 images. PNG, JPG, WebP, GIF. Auto-deleted in 24h.</p>

        <div
          {...getRootProps()}
          className={`mt-6 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition ${
            isDragActive ? "border-primary bg-secondary" : "border-border bg-card"
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-3xl">📸</div>
          <p className="mt-3 text-sm font-medium">
            {isDragActive ? "Drop them here" : "Tap or drag screenshots"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Max 6 images, 6 MB each</p>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 grid grid-cols-3 gap-3"
            >
              {files.map((f, i) => (
                <div key={i} className="relative aspect-[3/5] overflow-hidden rounded-2xl bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
            </motion.div>
          )}
        </AnimatePresence>

        {mutation.isError && (
          <p className="mt-3 text-sm text-destructive">{(mutation.error as Error).message}</p>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={files.length === 0 || mutation.isPending}
          className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:opacity-40"
        >
          Reveal the vibe 🔮
        </button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Takes ~30 seconds. Free preview, no signup.
        </p>
      </div>
    </main>
  );
}

const STATUSES = [
  "Reading the vibe…",
  "Counting emojis and dry replies…",
  "Detecting attachment style…",
  "Cross-referencing the ick database…",
  "Composing the truth…",
];

function AnalyzingScreen() {
  const [step, setStep] = useState(0);
  useState(() => {
    if (typeof window !== "undefined") {
      const iv = setInterval(() => setStep((s) => (s + 1) % STATUSES.length), 2400);
      return () => clearInterval(iv);
    }
  });
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto mb-8 inline-flex h-24 w-24 items-center justify-center rounded-full bg-primary text-5xl text-primary-foreground shadow-xl shadow-primary/30"
        >
          🔮
        </motion.div>
        <h2 className="font-serif text-3xl">Cooking your report</h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 text-sm text-muted-foreground"
          >
            {STATUSES[step]}
          </motion.p>
        </AnimatePresence>
      </div>
    </main>
  );
}