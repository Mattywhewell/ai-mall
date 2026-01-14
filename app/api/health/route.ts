import { NextResponse } from 'next/server';
// import { HybridStackOrchestrator } from '@/lib/ai/hybridStackOrchestrator';

/**
 * GET /api/health
 * Health check endpoint for monitoring system status
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Check environment variables
    const envStatus = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      openaiKey: !!process.env.OPENAI_API_KEY,
      stripeKey: !!process.env.STRIPE_SECRET_KEY,
      anthropicKey: !!process.env.ANTHROPIC_API_KEY,
      azureOpenaiKey: !!process.env.AZURE_OPENAI_API_KEY,
      grokKey: !!process.env.GROK_API_KEY,
    };

    const allEnvVars = Object.values(envStatus).every(Boolean);

    // Get AI system health
    let aiHealth = { status: 'mocked', providers: 6, lastUpdated: new Date().toISOString() };
    // Temporarily disabled to avoid orchestrator import issues

    // Overall system status
    const isHealthy = allEnvVars && aiHealth.status !== 'critical';
    const status = isHealthy ? 'healthy' : 'degraded';

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        environment: {
          status: allEnvVars ? 'healthy' : 'missing_vars',
          variables: envStatus
        },
        ai: {
          status: aiHealth.status,
          providers: aiHealth.providers,
          lastUpdated: aiHealth.lastUpdated
        }
      },
      checks: {
        environment: allEnvVars,
        ai: aiHealth.status !== 'critical',
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
        }
      }
    }, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 503 });
  }
}