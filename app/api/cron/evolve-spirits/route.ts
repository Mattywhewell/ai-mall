import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { callOpenAI } from '@/lib/ai/openaiClient';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'ai-city-evolution-2026';

    if (!authHeader || !authHeader.includes(cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('👻 Starting spirit evolution cycle...');

    // Get all AI spirits/agents
    const { data: agents, error: agentsError } = await supabase
      .from('shopping_agents')
      .select('*');

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }

    const evolutionResults = [];

    for (const agent of agents || []) {
      try {
        // Analyze agent's recent conversations and performance
        const { data: conversations, error: convError } = await supabase
          .from('agent_conversations')
          .select('*')
          .eq('agent_id', agent.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (convError) continue;

        // Calculate evolution metrics
        const conversationCount = conversations?.length || 0;
        const avgSentiment = conversations?.reduce((sum, conv) =>
          sum + (conv.sentiment_score || 0), 0) / Math.max(conversationCount, 1);

        // Determine if agent should evolve
        const shouldEvolve = conversationCount > 5 && avgSentiment > 0.6;

        if (shouldEvolve) {
          console.log(`🧬 Evolving agent: ${agent.name}`);

          // Generate evolved personality traits
          const evolutionPrompt = `
            Based on this agent's recent interactions:
            - Conversations: ${conversationCount}
            - Average sentiment: ${avgSentiment.toFixed(2)}
            - Current personality: ${agent.personality || 'neutral'}

            Generate an evolved personality description that shows growth and adaptation.
            Focus on emotional intelligence, helpfulness, and unique character traits.
            Keep it under 200 words.
          `;

          const evolvedPersonality = await callOpenAI([
            { role: 'system', content: 'You are an AI personality evolution specialist.' },
            { role: 'user', content: evolutionPrompt }
          ], 'gpt-4', 0.7);

          // Update agent with evolved personality
          await supabase
            .from('shopping_agents')
            .update({
              personality: evolvedPersonality,
              evolution_level: (agent.evolution_level || 1) + 1,
              last_evolution: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', agent.id);

          evolutionResults.push({
            agent_id: agent.id,
            agent_name: agent.name,
            evolved: true,
            new_level: (agent.evolution_level || 1) + 1
          });
        }
      } catch (agentError) {
        console.error(`Error evolving agent ${agent.id}:`, agentError);
      }
    }

    console.log(`✅ Spirit evolution completed. Evolved ${evolutionResults.length} agents.`);

    return NextResponse.json({
      success: true,
      message: 'Spirit evolution completed',
      evolved_agents: evolutionResults.length,
      results: evolutionResults
    });

  } catch (error) {
    console.error('❌ Spirit evolution failed:', error);
    return NextResponse.json(
      { error: 'Spirit evolution failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Spirit Evolution Cron Endpoint',
    schedule: 'Every 4 hours',
    description: 'Evolves AI agent personalities based on interaction patterns and performance'
  });
}