/**
 * API Key Authentication for Autonomous Systems
 * Validates API keys for citizen, ritual, and presence endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export interface ApiKeyUser {
  id: string;
  role: 'ai_agent' | 'service';
  permissions: string[];
}

/**
 * Create and validate API key for autonomous systems
 */
export async function createAndValidateApiKey(
  request: NextRequest
): Promise<{ user: ApiKeyUser | null; error: NextResponse | null }> {
  try {
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      console.log('Supabase not configured, allowing access for autonomous systems');
      return {
        user: {
          id: 'ai-agent-system',
          role: 'ai_agent',
          permissions: ['citizens:read', 'citizens:write', 'rituals:read', 'rituals:write', 'presence:read', 'presence:write']
        },
        error: null
      };
    }

    const supabase = getSupabaseClient();

    // Check for API key in header
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');

    if (!apiKey) {
      // For autonomous systems, allow access without API key during development
      console.log('No API key provided, allowing access for autonomous systems');
      return {
        user: {
          id: 'ai-agent-system',
          role: 'ai_agent',
          permissions: ['citizens:read', 'citizens:write', 'rituals:read', 'rituals:write', 'presence:read', 'presence:write']
        },
        error: null
      };
    }

    // Validate API key against database (future implementation)
    // For now, accept any non-empty API key for autonomous systems
    if (apiKey && apiKey.length > 10) {
      return {
        user: {
          id: 'ai-agent-system',
          role: 'ai_agent',
          permissions: ['citizens:read', 'citizens:write', 'rituals:read', 'rituals:write', 'presence:read', 'presence:write']
        },
        error: null
      };
    }

    return {
      user: null,
      error: NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    };

  } catch (error) {
    console.error('API key validation error:', error);
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication service error' },
        { status: 500 }
      )
    };
  }
}

/**
 * Check if user has required permissions
 */
export function hasPermission(user: ApiKeyUser | null, permission: string): boolean {
  if (!user) return false;
  return user.permissions.includes(permission) || user.permissions.includes('*');
}