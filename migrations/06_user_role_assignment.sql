-- Migration: Automatic User Role Assignment
-- Creates a trigger to automatically assign 'customer' role to new users

-- Function to handle automatic role assignment
CREATE OR REPLACE FUNCTION public.handle_user_role_assignment()
RETURNS TRIGGER AS $$
DECLARE
  user_role user_role := 'customer';
BEGIN
  -- Check if role is specified in user metadata
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    -- Validate the role is valid
    BEGIN
      user_role := (NEW.raw_user_meta_data->>'role')::user_role;
    EXCEPTION
      WHEN invalid_text_representation THEN
        -- Invalid role, default to customer
        user_role := 'customer';
    END;
  END IF;

  -- Insert role for new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id) DO UPDATE SET role = user_role, updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to assign role on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_role_assignment();

-- Ensure existing users have roles assigned
INSERT INTO public.user_roles (user_id, role)
SELECT
  au.id,
  COALESCE(
    CASE
      WHEN s.id IS NOT NULL THEN 'supplier'::user_role
      WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = au.id) THEN (SELECT ur.role FROM user_roles ur WHERE ur.user_id = au.id LIMIT 1)
      ELSE 'customer'::user_role
    END,
    'customer'::user_role
  )
FROM auth.users au
LEFT JOIN suppliers s ON s.user_id = au.id
WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = au.id)
ON CONFLICT (user_id) DO NOTHING;