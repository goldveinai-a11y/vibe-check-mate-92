import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, Section, SubHeading, Callout, PromiseBox, Steps } from "@/components/LegalLayout";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — VibeCheck" },
      {
        name: "description",
        content: "VibeCheck refund policy for one-time reports and subscription plans (Premium Monthly, Premium Yearly).",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <LegalLayout label="Legal · Refund" title={<>Refund Policy</>} updated="July 13, 2026">
      <PromiseBox label="14-day money back">
        If your VibeCheck report isn't useful, email us within 14 days of the charge for a full refund. No forms,
        no waiting.
      </PromiseBox>

      <Section num="01" title="Plans this policy covers">
        <p>VibeCheck sells three plans, and each has a slightly different refund shape:</p>
        <SubHeading>Single Report (one-time)</SubHeading>
        <p>A one-time payment for one report. No subscription, no future charge.</p>
        <SubHeading>Premium Monthly (trial + recurring)</SubHeading>
        <p>
          An upfront one-time fee that unlocks your first report and a short trial of expanded access. If you don't
          cancel before the trial ends, the subscription renews automatically at the then-current monthly price and
          continues renewing until you cancel.
        </p>
        <SubHeading>Premium Yearly (recurring)</SubHeading>
        <p>A yearly subscription billed upfront for 12 months, renewing automatically at the then-current annual
          price unless you cancel before the renewal date.</p>
      </Section>

      <Section num="02" title="Eligibility">
        <p>You are eligible for a full refund of a given charge if <strong>all</strong> of the following are true:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your refund request is sent within <strong>14 days</strong> of that specific charge (the initial
            payment, or a later subscription renewal).</li>
          <li>This is your <strong>first refund request</strong> for that charge. Repeat refund requests on the same
            plan by the same customer are reviewed case by case.</li>
          <li>You have not resold or publicly redistributed the report(s) covered by that charge (sharing privately
            with people of your choosing, as allowed by our{" "}
            <a href="/terms" className="underline decoration-ink/20 hover:text-ink">Terms</a>, is fine).</li>
        </ul>

        <Callout>
          <strong>EU consumers — statutory withdrawal right:</strong> by purchasing and accessing a report, you
          expressly consent to the immediate performance of the contract and acknowledge that you lose your
          statutory 14-day right of withdrawal under Article 16(m) of the EU Consumer Rights Directive 2011/83/EU
          (transposed in Spain as Article 103.m of the Royal Legislative Decree 1/2007 — TRLGDCU). Our 14-day refund
          policy is offered as a goodwill gesture above this statutory waiver.
        </Callout>
      </Section>

      <Section num="03" title="Cancelling a subscription vs. requesting a refund">
        <p>
          These are two different actions. <strong>Cancelling</strong> stops future renewals and is done yourself,
          any time, from your account page via Stripe's billing portal — no need to contact us. <strong>Requesting
          a refund</strong> asks us to return money already charged, and follows the process below.
        </p>
        <p>
          If you cancel a Premium Monthly plan before your trial ends, you keep the report from your initial
          payment and are never charged the recurring monthly price.
        </p>
      </Section>

      <Section num="04" title="How to request a refund">
        <Steps
          items={[
            <>Email <a href="mailto:hello@vibecheckapp.app" className="underline decoration-ink/20 hover:text-ink">hello@vibecheckapp.app</a> from the same address used at checkout.</>,
            <>Include your <strong>Stripe order, subscription, or receipt ID</strong> (found in your confirmation email).</>,
            <>Tell us briefly what didn't work for you — one line is enough.</>,
          ]}
        />
        <p>We respond to refund requests within <strong>2 business days</strong>. Once approved, the refund is
          issued by Stripe to your original payment method.</p>
      </Section>

      <Section num="05" title="Processing time">
        <p>Approved refunds typically appear on your card within <strong>5–10 business days</strong>, depending on
          your bank or card issuer. Some banks may take up to two billing cycles to display the credit.</p>
        <p>We'll notify you by email as soon as the refund is processed on our end.</p>
      </Section>

      <Section num="06" title="What is not refundable">
        <ul className="list-disc space-y-1 pl-5">
          <li>Requests received <strong>more than 14 days</strong> after the charge in question.</li>
          <li>Subscription renewal charges from <strong>before</strong> the most recent 14-day window — we don't
            retroactively refund months of usage.</li>
          <li>Cases where the report has been <strong>resold, publicly redistributed, or made available to the
            general public</strong> in violation of our <a href="/terms" className="underline decoration-ink/20 hover:text-ink">Terms of Service</a>.</li>
          <li>Dissatisfaction with the <strong>relationship outcome or life decisions</strong> you base on a report.
            VibeCheck is an entertainment and self-reflection product — an AI's read on a conversation, not advice
            and not a prediction. Any decision about your relationship or conversation is your own responsibility,
            as stated in our disclaimer.</li>
        </ul>
      </Section>

      <Section num="07" title="Defective or non-delivered reports">
        <p>
          If you paid but didn't receive a report, or generation failed, contact us immediately at{" "}
          <a href="mailto:hello@vibecheckapp.app" className="underline decoration-ink/20 hover:text-ink">hello@vibecheckapp.app</a>.
          We'll either regenerate the report or issue a full refund at our discretion — this is not subject to the
          14-day window.
        </p>
      </Section>

      <Section num="08" title="Why our refund policy exists in this form">
        <p>
          Because a VibeCheck report is delivered instantly and digitally, we can't enforce a "return" the way a
          physical product can be returned. Our policy is built on trust: a no-questions 14-day window per charge to
          let you evaluate the report, reviewed case by case if it's used repeatedly to get free reports.
        </p>
      </Section>

      <Section num="09" title="Questions">
        <p>For any question about this policy, contact:</p>
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
