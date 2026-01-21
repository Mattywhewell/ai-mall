# AI-Native Mall Setup Guide

## 🚀 **LIVE & OPERATIONAL**

**🌐 Production URL**: https://ai-mall.vercel.app

**✅ Status**: Fully deployed on Vercel with enterprise security

---

## Database Setup

### 1. Create Tables in Supabase

1. Go to your Supabase dashboard: https://wmiqtmtjhlpfsjwjvwgl.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Copy and paste the entire contents of `supabase-seed.sql`
4. Click **Run** to execute the SQL script
5. Verify the tables were created in the **Table Editor**

### 2. Enable Row Level Security (RLS)

After creating the tables, you need to enable public read access:

```sql
-- Enable RLS on microstores table
ALTER TABLE microstores ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access on microstores"
ON microstores FOR SELECT
TO anon
USING (true);

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access on products"
ON products FOR SELECT
TO anon
USING (true);
```

### 3. Verify Setup

Run this query in the SQL Editor to verify:

```sql
SELECT COUNT(*) FROM microstores;
SELECT COUNT(*) FROM products;
```

You should see:
- 5 microstores
- Multiple products across all stores

## Troubleshooting

### Error: "relation 'microstores' does not exist"
- Make sure you ran the `supabase-seed.sql` script
- Check the Table Editor to confirm tables exist

### Error: "permission denied for table microstores"
- Make sure you enabled RLS and created the public read policies
- Verify the policies in **Authentication > Policies**

### Error: "Empty results"
- Check if data was seeded properly: `SELECT * FROM microstores;`
- Verify your `.env.local` file has the correct credentials

## Development

Start the development server:

```bash
npm run dev
```

Visit http://localhost:3000

> CI note: To avoid flaky upstream Supabase Auth failures, the Playwright CI job sets `SKIP_SUPABASE_SEED=true` which skips creating Supabase auth users in CI and relies on deterministic `test_user` injection (localStorage/cookie). To run with full Supabase seeding locally or in CI, unset this env var and ensure Supabase credentials are available.
