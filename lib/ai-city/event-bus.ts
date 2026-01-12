/**
 * Event Bus System for Living City Engine
 * Pub/Sub system for coordinating autonomous systems, citizens, and UI components
 */

export interface EventData {
  type: string;
  payload: any;
  timestamp: number;
  source: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface EventSubscriber {
  id: string;
  callback: (event: EventData) => void;
  eventTypes?: string[];
  priority?: number;
}

export class EventBus {
  private static instance: EventBus;
  private subscribers: Map<string, EventSubscriber[]> = new Map();
  private eventHistory: EventData[] = [];
  private maxHistorySize = 1000;
  private isProcessing = false;

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to events
   */
  subscribe(subscriber: EventSubscriber): () => void {
    const eventTypes = subscriber.eventTypes || ['*'];

    eventTypes.forEach(eventType => {
      if (!this.subscribers.has(eventType)) {
        this.subscribers.set(eventType, []);
      }
      this.subscribers.get(eventType)!.push(subscriber);
      // Sort by priority (higher priority first)
      this.subscribers.get(eventType)!.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    });

    // Return unsubscribe function
    return () => this.unsubscribe(subscriber.id);
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriberId: string): void {
    this.subscribers.forEach((subs, eventType) => {
      this.subscribers.set(eventType, subs.filter(sub => sub.id !== subscriberId));
    });
  }

  /**
   * Publish an event
   */
  async publish(event: Omit<EventData, 'timestamp'>): Promise<void> {
    const fullEvent: EventData = {
      ...event,
      timestamp: Date.now()
    };

    // Add to history
    this.eventHistory.push(fullEvent);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Prevent recursive event processing
    if (this.isProcessing) {
      console.warn('Event bus is already processing, queuing event:', event.type);
      setTimeout(() => this.publish(event), 0);
      return;
    }

    this.isProcessing = true;

    try {
      // Get subscribers for this event type and wildcard
      const subscribers = [
        ...(this.subscribers.get(event.type) || []),
        ...(this.subscribers.get('*') || [])
      ];

      // Remove duplicates
      const uniqueSubscribers = subscribers.filter((sub, index, arr) =>
        arr.findIndex(s => s.id === sub.id) === index
      );

      // Process subscribers asynchronously
      const promises = uniqueSubscribers.map(async (subscriber) => {
        try {
          await subscriber.callback(fullEvent);
        } catch (error) {
          console.error(`Error in event subscriber ${subscriber.id}:`, error);
        }
      });

      await Promise.allSettled(promises);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get recent events
   */
  getRecentEvents(count = 50): EventData[] {
    return this.eventHistory.slice(-count);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string, count = 50): EventData[] {
    return this.eventHistory
      .filter(event => event.type === eventType)
      .slice(-count);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get subscriber count for debugging
   */
  getSubscriberCount(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.subscribers.forEach((subs, eventType) => {
      counts[eventType] = subs.length;
    });
    return counts;
  }
}

// Global event bus instance
export const eventBus = EventBus.getInstance();

// Convenience functions for common event types
export const publishUserEvent = (payload: any) =>
  eventBus.publish({ type: 'user:action', payload, source: 'user' });

export const publishCitizenEvent = (payload: any) =>
  eventBus.publish({ type: 'citizen:action', payload, source: 'citizen' });

export const publishDistrictEvent = (payload: any) =>
  eventBus.publish({ type: 'district:change', payload, source: 'district' });

export const publishRitualEvent = (payload: any) =>
  eventBus.publish({ type: 'ritual:trigger', payload, source: 'ritual' });

export const publishMoodEvent = (payload: any) =>
  eventBus.publish({ type: 'mood:shift', payload, source: 'mood' });

export const publishMemoryEvent = (payload: any) =>
  eventBus.publish({ type: 'memory:update', payload, source: 'memory' });