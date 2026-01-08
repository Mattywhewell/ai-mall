-- =====================================================
-- CREATE DEFAULT ADMIN USER
-- Run this AFTER signing up with email: mattw321990@gmail.com
-- =====================================================

-- Add admin role to the user
-- First, find the user_id for mattw321990@gmail.com
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the user_id for the email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'mattw321990@gmail.com';

  -- If user exists, add admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role granted to mattw321990@gmail.com';
  ELSE
    RAISE NOTICE 'User mattw321990@gmail.com not found. Please sign up first at http://localhost:3000';
  END IF;
END $$;

-- Verify the admin role was created
SELECT 
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'mattw321990@gmail.com';
