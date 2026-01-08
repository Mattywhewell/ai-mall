# 🚀 Quick Start: Autonomous Systems

Get the self-evolving AI-native mall running in 5 minutes.

## Prerequisites

- ✅ Existing AI-Native Mall setup (from previous implementation)
- ✅ OpenAI API key
- ✅ Supabase project with pgvector enabled
- ✅ Node.js 18+ installed

---

## Step 1: Database Setup (2 minutes)

### Run the Autonomous Schema

```bash
# Navigate to your Supabase SQL editor
# Or use psql:
psql -U postgres -d your_database -f autonomous-schema.sql
```

This creates:
- 20+ new tables for autonomous features
- Database functions for system operations
- Indexes for performance

### Verify Tables

```sql
-- Check that autonomous tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%autonomous%' 
   OR table_name LIKE '%learning%'
   OR table_name LIKE '%merchandising%';
```

You should see:
- `learning_signals`
- `autonomous_tasks`
- `autonomous_insights`
- `merchandising_rules`
- `ab_tests`
- And 15+ more...

---

## Step 2: Environment Variables (1 minute)

Your `.env.local` should already have:

```bash
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

No additional variables needed!

---

## Step 3: Start the Development Server (1 minute)

```bash
npm run dev
```

The autonomous systems will auto-start in development mode.

---

## Step 4: Access the Dashboard (1 minute)

Open your browser:

```
http://localhost:3000/admin/autonomous
```

You'll see:
- ✅ Core System status
- ✅ Job Runner status
- ✅ Active autonomous jobs
- ✅ Real-time insights
- ✅ Control panel

---

## Step 5: Test the Systems

### Test 1: Product Optimization

```bash
# Get a product ID from your database
curl http://localhost:3000/api/autonomous/products | jq
```

The system will analyze all products and suggest optimizations.

### Test 2: Run Health Check

```bash
curl http://localhost:3000/api/autonomous/health | jq
```

Watch the self-healing system detect and fix issues automatically.

### Test 3: Generate Social Calendar

```bash
curl -X POST http://localhost:3000/api/autonomous/social/calendar \
  -H "Content-Type: application/json" \
  -d '{"districtSlug": "tech-haven"}' | jq
```

AI generates a full week of social media content.

### Test 4: Get Personalized Experience

```bash
curl "http://localhost:3000/api/autonomous/personalize?userId=user123" | jq
```

See how the system builds user profiles and personalizes layouts.

---

## What Happens Automatically?

Once started, the system runs these jobs:

| Job | Frequency | What It Does |
|-----|-----------|-------------|
| **Product Intelligence** | Every 30 min | Analyzes and optimizes underperforming products |
| **Merchandising** | Every 15 min | Updates product ordering dynamically |
| **District Evolution** | Every 6 hours | Evolves district personalities and themes |
| **Health Checks** | Every hour | Detects and auto-fixes system issues |
| **Social Calendars** | Weekly | Generates full week of social content |
| **Analytics Narratives** | Daily | Creates NLG summaries of performance |
| **Anomaly Detection** | Every 2 hours | Detects traffic/conversion anomalies |
| **A/B Test Analysis** | Every 4 hours | Analyzes test results, picks winners |
| **User Profiles** | Every 5 min | Updates profiles for active users |
| **Plugin Hooks** | Every 20 min | Executes plugin optimization cycles |

---

## Monitoring the System

### Dashboard View

Navigate to `/admin/autonomous` to see:

1. **Status Cards**
   - Core system status
   - Job runner status
   - Active jobs count
   - Recent insights count

2. **Control Panel**
   - Start/Stop systems
   - Run one-time optimization
   - View last update time

3. **Recent Insights**
   - AI-generated insights
   - Trends and anomalies
   - Opportunities and warnings

4. **System Modules**
   - Quick links to each autonomous module
   - Direct API access

### Console Logs

Watch the console for:

```
🚀 Starting autonomous job runner...
✓ Loaded 6 plugins
✓ Autonomous job runner started
✓ Scheduled 10 autonomous jobs

🧠 Running product intelligence cycle...
⚕️  Running health check...
🔍 Found 12 issues
⚕️  Auto-healed 10 issues
```

---

## Manual Control

### Start Systems

```typescript
import { AutonomousJobRunner } from '@/lib/autonomous/job-runner';

await AutonomousJobRunner.start();
```

### Stop Systems

```typescript
AutonomousJobRunner.stop();
```

### Run One-Time Optimization

```typescript
await AutonomousJobRunner.runOptimization();
```

### Via API

```bash
# Start
curl -X POST http://localhost:3000/api/autonomous \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# Stop
curl -X POST http://localhost:3000/api/autonomous \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'

# Optimize
curl -X POST http://localhost:3000/api/autonomous \
  -H "Content-Type: application/json" \
  -d '{"action": "optimize"}'
```

---

## Verifying Autonomous Operations

### Check Learning Signals

```sql
SELECT * FROM learning_signals 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Autonomous Tasks

```sql
SELECT task_type, status, priority 
FROM autonomous_tasks 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Optimization Log

```sql
SELECT entity_type, optimization_type, ai_reasoning 
FROM optimization_log 
ORDER BY optimized_at DESC 
LIMIT 10;
```

### Check Health Issues

```sql
SELECT type, severity, auto_fixed, description 
FROM health_issues 
WHERE resolved_at IS NULL;
```

---

## Common Issues

### Issue: "Tables don't exist"

**Solution:**
```bash
# Re-run the schema
psql -U postgres -d your_database -f autonomous-schema.sql
```

### Issue: "OpenAI API error"

**Solution:**
```bash
# Check your API key
echo $OPENAI_API_KEY

# Ensure it's in .env.local
cat .env.local | grep OPENAI
```

### Issue: "No autonomous tasks running"

**Solution:**
```typescript
// Manually start the job runner
import { AutonomousJobRunner } from '@/lib/autonomous/job-runner';
AutonomousJobRunner.start();
```

### Issue: "Supabase connection error"

**Solution:**
```bash
# Verify Supabase credentials
curl "https://YOUR_PROJECT.supabase.co/rest/v1/microstores?select=*" \
  -H "apikey: YOUR_ANON_KEY"
```

---

## Performance Tips

### Adjust Job Frequencies

Edit `lib/autonomous/job-runner.ts`:

```typescript
// Change from 30 minutes to 1 hour
setInterval(async () => {
  await ProductIntelligence.analyzeProducts();
}, 60 * 60 * 1000) // 1 hour instead of 30 min
```

### Disable Specific Jobs

Comment out jobs you don't need:

```typescript
// Disable social media generation
// this.intervals.push(
//   setInterval(async () => {
//     await SocialMediaEngine.generateWeeklyCalendar(district.slug);
//   }, 24 * 60 * 60 * 1000)
// );
```

### Limit Processing

Reduce batch sizes:

```typescript
// In job-runner.ts
.limit(10) // Process only 10 districts instead of all
```

---

## Next Steps

1. ✅ Monitor the dashboard for 24 hours
2. ✅ Check optimization logs
3. ✅ Review auto-generated insights
4. ✅ Watch products evolve
5. ✅ Add custom plugins
6. ✅ Let the system learn

The autonomous systems are now running. The platform will continuously improve itself without your intervention.

**Welcome to self-evolving commerce.**

---

## Resources

- **Full Documentation:** [AUTONOMOUS_SYSTEMS.md](AUTONOMOUS_SYSTEMS.md)
- **Dashboard:** `/admin/autonomous`
- **API Reference:** See AUTONOMOUS_SYSTEMS.md
- **Database Schema:** `autonomous-schema.sql`

---

**Need help?** Check the console logs and database tables to see what the autonomous systems are doing.
