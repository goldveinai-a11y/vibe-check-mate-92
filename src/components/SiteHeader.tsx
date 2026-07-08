import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Heart } from "lucide-react";

interface Props {
  showUnlock?: boolean;
  unlockHref?: string;
  unlockParams?: { id: string };
}

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
          <Link to="/upload" className="text-sm text-ink/80 transition hover:text-ink">Upload</Link>
          <Link to="/my-reports" className="text-sm text-ink/80 transition hover:text-ink">My Reports</Link>
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
              <Link
                to="/upload"
                className="rounded-full bg-pink px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:opacity-90 sm:text-sm"
              >
                Unlock Full Report
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
            <Link to="/upload" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-ink hover:bg-muted">Upload</Link>
            <Link to="/my-reports" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-ink hover:bg-muted">My Reports</Link>
          </div>
        </div>
      )}
    </header>
  );
}