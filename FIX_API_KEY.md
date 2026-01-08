# ⚠️ INVALID API KEY DETECTED

## Problem
Your Supabase API key is invalid or has been regenerated. 

## Solution

### Step 1: Get Your Correct API Keys

1. Go to your Supabase dashboard: **https://app.supabase.com/project/wmiqtmtjhlpfsjwjvwgl**
2. Click on the **⚙️ Settings** (gear icon) in the left sidebar
3. Click on **API** in the settings menu
4. Find the section **Project API keys**
5. Copy the following:
   - **Project URL** (starts with `https://wmiqtmtjhlpfsjwjvwgl.supabase.co`)
   - **anon/public key** (this is a long JWT token)

### Step 2: Update Your .env.local File

Replace the contents of your `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=<paste your Project URL here>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste your anon public key here>
```

**Important:** 
- Make sure the entire key is on ONE line (no line breaks)
- Don't include spaces around the `=` sign
- Don't wrap the values in quotes

### Step 3: Restart Your Dev Server

After updating `.env.local`:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test the Connection

```bash
node test-supabase.js
```

You should see: `✅ Connection successful!`

---

## Still Not Working?

If you continue to get errors after updating the keys:

1. **Verify your project exists**: Visit https://app.supabase.com and make sure your project is active
2. **Check for typos**: Make sure you copied the entire key without truncation
3. **Clear cache**: Delete `.next` folder and restart: `rm -rf .next; npm run dev`
