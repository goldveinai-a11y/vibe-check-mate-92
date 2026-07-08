-- Wingman referral V1: "give a friend 20% off". Deliberately lean — this
-- only tracks the referral code and how many times it's been redeemed
-- (successful, paid checkouts). It does NOT yet auto-generate a reward
-- code back to the referrer (that would need live Stripe Promotion Code
-- creation via API, which needs Stripe API access this session doesn't
-- have) — the redemption_count is enough to validate whether referral
-- traffic is worth building that payout automation for. If it is, V2 adds
-- a reward_code column and a webhook step that creates a real one-time
-- Stripe Promotion Code for the referrer per redemption.

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  owner_anon_id text NOT NULL,
  owner_email text,
  redemption_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referrals_owner_anon_id_idx ON public.referrals (owner_anon_id);
CREATE INDEX IF NOT EXISTS referrals_code_idx ON public.referrals (code);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Same security model as the rest of this project: every read/write goes
-- through TanStack Start server functions using the service-role client
-- (supabaseAdmin), which bypasses RLS. anon/authenticated never need
-- direct access to this table.
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.referrals FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.referrals FROM authenticated;

CREATE POLICY "No client access to referrals"
  ON public.referrals FOR SELECT
  TO anon, authenticated
  USING (false);
