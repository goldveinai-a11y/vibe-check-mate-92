import { useEffect, useState, type RefObject } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

type Props = {
  id: string;
  showAfterRef: RefObject<HTMLElement | null>;
  hideNearRef: RefObject<HTMLElement | null>;
};

export function StickyUnlockBar({ id, showAfterRef, hideNearRef }: Props) {
  const [pastHero, setPastHero] = useState(false);
  const [nearFooter, setNearFooter] = useState(false);

  useEffect(() => {
    const a = showAfterRef.current;
    if (!a) return;
    const io = new IntersectionObserver(
      ([e]) => setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    io.observe(a);
    return () => io.disconnect();
  }, [showAfterRef]);

  useEffect(() => {
    const b = hideNearRef.current;
    if (!b) return;
    const io = new IntersectionObserver(
      ([e]) => setNearFooter(e.isIntersecting),
      { threshold: 0.1 },
    );
    io.observe(b);
    return () => io.disconnect();
  }, [hideNearRef]);

  const visible = pastHero && !nearFooter;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-cream/95 backdrop-blur transition-all duration-300 sm:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-ink/50">Full report</div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl leading-none text-ink">$4.99</span>
            <span className="text-xs text-ink/50 line-through">$9.99</span>
          </div>
        </div>
        <Link
          to="/paywall/$id"
          params={{ id }}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-pink px-5 py-3 text-sm font-medium text-white shadow-md"
        >
          <Lock className="h-3.5 w-3.5" />
          Unlock
        </Link>
      </div>
    </div>
  );
}