import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, Section, Callout } from "@/components/LegalLayout";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — VibeCheck" },
      {
        name: "description",
        content: "VibeCheck cookie policy — what cookies we use, why we use them, and how to control them.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalLayout label="Legal · Cookies" title={<>Cookie Policy</>} updated="July 13, 2026">
      <p className="text-ink/80">
        This Cookie Policy explains how <strong>Dmitrii Bosiachenko</strong>, autónomo registered in Spain (NIF:
        Z3795401S) ("Company," "we," "us," and "our") uses cookies and similar technologies on{" "}
        <a href="https://vibecheckapp.app" className="underline decoration-ink/20 hover:text-ink">vibecheckapp.app</a>{" "}
        ("Website"). It explains what these technologies are, why we use them, and your rights to control them.
      </p>

      <Section num="01" title="What are cookies?">
        <p>Cookies are small data files placed on your device when you visit a website, used to make the site work
          and to provide reporting information.</p>
        <p>
          Cookies set by us are "first-party cookies." Cookies set by others are "third-party cookies" — these let
          third-party features (like advertising or analytics) work on our Website, and can recognize your device
          across other sites too.
        </p>
      </Section>

      <Section num="02" title="Why do we use cookies?">
        <p>
          Some cookies are <strong>essential</strong> — for example, keeping you signed in so you can view your
          reports. Others let us measure traffic and advertising performance (Google Analytics, Meta Pixel, TikTok
          Pixel) so we understand how people find and use VibeCheck.
        </p>
      </Section>

      <Section num="03" title="Cookies we use">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Essential / authentication</strong> — keeps you logged in and your session secure (Supabase auth). Cannot be disabled without breaking sign-in.</li>
          <li><strong>Analytics</strong> — Google Analytics (GA4), to understand how the Website is used.</li>
          <li><strong>Advertising</strong> — Meta Pixel and TikTok Pixel, to measure and improve our ad campaigns.</li>
        </ul>
      </Section>

      <Section num="04" title="How can I control cookies?">
        <Callout>
          <strong>In short —</strong> you have the right to decide whether to accept or reject non-essential
          cookies.
        </Callout>
        <p>
          Set your preferences using the cookie banner on our Website, which lets you accept or reject non-essential
          categories. Essential cookies can't be rejected — they're required for the Website to work. If you reject
          cookies you can still use the Website, though some functionality may be limited. You can also control
          cookies through your browser settings.
        </p>
      </Section>

      <Section num="05" title="How can I control cookies on my browser?">
        <p>The way to refuse cookies varies by browser — check your browser's help menu, or use these direct links:</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener" className="underline decoration-ink/20 hover:text-ink">Chrome →</a>
          <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener" className="underline decoration-ink/20 hover:text-ink">Firefox →</a>
          <a href="https://support.apple.com/en-ie/guide/safari/sfri11471/mac" target="_blank" rel="noopener" className="underline decoration-ink/20 hover:text-ink">Safari →</a>
          <a href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd" target="_blank" rel="noopener" className="underline decoration-ink/20 hover:text-ink">Edge →</a>
        </div>
        <p>Most advertising networks also offer opt-outs from targeted advertising:</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li><a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener" className="underline decoration-ink/20 hover:text-ink">Digital Advertising Alliance (US) →</a></li>
          <li><a href="http://www.youronlinechoices.com/" target="_blank" rel="noopener" className="underline decoration-ink/20 hover:text-ink">European Interactive Digital Advertising Alliance →</a></li>
        </ul>
      </Section>

      <Section num="06" title="Do you serve targeted advertising?">
        <p>
          Third parties (Google, Meta, TikTok) may serve cookies on your device to measure and serve advertising
          through our Website. This doesn't let us or them identify your name or contact details unless you choose
          to provide those.
        </p>
      </Section>

      <Section num="07" title="How often will you update this Cookie Policy?">
        <p>We may update this policy from time to time to reflect changes to the cookies we use, or for operational,
          legal, or regulatory reasons. The date at the top shows when it was last updated.</p>
      </Section>

      <Section num="08" title="Where can I get further information?">
        <p>
          If you have questions about our use of cookies, email{" "}
          <a href="mailto:hello@vibecheckapp.app" className="underline decoration-ink/20 hover:text-ink">hello@vibecheckapp.app</a>.
          Postal address and full legal details: see our{" "}
          <a href="/terms" className="underline decoration-ink/20 hover:text-ink">Terms of Service</a>.
        </p>
      </Section>
    </LegalLayout>
  );
}
