-- SECURITY FIX (Lovable scan):
--
-- Critical: storage.objects had zero RLS policies for the 'screenshots'
-- bucket. Verified via SQL before this migration: the bucket is private
-- (public = false) and has 0 objects in it, and a grep of the app source
-- confirms no code path ever calls supabase.storage — uploaded screenshots
-- are sent as base64 directly to the analysis call and never persisted to
-- Supabase Storage (image_paths on public.analyses is always inserted as an
-- empty array and never populated). So there was nothing exposed today, but
-- an empty, policy-less bucket is a hole waiting for someone to fall into
-- later (e.g. if it's ever flipped public, or a future feature starts
-- writing to it without adding policies first). Lock it down explicitly now.
--
-- Warning: 'analyses' has RLS enabled and all anon/authenticated grants were
-- already revoked in 20260708120000_lock_down_analyses_access.sql, but with
-- no explicit policy object the scanner can't tell "locked down on purpose"
-- from "policy missing by accident". Add the same placeholder deny-all
-- pattern already used for 'subscriptions' so the finding clears without
-- changing any actual access (grants were already revoked; this is belt and
-- suspenders + makes the intent explicit to linters and future readers).

DROP POLICY IF EXISTS "No client access to storage objects" ON storage.objects;
CREATE POLICY "No client access to storage objects"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (false);

DROP POLICY IF EXISTS "No client writes to storage objects" ON storage.objects;
CREATE POLICY "No client writes to storage objects"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "No client updates to storage objects" ON storage.objects;
CREATE POLICY "No client updates to storage objects"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (false);

DROP POLICY IF EXISTS "No client deletes to storage objects" ON storage.objects;
CREATE POLICY "No client deletes to storage objects"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (false);

DROP POLICY IF EXISTS "No client access to analyses" ON public.analyses;
CREATE POLICY "No client access to analyses"
  ON public.analyses FOR SELECT
  TO anon, authenticated
  USING (false);
