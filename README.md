# 🌌 AI-Native Mall: A Self-Evolving Commerce Organism

**Not just software. A living system.**

This is a **fully autonomous, AI-native e-commerce platform** that learns, adapts, and evolves without human intervention. Built with Next.js 15, TypeScript, Supabase, OpenAI GPT-4, and pgvector.

> "Think beyond traditional software. Think in terms of systems that learn, adapt, and reconfigure themselves."

## 🧬 What Makes This Different?

**Traditional E-Commerce:**
- Static content
- Manual optimization
- Fixed layouts
- Human-driven changes

**This Platform:**
- ✨ **Self-optimizing** products
- 🔄 **Evolving** district personalities
- 🤖 **Autonomous** content generation
- ⚕️ **Self-healing** infrastructure
- 🔮 **Predictive** personalization
- 📊 **Natural language** analytics

## 🌟 Core Features

### Phase 1: AI-Native Foundation
1. ✅ **AI Product Descriptions** - GPT-4 generated with tone matching
2. ✅ **Intelligent Auto-Tagging** - Smart categorization
3. ✅ **Semantic Search** - pgvector-powered natural language search
4. ✅ **AI SEO Metadata** - Automated optimization
5. ✅ **Social Media Assets** - Platform-specific content generation
6. ✅ **Smart Shopping Cart** - Persistent state management
7. ✅ **Vendor Onboarding** - AI-assisted dashboard
8. ✅ **Analytics & Tracking** - Comprehensive event tracking
9. ✅ **Product Recommendations** - Personalized suggestions
10. ✅ **Admin Dashboard** - Real-time metrics visualization

### Phase 2: Autonomous Evolution 🧬
1. ✅ **Autonomous Core** - Learning cycles, task scheduling, signal processing
2. ✅ **Product Intelligence** - Self-optimizing products based on performance
3. ✅ **Merchandising Engine** - Dynamic ordering, A/B testing, auto-rules
4. ✅ **District Evolution** - Self-adapting themes and personalities
5. ✅ **Self-Healing System** - Auto-detection and repair
6. ✅ **Social Media Engine** - Fully automated content calendars
7. ✅ **AI Analytics with NLG** - Natural language insights
8. ✅ **Predictive Personalization** - User-specific experiences
9. ✅ **Plugin Architecture** - Modular AI capabilities
10. ✅ **Background Job Runner** - Continuous optimization cycles

### Phase 3: Consciousness Layer 🌊
1. ✅ **Emotional Intelligence Engine** - Detects user feelings from behavior
2. ✅ **AI Curator System** - Five named personalities that build relationships
3. ✅ **Transformation Journeys** - Guides users from stress → calm, seeking → inspired
4. ✅ **Personal Rituals** - AI-generated meaningful product usage practices
5. ✅ **Healing Moments** - Tracks significant positive emotional shifts
6. ✅ **Relationship Evolution** - Stranger → Acquaintance → Friend → Confidant
7. ✅ **Emotional Product Scoring** - Products ranked by emotional resonance
8. ✅ **Consciousness Analytics** - Measures transformation over conversion

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API key

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

1. Copy environment template:
```bash
cp .env.local.example .env.local
```

2. Add your credentials to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

3. Run SQL scripts in Supabase SQL Editor (in order):
   - `supabase-complete-schema.sql`
   - `supabase-pgvector-setup.sql`
   - `supabase-analytics-functions.sql`
   - `supabase-recommendations-functions.sql`

4. Generate embeddings for existing products:
```bash
npm run generate-embeddings
```

5. Start development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

## 📚 Documentation

### Setup & Configuration
- **[Quick Start Guide](QUICK_START.md)** - Get up and running fast
- **[Complete Setup Guide](COMPLETE_SETUP_GUIDE.md)** - Detailed documentation
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Technical overview
- **[Usage Examples](lib/examples/usage-examples.ts)** - Code examples

### Consciousness Layer (Latest)
- **[Consciousness Summary](CONSCIOUSNESS_SUMMARY.md)** - What makes AI City alive
- **[Consciousness Layer Deep Dive](AI_CONSCIOUSNESS_LAYER.md)** - Complete system docs
- **[Migration Guide](CONSCIOUSNESS_MIGRATION_GUIDE.md)** - Database setup instructions
- **[Architecture Diagram](ARCHITECTURE_DIAGRAM.md)** - Visual system overview

### Migration Instructions

**Apply Consciousness Layer to your database:**

1. **Via Supabase Dashboard** (Recommended):
   - Open Supabase SQL Editor
   - Copy contents of `supabase-consciousness-migration.sql`
   - Run query
   - Verify tables created

2. **Via Node.js Script**:
   ```bash
   node scripts/run-consciousness-migration.js
   ```

3. **Manual verification**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name LIKE '%emotional%' 
   OR table_name LIKE '%curator%' 
   OR table_name LIKE '%ritual%';
   ```

See [CONSCIOUSNESS_MIGRATION_GUIDE.md](CONSCIOUSNESS_MIGRATION_GUIDE.md) for detailed instructions.

## 🏗️ Project Structure

```
ai-mall/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Homepage
│   ├── cart/page.tsx                 # Shopping cart
│   ├── checkout/page.tsx             # Checkout flow
│   ├── vendor-registration/page.tsx  # Vendor signup
│   ├── districts/[slug]/page.tsx     # District pages
│   └── admin/
│       ├── dashboard/page.tsx        # Analytics dashboard
│       └── vendors/                  # Vendor management
├── components/
│   ├── ProductCard.tsx               # Product display
│   ├── ProductGrid.tsx               # Product grid
│   ├── CartIcon.tsx                  # Cart indicator
│   ├── SemanticSearchBar.tsx         # AI search
│   ├── RecommendationsSection.tsx    # Recommendations
│   └── AnalyticsTracker.tsx          # Analytics
├── lib/
│   ├── ai/
│   │   ├── openaiClient.ts           # OpenAI config
│   │   ├── generateDescription.ts    # AI descriptions
│   │   ├── generateTags.ts           # AI tagging
│   │   ├── generateSEO.ts            # SEO metadata
│   │   ├── generateSocial.ts         # Social content
│   │   └── semanticSearch.ts         # Vector search
│   ├── analytics/
│   │   └── tracking.ts               # Event tracking
│   ├── recommendations/
│   │   └── engine.ts                 # Recommendation logic
│   ├── store/
│   │   └── cartStore.ts              # Cart state (Zustand)
│   ├── supabaseClient.ts             # Supabase client
│   └── types.ts                      # TypeScript types
├── scripts/
│   └── generate-embeddings.ts        # Bulk embedding generation
├── supabase-*.sql                    # Database schemas
└── [config files]
```

## 🎯 Key Routes

### Public
- `/` - Homepage with districts
- `/districts/[slug]` - District product listings
- `/cart` - Shopping cart
- `/checkout` - Checkout page
- `/vendor-registration` - Vendor signup

### Admin
- `/admin/dashboard` - Analytics & insights
- `/admin/vendors` - Vendor management
- `/admin/vendors/[id]/products/upload` - Product upload

## 💻 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI (GPT-4, text-embedding-3-small)
- **State**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React

## 🗄️ Database Schema

### Core Tables
- **microstores**: Store/district information
- **products**: Product catalog with pgvector embeddings
- **vendors**: Vendor accounts and status
- **orders**: Customer orders
- **order_items**: Order line items
- **analytics**: Event tracking (views, clicks, purchases)
- **cart_items**: Server-side cart (optional)
- **product_seo**: SEO metadata storage
- **product_social**: Social media content storage

### Key Features
- Row Level Security (RLS) enabled
- pgvector extension for semantic search
- Automatic timestamp management
- Comprehensive indexing for performance

## 🤖 AI Features Usage

### Generate Product Description
```typescript
import { generateProductDescription } from '@/lib/ai/generateDescription';

const result = await generateProductDescription(
  'Wireless Headphones',
  'Electronics',
  'Tech District'
);
// Returns: { longDescription, shortDescription, seoKeywords, tone }
```

### Semantic Search
```typescript
import { semanticSearch } from '@/lib/ai/semanticSearch';

const results = await semanticSearch('comfortable running shoes', 10);
```

### Get Recommendations
```typescript
import { getRecommendedProducts } from '@/lib/recommendations/engine';

const products = await getRecommendedProducts({
  tags: ['tech', 'gadget'],
  districtSlug: 'tech',
  limit: 6
});
```

### Track Analytics
```typescript
import { trackProductView, trackAddToCart } from '@/lib/analytics/tracking';

await trackProductView(productId, microstoreId);
await trackAddToCart(productId, microstoreId, price);
```

## 📊 Admin Dashboard

Access at `/admin/dashboard` to view:
- **Summary Cards**: Views, add-to-carts, purchases, revenue
- **Top Products**: Most viewed products (bar chart)
- **District Popularity**: Event distribution (pie chart)
- **Trending Products**: Real-time trending items
- **AI Insights**: Conversion rate, cart abandonment analysis

## 🎨 Customization

### AI Prompts
Customize AI behavior in:
- `lib/ai/generateDescription.ts` - Product descriptions
- `lib/ai/generateTags.ts` - Tag generation
- `lib/ai/generateSEO.ts` - SEO metadata
- `lib/ai/generateSocial.ts` - Social content

### Styling
- Global styles: `styles/globals.css`
- Tailwind config: `tailwind.config.js`
- Component styles: Inline with Tailwind classes

### Districts/Categories
- Add/modify in database `microstores` table
- Update district themes in AI generation prompts
- Customize filtering logic in components

## 🔒 Security

### Implemented
- Row Level Security (RLS) on all tables
- Environment variable protection
- Input validation
- SQL injection prevention (via Supabase client)

### Recommendations
- Add Supabase Auth for user management
- Implement role-based access control
- Add rate limiting for AI endpoints
- Use HTTPS in production
- Regularly rotate API keys

## 📈 Performance

### Optimizations
- **Embeddings**: Generate asynchronously, cache when possible
- **Analytics**: Database indexes on frequently queried columns
- **Recommendations**: Cache trending products
- **Search**: pgvector IVFFlat index for fast similarity search

### Monitoring
- Track OpenAI API usage and costs
- Monitor Supabase database size
- Review analytics for insights
- Check error logs regularly

## 🧪 Testing

Run through this checklist:
- [ ] Install dependencies and configure environment
- [ ] Run all SQL scripts
- [ ] Test AI description generation
- [ ] Test semantic search
- [ ] Add items to cart
- [ ] Complete checkout
- [ ] Register vendor
- [ ] Upload product
- [ ] View analytics dashboard
- [ ] Test recommendations

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables
Add these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

## 🛠️ Troubleshooting

### Embeddings Not Working
- Ensure pgvector extension is enabled
- Check OpenAI API key validity
- Verify embedding column exists

### Analytics Not Tracking
- Check RLS policies
- Verify tracking functions are called
- Check browser console for errors

### AI Generation Fails
- Verify OpenAI API key and quota
- Check rate limits
- Review error logs

## 🤝 Contributing

This is a demonstration project showcasing AI-native e-commerce features. Feel free to fork and customize for your needs!

## 📄 License

This project is provided as-is for educational and demonstration purposes.

## 🙏 Acknowledgments

Built with:
- Next.js - React framework
- Supabase - Backend platform
- OpenAI - AI capabilities
- Tailwind CSS - Styling
- Recharts - Data visualization

---

**Made with ❤️ using AI-native technologies**

The seed data includes 5 unique shopping districts:

1. **ByteHub** - Tech & Gadgets
2. **GlowHaus** - Beauty & Wellness
3. **CraftCore** - Home & Lifestyle
4. **FitForge** - Fitness & Performance
5. **PetPavilion** - Pets & Companions

Each district comes with 4-6 example products.

## 🎨 Customization

### Adding New Districts

1. Add a new row to the `microstores` table in Supabase
2. Add products for that microstore using its `id`
3. The district will automatically appear on the homepage

### Styling

- Modify `styles/globals.css` for global styles
- Update `tailwind.config.js` for Tailwind customization
- Edit component files for component-specific styling

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Image Optimization**: Next.js Image component
- **State Management**: React Hooks

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `OPENAI_API_KEY` | Your OpenAI API key for AI features |

## 📚 Documentation

- **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)** - Complete implementation summary
- **[AUTONOMOUS_SYSTEMS.md](AUTONOMOUS_SYSTEMS.md)** - Deep dive into autonomous features
- **[AUTONOMOUS_QUICKSTART.md](AUTONOMOUS_QUICKSTART.md)** - 5-minute quick start guide
- **[SETUP.md](SETUP.md)** - Detailed setup instructions

## 🎯 Key Capabilities

### Self-Optimization
Products rewrite their own descriptions when performance drops. Districts evolve their personalities based on user behavior. The system learns what works and applies those patterns automatically.

### AI-Powered Insights
Get natural language summaries of your analytics. The system detects anomalies, suggests improvements, and generates executive reports—all automatically.

### Autonomous Content
Weekly social media calendars generated for each district. Platform-specific content (TikTok, Instagram, Twitter) created without human intervention.

### Personalization
Every user gets a unique experience. The system builds profiles from behavior, predicts interests, and adapts layouts in real-time.

### Self-Healing
Broken images? Missing data? The system detects and fixes issues automatically. No manual intervention required.

## 🔒 Security Notes

- Row Level Security (RLS) is enabled on all tables
- Public read access is granted for browsing
- Configure write policies based on your auth requirements
- Never commit `.env.local` to version control

## 🌌 Philosophy

This platform represents a new paradigm: **Software as an Organism**.

It doesn't just execute commands—it observes, learns, adapts, evolves, heals, generates, and optimizes continuously.

**This is the future of AI-native software development.**

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Support

For support, please open an issue in the repository.

---

**Built with:** Next.js 15, React 19, TypeScript, Supabase, OpenAI GPT-4, pgvector

**Philosophy:** Beyond traditional software. Into living systems.

**Result:** A self-evolving, AI-native commerce organism that no human would have designed.
