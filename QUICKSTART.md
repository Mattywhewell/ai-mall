# 🚀 Quick Start - AI City

## 🚀 **LIVE & OPERATIONAL**

**🌐 Production URL**: https://ai-mall.vercel.app

**✅ Status**: Fully deployed on Vercel with enterprise security

---

Get your AI City running in 5 minutes!

## Step 1: Database Setup (2 min)

Open your Supabase SQL Editor and run:

```sql
-- Copy and paste the entire contents of world-architecture-schema.sql
```

This creates:
- ✅ 9 tables (halls, streets, chapels, ai_spirits, etc.)
- ✅ Seed data (5 Halls, 5 Streets, 5 Chapels)
- ✅ Database functions
- ✅ Proper permissions

## Step 2: Environment Variables (30 sec)

Verify your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
OPENAI_API_KEY=your_openai_key
```

## Step 3: Install & Run (1 min)

```bash
npm install
npm run dev
```

## Step 4: Visit the City (30 sec)

Open your browser:

```
http://localhost:3000
```

Click **"✨ Explore the AI City"**

## Step 5: Test Key Features (1 min)

1. **Hall Experience**: Visit `/halls/luminous-nexus`
   - See AI spirit greeting
   - Notice connected streets
   - Check atmosphere adaptation

2. **Street Navigation**: Visit `/streets/neon-boulevard`
   - View popularity score
   - Browse featured products
   - See district connections

3. **Chapel Discovery**: Visit `/chapels/quiet-thoughts`
   - Read micro-story
   - Experience symbolism
   - Get AI insight

4. **District Integration**: Visit any `/districts/[slug]`
   - See breadcrumb navigation
   - Notice world context

---

## ✅ Success Checklist

- [ ] City homepage loads at `/city`
- [ ] All 5 Halls are visible
- [ ] Clicking a Hall shows its page with AI spirit
- [ ] Streets show popularity scores
- [ ] Chapels display micro-stories
- [ ] Districts show breadcrumb navigation
- [ ] No console errors

---

## 🔧 If Something Doesn't Work

### Database Issues
```bash
# Re-run the schema
psql -U postgres -d your_db -f world-architecture-schema.sql
```

### AI Spirits Not Generating
- Check OpenAI API key is valid
- Verify API credits available
- Look for errors in console

### Blank Pages
- Check Supabase connection
- Verify environment variables
- Restart dev server

---

## 🎉 You're Ready!

Your AI City is now running. Users can:
- 🏛️ Explore Grand Halls
- 🛣️ Navigate Living Streets
- 🕊️ Discover Sacred Chapels
- 🏪 Shop in Districts
- 🤖 Interact with AI Spirits

---

## 📚 Next Steps

1. **Read Full Docs**: [WORLD_ARCHITECTURE.md](WORLD_ARCHITECTURE.md)
2. **Deploy to Production**: [DEPLOYMENT.md](DEPLOYMENT.md)
3. **Review Implementation**: [AI_CITY_SUMMARY.md](AI_CITY_SUMMARY.md)
4. **Customize Your City**: Edit halls/streets/chapels in database

---

## 🚀 Deploy to Production (Bonus)

```bash
# Push to GitHub
git add .
git commit -m "AI City complete"
git push

# Deploy to Vercel
vercel --prod
```

Set environment variables in Vercel dashboard, then visit your live city!

---

**Welcome to the AI City. Let's make commerce magical.** ✨
