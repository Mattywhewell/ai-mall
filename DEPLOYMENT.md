# AI City Deployment Guide

## 🚀 **LIVE & OPERATIONAL**

**🌐 Production URL**: https://ai-mall.vercel.app

**✅ Status**: Fully deployed on Vercel with enterprise security

---

## Quick Start

### 1. Database Setup

Run the world architecture schema in your Supabase SQL Editor:

```bash
# Option 1: Using psql
psql -U postgres -d your_database -f world-architecture-schema.sql

# Option 2: Copy/paste into Supabase SQL Editor
```

The schema will create:
- 9 new tables (halls, streets, chapels, ai_spirits, user_world_views, etc.)
- Database functions for popularity calculations
- Seed data (5 Halls, 5 Streets, 5 Chapels)
- Proper indexes and permissions

### 2. Verify Environment Variables

Ensure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Test the City

Navigate to:
- `http://localhost:3000` - Homepage with city entrance
- `http://localhost:3000/city` - City overview
- `http://localhost:3000/halls/luminous-nexus` - Example Hall
- `http://localhost:3000/streets/neon-boulevard` - Example Street
- `http://localhost:3000/chapels/quiet-thoughts` - Example Chapel

---

## Production Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add AI City world architecture"
   git push origin main
   ```

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Set Environment Variables in Vercel**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `OPENAI_API_KEY`

4. **Redeploy**
   ```bash
   vercel --prod
   ```

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

---

## Post-Deployment Tasks

### 1. Run Initial World Evolution

Trigger the evolution jobs to populate initial data:

```bash
curl -X POST https://your-domain.com/api/world/evolution \
  -H "Content-Type: application/json" \
  -d '{"job": "all"}'
```

Or manually visit: `https://your-domain.com/api/world/evolution` (POST request)

### 2. Schedule Background Jobs

Set up cron jobs or use Vercel Cron (vercel.json):

```json
{
  "crons": [
    {
      "path": "/api/world/evolution",
      "schedule": "0 * * * *"
    }
  ]
}
```

Or use external services like:
- **Cron-job.org** - Free cron job scheduler
- **EasyCron** - Scheduled tasks
- **AWS CloudWatch Events** - If using AWS

Recommended schedule:
- **Hourly**: Street popularity updates
- **Daily at 3 AM**: AI spirit evolution, atmospheric content, analytics

### 3. Monitor AI Spirit Generation

First-time visitors will trigger AI spirit generation. Monitor logs:

```bash
# Development
npm run dev

# Production (if using PM2)
pm2 logs

# Vercel
vercel logs
```

### 4. Verify Database Seeding

Check Supabase dashboard:
- **halls** table should have 5 entries
- **streets** table should have 5 entries
- **chapels** table should have 5 entries

If missing, re-run the seed section of `world-architecture-schema.sql`

---

## Database Migration for Existing Projects

If you already have microstores/products data:

### Step 1: Map Districts to Streets

```sql
-- Update streets table with existing district slugs
UPDATE streets 
SET districts = ARRAY['district-slug-1', 'district-slug-2']
WHERE slug = 'neon-boulevard';

-- Example mappings:
UPDATE streets SET districts = ARRAY['tech-hub', 'gadget-corner'] WHERE slug = 'tech-corridor';
UPDATE streets SET districts = ARRAY['yoga-studio', 'spa-retreat'] WHERE slug = 'wellness-way';
UPDATE streets SET districts = ARRAY['handcraft-shop', 'pottery-corner'] WHERE slug = 'artisan-row';
```

### Step 2: Generate AI Spirits for Existing Districts

Run this API endpoint for each district:

```bash
curl -X POST https://your-domain.com/api/world/spirits/generate \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "district",
    "entity_id": "your-district-id"
  }'
```

(Note: You'll need to create this endpoint or use the existing spirit generation logic)

---

## Testing Checklist

### Functionality Tests

- [ ] City homepage loads with personalized greeting
- [ ] All 5 Halls are displayed
- [ ] Clicking a Hall navigates to Hall page
- [ ] Hall page shows AI spirit greeting
- [ ] Hall page lists connected Streets
- [ ] Street page shows districts and featured products
- [ ] Chapel page loads with micro-story and symbolism
- [ ] District page shows breadcrumb navigation (City → Hall → Street → District)
- [ ] Analytics are being tracked (check `world_analytics` table)
- [ ] User world views are being created (check `user_world_views` table)

### AI Features Tests

- [ ] AI spirits generate unique personalities
- [ ] Spirit greetings are contextual and varied
- [ ] Atmospheric descriptions are poetic and relevant
- [ ] Welcome messages adapt to returning users
- [ ] Navigation suggestions make sense

### Performance Tests

- [ ] City page loads in < 2 seconds
- [ ] API responses return in < 500ms
- [ ] Images load progressively
- [ ] No console errors in browser
- [ ] Mobile responsive design works

### Background Job Tests

- [ ] Street popularity updates correctly
- [ ] Trending status changes when popularity > 70
- [ ] AI spirits evolve after sufficient interactions
- [ ] Atmospheric content regenerates daily

---

## Troubleshooting

### Issue: AI spirits not generating

**Solution:**
1. Check OpenAI API key is valid
2. Verify API key has sufficient credits
3. Check OpenAI API status: https://status.openai.com
4. Review API logs for error messages

### Issue: Database tables not found

**Solution:**
1. Re-run `world-architecture-schema.sql`
2. Verify Supabase connection
3. Check table permissions (should be granted to `anon` and `authenticated`)

### Issue: World evolution jobs failing

**Solution:**
1. Check Supabase connection in background jobs
2. Verify analytics data exists in `world_analytics` table
3. Run jobs manually first: `POST /api/world/evolution`
4. Check function execution logs

### Issue: Personalization not working

**Solution:**
1. Verify `user_world_views` table exists
2. Check if analytics are being tracked
3. Clear browser cookies and test with fresh session
4. Review WorldRenderer logs

### Issue: Streets showing 0 popularity

**Solution:**
1. Manually trigger popularity update: `POST /api/world/evolution` with `{"job": "street-popularity"}`
2. Ensure analytics tracking is working
3. Verify `calculate_street_popularity()` database function exists

---

## Monitoring & Analytics

### Key Metrics to Track

1. **User Engagement**
   - Hall visits per session
   - Street navigation frequency
   - Chapel discovery rate
   - District conversion rate

2. **AI Performance**
   - Spirit generation success rate
   - Average response time for AI calls
   - User sentiment distribution
   - Spirit evolution frequency

3. **World Health**
   - Street popularity distribution
   - Trending street count
   - Chapel visit growth
   - Navigation path diversity

### Recommended Monitoring Tools

- **Vercel Analytics** - Page views, performance
- **Supabase Dashboard** - Database queries, API calls
- **OpenAI Usage Dashboard** - AI API usage, costs
- **Custom Analytics** - Query `world_analytics` table

### Example Analytics Queries

```sql
-- Most popular Hall
SELECT h.name, COUNT(wa.id) as visits
FROM halls h
JOIN world_analytics wa ON wa.entity_id = h.id
WHERE wa.layer_type = 'hall'
GROUP BY h.name
ORDER BY visits DESC
LIMIT 1;

-- Average session time per layer
SELECT layer_type, AVG(metric_value) as avg_time_seconds
FROM world_analytics
WHERE metric_type = 'time_spent'
GROUP BY layer_type;

-- Trending streets this week
SELECT s.name, s.popularity_score, s.trending
FROM streets s
WHERE s.updated_at > NOW() - INTERVAL '7 days'
ORDER BY s.popularity_score DESC;

-- Chapel emotion distribution
SELECT emotion, COUNT(*) as chapel_count, SUM(visit_count) as total_visits
FROM chapels
GROUP BY emotion
ORDER BY total_visits DESC;
```

---

## Scaling Considerations

### Database Optimization

1. **Indexes**: Already created in schema, but monitor query performance
2. **Partitioning**: Consider partitioning `world_analytics` by date if it grows large
3. **Archiving**: Archive old analytics data after 90 days

### AI Cost Optimization

1. **Caching**: Cache AI-generated content for 24 hours
2. **Rate Limiting**: Limit spirit generation to prevent abuse
3. **Model Selection**: Use GPT-3.5-turbo for less critical text generation

### Performance Optimization

1. **CDN**: Use Vercel's CDN for static assets
2. **Image Optimization**: Use Next.js Image component
3. **Code Splitting**: Dynamic imports for heavy components
4. **Edge Functions**: Deploy API routes to edge for lower latency

---

## Backup & Recovery

### Database Backups

Supabase provides automatic backups, but you can also:

```bash
# Manual backup
pg_dump -U postgres -d your_database > backup_$(date +%Y%m%d).sql

# Backup specific tables
pg_dump -U postgres -d your_database \
  -t halls -t streets -t chapels -t ai_spirits \
  > world_architecture_backup.sql
```

### Recovery Steps

1. **Restore from Supabase backup** (if available)
2. **Or restore from manual backup:**
   ```bash
   psql -U postgres -d your_database < backup_20240101.sql
   ```

3. **Re-run world evolution jobs:**
   ```bash
   curl -X POST https://your-domain.com/api/world/evolution \
     -d '{"job": "all"}'
   ```

---

## Support & Resources

- **Main Documentation**: [README.md](./README.md)
- **World Architecture Guide**: [WORLD_ARCHITECTURE.md](./WORLD_ARCHITECTURE.md)
- **Setup Instructions**: [SETUP.md](./SETUP.md)
- **Database Schema**: [world-architecture-schema.sql](./world-architecture-schema.sql)

---

## Next Steps After Deployment

1. **Customize Seed Data**
   - Add more Halls, Streets, Chapels relevant to your brand
   - Update color palettes and themes
   - Adjust AI spirit personalities

2. **Integrate with Marketing**
   - Share specific Hall/Street URLs on social media
   - Create seasonal Chapel experiences
   - Run campaigns highlighting trending Streets

3. **Collect User Feedback**
   - Monitor which layers are most engaging
   - Identify popular navigation paths
   - Survey users about AI spirit interactions

4. **Iterate on AI Personalities**
   - Refine spirit voices based on user sentiment
   - Add more diverse personality types
   - Create special event spirits

---

**Your AI City is now live! Welcome to the future of commerce.** ✨
