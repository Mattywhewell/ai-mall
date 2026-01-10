-- 03_functions_and_triggers.sql
-- Create helper functions and apply audit triggers (idempotent)

-- Helper functions
CREATE OR REPLACE FUNCTION jsonb_diff(old_data jsonb, new_data jsonb)
RETURNS jsonb AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  key text;
BEGIN
  FOR key IN SELECT jsonb_object_keys(new_data)
  LOOP
    IF old_data->key IS DISTINCT FROM new_data->key THEN
      result := result || jsonb_build_object(key, jsonb_build_object(
        'old', old_data->key,
        'new', new_data->key
      ));
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM user_roles WHERE user_id = uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM user_roles WHERE user_id = uid) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_supplier(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM user_roles WHERE user_id = uid) = 'supplier';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_supplier_id(uid UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM suppliers WHERE user_id = uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- log_audit function
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
DECLARE
  actor_role user_role;
BEGIN
  SELECT role INTO actor_role FROM user_roles WHERE user_id = auth.uid()::uuid;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, actor_id, actor_role, changes, metadata)
    VALUES (TG_TABLE_NAME, NEW.id, 'created', auth.uid()::uuid, actor_role, to_jsonb(NEW), jsonb_build_object('operation', TG_OP, 'table', TG_TABLE_NAME));
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, actor_id, actor_role, changes, metadata)
    VALUES (
      TG_TABLE_NAME,
      NEW.id,
      CASE 
        WHEN (TG_ARGV[0] IS NOT NULL) THEN TG_ARGV[0]
        ELSE 'updated' END,
      auth.uid()::uuid,
      actor_role,
      jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW), 'diff', jsonb_diff(to_jsonb(OLD), to_jsonb(NEW))),
      jsonb_build_object('operation', TG_OP, 'table', TG_TABLE_NAME)
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, actor_id, actor_role, changes, metadata)
    VALUES (TG_TABLE_NAME, OLD.id, 'deleted', auth.uid()::uuid, actor_role, to_jsonb(OLD), jsonb_build_object('operation', TG_OP, 'table', TG_TABLE_NAME));
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers only if target table exists and trigger not present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products')
     AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'products_audit_trigger') THEN
    EXECUTE 'CREATE TRIGGER products_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE FUNCTION log_audit()';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_products')
     AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'pending_products_audit_trigger') THEN
    EXECUTE 'CREATE TRIGGER pending_products_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON pending_products FOR EACH ROW EXECUTE FUNCTION log_audit()';
  END IF;
END $$;
