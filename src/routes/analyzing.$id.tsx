import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, Sparkles, Activity, MessageSquare, Lock } from "lucide-react";
import { getAnalysisPreview } from "@/lib/vibecheck.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/analyzing/$id")({
  head: () => ({
    meta: [
      { title: "Analyzing your vibe - VibeCheck" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalyzingPage,
});

const STEPS = [
  { Icon: Sparkles, label: "Reading the energy of your conversation" },
  { Icon: Activity, label: "Detecting patterns in tone and replies" },
  { Icon: MessageSquare, label: "Calculating your compatibility vibes" },
];

function AnalyzingPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(15);
  const startedAtRef = useRef(Date.now());

  const { data } = useQuery({
    queryKey: ["analysis-preview", id],
    queryFn: () => getAnalysisPreview({ data: { id } }),
    refetchInterval: 2500,
  });

  useEffect(() => {
    const iv = setInterval(() => setProgress((p) => Math.min(p + 3, 92)), 700);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (data?.status === "ready") {
      const processingSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);
      trackEvent("analysis_completed", { report_id: id, processing_seconds: processingSeconds });
      navigate({ to: "/results/$id", params: { id } });
    }
  }, [data?.status, id, navigate]);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />
      <section className="px-5 pt-4">
        <div className="mx-auto max-w-xl rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-10">
          <div className="flex flex-col items-center text-center">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="grid h-28 w-28 place-items-center rounded-full bg-purple-soft"
            >
              <div className="grid h-20 w-20 place-items-center rounded-full bg-pink text-white shadow-md">
                <Heart className="h-8 w-8 fill-white" />
              </div>
            </motion.div>

            <h1 className="font-serif mt-6 text-3xl sm:text-4xl">Analyzing your vibe</h1>
            <p className="mt-3 text-sm text-ink/60">Reading the energy...</p>

            <div className="mt-6 w-full">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                  className="h-full bg-pink"
                />
              </div>
              <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center text-xs text-ink/60">
                <span className="min-w-0 truncate">Crunching the details</span>
                <span className="shrink-0 font-medium text-ink">{progress}%</span>
              </div>
            </div>
          </div>

          <ul className="mt-8 space-y-4">
            {STEPS.map((s) => (
              <li key={s.label} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-purple-soft text-purple-deep">
                  <s.Icon className="h-4 w-4" />
                </div>
                <span className="min-w-0 text-sm text-ink/80">{s.label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl bg-muted/50 p-4 text-xs text-ink/60">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="min-w-0">
              Your privacy is protected. Screenshots are heavily encrypted, analyzed instantly, and permanently deleted from our system immediately after processing.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
