import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Heart,
  Lock,
  Upload as UploadIcon,
  Wand2,
  PieChart,
  LineChart,
  MessageCircleHeart,
  Users,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Info,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader />

      {/* Hero */}
      <section className="px-5 pt-6 pb-14 sm:pt-10 sm:pb-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-soft px-4 py-2 text-xs font-medium text-purple-deep sm:text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered relationship insights
          </span>

          <h1 className="font-serif mt-8 text-[42px] leading-[1.05] sm:text-6xl md:text-7xl">
            Is it a match, or just mixed signals?
          </h1>

          <p className="mt-5 max-w-xl text-base text-ink/70 sm:text-lg">
            Upload your chat screenshots and let VibeCheck decode the vibe. Get an instant compatibility score and honest insights into where things really stand.
          </p>

          <Link
            to="/upload"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-pink px-8 py-4 text-base font-medium text-white shadow-md transition hover:opacity-90"
          >
            <Heart className="h-4 w-4 fill-white" />
            Start Your VibeCheck
          </Link>

          <div className="mt-6 flex items-center gap-2 text-sm text-ink/60">
            <Lock className="h-4 w-4 text-mint" />
            Private &amp; secure — screenshots are never stored or shared
          </div>

          <div className="mt-10 h-px w-full max-w-md bg-border/70" />
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 pb-16 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">How VibeCheck works</h2>
            <p className="mt-4 text-base text-ink/70">
              Three simple steps between you and real clarity about your connection.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {[
              {
                Icon: UploadIcon,
                iconBg: "bg-pink-soft",
                iconColor: "text-pink",
                title: "Upload screenshots",
                body: "Drop in your chat screenshots. Multiple images welcome — the more context, the better the read.",
              },
              {
                Icon: Wand2,
                iconBg: "bg-purple-soft",
                iconColor: "text-purple",
                title: "We read the energy",
                body: "Our AI analyzes tone, effort, and patterns to detect the true vibe of your conversation.",
              },
              {
                Icon: PieChart,
                iconBg: "bg-pink-soft",
                iconColor: "text-pink",
                title: "Get your insights",
                body: "Instantly see your compatibility score, relationship vibe, and the honest takeaway.",
              },
            ].map((s) => (
              <div key={s.title} className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${s.iconBg}`}>
                  <s.Icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                <h3 className="font-serif mt-5 text-xl">{s.title}</h3>
                <p className="mt-3 text-sm text-ink/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Science */}
      <section className="px-5 pb-16 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">The Science of Every Conversation</h2>
            <p className="mt-4 text-base text-ink/70">
              AI analyzes 100+ communication signals using concepts inspired by leading research in psychology, linguistics, and relationship science — not just keywords.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { Icon: Users, title: "Attachment Style Tracking", body: "Based on Attachment Theory (Bowlby & Ainsworth). Spot anxious or avoidant dynamics, mixed signals, and emotional availability hidden in text patterns." },
              { Icon: LineChart, title: "Relationship Longevity Metrics", body: "Inspired by Dr. John Gottman's Research. Analysis of communication balance, reciprocity, and the subtle signs that predict the health of a connection." },
              { Icon: MessageCircleHeart, title: "Empathy & Conflict Patterns", body: "Based on Nonviolent Communication (Rosenberg). Detects hidden tension, passive-aggressive tones, and genuine emotional warmth." },
              { Icon: Sparkles, title: "Hidden Emotional Signals", body: "Rooted in Paul Ekman's Emotion Research. Decodes micro-expressions in text, flirting signals, and changes in response consistency over time." },
              { Icon: Brain, title: "Dynamic Personality Profiling", body: "Leveraging the Big Five Model (Costa & McCrae). Understands your communication styles, behavioral tendencies, and conversational compatibility." },
            ].map((s) => (
              <div key={s.title} className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
                <s.Icon className="h-6 w-6 text-ink/80" />
                <h3 className="font-serif mt-4 text-lg">{s.title}</h3>
                <p className="mt-3 text-sm text-ink/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="px-5 pb-16 sm:pb-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border/50 bg-card p-6 shadow-sm sm:p-10">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl">Your privacy comes first</h3>
          </div>

          <ul className="mt-6 space-y-5">
            {[
              { title: "100% Confidential", body: "Your personal chat screenshots are processed securely and are never stored on our servers." },
              { title: "End-to-End Encryption", body: "All uploaded data is encrypted during transit and completely wiped instantly after the analysis is generated." },
              { title: "No Third-Party Sharing", body: "Your data belongs to you. We never sell, share, or use your conversations for AI training." },
            ].map((p) => (
              <li key={p.title} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-mint" />
                <p className="min-w-0 text-sm text-ink/80">
                  <span className="font-semibold text-ink">{p.title}</span> — {p.body}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-muted/60 p-4 text-xs text-ink/60">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>VibeCheck is designed for fun and reflection. Insights are AI-generated estimates and should not replace real conversations or professional advice.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-purple-soft px-5 py-16 sm:py-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">Ready to find out where you really stand?</h2>
          <p className="mt-4 text-base text-ink/70">
            It only takes a few screenshots. Your vibe check is one tap away.
          </p>
          <Link
            to="/upload"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-pink px-8 py-4 text-base font-medium text-white shadow-md transition hover:opacity-90"
          >
            <Heart className="h-4 w-4 fill-white" />
            Start Your VibeCheck
          </Link>
        </div>
      </section>
    </main>
  );
}
