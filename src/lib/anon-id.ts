const KEY = "vibecheck_anon_id";

export function getAnonId(): string {
  if (typeof window === "undefined") return "ssr-placeholder-anon-id";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

const OWNED_KEY = "vibecheck_owned_analyses";

export function rememberOwnedAnalysis(id: string) {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(OWNED_KEY);
  const list: string[] = raw ? JSON.parse(raw) : [];
  if (!list.includes(id)) {
    list.unshift(id);
    window.localStorage.setItem(OWNED_KEY, JSON.stringify(list.slice(0, 50)));
  }
}

// Wingman referral V1 — captured once (on first landing with ?ref=) and
// carried through the whole session to checkout, since the query param
// itself won't survive the upload → results → paywall hop.
const REF_KEY = "vibecheck_ref_code";

export function captureRefCode() {
  if (typeof window === "undefined") return;
  const existing = window.localStorage.getItem(REF_KEY);
  if (existing) return; // first-touch attribution — don't overwrite
  const ref = new URLSearchParams(window.location.search).get("ref");
  if (ref && /^[a-z0-9]{4,16}$/i.test(ref)) {
    window.localStorage.setItem(REF_KEY, ref.toLowerCase());
  }
}

export function getStoredRefCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REF_KEY);
}

// Sticky email on the paywall - a full browser navigation to Stripe
// Checkout and back (via cancel_url, or the native back button) remounts
// the page fresh, wiping plain useState. Someone who typed their email,
// picked a plan, bailed at Stripe, and came back to try a different plan
// shouldn't have to retype it. Not an account, not durable identity - just
// the same lightweight localStorage convenience as anon id / ref code
// above, scoped to this browser only.
const EMAIL_KEY = "vibecheck_email";

export function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(EMAIL_KEY);
}

export function setStoredEmail(email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EMAIL_KEY, email);
}
