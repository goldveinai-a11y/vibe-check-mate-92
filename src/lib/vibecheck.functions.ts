import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Report } from "./vibecheck-schema";

// Shared entitlement check — same logic getAnalysisFull uses (paid on this
// exact analysis, OR an active/trialing subscription matched by anon id or
// verified email). Factored out so the chat endpoints below gate access
// identically instead of re-implementing (and potentially drifting from)
// this logic.
type Entitlement = { entitled: boolean; plan: string | null };

async function checkEntitlement(row: {
  paid: boolean | null;
  owner_anon_id?: string | null;
  email?: string | null;
  plan?: string | null;
}, ownerAnonId: string): Promise<Entitlement> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { getVerifiedEmail } = await import("./optional-auth.server");

  // "plan" here means the plan that GRANTED access, not just whatever is
  // stored on this row — a subscriber can view a report they never
  // personally paid for (e.g. after a device switch) purely on the
  // strength of their active subscription, so the plan attached to that
  // path should win over a stale/absent value on the row itself.
  if (row.paid === true) return { entitled: true, plan: row.plan ?? "single" };

  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("plan")
    .eq("owner_anon_id", ownerAnonId)
    .in("status", ["active", "trialing"])
    .limit(1)
    .maybeSingle();
  if (sub) return { entitled: true, plan: sub.plan as string };

  const verifiedEmail = await getVerifiedEmail();
  if (verifiedEmail) {
    // Note: a "this exact analysis is paid AND its stored email matches"
    // branch is intentionally not repeated here — the `row.paid === true`
    // check above already returns unconditionally for any paid analysis
    // (paid analyses are addressed by unguessable UUID), so re-checking it
    // here would always be unreachable dead code (TS correctly flags this
    // as a type error once written as an early-return chain).
    const { data: subByEmail } = await supabaseAdmin
      .from("subscriptions")
      .select("plan")
      .eq("email", verifiedEmail)
      .in("status", ["active", "trialing"])
      .limit(1)
      .maybeSingle();
    if (subByEmail) return { entitled: true, plan: subByEmail.plan as string };
  }
  return { entitled: false, plan: null };
}

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
          report_json: report as never,
          preview_json: preview as never,
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

export type FullResult =
  | { locked: true; paid: boolean }
  | { locked: false; report: unknown; createdAt: string };

export const getAnalysisFull = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FullInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("analyses")
      .select("id, status, report_json, paid, owner_anon_id, email, plan, created_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");

    // Entitlement, checked in order:
    // 1. This exact analysis was paid for.
    // 2. An active/trialing subscription matches the anonymous device id —
    //    fast path right after purchase, same browser, no login needed.
    // 3. The signed-in user's verified email (from a Supabase magic-link
    //    session, attached automatically to this request if one exists)
    //    matches this analysis's owner email, or matches an active/trialing
    //    subscription. This is what makes access survive a new device or a
    //    cleared browser — the anon id alone never would.
    const { entitled } = await checkEntitlement(row, data.ownerAnonId);

    if (!entitled || !row.report_json) {
      return { locked: true as const, paid: row.paid === true };
    }
    return {
      locked: false as const,
      report: JSON.parse(JSON.stringify(row.report_json)),
      createdAt: row.created_at as string,
    };
  });

// --- Real "Vibe Decay Trajectory": check-ins on an existing conversation.
// A check-in re-scores NEW screenshots of the SAME conversation, taken
// later, and stores just the 7 numbers (see report_checkins migration
// 20260710090000). Once 2+ real data points exist (the original report +
// at least one check-in), report.$id.tsx renders the trend from these real
// scores instead of the seeded pseudo-random sparkline. Same entitlement
// gate as the report itself, plus a rate limit purely as an abuse safety
// net — unlike the Haiku chat, each check-in is a real vision call, so
// cost per call isn't trivial even though Haiku keeps it far cheaper than
// a full Sonnet report.

const CHECKIN_LIMIT = 30;

const CheckinIdInputSchema = z.object({
  id: z.string().uuid(),
  ownerAnonId: z.string().min(8).max(128),
});

export type Checkin = { overallScore: number; scores: Record<string, number>; createdAt: string };

export const getCheckins = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CheckinIdInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ checkins: Checkin[]; locked: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("analyses")
      .select("paid, owner_anon_id, email, plan")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");

    const { entitled } = await checkEntitlement(row, data.ownerAnonId);
    if (!entitled) return { checkins: [], locked: true };

    const { data: rows, error: checkinErr } = await supabaseAdmin
      .from("report_checkins")
      .select("overall_score, scores, created_at")
      .eq("analysis_id", data.id)
      .order("created_at", { ascending: true });
    if (checkinErr) throw new Error(checkinErr.message);

    return {
      checkins: (rows ?? []).map((r) => ({
        overallScore: r.overall_score as number,
        scores: r.scores as Record<string, number>,
        createdAt: r.created_at as string,
      })),
      locked: false,
    };
  });

const AddCheckinInputSchema = z.object({
  id: z.string().uuid(),
  ownerAnonId: z.string().min(8).max(128),
  images: z.array(ImageInputSchema).min(1).max(6),
});

export const addCheckin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AddCheckinInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ overallScore: number } | { error: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { analyzeCheckinScores } = await import("./vibecheck.server");

    const { data: row, error } = await supabaseAdmin
      .from("analyses")
      .select("paid, owner_anon_id, email, plan")
      .eq("id", data.id)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!row) return { error: "Report not found" };

    const { entitled } = await checkEntitlement(row, data.ownerAnonId);
    if (!entitled) return { error: "locked" };

    const { count } = await supabaseAdmin
      .from("report_checkins")
      .select("id", { count: "exact", head: true })
      .eq("analysis_id", data.id);
    if ((count ?? 0) >= CHECKIN_LIMIT) {
      return { error: "limit_reached" };
    }

    let scores;
    try {
      scores = await analyzeCheckinScores(data.images);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Check-in analysis failed" };
    }

    const overallScore = Math.round(
      (scores.interest_score +
        scores.reciprocity_score +
        scores.emotional_warmth +
        scores.response_consistency +
        scores.flirting_signals +
        (100 - scores.toxicity_score) +
        scores.conversation_health) /
        7,
    );

    const { error: insErr } = await supabaseAdmin.from("report_checkins").insert({
      analysis_id: data.id,
      overall_score: overallScore,
      scores: scores as never,
    });
    if (insErr) return { error: insErr.message };

    return { overallScore };
  });

// --- AI-chat over the report (Reply Help's neighbor feature: "ask why your
// Interest Score dropped"). Same entitlement gate as the report itself —
// only unlocked once the user has paid. Messages persist in
// report_chat_messages (see migration 20260709090000) so the rate limit
// below can't be reset by refreshing the page, and so the questions people
// actually ask become a real VOC data source.

const ChatIdInputSchema = z.object({
  id: z.string().uuid(),
  ownerAnonId: z.string().min(8).max(128),
});

export type ChatMessage = { role: "user" | "assistant"; content: string; createdAt: string };

export const getChatMessages = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatIdInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ messages: ChatMessage[]; limit: number; locked: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { chatLimitForPlan } = await import("./vibecheck-chat.server");

    const { data: row, error } = await supabaseAdmin
      .from("analyses")
      .select("paid, owner_anon_id, email, plan")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");

    const { entitled, plan } = await checkEntitlement(row, data.ownerAnonId);
    const limit = chatLimitForPlan(plan);
    if (!entitled) return { messages: [], limit, locked: true };

    const { data: msgs, error: msgErr } = await supabaseAdmin
      .from("report_chat_messages")
      .select("role, content, created_at")
      .eq("analysis_id", data.id)
      .order("created_at", { ascending: true });
    if (msgErr) throw new Error(msgErr.message);

    return {
      messages: (msgs ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content as string,
        createdAt: m.created_at as string,
      })),
      limit,
      locked: false,
    };
  });

const SendChatInputSchema = z.object({
  id: z.string().uuid(),
  ownerAnonId: z.string().min(8).max(128),
  message: z.string().min(1).max(400),
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SendChatInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ reply: string; remaining: number } | { error: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { answerReportQuestion, chatLimitForPlan } = await import("./vibecheck-chat.server");
    type ChatTurn = { role: "user" | "assistant"; content: string };

    const { data: row, error } = await supabaseAdmin
      .from("analyses")
      .select("report_json, paid, owner_anon_id, email, plan")
      .eq("id", data.id)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!row || !row.report_json) return { error: "Report not found" };

    const { entitled, plan } = await checkEntitlement(row, data.ownerAnonId);
    if (!entitled) return { error: "locked" };
    const limit = chatLimitForPlan(plan);

    const { count } = await supabaseAdmin
      .from("report_chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("analysis_id", data.id);
    const existingRows = count ?? 0;
    // Each exchange writes 2 rows (user + assistant); gate on the user's
    // half of the budget so "remaining" reads as "questions left", not rows.
    const questionsUsed = Math.ceil(existingRows / 2);
    if (questionsUsed >= limit) {
      return { error: "limit_reached" };
    }

    const { data: historyRows, error: histErr } = await supabaseAdmin
      .from("report_chat_messages")
      .select("role, content")
      .eq("analysis_id", data.id)
      .order("created_at", { ascending: true });
    if (histErr) return { error: histErr.message };

    const turns: ChatTurn[] = (historyRows ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content as string,
    }));
    const report = JSON.parse(JSON.stringify(row.report_json)) as Report;

    let reply: string;
    try {
      reply = await answerReportQuestion(report, turns, data.message);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Chat failed" };
    }

    const { error: insErr } = await supabaseAdmin.from("report_chat_messages").insert([
      { analysis_id: data.id, role: "user", content: data.message },
      { analysis_id: data.id, role: "assistant", content: reply },
    ]);
    if (insErr) return { error: insErr.message };

    return { reply, remaining: limit - (questionsUsed + 1) };
  });

const PlanEnum = z.enum(["single", "monthly", "yearly"]);

const CheckoutInputSchema = z.object({
  analysisId: z.string().uuid(),
  ownerAnonId: z.string().min(8).max(128),
  plan: PlanEnum,
  environment: z.enum(["sandbox", "live"]),
  returnUrl: z.string().url(),
  // Required, not optional: email is now the durable identity key that lets
  // a buyer find their report(s) again from any device via magic link,
  // instead of relying solely on a localStorage anon id.
  email: z.string().email(),
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

      // For monthly plan: resolve the one-time $4.99 upfront trial fee.
      let trialFeePriceId: string | undefined;
      if (data.plan === "monthly") {
        const feePrices = await stripe.prices.list({ lookup_keys: ["vibecheck_monthly_trial_fee"] });
        if (!feePrices.data.length) return { error: "Trial fee price not found" };
        trialFeePriceId = feePrices.data[0].id;
      }

      const metadata = {
        analysisId: data.analysisId,
        ownerAnonId: data.ownerAnonId,
        plan: data.plan,
        email: data.email,
      };

      const isSubscription = data.plan !== "single";
      // For monthly paid trial: charge $4.99 upfront AND start recurring $9.99/mo
      // after 3-day trial. Stripe Checkout does NOT support subscription_data.add_invoice_items,
      // but a subscription-mode session accepts a one-time price as a second line item —
      // that one-time price is billed at checkout completion while the recurring price
      // enters the trial. This gives us the exact "pay now, then subscribe" behavior.
      const lineItems: Array<{ price: string; quantity: number }> = [
        { price: price.id, quantity: 1 },
      ];
      if (data.plan === "monthly" && trialFeePriceId) {
        lineItems.push({ price: trialFeePriceId, quantity: 1 });
      }

      const session = await stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: isSubscription ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        automatic_tax: { enabled: true },
        customer_email: data.email,
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
        .update({ stripe_session_id: session.id, plan: data.plan, email: data.email })
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

export const getUnlockedCount = createServerFn({ method: "GET" }).handler(async () => {
  // Uses supabaseAdmin (service role) rather than a raw anon-key client —
  // the analyses table no longer grants anon/authenticated any direct
  // access (see the RLS lockdown migration), so this was the last caller
  // that needed fixing to match.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("analyses")
    .select("id", { count: "exact", head: true })
    .eq("paid", true);
  // Baseline social-proof floor so early days still read as busy.
  const baseline = 12_478;
  return { count: baseline + (count ?? 0) };
});

const MyReportsResultSchema = z.object({
  email: z.string(),
  reports: z.array(
    z.object({
      id: z.string(),
      createdAt: z.string(),
      status: z.string(),
      plan: z.string().nullable(),
      paid: z.boolean(),
      interestScore: z.number().nullable(),
      headline: z.string().nullable(),
    }),
  ),
  subscription: z
    .object({
      plan: z.string(),
      status: z.string(),
      currentPeriodEnd: z.string().nullable(),
    })
    .nullable(),
});
export type MyReportsResult = z.infer<typeof MyReportsResultSchema>;

// Protected by requireSupabaseAuth — only returns data for the email address
// verified on the caller's own Supabase magic-link session. This is the
// "My Reports" account page: it's what makes a purchase (or subscription)
// findable again from a brand-new device, instead of being stranded behind
// a localStorage id that only ever lived in one browser.
export const getMyReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyReportsResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = (context.claims as { email?: string }).email?.toLowerCase();
    if (!email) throw new Error("No verified email on this session");

    const { data: analyses, error } = await supabaseAdmin
      .from("analyses")
      .select("id, created_at, status, plan, paid, preview_json")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("email", email)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1);

    return {
      email,
      reports: (analyses ?? []).map((a) => {
        const preview = a.preview_json as {
          scores?: { interest_score?: number };
          viral_preview?: { pop_culture_match?: { couple?: string }; vibe_award?: { title?: string } };
        } | null;
        return {
          id: a.id as string,
          createdAt: a.created_at as string,
          status: a.status as string,
          plan: (a.plan as string | null) ?? null,
          paid: a.paid as boolean,
          interestScore: preview?.scores?.interest_score ?? null,
          headline: preview?.viral_preview?.vibe_award?.title ?? preview?.viral_preview?.pop_culture_match?.couple ?? null,
        };
      }),
      subscription: subs?.[0]
        ? {
            plan: subs[0].plan as string,
            status: subs[0].status as string,
            currentPeriodEnd: (subs[0].current_period_end as string | null) ?? null,
          }
        : null,
    };
  });

const BillingPortalInputSchema = z.object({
  returnUrl: z.string().url(),
  environment: z.enum(["sandbox", "live"]),
});

// Protected by requireSupabaseAuth. Hands off subscription management to
// Stripe's own hosted Billing Portal instead of building cancel/upgrade UI —
// cheaper to build and maintain, and Stripe already handles the compliance
// details (clear cancellation, proration, receipts).
export const createBillingPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BillingPortalInputSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createStripeClient, getStripeErrorMessage } = await import("./stripe.server");
    const email = (context.claims as { email?: string }).email?.toLowerCase();
    if (!email) return { error: "No verified email on this session" };

    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("email", email)
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return { error: "No subscription found for this account" };
    }

    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id as string,
        return_url: data.returnUrl,
      });
      return { url: session.url };
    } catch (err) {
      return { error: getStripeErrorMessage(err) };
    }
  });