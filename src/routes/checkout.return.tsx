import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { saveEmail } from "@/lib/vibecheck.functions";

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

  useEffect(() => {
    if (!id) return;
    // Give the webhook a couple seconds to land, then reveal the CTA.
    const t = setTimeout(() => {}, 500);
    return () => clearTimeout(t);
  }, [id]);

  if (!id) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-serif text-3xl">Payment received</h1>
          <p className="mt-2 text-sm text-muted-foreground">Missing report reference.</p>
          <Link to="/" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-primary-foreground">Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-mint text-4xl"
        >
          🔓
        </motion.div>
        <h1 className="font-serif text-4xl">Unlocked</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your full report is ready.</p>

        <button
          onClick={() => navigate({ to: "/report/$id", params: { id } })}
          className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20"
        >
          Read the full truth →
        </button>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!email) return;
            await saveEmail({ data: { id, email } });
            setSaved(true);
          }}
          className="mt-10 rounded-3xl bg-card p-5 text-left"
        >
          <p className="text-sm font-medium">Save access to this report</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Optional. We'll email the link so you can come back later.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm"
              disabled={saved}
            />
            <button
              type="submit"
              disabled={!email || saved}
              className="rounded-full bg-ink px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              {saved ? "Saved ✓" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}