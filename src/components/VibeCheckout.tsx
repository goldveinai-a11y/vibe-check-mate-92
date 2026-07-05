import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/lib/vibecheck.functions";

interface Props {
  analysisId: string;
  ownerAnonId: string;
  plan: "single" | "monthly" | "yearly";
  returnUrl: string;
  email?: string;
}

export function VibeCheckout({ analysisId, ownerAnonId, plan, returnUrl, email }: Props) {
  const fetchClientSecret = async () => {
    const result = await createCheckoutSession({
      data: { analysisId, ownerAnonId, plan, returnUrl, environment: getStripeEnvironment(), email },
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