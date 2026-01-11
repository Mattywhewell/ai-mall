Migration run order (idempotent, safe):

1) 01_user_roles_and_types.sql
   - Creates user_role type and user_roles table/indexes.

2) 02_audit_and_product_columns.sql
   - Creates audit_logs table and adds audit/status columns to products; updates pending_products if present.

3) 03_functions_and_triggers.sql
   - Adds helper functions (get_user_role, is_admin, get_supplier_id, jsonb_diff, log_audit) and creates audit triggers (only where tables exist).

4) 04_rls_policies_and_views.sql
   - Enables RLS and creates policies for products, pending_products, suppliers, audit_logs, and admin helper views when tables/columns exist.

5) 05_suppliers.sql
   - Creates suppliers table and adds supplier_id to products (if missing); creates supplier trigger.

Recommended workflow:
- Run steps 1..5 in order in Supabase SQL editor.
- If any step is skipped (e.g., pending_products absent) it's safe to re-run later after creating missing tables.

Notes:
- Files are written to be idempotent so they can be re-run safely.
- If your Supabase DB has custom/table differences, paste errors here and I'll adjust.
