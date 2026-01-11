-- Role-Based Access Control (RBAC) Implementation
-- Implements secure role-based permissions with audit trails

-- =======================
-- 1. USER ROLES TABLE
-- =======================

-- Create user_role enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'supplier', 'customer', 'ai_agent');
  END IF;
END $$;

-- Extend auth.users with role information
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'customer',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- =======================
-- 2. AUDIT TRAIL SYSTEM
-- =======================

-- Create audit_logs table (drop and recreate if needed)
DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'approved', 'rejected', 'flagged', 'deleted')),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role user_role,
  changes JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- =======================
-- 3. ENHANCED PRODUCT TABLES WITH AUDIT FIELDS
-- =======================

-- Add audit fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS flag_reason TEXT,
ADD COLUMN IF NOT EXISTS ai_modifications JSONB,
-- Add status column if missing (used by policies)
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Add audit fields to pending_products table (only if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_products') THEN
    ALTER TABLE pending_products 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS flag_reason TEXT;
  END IF;
END $$;

-- =======================
-- 4. HELPER FUNCTIONS
-- =======================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM user_roles WHERE user_id = uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM user_roles WHERE user_id = uid) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is supplier
CREATE OR REPLACE FUNCTION is_supplier(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM user_roles WHERE user_id = uid) = 'supplier';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get supplier_id for a user
CREATE OR REPLACE FUNCTION get_supplier_id(uid UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM suppliers WHERE user_id = uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- 5. AUDIT TRAIL TRIGGERS
-- =======================

-- Generic audit function
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
DECLARE
  actor_role user_role;
BEGIN
  -- Get actor role
  SELECT role INTO actor_role FROM user_roles WHERE user_id = auth.uid()::uuid;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
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
    INSERT INTO audit_logs (
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
    INSERT INTO audit_logs (
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
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for jsonb diff
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

-- Apply audit triggers to key tables (only if they don't exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products')
     AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'products_audit_trigger') THEN
    EXECUTE 'CREATE TRIGGER products_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION log_audit()';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_products')
     AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'pending_products_audit_trigger') THEN
    EXECUTE 'CREATE TRIGGER pending_products_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON pending_products
    FOR EACH ROW EXECUTE FUNCTION log_audit()';
  END IF;
END $$;

-- =======================
-- 6. ROW LEVEL SECURITY POLICIES
-- =======================

-- ============ PRODUCTS TABLE ============
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Everyone can view approved products
CREATE POLICY "Public can view approved products"
  ON products FOR SELECT
  USING (status = 'active');

-- Suppliers can view their own products
CREATE POLICY "Suppliers can view own products"
  ON products FOR SELECT
  USING (supplier_id = get_supplier_id(auth.uid()::uuid));

-- Admins can view all products
CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  USING (is_admin(auth.uid()::uuid));

-- Suppliers can insert products
CREATE POLICY "Suppliers can insert products"
  ON products FOR INSERT
  WITH CHECK (
    is_supplier(auth.uid()::uuid) AND 
    supplier_id = get_supplier_id(auth.uid()::uuid)
  );

-- Suppliers can update their own products
CREATE POLICY "Suppliers can update own products"
  ON products FOR UPDATE
  USING (supplier_id = get_supplier_id(auth.uid()::uuid))
  WITH CHECK (supplier_id = get_supplier_id(auth.uid()::uuid));

-- Admins can update any product
CREATE POLICY "Admins can update any product"
  ON products FOR UPDATE
  USING (is_admin(auth.uid()::uuid));

-- Admins can delete products
CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  USING (is_admin(auth.uid()::uuid));

-- ============ PENDING_PRODUCTS TABLE ============
-- (Only apply if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_products') THEN
    EXECUTE 'ALTER TABLE pending_products ENABLE ROW LEVEL SECURITY';
    
    -- Suppliers can view their own pending products
    EXECUTE 'CREATE POLICY "Suppliers can view own pending products"
      ON pending_products FOR SELECT
      USING (supplier_id = get_supplier_id(auth.uid()::uuid))';
    
    -- Admins can view all pending products
    EXECUTE 'CREATE POLICY "Admins can view all pending products"
      ON pending_products FOR SELECT
      USING (is_admin(auth.uid()::uuid))';
    
    -- Suppliers can insert pending products
    EXECUTE 'CREATE POLICY "Suppliers can insert pending products"
      ON pending_products FOR INSERT
      WITH CHECK (
        is_supplier(auth.uid()::uuid) AND 
        supplier_id = get_supplier_id(auth.uid()::uuid)
      )';
    
    -- Admins can update pending products (for approval/rejection)
    EXECUTE 'CREATE POLICY "Admins can update pending products"
      ON pending_products FOR UPDATE
      USING (is_admin(auth.uid()::uuid))';
    
    -- Admins can delete pending products
    EXECUTE 'CREATE POLICY "Admins can delete pending products"
      ON pending_products FOR DELETE
      USING (is_admin(auth.uid()::uuid))';
  END IF;
END $$;

-- ============ SUPPLIERS TABLE ============
-- (Only apply if table and expected columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'user_id') THEN
      EXECUTE 'ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY';

      -- Suppliers can view their own data
      EXECUTE 'CREATE POLICY "Suppliers can view own data" ON suppliers FOR SELECT USING (user_id = auth.uid()::uuid)';

      -- Admins can view all suppliers
      EXECUTE 'CREATE POLICY "Admins can view all suppliers" ON suppliers FOR SELECT USING (is_admin(auth.uid()::uuid))';

      -- Suppliers can update their own data
      EXECUTE 'CREATE POLICY "Suppliers can update own data" ON suppliers FOR UPDATE USING (user_id = auth.uid()::uuid) WITH CHECK (user_id = auth.uid()::uuid)';

      -- Admins can update any supplier
      EXECUTE 'CREATE POLICY "Admins can update any supplier" ON suppliers FOR UPDATE USING (is_admin(auth.uid()::uuid))';
    ELSE
      RAISE NOTICE 'Skipping suppliers policies: column "user_id" missing on suppliers table';
    END IF;
  END IF;
END $$;

-- ============ AUDIT_LOGS TABLE ============
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (is_admin(auth.uid()::uuid));

-- Suppliers can view audit logs for their own records
CREATE POLICY "Suppliers can view own audit logs"
  ON audit_logs FOR SELECT
  USING (
    actor_id = auth.uid()::uuid OR
    record_id IN (
      SELECT id FROM products WHERE supplier_id = get_supplier_id(auth.uid()::uuid)
    )
  );

-- ============ EXTRACTION_LOGS TABLE ============
-- (Already has RLS, but let's ensure consistency)

-- ============ AUTO_LISTING_STATS TABLE ============
-- (Already has RLS, but let's ensure consistency)

-- =======================
-- 7. AI AGENT PERMISSIONS
-- =======================

-- AI agents can only read specific data
CREATE POLICY "AI agents can read products"
  ON products FOR SELECT
  USING (get_user_role(auth.uid()::uuid) = 'ai_agent');

-- AI agents can update AI-specific fields
CREATE POLICY "AI agents can update ai_modifications"
  ON products FOR UPDATE
  USING (get_user_role(auth.uid()::uuid) = 'ai_agent')
  WITH CHECK (
    ai_modifications IS NOT NULL AND
    -- Ensure only ai_modifications field is being changed
    OLD.title = NEW.title AND
    OLD.price = NEW.price AND
    OLD.supplier_id = NEW.supplier_id
  );

-- =======================
-- 8. ADMIN HELPER VIEWS
-- =======================

-- View for pending approvals (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_products') AND
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pending_approvals AS
    SELECT 
      pp.id,
      pp.source_url,
      pp.status,
      pp.created_at,
      s.business_name as supplier_name,
      s.id as supplier_id,
      pp.similarity_scores,
      pp.extracted_data->>''title'' as product_title,
      pp.extracted_data->>''price'' as product_price,
      u.email as supplier_email
    FROM pending_products pp
    JOIN suppliers s ON pp.supplier_id = s.id
    JOIN auth.users u ON s.user_id = u.id
    WHERE pp.status = ''pending_review''
    ORDER BY pp.created_at ASC';
  END IF;
END $$;

-- View for flagged products (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    EXECUTE 'CREATE OR REPLACE VIEW flagged_products AS
    SELECT 
      p.id,
      p.title,
      p.flag_reason,
      p.flagged_at,
      s.business_name as supplier_name,
      u.email as supplier_email,
      flagged_user.email as flagged_by_email
    FROM products p
    JOIN suppliers s ON p.supplier_id = s.id
    JOIN auth.users u ON s.user_id = u.id
    LEFT JOIN auth.users flagged_user ON p.flagged_by = flagged_user.id
    WHERE p.flagged_at IS NOT NULL
    ORDER BY p.flagged_at DESC';
  END IF;
END $$;

-- View for supplier stats (only if suppliers table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    EXECUTE 'CREATE OR REPLACE VIEW supplier_dashboard_stats AS
    SELECT 
      s.id as supplier_id,
      s.business_name,
      COUNT(DISTINCT p.id) as total_products,
      COUNT(DISTINCT CASE WHEN p.status = ''active'' THEN p.id END) as active_products,
      COUNT(DISTINCT pp.id) as pending_products,
      COUNT(DISTINCT CASE WHEN p.flagged_at IS NOT NULL THEN p.id END) as flagged_products,
      COALESCE(als.total_extractions, 0) as total_auto_listings,
      COALESCE(als.auto_approved, 0) as auto_approved_count
    FROM suppliers s
    LEFT JOIN products p ON s.id = p.supplier_id
    LEFT JOIN pending_products pp ON s.id = pp.supplier_id AND pp.status = ''pending_review''
    LEFT JOIN LATERAL (
      SELECT 
        SUM(total_extractions) as total_extractions,
        SUM(auto_approved) as auto_approved
      FROM auto_listing_stats
      WHERE supplier_id = s.id
    ) als ON true
    GROUP BY s.id, s.business_name, als.total_extractions, als.auto_approved';
  END IF;
END $$;

-- =======================
-- 9. UTILITY FUNCTIONS
-- =======================

-- Function to flag a product
CREATE OR REPLACE FUNCTION flag_product(
  product_id UUID,
  reason TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET 
    flagged_by = auth.uid(),
    flagged_at = NOW(),
    flag_reason = reason
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve pending product
CREATE OR REPLACE FUNCTION approve_pending_product(
  pending_id UUID,
  notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_product_id UUID;
  pending_data RECORD;
BEGIN
  -- Must be admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can approve products';
  END IF;

  -- Get pending product data
  SELECT * INTO pending_data FROM pending_products WHERE id = pending_id;

  -- Insert into products table
  INSERT INTO products (
    supplier_id,
    title,
    description,
    price,
    category,
    images,
    specifications,
    tags,
    source_url,
    extraction_metadata,
    similarity_scores,
    status,
    created_by,
    approved_by,
    approved_at
  ) VALUES (
    pending_data.supplier_id,
    pending_data.extracted_data->>'title',
    pending_data.extracted_data->>'description',
    (pending_data.extracted_data->>'price')::NUMERIC,
    pending_data.extracted_data->>'category',
    pending_data.extracted_data->'images',
    pending_data.extracted_data->'specifications',
    pending_data.extracted_data->'tags',
    pending_data.source_url,
    pending_data.extracted_data,
    pending_data.similarity_scores,
    'active',
    pending_data.created_by,
    auth.uid(),
    NOW()
  ) RETURNING id INTO new_product_id;

  -- Update pending product
  UPDATE pending_products
  SET 
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    review_notes = notes
  WHERE id = pending_id;

  RETURN new_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject pending product
CREATE OR REPLACE FUNCTION reject_pending_product(
  pending_id UUID,
  notes TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Must be admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can reject products';
  END IF;

  UPDATE pending_products
  SET 
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    review_notes = notes
  WHERE id = pending_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- 10. SEED ADMIN USER
-- =======================

-- Function to make a user an admin (run manually after user signup)
CREATE OR REPLACE FUNCTION make_admin(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Insert or update role
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = NOW();
  
  RAISE NOTICE 'User % is now an admin', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE user_roles IS 'Manages role-based access control for all users';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail of all system actions';
COMMENT ON FUNCTION get_user_role IS 'Helper to retrieve user role for RLS policies';
COMMENT ON FUNCTION flag_product IS 'Allows admins to flag products for review';
COMMENT ON FUNCTION approve_pending_product IS 'Moves pending product to active products table';
COMMENT ON VIEW pending_approvals IS 'Admin view of all products awaiting approval';
COMMENT ON VIEW flagged_products IS 'Admin view of all flagged products';
