#!/bin/bash

echo "🚀 AI Mall Deployment Script"
echo "============================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel:"
    vercel login
fi

echo "📋 Required Environment Variables for Deployment:"
echo "=================================================="
echo ""
echo "SUPABASE CONFIGURATION:"
echo "  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key"
echo "  SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key"
echo ""
echo "OPENAI CONFIGURATION:"
echo "  OPENAI_API_KEY=your_actual_openai_api_key"
echo ""
echo "STRIPE CONFIGURATION:"
echo "  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key"
echo "  STRIPE_SECRET_KEY=sk_test_your_key"
echo "  STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret"
echo "  STRIPE_CONNECT_CLIENT_ID=ca_your_connect_client_id"
echo ""
echo "MATTERPORT CONFIGURATION:"
echo "  MATTERPORT_SDK_KEY=your_actual_matterport_sdk_key"
echo ""
echo "SECURITY:"
echo "  CRON_SECRET=your_secure_random_string"
echo ""
echo "📝 INSTRUCTIONS:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Create a new project or select existing"
echo "3. Add the environment variables above in Project Settings > Environment Variables"
echo "4. Set them for Production, Preview, and Development environments"
echo ""
read -p "❓ Have you configured the environment variables in Vercel? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⏹️  Deployment cancelled. Please configure environment variables first."
    exit 1
fi

echo "🔨 Building for production..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your AI Mall is now live!"
echo ""
echo "📊 Next Steps:"
echo "1. Run database migrations in Supabase"
echo "2. Test all features"
echo "3. Configure domain (optional)"
echo "4. Set up monitoring"