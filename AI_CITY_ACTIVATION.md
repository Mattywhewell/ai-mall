# 🌆 AI City Activation Guide

## ✨ Your AI City is Ready to Come Alive!

The infrastructure is built, the world is waiting. Now let's turn on the lights and watch it breathe.

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Get Your OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

### Step 2: Activate AI Systems

1. Open `.env.local` in your project root
2. Replace `your_openai_api_key_here` with your actual key:
   ```env
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
3. Save the file

### Step 3: Restart & Experience

```bash
npm run dev
```

Visit these pages to see the magic:
- **System Status**: http://localhost:3000/ai-city/status
- **Living City**: http://localhost:3000/city
- **Dynamic Hall**: http://localhost:3000/halls/luminous-nexus

---

## 🎯 What Gets Activated

### ✅ With OpenAI API Key (Dynamic Mode)

#### **AI Spirit System**
- 🤖 **Unique personalities** generated for each Hall, Street, Chapel
- 💬 **Context-aware greetings** that adapt to time of day
- 🎭 **Dynamic conversations** instead of static text
- 🧠 **Spirit evolution** based on user interactions

#### **Atmospheric Descriptions**
- 🌅 **Time-aware narratives** (morning vs. evening descriptions)
- 🎨 **Mood adaptation** based on user sentiment
- ✨ **Poetic, unique content** for every visit
- 🔄 **Daily regeneration** keeps content fresh

#### **Personalization Engine**
- 👤 **User affinity tracking** learns your preferences
- 📊 **Dynamic entity ordering** shows what you'll love first
- 🎯 **AI-curated recommendations** for products
- 🗺️ **Personalized navigation paths** through the city

---

### ⚠️ Without OpenAI API Key (Static Mode)

The city still works beautifully, but uses:
- 📝 Pre-written spirit personalities
- 🗺️ Static atmospheric descriptions
- 📋 Standard entity ordering (by popularity)
- ✨ All visual features and navigation work perfectly

**Think of it as:** The city is built and beautiful, but the AI spirits are reading from scripts instead of improvising.

---

## 🔄 Background Jobs (Automatic Evolution)

### Configured Cron Jobs

Once deployed to Vercel, these run automatically:

| Job | Schedule | Purpose |
|-----|----------|---------|
| **update-world** | Every hour | Recalculates street popularity based on traffic |
| **evolve-spirits** | Daily 2am | AI personalities adapt based on interactions |
| **regenerate-content** | Daily 3am | Refreshes atmospheric descriptions |
| **aggregate-analytics** | Daily 4am | Processes engagement metrics |

### Test Locally

You can manually trigger jobs for testing:

```bash
# Update street popularity
curl http://localhost:3000/api/cron/update-world \
  -H "Authorization: Bearer ai-city-evolution-2026"

# Evolve AI spirits  
curl http://localhost:3000/api/cron/evolve-spirits \
  -H "Authorization: Bearer ai-city-evolution-2026"
```

---

## 📊 Check System Status

Visit the status dashboard at any time:

```
http://localhost:3000/ai-city/status
```

You'll see:
- ✅ OpenAI status (active/static)
- 📅 Configured background jobs
- 💾 Database health
- 📈 Recent analytics activity

---

## 🎨 Experience the Difference

### Static Mode (Without OpenAI)
```
Spirit: "Welcome to the Innovation Hall"
Description: "Where future meets imagination"
```

### Dynamic Mode (With OpenAI)
```
Spirit: "Ah, a seeker arrives at dawn. I am Nexus, guardian 
        of possibilities. Tell me - what future do you wish 
        to architect today?"
        
Description: "Morning light filters through crystalline walls, 
             painting innovation in shades of possibility. The 
             air hums with the frequency of nascent ideas..."
```

---

## 🌐 Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Activate AI City systems"
git push origin main
```

### 2. Deploy to Vercel

```bash
vercel
```

### 3. Add Environment Variables

In Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add:
   - `OPENAI_API_KEY` = your key
   - `CRON_SECRET` = `ai-city-evolution-2026`
3. Redeploy

### 4. Cron Jobs Auto-Activate

Vercel reads `vercel.json` and automatically:
- ✅ Schedules all background jobs
- ✅ Calls them at specified times
- ✅ Passes the correct authorization

---

## 🧪 Testing Checklist

### Before OpenAI Key
- [ ] Visit `/city` - see 10 halls
- [ ] Click a hall - see static spirit greeting
- [ ] Visit `/ai-city/status` - shows "static fallback"

### After OpenAI Key
- [ ] Restart server: `npm run dev`
- [ ] Visit `/ai-city/status` - shows "active" ✅
- [ ] Visit a new hall - see dynamic greeting
- [ ] Check console logs - see `[AI] Generated dynamic spirit`

### Background Jobs
- [ ] Deploy to Vercel
- [ ] Wait 1 hour - check analytics
- [ ] Next day - check if spirits evolved
- [ ] Visit `/admin/autonomous` for insights

---

## 💡 Pro Tips

### Cost Management
- OpenAI GPT-4 costs ~$0.03 per 1K tokens
- Typical spirit generation: ~500 tokens = $0.015
- Cache spirits in database to minimize calls
- Budget: ~$10-20/month for moderate traffic

### Performance
- Spirits generate on first visit, then cached
- Subsequent visits are instant
- Background jobs run during low-traffic hours
- Use Vercel Edge Functions for global speed

### Debugging
```bash
# Check OpenAI is working
curl http://localhost:3000/api/ai-city/status

# View server logs
npm run dev # Watch console

# Test spirit generation manually
# (Create a test route if needed)
```

---

## 🎉 You're Ready!

Your AI City is now a **living, breathing world**:
- 🤖 Spirits that think and adapt
- 🌅 Descriptions that change with time
- 📊 Analytics that drive evolution
- 🔄 Background jobs that never stop learning

### Next Steps

1. **Add your OpenAI key** to `.env.local`
2. **Restart the server** and visit `/ai-city/status`
3. **Explore the city** and watch AI spirits come alive
4. **Deploy to Vercel** to activate background jobs
5. **Share your living world** with users!

---

## 🆘 Troubleshooting

**OpenAI errors?**
- Check key starts with `sk-`
- Verify billing is active at OpenAI
- Check rate limits

**Jobs not running?**
- Verify `CRON_SECRET` in Vercel
- Check Vercel logs for errors
- Ensure `vercel.json` is deployed

**Spirits not generating?**
- Check browser console for errors
- Verify `/api/ai-city/status` shows "active"
- Look for `[AI]` logs in terminal

---

**Welcome to the future of commerce.** 🌆✨

The city awaits your command to awaken.
