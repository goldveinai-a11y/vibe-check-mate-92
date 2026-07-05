import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, CheckCircle2, Loader2 } from "lucide-react";
import { saveEmail } from "@/lib/vibecheck.functions";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({ meta: [{ title: "Payment complete — VibeCheck" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    id: typeof s.id === "string" ? s.id : undefined,
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
  component: ReturnPage,
});

function ReturnPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!id) return;
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, [id]);

  if (!id) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
        <div>
          <h1 className="font-serif text-3xl">Payment received</h1>
          <p className="mt-2 text-sm text-ink/60">Missing report reference.</p>
          <Link to="/" className="mt-6 inline-block rounded-full bg-pink px-6 py-3 text-white">Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />
      <section className="flex min-h-[70vh] items-center justify-center px-5 py-16">
        <div className="w-full max-w-md text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-pink text-white shadow-md"
          >
            <Heart className="h-7 w-7 fill-white" />
          </motion.div>
          <h1 className="font-serif text-3xl sm:text-4xl">
            {ready ? "Your report is ready" : "Finalizing your report…"}
          </h1>
          <p className="mt-3 text-sm text-ink/60">
            {ready ? "Tap below to read the full compatibility breakdown." : "Just a moment while we unlock your premium insights."}
          </p>

          <div className="mt-6 flex justify-center">
            {ready ? (
              <CheckCircle2 className="h-6 w-6 text-mint" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-pink" />
            )}
          </div>

          <button
            onClick={() => navigate({ to: "/report/$id", params: { id } })}
            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-pink px-6 py-4 text-base font-medium text-white shadow-md transition hover:opacity-90"
          >
            View Full Report
          </button>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!email) return;
              await saveEmail({ data: { id, email } });
              setSaved(true);
            }}
            className="mt-8 rounded-3xl border border-border/60 bg-card p-5 text-left shadow-sm"
          >
            <p className="text-sm font-medium">Save access to this report</p>
            <p className="mt-1 text-xs text-ink/60">
              Optional. We'll email the link so you can come back later.
            </p>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="min-w-0 rounded-full border border-border bg-cream px-4 py-2 text-sm outline-none focus:border-pink"
                disabled={saved}
              />
              <button
                type="submit"
                disabled={!email || saved}
                className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm text-white disabled:opacity-40"
              >
                {saved ? "Saved ✓" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}