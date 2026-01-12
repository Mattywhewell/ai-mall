-- ===========================================
-- Supplier Authentication & Schema Fixes
-- Adds proper supplier tables and RLS policies
-- ===========================================

-- Create suppliers table with proper user relationships
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active')),
  stripe_account_id TEXT,
  stripe_connected_at TIMESTAMPTZ,
  integration_status TEXT DEFAULT 'none',
  website_analysis JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Add supplier_id to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE products ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
  END IF;
END $$;

-- Enable RLS on suppliers table
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Suppliers can view and manage their own supplier account
CREATE POLICY "Suppliers can manage own account" ON suppliers
  FOR ALL USING (auth.uid()::text = user_id);

-- Admins can view all suppliers
CREATE POLICY "Admins can manage all suppliers" ON suppliers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Products policies for suppliers
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Suppliers can manage their own products
CREATE POLICY "Suppliers can manage own products" ON products
  FOR ALL USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );

-- Public read access for products (for marketplace)
CREATE POLICY "Public can view products" ON products
  FOR SELECT USING (true);

-- Admins can manage all products
CREATE POLICY "Admins can manage all products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Orders table (if exists) policies for suppliers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    -- Enable RLS on orders if it exists
    EXECUTE 'ALTER TABLE orders ENABLE ROW LEVEL SECURITY';

    -- Suppliers can view orders for their products
    EXECUTE 'CREATE POLICY "Suppliers can view orders for their products" ON orders
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          JOIN suppliers s ON p.supplier_id = s.id
          WHERE oi.order_id = orders.id AND s.user_id = auth.uid()
        )
      )';
  END IF;
END $$;

-- Function to get supplier for current user
CREATE OR REPLACE FUNCTION get_current_supplier()
RETURNS UUID AS $$
DECLARE
  supplier_id UUID;
BEGIN
  SELECT id INTO supplier_id
  FROM suppliers
  WHERE user_id = auth.uid()
  AND status = 'active';

  RETURN supplier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is supplier
CREATE OR REPLACE FUNCTION is_supplier(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.user_id = user_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);

-- Function to update updated_at timestamp for suppliers
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_suppliers_updated_at();