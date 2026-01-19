#!/usr/bin/env node

/**
 * Supabase introspection for RBAC issues
 * Prints functions, triggers, and columns referencing user_role / user_roles
 */
const { createClient } = require('@supabase/supabase-js');
const sqlRunner = async (supabase, sql, label) => {
  console.log(`\n--- ${label} ---`);
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.error(`${label} ERROR:`, error.message || error);
    return;
  }
  console.log(`${label} RESULT:`, JSON.stringify(data, null, 2).slice(0, 20*1024));
};

(async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const functionsSql = `SELECT p.oid, n.nspname AS schema, p.proname, pg_get_functiondef(p.oid) AS def
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%user_role%' OR pg_get_functiondef(p.oid) ILIKE '%user_roles%';`;

  const triggersSql = `SELECT event_object_schema, event_object_table, trigger_name, action_statement
FROM information_schema.triggers
WHERE action_statement ILIKE '%user_role%' OR action_statement ILIKE '%user_roles%';`;

  const columnsSql = `SELECT table_schema, table_name, column_name, udt_name
FROM information_schema.columns
WHERE udt_name = 'user_role';`;

  const authTriggersSql = `SELECT * FROM information_schema.triggers
WHERE event_object_schema='auth' AND event_object_table='users';`;

  const depSql = `-- dependencies on user_role type
SELECT d.classid::regclass::text AS class, d.objid, d.objid::regprocedure AS proc, d.refobjid::regtype AS ref_type
FROM pg_depend d
WHERE d.refobjid = (SELECT oid FROM pg_type WHERE typname='user_role');`;

  const attrSql = `-- columns typed as user_role
SELECT attrelid::regclass AS table, attname, atttypid::regtype AS type
FROM pg_attribute
WHERE atttypid = (SELECT oid FROM pg_type WHERE typname='user_role');`;

  const procTypeSql = `-- functions with user_role in return/arg types
SELECT p.oid, n.nspname AS schema, p.proname, p.prorettype::regtype AS return_type, p.proargtypes
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prorettype = (SELECT oid FROM pg_type WHERE typname='user_role')
   OR p.proargtypes::text ILIKE '%user_role%';`;

  await sqlRunner(supabase, functionsSql, 'FUNCTIONS');
  await sqlRunner(supabase, triggersSql, 'TRIGGERS');
  await sqlRunner(supabase, columnsSql, 'COLUMNS');
  await sqlRunner(supabase, authTriggersSql, 'AUTH_USERS_TRIGGERS');

  await sqlRunner(supabase, depSql, 'DEPENDENCIES');
  await sqlRunner(supabase, attrSql, 'ATTRIBUTES');
  await sqlRunner(supabase, procTypeSql, 'PROC_TYPES');

  console.log('\n--- Done ---');
  process.exit(0);
})();
