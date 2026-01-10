/**
 * Health Check Endpoint
 * Returns system health status for monitoring
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  const startTime = Date.now();

  try {
    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {},
    };

    // Database check
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const dbStart = Date.now();
      const { error } = await supabase.from('products').select('id').limit(1);
      const dbLatency = Date.now() - dbStart;

      health.checks.database = {
        status: error ? 'unhealthy' : 'healthy',
        latency: dbLatency,
        message: error ? error.message : 'Connected',
      };

      if (error) health.status = 'degraded';
    } catch (err: any) {
      health.checks.database = {
        status: 'unhealthy',
        message: err.message,
      };
      health.status = 'down';
    }

    // API latency
    const apiLatency = Date.now() - startTime;
    health.checks.api = {
      status: apiLatency < 200 ? 'healthy' : 'degraded',
      latency: apiLatency,
    };

    // Memory usage
    const memUsage = process.memoryUsage();
    health.checks.memory = {
      status: 'healthy',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
    };

    // Environment
    health.environment = process.env.NODE_ENV || 'development';
    health.uptime = Math.round(process.uptime());

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : health.status === 'degraded' ? 207 : 503,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'down',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    );
  }
}
