-- Report renaming: /account's report list showed an auto-generated
-- headline (the AI's vibe_award title or pop-culture couple name) with no
-- way to relabel it — requested after a user compared it to naming chats
-- in Claude, especially for tracking multiple analyses of the same person
-- over time. custom_label is nullable and purely a display override: when
-- set, getMyReports prefers it over the auto headline; when null/cleared,
-- it falls back to the existing auto-generated one. Nothing about
-- analysis/report generation changes.

ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS custom_label text;

-- Same security model as every other column on this table: only
-- supabaseAdmin (service role) touches it, via the renameReport server
-- function, which itself checks the caller's authenticated email against
-- this row's email before allowing the update. No new RLS policy needed —
-- analyses already has anon/authenticated fully locked out.
