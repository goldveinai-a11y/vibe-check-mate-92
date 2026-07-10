-- Revoke execute from anon/authenticated on internal email queue functions
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM anon, authenticated, PUBLIC;

-- Set a fixed search_path on the SECURITY DEFINER functions that lacked it
ALTER FUNCTION public.enqueue_email(TEXT, JSONB) SET search_path = public;
ALTER FUNCTION public.read_email_batch(TEXT, INT, INT) SET search_path = public;
ALTER FUNCTION public.delete_email(TEXT, BIGINT) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) SET search_path = public;
