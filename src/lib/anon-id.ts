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