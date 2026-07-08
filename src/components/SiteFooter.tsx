import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

// Gives every page a real, deliberate ending instead of trailing off into
// blank cream after the last section. Only real, working links — no
// placeholder social icons pointing nowhere, since a footer that looks
// like it has a presence it doesn't have is exactly the kind of
// small dishonesty this product is trying to avoid everywhere else.
export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-cream px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
        <Link to="/" className="flex items-center gap-2">
          <Heart className="h-4 w-4 fill-ink text-ink" />
          <span className="text-base font-semibold text-ink">VibeCheck</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink/70">
          <Link to="/" className="transition hover:text-ink">Home</Link>
          <Link to="/upload" className="transition hover:text-ink">Upload</Link>
          <Link to="/my-reports" className="transition hover:text-ink">My Reports</Link>
        </nav>

        <p className="max-w-md text-xs leading-relaxed text-ink/50">
          VibeCheck is designed for fun and reflection. Insights are AI-generated estimates and should not replace real conversations or professional advice.
        </p>

        <p className="text-xs text-ink/40">© {new Date().getFullYear()} VibeCheck. All rights reserved.</p>
      </div>
    </footer>
  );
}
