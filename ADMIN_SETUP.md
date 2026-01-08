# 🔐 ADMIN ACCOUNT SETUP

## Step 1: Sign Up

1. Visit: http://localhost:3000
2. Click "Sign Up"
3. Use these credentials:
   - **Email:** mattw321990@gmail.com
   - **Password:** Brooquerae5211.
4. Check your email for verification link
5. Click the verification link

## Step 2: Grant Admin Role

After email is verified, run the SQL script:

1. Go to: https://supabase.com/dashboard/project/wmiqtmtjhlpfsjwjvwgl/sql/new
2. Copy contents of `create-admin-user.sql`
3. Paste and click "RUN" ▶️
4. You should see: "Admin role granted to mattw321990@gmail.com"

## Step 3: Verify Admin Access

1. Log in at http://localhost:3000
2. You should now have access to:
   - `/admin/system-health` - System monitoring
   - `/admin/prompts` - AI prompt management
   - `/admin/products` - Product management
   - All admin features

---

## Alternative: Quick Setup Script

Run this in your terminal (after signing up):

```bash
# This will grant admin role automatically
npx tsx scripts/create-admin.ts
```

---

## Credentials Reference

- **Email:** mattw321990@gmail.com
- **Password:** Brooquerae5211.
- **Role:** Admin

**⚠️ IMPORTANT:** Change this password after first login for security!

Visit: http://localhost:3000/settings to change password
