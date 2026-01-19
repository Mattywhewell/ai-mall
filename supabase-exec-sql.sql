-- idempotent creation of a helper to execute arbitrary SELECT SQL and return jsonb
-- WARNING: This should only be used in trusted contexts (service role).
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _res jsonb;
BEGIN
  -- Wrap the provided SQL to produce JSON aggregation of rows
  EXECUTE format('SELECT coalesce(jsonb_agg(t), '"[]"'::jsonb) FROM (%s) t', sql) INTO _res;
  RETURN COALESCE(_res, '[]'::jsonb);
EXCEPTION WHEN OTHERS THEN
  -- Return error message to caller as JSON
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;