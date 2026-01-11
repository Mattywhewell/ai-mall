@echo off
echo 🚀 AI Mall Setup Script
echo ======================
echo.

REM Check if .env.local exists
if not exist ".env.local" (
    echo ❌ .env.local not found. Creating template...
    copy .env.local.example .env.local
    echo ✅ Created .env.local from template
    echo ⚠️  Please edit .env.local with your actual API keys
    echo.
)

echo 📋 Required Environment Variables:
echo ==================================
echo.
echo 🔑 Supabase:
echo    - NEXT_PUBLIC_SUPABASE_URL
echo    - NEXT_PUBLIC_SUPABASE_ANON_KEY
echo    - SUPABASE_SERVICE_ROLE_KEY
echo.
echo 🤖 OpenAI:
echo    - OPENAI_API_KEY
echo.
echo 💳 Stripe:
echo    - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
echo    - STRIPE_SECRET_KEY
echo    - STRIPE_WEBHOOK_SECRET
echo    - STRIPE_CONNECT_CLIENT_ID
echo.
echo 🏗️ Matterport (for 3D tours):
echo    - NEXT_PUBLIC_MATTERPORT_KEY
echo.

echo 🗄️ Database Setup:
echo ==================
echo Run these SQL files in your Supabase dashboard:
echo    - supabase-3d-tours-schema.sql
echo    - supabase-new-features-migration.sql
echo    - Other migration files as needed
echo.

echo 🧪 Testing:
echo ===========
echo npm run dev                    # Start development server
echo npm run build                  # Test production build
echo npx playwright test            # Run e2e tests
echo.

echo 🚀 Deployment:
echo ==============
echo vercel --prod                  # Deploy to production
echo.

echo ✅ Setup complete! Edit your environment variables and run migrations.
pause