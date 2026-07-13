import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, Section, SubHeading, Callout } from "@/components/LegalLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — VibeCheck" },
      {
        name: "description",
        content: "VibeCheck Terms of Service — AI chat analysis reports and subscription plans. Entertainment and self-reflection only.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout label="Legal · Terms" title={<>Terms of Service</>} updated="July 13, 2026">
      <p className="text-ink/80">
        These Terms of Service ("Terms") govern your access to and use of{" "}
        <a href="https://vibecheckapp.app" className="underline decoration-ink/20 hover:text-ink">vibecheckapp.app</a>{" "}
        ("Website") and the VibeCheck digital product ("Product"), operated by <strong>Dmitrii Bosiachenko</strong>,
        autónomo registered in Spain (NIF: Z3795401S) ("we," "us," or "VibeCheck").
      </p>
      <p className="text-ink/80">
        By accessing the Website or purchasing the Product, you agree to these Terms. If you do not agree, do not
        use the Website or purchase the Product.
      </p>

      <Callout tone="highlight">
        <strong>Entertainment and self-reflection only.</strong> VibeCheck generates an AI-written read of a
        conversation you upload. It is <strong>not</strong> professional advice — not relationship counseling,
        therapy, legal, or psychological advice — and it does not predict the future or any real person's actual
        feelings or intentions. Any decision you make based on a report is your own. See Section 08.
      </Callout>

      <Section num="01" title="The product">
        <p>
          VibeCheck lets you upload screenshots of a text conversation. We send those screenshots to an AI model to
          generate a written report: an interest-level read, flagged patterns, and a compatibility/outlook take on
          the conversation. Reports are delivered on-screen and, where you provide one, by email.
        </p>
        <p>
          Your uploaded screenshots are used only to generate that report and are <strong>not stored</strong> by us
          — see our <a href="/privacy" className="underline decoration-ink/20 hover:text-ink">Privacy Policy</a> for
          exactly how that works.
        </p>
      </Section>

      <Section num="02" title="Respect for other people in your screenshots">
        <p>
          A conversation you upload necessarily includes messages from someone else. By using VibeCheck you confirm
          that you have the right to share that conversation and that you will not use the Product to harass, stalk,
          dox, defame, or make decisions that materially harm another real person. We reserve the right to suspend
          accounts we reasonably believe are being used this way.
        </p>
      </Section>

      <Section num="03" title="Plans, purchase, and payment">
        <p>Purchases are processed by <strong>Stripe</strong>. We are the seller and merchant of record.</p>
        <div className="space-y-2">
          <SubHeading>Single Report — one-time</SubHeading>
          <p>A one-time payment for a full report on one conversation, including a limited number of AI chat
            follow-up questions about your results. No subscription, no recurring charge.</p>
        </div>
        <div className="space-y-2">
          <SubHeading>Premium Monthly — trial + recurring subscription</SubHeading>
          <p>An upfront one-time fee unlocks your first report plus a short trial period of expanded access
            (additional uploads and AI chat about your results). Unless you cancel before the trial ends, the
            subscription automatically renews at the then-current monthly price until you cancel.</p>
        </div>
        <div className="space-y-2">
          <SubHeading>Premium Yearly — recurring subscription</SubHeading>
          <p>A yearly subscription billed upfront for 12 months of expanded access. It renews automatically at the
            then-current annual price unless you cancel before the renewal date.</p>
        </div>
        <p>
          Current prices for each plan are shown on the Website at checkout — that page is the authoritative source
          of pricing, not this document. Features described as "unlimited" (such as AI chat about your results) are
          subject to reasonable fair-use limits to prevent abuse.
        </p>
        <p>
          You are responsible for providing accurate information at checkout, including a valid email address. We
          are not liable for delivery failures caused by incorrect contact details.
        </p>
      </Section>

      <Section num="04" title="Managing and cancelling your subscription">
        <p>
          You can view and cancel an active subscription at any time from your account page, via Stripe's secure
          billing portal. Cancelling stops future renewals; it does not retroactively refund charges already made
          except as described in our{" "}
          <a href="/refund" className="underline decoration-ink/20 hover:text-ink">Refund Policy</a>.
        </p>
      </Section>

      <Section num="05" title="Referral codes and discounts">
        <p>
          We may offer referral links or discount codes. Any discount, reward, or referral program is described at
          the point it's offered and may be changed, limited, or discontinued at any time without notice.
        </p>
      </Section>

      <Section num="06" title="License">
        <SubHeading>What you can do</SubHeading>
        <ul className="list-disc space-y-1 pl-5">
          <li>Use your report for your own personal, non-commercial purposes</li>
          <li>Save or share your own report with people of your choosing for personal use</li>
        </ul>
        <SubHeading>What you cannot do</SubHeading>
        <ul className="list-disc space-y-1 pl-5">
          <li>Resell, sublicense, or commercially redistribute reports or the service</li>
          <li>Use the Website, its content, or its outputs to build a substantially similar competing product</li>
          <li>Remove or alter any copyright, trademark, or attribution notices</li>
          <li>Use the Product for any unlawful purpose, or attempt to disrupt, scrape, or reverse-engineer the service</li>
        </ul>
      </Section>

      <Section num="07" title="Third-party services">
        <p>The Product relies on third-party services we don't control, including:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Stripe</strong> for payment processing and subscription billing</li>
          <li><strong>Anthropic</strong> (Claude models) to analyze the conversation you upload and generate your report</li>
          <li><strong>Supabase</strong> for account authentication and storing your report data</li>
        </ul>
        <p>If a provider changes in ways that affect the Product, we'll make reasonable efforts to keep the service
          running but don't guarantee continued functionality.</p>
      </Section>

      <Section num="08" title="Disclaimer of warranties & no advice">
        <p>The Product is provided <strong>"as is"</strong> and <strong>"as available"</strong> without warranties
          of any kind, express or implied, including merchantability, fitness for a particular purpose, or
          non-infringement.</p>
        <p><strong>VibeCheck is for entertainment and self-reflection only.</strong> AI-generated reads of a
          conversation are probabilistic guesses based on limited text, not facts about another person's real
          feelings, intentions, or character. We do not warrant that:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>The Product will be uninterrupted, secure, or error-free</li>
          <li>The analysis, flags, or scores are accurate, complete, or reflect reality</li>
          <li>Using the Product will produce any particular outcome in your relationship or conversation</li>
        </ul>
        <p>Any decision you make about a relationship, conversation, or person is your own decision and
          responsibility. For real relationship, legal, or mental-health concerns, consult a qualified
          professional.</p>
      </Section>

      <Section num="09" title="Limitation of liability">
        <p>To the maximum extent permitted by law, our total liability for any claim arising out of or relating to
          these Terms or the Product is limited to the amount you paid us in the 12 months preceding the claim.</p>
        <p>We are not liable for any indirect, incidental, consequential, special, or punitive damages, including
          lost profits, lost data, relationship or emotional harm, or loss of opportunity.</p>
        <Callout>
          <strong>Consumer protection notice:</strong> the limitations above do not exclude or limit our liability
          for fraud, gross negligence, willful misconduct, death or personal injury caused by our negligence, or any
          other liability that cannot be excluded under Spanish or EU consumer protection law.
        </Callout>
      </Section>

      <Section num="10" title="Intellectual property">
        <p>The Website, including its design, content, and software, is owned by <strong>Dmitrii Bosiachenko</strong>{" "}
          and protected by Spanish, EU, and international copyright law. "VibeCheck" and its branding are our
          trademarks. Unauthorized use is prohibited.</p>
      </Section>

      <Section num="11" title="Termination">
        <p>We may suspend or terminate your access if you breach these Terms, particularly Sections 02 or 06.
          Termination does not entitle you to a refund unless required by our{" "}
          <a href="/refund" className="underline decoration-ink/20 hover:text-ink">Refund Policy</a>. Sections 08,
          09, 10, and 14 survive termination.</p>
      </Section>

      <Section num="12" title="Changes to these terms">
        <p>We may update these Terms from time to time. Material changes affecting your rights will be communicated
          by email where we have your address. Continued use after changes constitutes acceptance of the updated
          Terms.</p>
      </Section>

      <Section num="13" title="Privacy">
        <p>Our handling of your personal data, including your uploaded conversations and report content, is
          described in our <a href="/privacy" className="underline decoration-ink/20 hover:text-ink">Privacy
          Policy</a>.</p>
      </Section>

      <Section num="14" title="Governing law and dispute resolution">
        <p>These Terms are governed by the laws of <strong>Spain</strong>, without regard to its conflict of laws
          principles.</p>
        <p>Any dispute shall be resolved by the competent courts of <strong>Oviedo, Asturias, Spain</strong>, unless
          mandatory consumer protection law assigns jurisdiction to the courts of your country of residence.</p>
        <p>EU consumers may also use the European Commission's{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener" className="underline decoration-ink/20 hover:text-ink">
            Online Dispute Resolution platform
          </a>{" "}
          to resolve disputes out of court.</p>
      </Section>

      <Section num="15" title="Contact">
        <p>For any question about these Terms, contact:</p>
        <p>
          <strong>Dmitrii Bosiachenko</strong><br />
          Autónomo (registered in Spain)<br />
          NIF: Z3795401S<br />
          Calle Manuel Pedregal 17, 5°B<br />
          33001 Oviedo, Asturias<br />
          Spain<br />
          <br />
          <a href="mailto:hello@vibecheckapp.app" className="underline decoration-ink/20 hover:text-ink">
            hello@vibecheckapp.app
          </a>
        </p>
      </Section>
    </LegalLayout>
  );
}
