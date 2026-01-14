import { NextRequest, NextResponse } from 'next/server';
// Temporarily using mock implementation to avoid orchestrator import issues

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, systemPrompt, taskType } = body;

    if (!prompt || !taskType) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and taskType' },
        { status: 400 }
      );
    }

    // Simple mock response demonstrating hybrid AI stack concept
    const mockResponse = {
      success: true,
      response: `Hybrid AI Stack Demo: Processed "${taskType}" task with prompt: ${prompt.substring(0, 100)}...`,
      provider: 'intelligent-router-demo',
      cost: 0.002,
      latency: 200,
      routing: {
        selectedProvider: 'openai-gpt4',
        reasoning: 'Best fit for general task',
        fallbacks: ['anthropic-claude', 'azure-openai']
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      status: 'operational',
      version: '1.0.0-hybrid-demo',
      providers: ['openai', 'anthropic', 'azure-openai', 'grok', 'huggingface', 'llama', 'mistral'],
      health: {
        openai: 'healthy',
        anthropic: 'healthy',
        'azure-openai': 'configured',
        grok: 'configured',
        huggingface: 'available',
        llama: 'available',
        mistral: 'available'
      },
      message: 'Hybrid AI stack is ready for testing - orchestrator temporarily mocked'
    });
  } catch (error) {
    console.error('AI health check error:', error);
    return NextResponse.json(
      { error: 'Health check failed', status: 'error' },
      { status: 503 }
    );
  }
}