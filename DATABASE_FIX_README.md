# 🚨 DATABASE AUTHENTICATION FIX

## Problem
Next.js server failing to start due to expired Supabase service role key.

## Solution: Create New Supabase Project

### Step 1: Create New Supabase Project

1. **Open Supabase Dashboard**: https://supabase.com/dashboard (already opened)

2. **Create New Project**:
   - Click "New project"
   - Choose your organization
   - Project name: `ai-mall-prod` (or your choice)
   - Database password: Choose a strong password
   - Region: Select closest to your users
   - Click "Create new project"

3. **Wait for Setup** (2-3 minutes):
   - Project will show "Setting up" status
   - Wait until it shows "Running"

### Step 2: Get Your New Keys

1. **Go to Settings**:
   - Click "Settings" in left sidebar
   - Click "API" in settings menu

2. **Copy These Values**:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 3: Update Environment Variables

Run the update script:

```bash
node update-supabase-keys.js
```

When prompted, paste your new:
- Supabase Project URL
- Supabase Anon/Public Key
- Supabase Service Role Key

### Step 4: Set Up Database Tables

Run the database setup script:

```bash
node setup-database.js
```

This will:
- ✅ Test database connection
- ✅ Run all SQL migrations
- ✅ Set up tables and seed data
- ✅ Verify everything works

### Step 5: Test the Server

```bash
npm run dev
```

Visit http://localhost:3000 - server should start successfully!

---

## 🔧 Manual Alternative (If Scripts Don't Work)

If the automated scripts fail, you can manually update `.env.local`:

```bash
# Edit .env.local with your new keys
notepad .env.local
```

Then run individual SQL files in Supabase SQL Editor:
1. `supabase-complete-schema.sql`
2. `supabase-complete-migration.sql`
3. `supabase-v5.1-schema-fixed.sql`
4. `world-architecture-schema.sql`
5. `3d-generation-schema.sql`

---

## ✅ Expected Results

After setup:
- ✅ `npm run setup:check` passes
- ✅ `npm run dev` starts server
- ✅ Database connection works
- ✅ All tables created
- ✅ 3D Commons page loads
- ✅ AI City features work

---

## 🆘 Troubleshooting

### "Connection failed"
- Double-check your keys are copied correctly
- Make sure project is fully set up (not still "Setting up")

### "Table creation failed"
- Check Supabase SQL Editor for error messages
- Some tables might already exist - that's OK

### "Server still won't start"
- Run `npm run setup:check` to see specific errors
- Check `.env.local` has correct format

---

## 🎯 Quick Commands Summary

```bash
# 1. Update keys
node update-supabase-keys.js

# 2. Setup database
node setup-database.js

# 3. Start server
npm run dev
```

**Need help?** The scripts will guide you through each step with clear prompts.