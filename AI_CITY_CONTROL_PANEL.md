# 🎛️ AI City Control Panel

## 🚀 Quick Activation (30 seconds)

```bash
# 1. Add your OpenAI key to .env.local
OPENAI_API_KEY=sk-your-actual-key-here

# 2. Restart server
npm run dev

# 3. Check status
open http://localhost:3000/ai-city/status
```

---

## 📊 System Endpoints

| Endpoint | Purpose | Try It |
|----------|---------|--------|
| `/ai-city/status` | View system status dashboard | [Status Page](http://localhost:3000/ai-city/status) |
| `/api/ai-city/status` | JSON status API | `curl localhost:3000/api/ai-city/status` |
| `/city` | Experience the living city | [City Home](http://localhost:3000/city) |

---

## 🔄 Background Jobs (Manual Trigger)

```bash
# Update street popularity (hourly)
curl http://localhost:3000/api/cron/update-world \
  -H "Authorization: Bearer ai-city-evolution-2026"

# Evolve AI spirits (daily)
curl http://localhost:3000/api/cron/evolve-spirits \
  -H "Authorization: Bearer ai-city-evolution-2026"

# Regenerate content (daily)
curl http://localhost:3000/api/cron/regenerate-content \
  -H "Authorization: Bearer ai-city-evolution-2026"

# Aggregate analytics (daily)
curl http://localhost:3000/api/cron/aggregate-analytics \
  -H "Authorization: Bearer ai-city-evolution-2026"
```

---

## 🎯 What's Active Right Now

### ✅ Always Working
- World architecture (Halls, Streets, Chapels)
- Navigation & routing
- Database operations
- Static AI spirits
- Visual themes & UI
- E-commerce features

### ⚡ Activated with OpenAI Key
- Dynamic spirit generation
- Personalized greetings
- Atmospheric descriptions
- Spirit evolution
- AI-powered recommendations

### 🔄 Activated on Vercel Deploy
- Hourly popularity updates
- Daily spirit evolution
- Daily content refresh
- Analytics aggregation

---

## 🎨 Experience Modes

| Feature | Static Mode | Dynamic Mode (OpenAI) |
|---------|-------------|----------------------|
| Spirits | Pre-written | AI-generated |
| Greetings | Fixed | Context-aware |
| Descriptions | Database text | Time/mood adaptive |
| Evolution | Manual updates | Learns from users |
| Cost | Free | ~$10-20/month |

---

## 🚢 Deploy to Production

```bash
# 1. Commit changes
git add .
git commit -m "Activate AI City"
git push

# 2. Deploy
vercel

# 3. Set environment variables in Vercel dashboard
OPENAI_API_KEY=sk-...
CRON_SECRET=ai-city-evolution-2026

# 4. Background jobs auto-start! ✨
```

---

## 🧪 Quick Tests

```bash
# Test OpenAI is working
curl localhost:3000/api/ai-city/status | jq '.systems.openAI'

# Test cron endpoint
curl localhost:3000/api/cron/update-world \
  -H "Authorization: Bearer ai-city-evolution-2026"

# Check recent analytics
# Visit: /admin/autonomous
```

---

## 📈 Monitor Your Living City

### Key Metrics to Watch
- **Street Popularity**: Changes hourly based on traffic
- **Spirit Interactions**: Tracked in `spirit_interactions` table
- **User Affinity**: Builds in `user_world_views` table
- **Analytics**: Aggregated daily

### View in Database
```sql
-- Recent spirit interactions
SELECT * FROM spirit_interactions ORDER BY created_at DESC LIMIT 10;

-- Street popularity trends
SELECT name, popularity_score, trending FROM streets ORDER BY popularity_score DESC;

-- Analytics summary
SELECT layer_type, COUNT(*) as views 
FROM world_analytics 
WHERE recorded_at > NOW() - INTERVAL '24 hours'
GROUP BY layer_type;
```

---

## 🔐 Security Notes

- `CRON_SECRET` protects background job endpoints
- Only authorized requests can trigger jobs
- Change the secret in production
- Keep `OPENAI_API_KEY` private

---

## 💰 Cost Estimates

### OpenAI Usage (GPT-4)
- Spirit generation: ~500 tokens = $0.015
- Atmospheric description: ~200 tokens = $0.006
- Daily evolution (10 spirits): ~$0.20

### Monthly Estimates
- Low traffic (100 visitors/day): ~$10
- Medium (500 visitors/day): ~$25
- High (2000 visitors/day): ~$75

*Costs decrease with caching*

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ `/ai-city/status` shows "DYNAMIC" mode
- ✅ Hall pages show unique, poetic greetings
- ✅ Console logs show `[AI] Generated dynamic spirit`
- ✅ Each visit to same hall feels slightly different
- ✅ Background jobs log success in Vercel

---

## 🆘 Common Issues

**"static fallback" mode**
→ OpenAI key not set or invalid

**"Unauthorized" on cron**
→ Missing Authorization header with CRON_SECRET

**Spirits not evolving**
→ Need more interactions (minimum 10)

**Jobs not running**
→ Only work on Vercel, not localhost

---

**The city is alive. Let it learn, adapt, and amaze.** 🌆✨
