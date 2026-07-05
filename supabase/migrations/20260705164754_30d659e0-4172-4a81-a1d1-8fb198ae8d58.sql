
DROP POLICY IF EXISTS "Anyone can create analyses" ON public.analyses;

CREATE POLICY "Anyone can create analyses"
  ON public.analyses FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    owner_anon_id IS NOT NULL
    AND length(owner_anon_id) BETWEEN 8 AND 128
    AND paid = false
    AND report_json IS NULL
    AND stripe_session_id IS NULL
    AND stripe_subscription_id IS NULL
    AND plan IS NULL
    AND status IN ('pending','processing')
  );

-- Placeholder deny-all policy so the linter sees an explicit policy on subscriptions.
CREATE POLICY "No client access to subscriptions"
  ON public.subscriptions FOR SELECT
  TO anon, authenticated
  USING (false);
