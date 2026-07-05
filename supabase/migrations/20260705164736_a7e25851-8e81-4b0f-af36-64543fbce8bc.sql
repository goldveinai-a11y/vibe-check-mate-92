
-- ============ analyses ============
CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','failed')),
  error_message TEXT,
  image_paths TEXT[] NOT NULL DEFAULT '{}',
  preview_json JSONB,
  report_json JSONB,
  paid BOOLEAN NOT NULL DEFAULT false,
  plan TEXT CHECK (plan IN ('single','monthly','yearly')),
  stripe_session_id TEXT,
  stripe_subscription_id TEXT,
  email TEXT,
  owner_anon_id TEXT NOT NULL
);

CREATE INDEX analyses_owner_anon_idx ON public.analyses (owner_anon_id);
CREATE INDEX analyses_created_at_idx ON public.analyses (created_at DESC);

GRANT SELECT, INSERT ON public.analyses TO anon;
GRANT SELECT, INSERT, UPDATE ON public.analyses TO authenticated;
GRANT ALL ON public.analyses TO service_role;

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Anyone can create a shell row (UUID becomes the shareable id).
CREATE POLICY "Anyone can create analyses"
  ON public.analyses FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Anyone can read by UUID; the server strips paid-only fields before returning.
CREATE POLICY "Anyone can read analyses"
  ON public.analyses FOR SELECT
  TO anon, authenticated
  USING (true);

-- No client updates. Server-side (service_role) handles all writes to report_json / paid.

-- ============ subscriptions ============
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  owner_anon_id TEXT,
  email TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('monthly','yearly')),
  status TEXT NOT NULL CHECK (status IN ('trialing','active','canceled','past_due','incomplete')),
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT
);

CREATE INDEX subscriptions_owner_idx ON public.subscriptions (owner_anon_id);
CREATE INDEX subscriptions_email_idx ON public.subscriptions (email);

GRANT ALL ON public.subscriptions TO service_role;
-- No anon/authenticated grants: server functions only.

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated — service_role bypasses RLS.

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER analyses_set_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
