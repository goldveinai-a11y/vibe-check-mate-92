import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhook, type StripeEnv } from "@/lib/stripe.server";

async function markAnalysisPaid(session: Record<string, unknown>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const analysisId = metadata.analysisId;
  if (!analysisId) return;
  await supabaseAdmin
    .from("analyses")
    .update({
      paid: true,
      plan: metadata.plan as "single" | "monthly" | "yearly",
      stripe_session_id: (session.id as string) ?? null,
      stripe_subscription_id: (session.subscription as string) ?? null,
      // Belt-and-suspenders: createCheckoutSession already writes this at
      // session-creation time, but re-affirming it here from the verified
      // webhook payload means the durable email key is set even if that
      // earlier write ever failed.
      email: metadata.email ? metadata.email.toLowerCase() : null,
    })
    .eq("id", analysisId);
}

async function upsertSubscription(sub: Record<string, unknown>, env: StripeEnv) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const metadata = (sub.metadata ?? {}) as Record<string, string>;
  const ownerAnonId = metadata.ownerAnonId ?? null;
  const plan = (metadata.plan ?? "monthly") as "monthly" | "yearly";
  const status = sub.status as string;
  const items = (sub.items as { data: Array<{ current_period_end?: number }> } | undefined)?.data ?? [];
  const item = items[0];
  const periodEnd = item?.current_period_end ?? (sub as { current_period_end?: number }).current_period_end;

  const email = metadata.email ? metadata.email.toLowerCase() : null;

  await supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
        owner_anon_id: ownerAnonId,
        email,
        plan,
        status: (["trialing", "active", "canceled", "past_due", "incomplete"].includes(status)
          ? status
          : "incomplete") as "trialing" | "active" | "canceled" | "past_due" | "incomplete",
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        stripe_subscription_id: sub.id as string,
        stripe_customer_id: (sub.customer as string) ?? null,
      },
      { onConflict: "stripe_subscription_id" },
    );
  // Note: env is available if we later add an environment column.
  void env;
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(request, env);
          switch (event.type) {
            case "checkout.session.completed":
              await markAnalysisPaid(event.data.object);
              break;
            case "customer.subscription.created":
            case "customer.subscription.updated":
              await upsertSubscription(event.data.object, env);
              break;
            case "customer.subscription.deleted":
              await upsertSubscription({ ...event.data.object, status: "canceled" }, env);
              break;
            default:
              console.log("Unhandled event:", event.type);
          }
          return Response.json({ received: true });
        } catch (err) {
          console.error("Webhook error:", err);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});