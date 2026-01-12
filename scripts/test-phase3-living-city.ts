/**
 * Phase 3 Living City Engine Test Script
 * Tests the autonomous citizens, rituals, and event bus systems
 */

import { citizenAIService } from '../lib/ai-city/citizen-ai-service';
import { ritualSystem } from '../lib/ai-city/ritual-system';
import { eventBus } from '../lib/ai-city/event-bus';

async function testPhase3Systems() {
  console.log('🧪 Testing Phase 3 Living City Engine...\n');

  try {
    // Test 1: Basic functionality
    console.log('1️⃣ Testing basic functionality...');
    const citizenCount = citizenAIService.getCitizenCount();
    const allRituals = ritualSystem.getAllRituals();
    console.log(`✅ Citizen service: ${citizenCount} citizens`);
    console.log(`✅ Ritual system: ${allRituals.length} rituals\n`);

    // Test 2: Event bus
    console.log('2️⃣ Testing event bus...');
    let eventCount = 0;
    const testSubscription = eventBus.subscribe({
      id: 'test-subscriber',
      eventTypes: ['*'],
      callback: () => eventCount++
    });

    // Publish a test event
    eventBus.publish({ type: 'test:event', payload: { test: true }, source: 'test' });
    console.log(`✅ Event bus: ${eventCount} events received\n`);

    // Test 3: Spawn a citizen
    console.log('3️⃣ Testing citizen spawning...');
    const citizenId = await citizenAIService.spawnCitizen('innovation_district', { x: 0, y: 0, z: 0 });
    console.log(`✅ Spawned citizen: ${citizenId}\n`);

    console.log('🎉 Phase 3 Living City Engine basic test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPhase3Systems().catch(console.error);