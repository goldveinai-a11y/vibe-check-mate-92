import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/lib/vibecheck.functions";

interface Props {
  analysisId: string;
  ownerAnonId: string;
  plan: "single" | "monthly" | "yearly";
  returnUrl: string;
  // Required: the durable identity key that lets the buyer find this (and
  // any future) report again from any device via magic link, instead of
  // relying solely on a localStorage anon id.
  email: string;
  // Wingman referral V1 — set if the visitor arrived via a friend's
  // ?ref= link. Server re-validates it's real and not self-referred;
  // silently ignored if not.
  refCode?: string | null;
}

export function VibeCheckout({ analysisId, ownerAnonId, plan, returnUrl, email, refCode }: Props) {
  const fetchClientSecret = async () => {
    const result = await createCheckoutSession({
      data: { analysisId, ownerAnonId, plan, returnUrl, environment: getStripeEnvironment(), email, ...(refCode ? { refCode } : {}) },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("No client secret returned");
    return result.clientSecret;
  };

  return (
    <div id="checkout" className="w-full">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}