/**
 * API Route: Plugin System
 * GET /api/autonomous/plugins - List all plugins
 * POST /api/autonomous/plugins - Register or toggle plugin
 */

import { NextResponse } from 'next/server';
import { PluginSystem } from '@/lib/autonomous/plugin-system';

export async function GET() {
  try {
    const plugins = PluginSystem.getAllPlugins();

    return NextResponse.json({
      count: plugins.length,
      plugins: plugins.map(p => ({
        id: p.id,
        name: p.name,
        version: p.version,
        description: p.description,
        capabilities: p.capabilities,
        enabled: p.enabled,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { action, pluginId, enabled, config } = await request.json();

    if (action === 'toggle') {
      const success = await PluginSystem.togglePlugin(pluginId, enabled);
      return NextResponse.json({ success });
    }

    if (action === 'update_config') {
      const success = await PluginSystem.updatePluginConfig(pluginId, config);
      return NextResponse.json({ success });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
