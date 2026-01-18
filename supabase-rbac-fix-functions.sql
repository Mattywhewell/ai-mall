-- Fix RBAC functions/triggers to explicitly reference public schema types and tables
-- This prevents Auth (GoTrue) sessions from failing when search_path doesn't include public.

/* get_user_role */
CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID)
RETURNS public.user_role AS $$
BEGIN
  RETURN (SELECT role FROM public.user_roles WHERE user_id = uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

/* is_admin */
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.user_roles WHERE user_id = uid) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

/* is_supplier */
CREATE OR REPLACE FUNCTION public.is_supplier(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.user_roles WHERE user_id = uid) = 'supplier';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

/* get_supplier_id */
CREATE OR REPLACE FUNCTION public.get_supplier_id(uid UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM public.suppliers WHERE user_id = uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

/* log_audit trigger function - qualify user_roles references */
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER AS $$
DECLARE
  actor_role public.user_role;
BEGIN
  -- Get actor role (qualified)
  SELECT role INTO actor_role FROM public.user_roles WHERE user_id = auth.uid()::uuid;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      table_name,
      record_id,
      action,
      actor_id,
      actor_role,
      changes,
      metadata
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id,
      'created',
      auth.uid()::uuid,
      actor_role,
      to_jsonb(NEW),
      jsonb_build_object('operation', TG_OP, 'table', TG_TABLE_NAME)
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      table_name,
      record_id,
      action,
      actor_id,
      actor_role,
      changes,
      metadata
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id,
      CASE 
        WHEN OLD.status != NEW.status AND NEW.status = 'approved' THEN 'approved'
        WHEN OLD.status != NEW.status AND NEW.status = 'rejected' THEN 'rejected'
        WHEN NEW.flagged_at IS NOT NULL AND OLD.flagged_at IS NULL THEN 'flagged'
        ELSE 'updated'
      END,
      auth.uid()::uuid,
      actor_role,
      jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW),
        'diff', jsonb_diff(to_jsonb(OLD), to_jsonb(NEW))
      ),
      jsonb_build_object('operation', TG_OP, 'table', TG_TABLE_NAME)
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      table_name,
      record_id,
      action,
      actor_id,
      actor_role,
      changes,
      metadata
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id,
      'deleted',
      auth.uid()::uuid,
      actor_role,
      to_jsonb(OLD),
      jsonb_build_object('operation', TG_OP, 'table', TG_TABLE_NAME)
    );
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;
