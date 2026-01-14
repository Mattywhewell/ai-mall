-- 04_rls_policies_and_views.sql
-- Create RLS policies and views (checks existence of tables/columns before creating policies)

-- Products policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN

    EXECUTE 'ALTER TABLE products ENABLE ROW LEVEL SECURITY';

    -- Public view
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Public can view approved products' AND polrelid = 'products'::regclass) THEN
      EXECUTE 'CREATE POLICY "Public can view approved products" ON products FOR SELECT USING (COALESCE(status, ''draft'') = ''active'')';
    END IF;

    -- Suppliers view own products (only if suppliers table exists and supplier_id column exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'supplier_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Suppliers can view own products' AND polrelid = 'products'::regclass) THEN
        EXECUTE 'CREATE POLICY "Suppliers can view own products" ON products FOR SELECT USING (supplier_id = get_supplier_id(auth.uid()::uuid))';
      END IF;
    END IF;

    -- Admins
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can view all products' AND polrelid = 'products'::regclass) THEN
      EXECUTE 'CREATE POLICY "Admins can view all products" ON products FOR SELECT USING (is_admin(auth.uid()::uuid))';
    END IF;

    -- Insert & update policies
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'supplier_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Suppliers can insert products' AND polrelid = 'products'::regclass) THEN
        EXECUTE 'CREATE POLICY "Suppliers can insert products" ON products FOR INSERT WITH CHECK (is_supplier(auth.uid()::uuid) AND supplier_id = get_supplier_id(auth.uid()::uuid))';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Suppliers can update own products' AND polrelid = 'products'::regclass) THEN
        EXECUTE 'CREATE POLICY "Suppliers can update own products" ON products FOR UPDATE USING (supplier_id = get_supplier_id(auth.uid()::uuid)) WITH CHECK (supplier_id = get_supplier_id(auth.uid()::uuid))';
      END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can update any product' AND polrelid = 'products'::regclass) THEN
      EXECUTE 'CREATE POLICY "Admins can update any product" ON products FOR UPDATE USING (is_admin(auth.uid()::uuid))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can delete products' AND polrelid = 'products'::regclass) THEN
      EXECUTE 'CREATE POLICY "Admins can delete products" ON products FOR DELETE USING (is_admin(auth.uid()::uuid))';
    END IF;

  END IF;
END $$;

-- Pending products policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_products') THEN
    EXECUTE 'ALTER TABLE pending_products ENABLE ROW LEVEL SECURITY';
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pending_products' AND column_name = 'supplier_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Suppliers can view own pending products' AND polrelid = 'pending_products'::regclass) THEN
        EXECUTE 'CREATE POLICY "Suppliers can view own pending products" ON pending_products FOR SELECT USING (supplier_id = get_supplier_id(auth.uid()::uuid))';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Suppliers can insert pending products' AND polrelid = 'pending_products'::regclass) THEN
        EXECUTE 'CREATE POLICY "Suppliers can insert pending products" ON pending_products FOR INSERT WITH CHECK (is_supplier(auth.uid()::uuid) AND supplier_id = get_supplier_id(auth.uid()::uuid))';
      END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can view all pending products' AND polrelid = 'pending_products'::regclass) THEN
      EXECUTE 'CREATE POLICY "Admins can view all pending products" ON pending_products FOR SELECT USING (is_admin(auth.uid()::uuid))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can update pending products' AND polrelid = 'pending_products'::regclass) THEN
      EXECUTE 'CREATE POLICY "Admins can update pending products" ON pending_products FOR UPDATE USING (is_admin(auth.uid()::uuid))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can delete pending products' AND polrelid = 'pending_products'::regclass) THEN
      EXECUTE 'CREATE POLICY "Admins can delete pending products" ON pending_products FOR DELETE USING (is_admin(auth.uid()::uuid))';
    END IF;
  END IF;
END $$;

-- Suppliers policies (only when suppliers.user_id exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'user_id') THEN
    EXECUTE 'ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Suppliers can view own data' AND polrelid = 'suppliers'::regclass) THEN
      EXECUTE 'CREATE POLICY "Suppliers can view own data" ON suppliers FOR SELECT USING (user_id = auth.uid()::uuid)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can view all suppliers' AND polrelid = 'suppliers'::regclass) THEN
      EXECUTE 'CREATE POLICY "Admins can view all suppliers" ON suppliers FOR SELECT USING (is_admin(auth.uid()::uuid))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Suppliers can update own data' AND polrelid = 'suppliers'::regclass) THEN
      EXECUTE 'CREATE POLICY "Suppliers can update own data" ON suppliers FOR UPDATE USING (user_id = auth.uid()::uuid) WITH CHECK (user_id = auth.uid()::uuid)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can update any supplier' AND polrelid = 'suppliers'::regclass) THEN
      EXECUTE 'CREATE POLICY "Admins can update any supplier" ON suppliers FOR UPDATE USING (is_admin(auth.uid()::uuid))';
    END IF;
  END IF;
END $$;

-- Audit logs policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    EXECUTE 'ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can view all audit logs' AND polrelid = 'audit_logs'::regclass) THEN
      EXECUTE 'CREATE POLICY "Admins can view all audit logs" ON audit_logs FOR SELECT USING (is_admin(auth.uid()::uuid))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Suppliers can view own audit logs' AND polrelid = 'audit_logs'::regclass) THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'supplier_id') THEN
        EXECUTE 'CREATE POLICY "Suppliers can view own audit logs" ON audit_logs FOR SELECT USING (actor_id = auth.uid()::uuid OR record_id IN (SELECT id FROM products WHERE supplier_id = get_supplier_id(auth.uid()::uuid)))';
      ELSE
        EXECUTE 'CREATE POLICY "Suppliers can view own audit logs" ON audit_logs FOR SELECT USING (actor_id = auth.uid()::uuid)';
      END IF;
    END IF;
  END IF;
END $$;

-- Views (only create if relevant tables exist and required columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_products')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'user_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pending_products' AND column_name = 'supplier_id') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pending_approvals AS SELECT pp.id, pp.source_url, pp.status, pp.created_at, s.business_name as supplier_name, s.id as supplier_id, pp.similarity_scores, pp.extracted_data->>''title'' as product_title, pp.extracted_data->>''price'' as product_price, u.email as supplier_email FROM pending_products pp JOIN suppliers s ON pp.supplier_id = s.id JOIN auth.users u ON s.user_id = u.id WHERE pp.status = ''pending_review'' ORDER BY pp.created_at ASC';
  ELSE
    RAISE NOTICE 'Skipping view pending_approvals: pending_products and/or suppliers.user_id and/or supplier_id columns missing';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'user_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'supplier_id') THEN
      EXECUTE 'CREATE OR REPLACE VIEW flagged_products AS SELECT p.id, p.title, p.flag_reason, p.flagged_at, s.business_name as supplier_name, u.email as supplier_email, flagged_user.email as flagged_by_email FROM products p JOIN suppliers s ON p.supplier_id = s.id JOIN auth.users u ON s.user_id = u.id LEFT JOIN auth.users flagged_user ON p.flagged_by = flagged_user.id WHERE p.flagged_at IS NOT NULL ORDER BY p.flagged_at DESC';
    ELSE
      RAISE NOTICE 'Skipping view flagged_products: suppliers.user_id or products.supplier_id missing';
    END IF;

    -- supplier_dashboard_stats: build view dynamically so it only references existing tables
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'supplier_id') THEN
      DECLARE
        v_sql TEXT := '';
      BEGIN
        v_sql := 'CREATE OR REPLACE VIEW supplier_dashboard_stats AS SELECT s.id as supplier_id, s.business_name, COUNT(DISTINCT p.id) as total_products, COUNT(DISTINCT CASE WHEN p.status = ''active'' THEN p.id END) as active_products';

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_products')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pending_products' AND column_name = 'supplier_id') THEN
          v_sql := v_sql || ', COUNT(DISTINCT pp.id) as pending_products';
        ELSE
          v_sql := v_sql || ', 0 as pending_products';
        END IF;

        v_sql := v_sql || ', COUNT(DISTINCT CASE WHEN p.flagged_at IS NOT NULL THEN p.id END) as flagged_products';

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auto_listing_stats') THEN
          v_sql := v_sql || ', COALESCE(als.total_extractions, 0) as total_auto_listings, COALESCE(als.auto_approved, 0) as auto_approved_count';
        ELSE
          v_sql := v_sql || ', 0 as total_auto_listings, 0 as auto_approved_count';
        END IF;

        v_sql := v_sql || ' FROM suppliers s LEFT JOIN products p ON s.id = p.supplier_id';

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_products')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pending_products' AND column_name = 'supplier_id') THEN
          v_sql := v_sql || ' LEFT JOIN pending_products pp ON s.id = pp.supplier_id AND pp.status = ''pending_review''';
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auto_listing_stats') THEN
          v_sql := v_sql || ' LEFT JOIN LATERAL (SELECT SUM(total_extractions) as total_extractions, SUM(auto_approved) as auto_approved FROM auto_listing_stats WHERE supplier_id = s.id) als ON true';
        END IF;

        v_sql := v_sql || ' GROUP BY s.id, s.business_name';

        EXECUTE v_sql;
      END;
    END IF;
  END IF;
END $$;
