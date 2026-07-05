import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-10 pb-16">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg">💬</span>
            <span className="font-serif text-2xl">VibeCheck</span>
          </div>
          <span className="text-xs text-muted-foreground">by AI</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-serif mt-16 text-5xl leading-[1.05] tracking-tight"
        >
          Are they actually into you?
          <br />
          <span className="italic text-purple">Or delusional?</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-6 text-base text-muted-foreground"
        >
          Upload your chat screenshots. Get an unfiltered breakdown of interest, red flags, and where it's really going — no sugarcoating.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-10"
        >
          <Link
            to="/upload"
            className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90"
          >
            Reveal the vibe 🔮
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Free preview · Screenshots auto-delete in 24h
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground"
        >
          {[
            { emoji: "📸", label: "Upload chat" },
            { emoji: "🧠", label: "AI analyzes" },
            { emoji: "💅", label: "Truth served" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-card p-4 shadow-sm">
              <div className="text-2xl">{s.emoji}</div>
              <div className="mt-2">{s.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 rounded-3xl bg-secondary p-6"
        >
          <p className="font-serif text-xl leading-snug">
            "I was full delulu. The report ended it in 2 minutes flat."
          </p>
          <p className="mt-3 text-xs text-muted-foreground">— Maya, 27</p>
        </motion.div>
      </div>
    </main>
  );
}
