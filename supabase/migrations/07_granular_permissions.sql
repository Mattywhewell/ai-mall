-- 07_granular_permissions.sql
-- Add granular permissions system to user_roles table

-- Ensure permissions column exists and is properly typed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'permissions') THEN
    ALTER TABLE user_roles ADD COLUMN permissions TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Create helper functions for permission checking
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role user_role;
  role_permissions TEXT[];
  custom_permissions TEXT[];
BEGIN
  -- Get user's role
  SELECT role INTO user_role FROM user_roles WHERE user_roles.user_id = has_permission.user_id;

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Define role-based permissions
  CASE user_role
    WHEN 'admin' THEN
      role_permissions := ARRAY[
        'user.view', 'user.create', 'user.update', 'user.delete',
        'supplier.view', 'supplier.create', 'supplier.update', 'supplier.delete',
        'supplier.approve', 'supplier.reject',
        'product.view', 'product.create', 'product.update', 'product.delete',
        'product.approve', 'product.flag',
        'admin.view', 'admin.manage_users', 'admin.manage_suppliers',
        'admin.manage_products', 'admin.view_audit_logs', 'admin.system_config',
        'ai.generate', 'ai.moderate', 'ai.analyze',
        'file.upload', 'file.download', 'file.delete',
        'analytics.view', 'analytics.export'
      ];
    WHEN 'supplier' THEN
      role_permissions := ARRAY[
        'user.view', 'user.update',
        'product.view', 'product.create', 'product.update',
        'file.upload', 'file.download',
        'analytics.view'
      ];
    WHEN 'customer' THEN
      role_permissions := ARRAY[
        'user.view', 'user.update',
        'product.view',
        'file.download'
      ];
    WHEN 'ai_agent' THEN
      role_permissions := ARRAY[
        'ai.generate', 'ai.moderate', 'ai.analyze',
        'product.view', 'product.update'
      ];
    ELSE
      role_permissions := ARRAY[]::TEXT[];
  END CASE;

  -- Check role-based permissions
  IF required_permission = ANY(role_permissions) THEN
    RETURN TRUE;
  END IF;

  -- Check custom permissions
  SELECT permissions INTO custom_permissions FROM user_roles WHERE user_roles.user_id = has_permission.user_id;
  IF custom_permissions IS NOT NULL AND required_permission = ANY(custom_permissions) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_any_permission(user_id UUID, required_permissions TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  permission TEXT;
BEGIN
  FOREACH permission IN ARRAY required_permissions LOOP
    IF has_permission(user_id, permission) THEN
      RETURN TRUE;
    END IF;
  END LOOP;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_all_permissions(user_id UUID, required_permissions TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  permission TEXT;
BEGIN
  FOREACH permission IN ARRAY required_permissions LOOP
    IF NOT has_permission(user_id, permission) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for permissions array operations
CREATE INDEX IF NOT EXISTS idx_user_roles_permissions ON user_roles USING GIN (permissions);

-- Insert migration record
INSERT INTO supabase_migrations.schema_migrations(version, name, statements)
VALUES(
  '07',
  'granular_permissions',
  ARRAY[
    '-- 07_granular_permissions.sql',
    '-- Add granular permissions system to user_roles table',
    '',
    '-- Ensure permissions column exists and is properly typed',
    'DO $$',
    'BEGIN',
    '  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = ''user_roles'' AND column_name = ''permissions'') THEN',
    '    ALTER TABLE user_roles ADD COLUMN permissions TEXT[] DEFAULT ''{}'';',
    '  END IF;',
    'END $$;',
    '',
    '-- Create helper functions for permission checking',
    'CREATE OR REPLACE FUNCTION has_permission(user_id UUID, required_permission TEXT)',
    'RETURNS BOOLEAN AS $$',
    'DECLARE',
    '  user_role user_role;',
    '  role_permissions TEXT[];',
    '  custom_permissions TEXT[];',
    'BEGIN',
    '  -- Get user''s role',
    '  SELECT role INTO user_role FROM user_roles WHERE user_roles.user_id = has_permission.user_id;',
    '',
    '  IF user_role IS NULL THEN',
    '    RETURN FALSE;',
    '  END IF;',
    '',
    '  -- Define role-based permissions',
    '  CASE user_role',
    '    WHEN ''admin'' THEN',
    '      role_permissions := ARRAY[',
    '        ''user.view'', ''user.create'', ''user.update'', ''user.delete'',',
    '        ''supplier.view'', ''supplier.create'', ''supplier.update'', ''supplier.delete'',',
    '        ''supplier.approve'', ''supplier.reject'',',
    '        ''product.view'', ''product.create'', ''product.update'', ''product.delete'',',
    '        ''product.approve'', ''product.flag'',',
    '        ''admin.view'', ''admin.manage_users'', ''admin.manage_suppliers'',',
    '        ''admin.manage_products'', ''admin.view_audit_logs'', ''admin.system_config'',',
    '        ''ai.generate'', ''ai.moderate'', ''ai.analyze'',',
    '        ''file.upload'', ''file.download'', ''file.delete'',',
    '        ''analytics.view'', ''analytics.export''',
    '      ];',
    '    WHEN ''supplier'' THEN',
    '      role_permissions := ARRAY[',
    '        ''user.view'', ''user.update'',',
    '        ''product.view'', ''product.create'', ''product.update'',',
    '        ''file.upload'', ''file.download'',',
    '        ''analytics.view''',
    '      ];',
    '    WHEN ''customer'' THEN',
    '      role_permissions := ARRAY[',
    '        ''user.view'', ''user.update'',',
    '        ''product.view'',',
    '        ''file.download''',
    '      ];',
    '    WHEN ''ai_agent'' THEN',
    '      role_permissions := ARRAY[',
    '        ''ai.generate'', ''ai.moderate'', ''ai.analyze'',',
    '        ''product.view'', ''product.update''',
    '      ];',
    '    ELSE',
    '      role_permissions := ARRAY[]::TEXT[];',
    '  END CASE;',
    '',
    '  -- Check role-based permissions',
    '  IF required_permission = ANY(role_permissions) THEN',
    '    RETURN TRUE;',
    '  END IF;',
    '',
    '  -- Check custom permissions',
    '  SELECT permissions INTO custom_permissions FROM user_roles WHERE user_roles.user_id = has_permission.user_id;',
    '  IF custom_permissions IS NOT NULL AND required_permission = ANY(custom_permissions) THEN',
    '    RETURN TRUE;',
    '  END IF;',
    '',
    '  RETURN FALSE;',
    'END;',
    '$$ LANGUAGE plpgsql SECURITY DEFINER;',
    '',
    'CREATE OR REPLACE FUNCTION has_any_permission(user_id UUID, required_permissions TEXT[])',
    'RETURNS BOOLEAN AS $$',
    'DECLARE',
    '  permission TEXT;',
    'BEGIN',
    '  FOREACH permission IN ARRAY required_permissions LOOP',
    '    IF has_permission(user_id, permission) THEN',
    '      RETURN TRUE;',
    '    END IF;',
    '  END LOOP;',
    '  RETURN FALSE;',
    'END;',
    '$$ LANGUAGE plpgsql SECURITY DEFINER;',
    '',
    'CREATE OR REPLACE FUNCTION has_all_permissions(user_id UUID, required_permissions TEXT[])',
    'RETURNS BOOLEAN AS $$',
    'DECLARE',
    '  permission TEXT;',
    'BEGIN',
    '  FOREACH permission IN ARRAY required_permissions LOOP',
    '    IF NOT has_permission(user_id, permission) THEN',
    '      RETURN FALSE;',
    '    END IF;',
    '  END LOOP;',
    '  RETURN TRUE;',
    'END;',
    '$$ LANGUAGE plpgsql SECURITY DEFINER;',
    '',
    '-- Create index for permissions array operations',
    'CREATE INDEX IF NOT EXISTS idx_user_roles_permissions ON user_roles USING GIN (permissions);'
  ]
);