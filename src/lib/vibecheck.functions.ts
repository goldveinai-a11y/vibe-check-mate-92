import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ImageInputSchema = z.object({
  mediaType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
  base64: z.string().min(100).max(8_000_000), // ~6MB decoded
});

const CreateInputSchema = z.object({
  ownerAnonId: z.string().min(8).max(128),
  images: z.array(ImageInputSchema).min(1).max(6),
});

export const createAnalysis = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CreateInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ id: string } | { error: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { analyzeConversation } = await import("./vibecheck.server");
    const { buildPreview } = await import("./vibecheck-schema");

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("analyses")
      .insert({
        owner_anon_id: data.ownerAnonId,
        status: "processing",
        image_paths: [],
      })
      .select("id")
      .single();
    if (insErr || !inserted) return { error: insErr?.message ?? "Failed to create analysis" };
    const id = inserted.id as string;

    try {
      const report = await analyzeConversation(data.images);
      const preview = buildPreview(report);
      const { error: updErr } = await supabaseAdmin
        .from("analyses")
        .update({
          status: "ready",
          report_json: report as unknown as Record<string, unknown>,
          preview_json: preview as unknown as Record<string, unknown>,
        })
        .eq("id", id);
      if (updErr) return { error: updErr.message };
      return { id };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      await supabaseAdmin
        .from("analyses")
        .update({ status: "failed", error_message: message.slice(0, 500) })
        .eq("id", id);
      return { error: message };
    }
  });

const IdInputSchema = z.object({ id: z.string().uuid() });

export const getAnalysisPreview = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => IdInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("analyses")
      .select("id, status, preview_json, paid, error_message, created_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");
    return row;
  });

const FullInputSchema = z.object({
  id: z.string().uuid(),
  ownerAnonId: z.string().min(8).max(128),
});

export const getAnalysisFull = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FullInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ report: Record<string, unknown> } | { locked: true; paid: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("analyses")
      .select("id, status, report_json, paid, owner_anon_id")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");

    // Check entitlement: paid on this analysis OR active subscription for this owner.
    let entitled = row.paid === true;
    if (!entitled) {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("owner_anon_id", data.ownerAnonId)
        .in("status", ["active", "trialing"])
        .limit(1)
        .maybeSingle();
      if (sub) entitled = true;
    }

    if (!entitled || !row.report_json) {
      return { locked: true, paid: row.paid === true };
    }
    return { report: row.report_json as Record<string, unknown> };
  });

const PlanEnum = z.enum(["single", "monthly", "yearly"]);

const CheckoutInputSchema = z.object({
  analysisId: z.string().uuid(),
  ownerAnonId: z.string().min(8).max(128),
  plan: PlanEnum,
  environment: z.enum(["sandbox", "live"]),
  returnUrl: z.string().url(),
  email: z.string().email().optional(),
});

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CheckoutInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ clientSecret: string } | { error: string }> => {
    try {
      const { createStripeClient, getStripeErrorMessage } = await import("./stripe.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const stripe = createStripeClient(data.environment);

      const priceLookup = data.plan === "single"
        ? "vibecheck_single"
        : data.plan === "monthly"
          ? "vibecheck_monthly"
          : "vibecheck_yearly";
      const prices = await stripe.prices.list({ lookup_keys: [priceLookup] });
      if (!prices.data.length) return { error: `Price ${priceLookup} not found` };
      const price = prices.data[0];

      const metadata = {
        analysisId: data.analysisId,
        ownerAnonId: data.ownerAnonId,
        plan: data.plan,
      };

      const isSubscription = data.plan !== "single";
      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: isSubscription ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        ...(data.email ? { customer_email: data.email } : {}),
        metadata,
        ...(isSubscription
          ? {
              subscription_data: {
                metadata,
                ...(data.plan === "monthly" ? { trial_period_days: 3 } : {}),
              },
            }
          : {
              payment_intent_data: {
                description: "VibeCheck full report",
                metadata,
              },
            }),
      });

      await supabaseAdmin
        .from("analyses")
        .update({ stripe_session_id: session.id, plan: data.plan, email: data.email ?? null })
        .eq("id", data.analysisId);

      return { clientSecret: session.client_secret ?? "" };
    } catch (err) {
      const { getStripeErrorMessage } = await import("./stripe.server");
      return { error: getStripeErrorMessage(err) };
    }
  });

const SaveEmailInputSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});

export const saveEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SaveEmailInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("analyses").update({ email: data.email }).eq("id", data.id);
    return { ok: true };
  });