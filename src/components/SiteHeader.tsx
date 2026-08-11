import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Heart } from "lucide-react";

interface Props {
  showUnlock?: boolean;
  unlockHref?: string;
  unlockParams?: { id: string };
}

// Nav is four items: Patterns earns its place because the section is what
// organic search lands on, and a visitor who arrives on an article needs an
// obvious way into the rest of them.
//
// Previously three items. "Upload" is gone - the chat is the
// entry point now, and a menu item pointing at the bare upload page sent
// people around the funnel rather than through it. "Example report" earns
// its slot because "what do I actually get" is the question standing
// between a visitor and a purchase; the research page is one level down in
// the footer, since that's something people seek out rather than something
// worth spending nav space on.
export function SiteHeader({ showUnlock = true, unlockHref, unlockParams }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <header className="w-full border-b border-transparent">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <Heart className="h-4 w-4 fill-ink text-ink" />
          <span className="text-base font-semibold text-ink">VibeCheck</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm text-ink/80 transition hover:text-ink">Home</Link>
          <Link to="/patterns" className="text-sm text-ink/80 transition hover:text-ink">Patterns</Link>
          <Link to="/quiz" className="text-sm text-ink/80 transition hover:text-ink">The full read</Link>
        </nav>

        <div className="flex items-center gap-2">
          {showUnlock && (
            unlockHref && unlockParams ? (
              <Link
                to="/paywall/$id"
                params={unlockParams}
                className="rounded-full bg-pink px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:opacity-90 sm:text-sm"
              >
                Unlock Full Report
              </Link>
            ) : (
              // No report exists yet in this branch, so there is nothing to
              // unlock - send people to the chat on the landing page instead of to
              // a page that can't do anything for them.
              <Link
                to="/"
          hash="chat"
                className="rounded-full bg-pink px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:opacity-90 sm:text-sm"
              >
                Start a check
              </Link>
            )
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink md:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/40 bg-cream md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-3">
            <Link to="/" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-ink hover:bg-muted">Home</Link>
            <Link to="/patterns" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-base text-ink/80 hover:bg-cream">Patterns</Link>
              <Link to="/quiz" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-base text-ink/80 hover:bg-cream">The full read</Link>
            <Link to="/science" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-ink hover:bg-muted">The research</Link>
          </div>
        </div>
      )}
    </header>
  );
}
