-- Real "Vibe Decay Trajectory": before this migration, the trend shown in
-- the full report was a one-shot AI narrative rendered through a seeded
-- pseudo-random sparkline (see DecaySparkline in report.$id.tsx) — it looked
-- like a trend but was never based on repeated observations of the same
-- conversation. This table lets a user re-upload screenshots of the SAME
-- conversation later ("Track this conversation") so the trend line can be
-- built from real, timestamped score snapshots instead.

CREATE TABLE IF NOT EXISTS public.report_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  overall_score integer NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  scores jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_checkins_analysis_id_idx
  ON public.report_checkins (analysis_id, created_at);

ALTER TABLE public.report_checkins ENABLE ROW LEVEL SECURITY;

-- Same security model as report_chat_messages / analyses: every read/write
-- goes through TanStack Start server functions using the service-role
-- client (supabaseAdmin), which bypasses RLS and does its own entitlement
-- check against `analyses` before touching this table. anon/authenticated
-- never need direct access.
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.report_checkins FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.report_checkins FROM authenticated;

CREATE POLICY "No client access to report_checkins"
  ON public.report_checkins FOR SELECT
  TO anon, authenticated
  USING (false);
