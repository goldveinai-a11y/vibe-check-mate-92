// Central analytics helper for VibeCheck.
// Fires the canonical GA4 event for every product event, and mirrors the 5
// monetization/funnel events to Meta Pixel + TikTok Pixel as their native
// standard events (drives Meta VBO / TikTok VOA value-based bidding and
// lookalike audiences). All other events are GA4-only product analytics and
// are intentionally not mirrored, so the ad pixels only see purchase-intent
// signal, not noise. See VibeCheck_Event_Taxonomy.md for the full spec.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (event: string, params?: Record<string, unknown>) => void };
  }
}

type MirrorTarget = { meta: string; tiktok: string; ga4Alias?: string };

const PLATFORM_MIRROR: Record<string, MirrorTarget> = {
  results_viewed: { meta: 'ViewContent', tiktok: 'ViewContent', ga4Alias: 'view_item' },
  paywall_viewed: { meta: 'ViewContent', tiktok: 'ViewContent', ga4Alias: 'view_item' },
  checkout_started: { meta: 'InitiateCheckout', tiktok: 'InitiateCheckout', ga4Alias: 'begin_checkout' },
  purchase_completed: { meta: 'Purchase', tiktok: 'CompletePayment', ga4Alias: 'purchase' },
  signup_completed: { meta: 'CompleteRegistration', tiktok: 'CompleteRegistration', ga4Alias: 'sign_up' },
};

export function trackEvent(eventName: string, properties: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;

const props = { platform: 'web', page_path: window.location.pathname, ...properties };

window.gtag?.('event', eventName, props);

const mirror = PLATFORM_MIRROR[eventName];
  if (mirror) {
    if (mirror.ga4Alias) window.gtag?.('event', mirror.ga4Alias, props);
    window.fbq?.('track', mirror.meta, props);
    window.ttq?.track(mirror.tiktok, props);
  }
}
