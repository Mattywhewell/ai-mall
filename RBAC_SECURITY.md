# Role-Based Access Control (RBAC) & Security Implementation

## � **LIVE & OPERATIONAL**

**🌐 Production URL**: https://ai-mall.vercel.app

**✅ Status**: Fully deployed on Vercel with enterprise security

---

## �🔐 Overview

The AI Commerce City now has a complete **Role-Based Access Control (RBAC)** system with three primary roles, comprehensive audit trails, and Row Level Security (RLS) policies to ensure data isolation and security.

## 👥 User Roles

### 1. **Admin** (`admin`)
- Full system access
- Manage all suppliers, products, and pending approvals
- Review auto-listing engine results
- Flag problematic products
- View complete audit logs
- Configure system settings

### 2. **Supplier** (`supplier`)
- Manage own products only
- Use auto-listing engine
- View own statistics and logs
- Cannot see other suppliers' data
- Cannot access admin functions

### 3. **Customer** (`customer`)
- Browse products
- Make purchases
- View own orders and profile
- No access to supplier or admin functions

### 4. **AI Agent** (`ai_agent`)
- Read product data for processing
- Update AI-specific fields (like `ai_modifications`)
- Cannot modify core product data
- Limited scope for autonomous operations

## 🗄️ Database Schema Components

### Core RBAC Tables

#### `user_roles`
Maps users to roles and permissions:
```sql
- user_id (UUID, references auth.users)
- role (ENUM: admin, supplier, customer, ai_agent)
- permissions (JSONB for granular control)
- created_at, updated_at
```

#### `audit_logs`
Complete audit trail of all actions:
```sql
- table_name (TEXT)
- record_id (UUID)
- action (created, updated, approved, rejected, flagged, deleted)
- actor_id (UUID, who performed the action)
- actor_role (user_role)
- changes (JSONB, old/new values with diff)
- metadata (JSONB)
- created_at
```

### Enhanced Product Tables

Both `products` and `pending_products` now track:
- **created_by** - Who originally created the listing
- **updated_by** - Who last modified it
- **approved_by** - Who approved it (admin only)
- **approved_at** - When it was approved
- **flagged_by** - Who flagged it for review
- **flagged_at** - When it was flagged
- **flag_reason** - Why it was flagged
- **ai_modifications** - What the AI changed (JSONB)

## 🔒 Row Level Security (RLS) Policies

### Products Table
- ✅ **Public**: Can view approved (`active`) products
- ✅ **Suppliers**: Can view, insert, update own products only
- ✅ **Admins**: Can view, update, delete all products
- ✅ **AI Agents**: Can read all products, update only `ai_modifications` field

### Pending Products Table
- ✅ **Suppliers**: Can view and insert own pending products
- ✅ **Admins**: Can view, update, delete all pending products
- ❌ **Customers**: No access

### Suppliers Table
- ✅ **Suppliers**: Can view and update own data only
- ✅ **Admins**: Can view and update all suppliers
- ❌ **Customers**: No access

### Audit Logs Table
- ✅ **Admins**: Can view all logs
- ✅ **Suppliers**: Can view logs related to their own records
- ❌ **Customers**: No access

### Stats & Logs Tables
- ✅ **Suppliers**: Can view own `auto_listing_stats` and `extraction_logs`
- ✅ **Admins**: Can view everything
- ❌ **Others**: No access

## 🛡️ Helper Functions

### Security Functions
```sql
-- Check user role
get_user_role(user_id UUID) → user_role

-- Check if admin
is_admin(user_id UUID) → BOOLEAN

-- Check if supplier
is_supplier(user_id UUID) → BOOLEAN

-- Get supplier ID for user
get_supplier_id(user_id UUID) → UUID
```

### Admin Operations
```sql
-- Approve pending product and publish it
approve_pending_product(pending_id UUID, notes TEXT) → UUID (new product_id)

-- Reject pending product
reject_pending_product(pending_id UUID, notes TEXT) → VOID

-- Flag a product for review
flag_product(product_id UUID, reason TEXT) → VOID

-- Make a user an admin
make_admin(user_email TEXT) → VOID
```

## 📊 Admin Views

### `pending_approvals`
Shows all products awaiting manual review:
- Product details (title, price, source URL)
- Supplier information (name, email)
- Similarity scores
- Created timestamp

### `flagged_products`
Shows all flagged products:
- Product title and ID
- Flag reason
- Supplier information
- Who flagged it and when

### `supplier_dashboard_stats`
Per-supplier statistics:
- Total products (active, pending, flagged)
- Auto-listing usage (total extractions, auto-approved count)

## 🎯 Admin Dashboard

Located at `/admin/auto-listing`, the admin dashboard provides:

### **Pending Approval Tab**
- List of all products pending manual review
- Quality scores breakdown (title-image, description-image, category-image match)
- Quick approve/reject buttons
- Detailed review modal with full product preview
- Notes field for approval/rejection reasons

### **Flagged Products Tab**
- List of all products flagged for issues
- Flag reason display
- Supplier and flagging admin information
- Resolution actions

### **Statistics Tab**
- Total pending reviews
- Total flagged items
- Today's approved/rejected counts
- Average quality score across all extractions
- Auto-approval threshold visualization (75%)
- Approval rate percentage

## 🔄 Audit Trail

Every action is automatically logged:

### What's Tracked
- ✅ Product creation (by supplier or auto-listing engine)
- ✅ Product updates (price changes, description edits, etc.)
- ✅ Approvals (admin approving pending products)
- ✅ Rejections (admin rejecting pending products)
- ✅ Flags (admin marking products for review)
- ✅ AI modifications (what the AI changed)
- ✅ Deletions (any record removal)

### Audit Log Fields
Each log entry contains:
- **Who**: `actor_id` and `actor_role`
- **What**: `action` type and `changes` (with before/after values)
- **When**: `created_at` timestamp
- **Where**: `table_name` and `record_id`
- **Why**: `metadata` with context

## 🚀 Setup Instructions

### 1. Run the RBAC Migration
```bash
# In Supabase SQL Editor, run:
supabase-rbac-schema.sql
```

This creates:
- User roles table
- Audit logs table
- All helper functions
- RLS policies
- Admin views
- Triggers for automatic audit logging

### 2. Create Your First Admin
```sql
-- After a user signs up, make them an admin:
SELECT make_admin('admin@example.com');
```

### 3. Verify Policies
```sql
-- Check that RLS is enabled:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- All should show rowsecurity = true
```

### 4. Test Access
- Sign in as **supplier**: Should only see own products
- Sign in as **admin**: Should see everything
- Sign in as **customer**: Should only see active products

## 🔐 Security Best Practices

### ✅ Do's
- Always use service role key for admin operations in API routes
- Validate user roles before performing sensitive actions
- Log all administrative actions
- Use RLS policies instead of application-level checks
- Regularly review audit logs for suspicious activity

### ❌ Don'ts
- Never expose service role key in client-side code
- Don't bypass RLS policies with `SECURITY DEFINER` unless necessary
- Never trust client-side role claims without verification
- Don't store sensitive data in `metadata` or `changes` fields without encryption

## 📈 Monitoring & Analytics

### Admin Responsibilities
1. **Daily Review**: Check pending approvals queue
2. **Flag Investigation**: Review flagged products and take action
3. **Audit Review**: Scan audit logs for unusual patterns
4. **Threshold Tuning**: Adjust auto-approval threshold based on quality trends
5. **Supplier Management**: Onboard new suppliers, revoke access if needed

### Metrics to Track
- Approval rate (approved / total reviewed)
- Average time to review
- Auto-approval accuracy (% of auto-approved that don't get flagged later)
- Supplier quality scores over time
- Flags per supplier (identify problematic suppliers)

## 🎓 Example Workflows

### Supplier Creating a Product via Auto-Listing
1. Supplier visits `/supplier/auto-listing`
2. Enters product URL
3. Auto-listing engine extracts data
4. **If quality ≥ 75%**: Auto-approved, saved to `products`, audit log created with `action='created'`, `actor_role='supplier'`
5. **If quality < 75%**: Saved to `pending_products`, awaits admin review

### Admin Approving a Pending Product
1. Admin visits `/admin/auto-listing`
2. Reviews product in "Pending Approval" tab
3. Clicks "Approve" or opens detail modal to add notes
4. System calls `approve_pending_product()` function
5. Product moved from `pending_products` to `products`
6. Audit log created: `action='approved'`, `actor_role='admin'`
7. Supplier receives notification (future feature)

### Admin Flagging a Product
1. Admin notices problematic product (e.g., mismatched images)
2. Calls `flag_product(product_id, "Images don't match product description")`
3. Product marked with `flagged_at`, `flagged_by`, `flag_reason`
4. Audit log created: `action='flagged'`, `actor_role='admin'`
5. Product appears in "Flagged Products" tab
6. Supplier sees flagged status in their dashboard

## 📝 API Endpoints

### Admin Endpoints
- `POST /api/admin/approve-product` - Approve pending product
- `POST /api/admin/reject-product` - Reject pending product
- `POST /api/admin/flag-product` - Flag a product

All require admin authentication (verify via `is_admin()` function).

## 🔮 Future Enhancements

- [ ] Email notifications for approvals/rejections
- [ ] Supplier appeals system for rejections
- [ ] Automated flag resolution (AI-powered)
- [ ] Role hierarchy (super-admin, moderator, etc.)
- [ ] Granular permissions system beyond roles
- [ ] Two-factor authentication for admins
- [ ] IP whitelisting for admin access
- [ ] Automated suspension for repeatedly flagged suppliers
- [ ] Detailed permission audit (who can do what)

---

**Security is paramount.** This RBAC system ensures that suppliers can only access their own data, admins have full control, and all actions are traceable. The audit trail provides accountability and debugging power.
