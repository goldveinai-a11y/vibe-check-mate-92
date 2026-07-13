import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import type { ReactNode } from "react";

// Shared shell for the 4 legal pages (Terms / Privacy / Refund / Cookies).
// Keeps them visually consistent with the rest of the site (cream bg, ink
// text, pink accents, DM Serif Display headings) without duplicating the
// header/footer/typography boilerplate in every route file.

interface LegalLayoutProps {
  label: string; // e.g. "Legal · Terms"
  title: ReactNode; // e.g. <>Terms of <em className="not-italic text-ink/60">Service</em></>
  updated: string; // e.g. "July 13, 2026"
  intro?: ReactNode;
  children: ReactNode;
}

export function LegalLayout({ label, title, updated, intro, children }: LegalLayoutProps) {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader showUnlock={false} />

      <section className="px-5 pt-6 pb-16 sm:px-8 sm:pt-10 sm:pb-24">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-pink">{label}</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-2 text-sm text-ink/50">Last updated · {updated}</p>

          {intro && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-sm leading-relaxed text-ink/70">
              {intro}
            </div>
          )}

          <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-ink/90">
            {children}
          </div>

          <LegalCrossLinks />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function LegalCrossLinks() {
  return (
    <p className="mt-16 border-t border-border/60 pt-6 text-xs text-ink/40">
      See also:{" "}
      <Link to="/terms" className="underline decoration-ink/20 hover:text-ink">Terms of Service</Link>
      {" · "}
      <Link to="/privacy" className="underline decoration-ink/20 hover:text-ink">Privacy Policy</Link>
      {" · "}
      <Link to="/refund" className="underline decoration-ink/20 hover:text-ink">Refund Policy</Link>
      {" · "}
      <Link to="/cookies" className="underline decoration-ink/20 hover:text-ink">Cookie Policy</Link>
    </p>
  );
}

export function Section({ num, title, children }: { num: string; title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="flex items-baseline gap-3 font-serif text-2xl">
        <span className="font-sans text-xs font-semibold tracking-widest text-pink">{num}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-ink/80">{children}</div>
    </div>
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-sm font-semibold text-ink">{children}</h3>;
}

export function Callout({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "highlight" }) {
  return (
    <div
      className={
        tone === "highlight"
          ? "rounded-2xl border border-pink/40 bg-pink-soft/50 p-5 text-sm leading-relaxed text-ink/90"
          : "rounded-2xl border border-border bg-card p-5 text-sm leading-relaxed text-ink/80"
      }
    >
      {children}
    </div>
  );
}

export function PromiseBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-mint/50 bg-mint-soft/40 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint">{label}</p>
      <p className="mt-2 font-serif text-xl leading-snug text-ink">{children}</p>
    </div>
  );
}

export function DataTable({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      {rows.map(([k, v], i) => (
        <div
          key={i}
          className={`grid grid-cols-1 sm:grid-cols-[200px_1fr] ${i > 0 ? "border-t border-border" : ""}`}
        >
          <div className="bg-card px-4 py-3 text-sm font-semibold text-ink">{k}</div>
          <div className="border-t border-border px-4 py-3 text-sm text-ink/70 sm:border-l sm:border-t-0">{v}</div>
        </div>
      ))}
    </div>
  );
}

export function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-pink/50 text-xs font-semibold text-pink">
            {i + 1}
          </span>
          <span className="text-ink/80">{item}</span>
        </li>
      ))}
    </ol>
  );
}
