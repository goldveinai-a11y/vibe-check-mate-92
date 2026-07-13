import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, Section, SubHeading, Callout, PromiseBox, DataTable } from "@/components/LegalLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — VibeCheck" },
      {
        name: "description",
        content: "VibeCheck Privacy Policy — how we handle the screenshots you upload, your report data, and your GDPR rights.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalLayout
      label="Legal · Privacy"
      title={<>Privacy Policy</>}
      updated="July 13, 2026"
      intro={
        <>
          <strong className="text-ink">In short —</strong> the screenshots you upload are analyzed and then
          deleted, not stored. We keep the AI-generated report, your account, and purchase data needed to run the
          service. Payments go through Stripe, analysis goes through Anthropic. We never sell your data, and you
          have full GDPR rights.
        </>
      }
    >
      <p className="text-ink/80">
        This Privacy Policy describes how <strong>Dmitrii Bosiachenko</strong>, autónomo registered in Spain (NIF:
        Z3795401S) ("we," "us," or "VibeCheck") collects, uses, and protects your personal information when you
        visit <a href="https://vibecheckapp.app" className="underline decoration-ink/20 hover:text-ink">vibecheckapp.app</a>{" "}
        or purchase our product.
      </p>
      <p className="text-ink/80">
        This policy is provided in compliance with the EU General Data Protection Regulation (GDPR, Regulation
        2016/679) and the Spanish Organic Law 3/2018 on Personal Data Protection and Guarantee of Digital Rights
        (LOPDGDD).
      </p>

      <PromiseBox label="Your screenshots, specifically">
        Your uploaded chat screenshots are sent directly to our AI provider to generate your report and are{" "}
        <strong>never saved</strong> to our servers or storage — not before, during, or after analysis.
      </PromiseBox>

      <Section num="01" title="Data controller">
        <DataTable
          rows={[
            ["Controller", "Dmitrii Bosiachenko (autónomo)"],
            ["NIF", "Z3795401S"],
            ["Postal address", <>See full legal details in our <a href="/terms" className="underline decoration-ink/20 hover:text-ink">Terms of Service</a></>],
            ["Email", <a href="mailto:hello@vibecheckapp.app" className="underline decoration-ink/20 hover:text-ink">hello@vibecheckapp.app</a>],
          ]}
        />
      </Section>

      <Section num="02" title="What data we collect">
        <SubHeading>Chat screenshots (not stored)</SubHeading>
        <p>
          When you upload a screenshot, it's transmitted securely and sent as image data directly to our AI
          provider, Anthropic, to generate your analysis. We do not save the image to our database or file storage
          at any point — the field where an image reference would be stored is always left empty. Once your report
          is generated, the image itself is gone from our systems.
        </p>
        <SubHeading>The report itself (stored)</SubHeading>
        <p>
          We do store the AI-generated report text — the interest read, flagged patterns, compatibility notes, and
          any short quotes the AI pulled from your conversation to support its analysis — so you can come back and
          view it later. Because a report can quote lines from your conversation, it may include text originally
          written by the other person in that conversation, not just you.
        </p>
        <SubHeading>Follow-up chat about your results</SubHeading>
        <p>
          If you ask our AI follow-up questions about your report, we store that question-and-answer history so you
          can revisit it, and so we can understand common questions and improve the product.
        </p>
        <SubHeading>Check-ins</SubHeading>
        <p>
          If you re-upload a later conversation to see how things have progressed, we store a snapshot of that
          score over time so we can show you a trend.
        </p>
        <SubHeading>Account and purchase data</SubHeading>
        <p>When you create an account or buy a plan, our processors collect and store:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your email address (for login and receipts)</li>
          <li>Plan type, subscription status, and Stripe order/subscription IDs</li>
          <li>A device-level anonymous identifier used to link a report to your session before you sign in</li>
        </ul>
        <p>We do not collect or store full payment card data — that's handled exclusively by Stripe.</p>
        <SubHeading>Referral data</SubHeading>
        <p>If you use or share a referral link, we store the referral code and a count of how many times it's been
          redeemed.</p>
        <SubHeading>Website usage data</SubHeading>
        <p>
          When you visit our Website, we collect standard analytics and advertising data (e.g. pages visited, device
          and browser type, approximate location from IP) via Google Analytics, Meta Pixel, and TikTok Pixel. See
          our <a href="/cookies" className="underline decoration-ink/20 hover:text-ink">Cookie Policy</a> for
          details.
        </p>
        <SubHeading>Communication data</SubHeading>
        <p>If you email us at <a href="mailto:hello@vibecheckapp.app" className="underline decoration-ink/20 hover:text-ink">hello@vibecheckapp.app</a>,
          we retain the content of your message for support and quality purposes.</p>
      </Section>

      <Section num="03" title="A note on the other person in your screenshots">
        <p>
          A conversation naturally includes messages from someone other than you. We treat any such text that ends
          up quoted in your report the same way we treat the rest of your report data — it is not used for
          advertising, not sold, and not linked to that other person's identity in any way we control. It exists
          only within your own report.
        </p>
      </Section>

      <Section num="04" title="Why we process your data">
        <DataTable
          rows={[
            ["Generating your report", "Performance of contract (Art. 6.1.b)"],
            ["Processing payment / subscription billing", "Performance of contract (Art. 6.1.b)"],
            ["Tax and accounting records", "Legal obligation (Art. 6.1.c) — Spanish tax law"],
            ["Improving the product from Q&A / usage patterns", "Legitimate interest (Art. 6.1.f)"],
            ["Analytics and advertising measurement", "Consent / Legitimate interest (Art. 6.1.a / 6.1.f)"],
          ]}
        />
      </Section>

      <Section num="05" title="How long we keep your data">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Chat screenshots:</strong> not retained — deleted immediately after analysis</li>
          <li><strong>Reports, check-ins, and chat history:</strong> kept so you can re-access them; deleted on request</li>
          <li><strong>Purchase records:</strong> 6 years (Spanish tax law requires invoice retention)</li>
          <li><strong>Email correspondence:</strong> 2 years after last contact</li>
          <li><strong>Analytics data:</strong> 14 months</li>
        </ul>
      </Section>

      <Section num="06" title="Who we share data with">
        <p>We share data only with the processors necessary to run the service:</p>
        <DataTable
          rows={[
            ["Anthropic", <>Receives your screenshot image(s) to generate your AI analysis; not retained by us afterward</>],
            ["Stripe", <>Payment and subscription billing. <a href="https://stripe.com/privacy" target="_blank" rel="noopener" className="underline decoration-ink/20 hover:text-ink">Their privacy policy</a></>],
            ["Supabase", "Account authentication and database hosting for your reports and account data"],
            ["Google (Analytics)", <>Website analytics. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="underline decoration-ink/20 hover:text-ink">Their privacy policy</a></>],
            ["Meta Platforms", <>Advertising measurement when our ads run. <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener" className="underline decoration-ink/20 hover:text-ink">Their privacy policy</a></>],
            ["TikTok", <>Advertising measurement when our ads run. <a href="https://www.tiktok.com/legal/page/eea/privacy-policy/en" target="_blank" rel="noopener" className="underline decoration-ink/20 hover:text-ink">Their privacy policy</a></>],
            ["Spanish tax authorities (AEAT)", "Required reporting under Spanish tax law"],
          ]}
        />
        <p>We never sell your personal data.</p>
      </Section>

      <Section num="07" title="International data transfers">
        <p>Some processors (e.g. Stripe, Anthropic, Google, Meta, TikTok) may process data in the United States. All
          such transfers rely on GDPR Chapter V safeguards (EU-US Data Privacy Framework and/or Standard Contractual
          Clauses).</p>
      </Section>

      <Section num="08" title="Your rights">
        <p>Under GDPR and Spanish law, you have the right to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Access</strong> the personal data we hold about you</li>
          <li><strong>Rectify</strong> inaccurate or incomplete data</li>
          <li><strong>Erase</strong> your data ("right to be forgotten"), subject to legal retention obligations</li>
          <li><strong>Restrict</strong> processing of your data</li>
          <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
          <li><strong>Object</strong> to processing based on legitimate interest</li>
          <li><strong>Withdraw consent</strong> at any time, where processing is based on consent</li>
          <li><strong>Lodge a complaint</strong> with the Spanish Data Protection Authority (AEPD) at{" "}
            <a href="https://www.aepd.es" target="_blank" rel="noopener" className="underline decoration-ink/20 hover:text-ink">aepd.es</a></li>
        </ul>
        <p>
          There is currently no self-service "delete my account" button in the product — to exercise any of these
          rights, including deletion, email us at{" "}
          <a href="mailto:hello@vibecheckapp.app" className="underline decoration-ink/20 hover:text-ink">hello@vibecheckapp.app</a>.
          We respond within 30 days as required by GDPR.
        </p>
      </Section>

      <Section num="09" title="Security">
        <p>We apply industry-standard security measures: TLS encryption in transit, encrypted storage at rest, and
          limited access on a need-to-know basis. Our payment processor Stripe is PCI-DSS Level 1 certified.</p>
        <p>Despite reasonable precautions, no method of transmission over the internet is 100% secure. If a data
          breach occurs that affects your data, we will notify you and the AEPD within 72 hours as required by GDPR
          Article 33.</p>
      </Section>

      <Section num="10" title="Children">
        <p>VibeCheck is not directed at children under 16. We do not knowingly collect personal data from children.
          If you believe a child has provided us with personal data, contact us and we will delete it.</p>
      </Section>

      <Section num="11" title="Changes to this policy">
        <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated
          "Last updated" date. Material changes affecting your rights will be communicated by email where we have
          your address.</p>
      </Section>

      <Section num="12" title="Contact">
        <p>For any privacy question or to exercise your rights, contact:</p>
        <p>
          <strong>Dmitrii Bosiachenko</strong><br />
          Autónomo (registered in Spain)<br />
          <a href="mailto:hello@vibecheckapp.app" className="underline decoration-ink/20 hover:text-ink">hello@vibecheckapp.app</a><br />
          <br />
          <span className="text-sm text-ink/50">
            Postal address, NIF, and full legal details: see our{" "}
            <a href="/terms" className="underline decoration-ink/20 hover:text-ink">Terms of Service</a>.
          </span>
        </p>
      </Section>
    </LegalLayout>
  );
}
