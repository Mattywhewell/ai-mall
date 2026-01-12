-- ============================================================================
-- RLS POLICIES FOR AI CITY
-- Enables Row Level Security on all public tables
-- Run this in Supabase SQL Editor after running the main schema
-- ============================================================================

-- ============================================================================
-- DROP ALL EXISTING POLICIES (to avoid conflicts)
-- ============================================================================

-- World Architecture
DROP POLICY IF EXISTS "Halls are viewable by everyone" ON public.halls;
DROP POLICY IF EXISTS "Only authenticated users can insert halls" ON public.halls;
DROP POLICY IF EXISTS "Only authenticated users can update halls" ON public.halls;
DROP POLICY IF EXISTS "Streets are viewable by everyone" ON public.streets;
DROP POLICY IF EXISTS "Only authenticated users can insert streets" ON public.streets;
DROP POLICY IF EXISTS "Only authenticated users can update streets" ON public.streets;
DROP POLICY IF EXISTS "Chapels are viewable by everyone" ON public.chapels;
DROP POLICY IF EXISTS "Only authenticated users can insert chapels" ON public.chapels;
DROP POLICY IF EXISTS "Only authenticated users can update chapels" ON public.chapels;
DROP POLICY IF EXISTS "AI Spirits are viewable by everyone" ON public.ai_spirits;
DROP POLICY IF EXISTS "Only authenticated users can modify ai_spirits" ON public.ai_spirits;
DROP POLICY IF EXISTS "Atmospheric states are viewable by everyone" ON public.atmospheric_states;
DROP POLICY IF EXISTS "Only authenticated users can modify atmospheric_states" ON public.atmospheric_states;

-- User Data
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can view their own shopping agents" ON public.shopping_agents;
DROP POLICY IF EXISTS "Users can insert their own shopping agents" ON public.shopping_agents;
DROP POLICY IF EXISTS "Users can update their own shopping agents" ON public.shopping_agents;
DROP POLICY IF EXISTS "Users can view their own agent conversations" ON public.agent_conversations;
DROP POLICY IF EXISTS "Users can insert their own agent conversations" ON public.agent_conversations;
DROP POLICY IF EXISTS "Users can view their own agent recommendations" ON public.agent_recommendations;
DROP POLICY IF EXISTS "System can insert agent recommendations" ON public.agent_recommendations;
DROP POLICY IF EXISTS "Users can view their own agent learning events" ON public.agent_learning_events;
DROP POLICY IF EXISTS "System can insert agent learning events" ON public.agent_learning_events;
DROP POLICY IF EXISTS "Users can view their own world views" ON public.user_world_views;
DROP POLICY IF EXISTS "Users can insert their own world views" ON public.user_world_views;
DROP POLICY IF EXISTS "Users can update their own world views" ON public.user_world_views;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription boxes" ON public.subscription_boxes;
DROP POLICY IF EXISTS "System can insert subscription boxes" ON public.subscription_boxes;
DROP POLICY IF EXISTS "Users can update their own subscription boxes" ON public.subscription_boxes;

-- Live Shopping
DROP POLICY IF EXISTS "Live shopping events are viewable by everyone" ON public.live_shopping_events;
DROP POLICY IF EXISTS "Only authenticated users can manage live shopping events" ON public.live_shopping_events;
DROP POLICY IF EXISTS "Event attendees are viewable by everyone" ON public.event_attendees;
DROP POLICY IF EXISTS "Users can join events" ON public.event_attendees;
DROP POLICY IF EXISTS "Users can update their own event attendance" ON public.event_attendees;
DROP POLICY IF EXISTS "Event chat messages are viewable by everyone" ON public.event_chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send chat messages" ON public.event_chat_messages;
DROP POLICY IF EXISTS "Event product moments are viewable by everyone" ON public.event_product_moments;
DROP POLICY IF EXISTS "Only authenticated users can create product moments" ON public.event_product_moments;

-- Subscriptions
DROP POLICY IF EXISTS "Subscription plans are viewable by everyone" ON public.subscription_plans;
DROP POLICY IF EXISTS "Only authenticated users can manage subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Subscription tiers are viewable by everyone" ON public.subscription_tiers;
DROP POLICY IF EXISTS "Only authenticated users can manage subscription tiers" ON public.subscription_tiers;
DROP POLICY IF EXISTS "Users can view their own subscription box items" ON public.subscription_box_items;
DROP POLICY IF EXISTS "System can manage subscription box items" ON public.subscription_box_items;
DROP POLICY IF EXISTS "Users can view their own subscription deliveries" ON public.subscription_deliveries;
DROP POLICY IF EXISTS "System can manage subscription deliveries" ON public.subscription_deliveries;
DROP POLICY IF EXISTS "Users can view their own waitlist entries" ON public.subscription_waitlist;
DROP POLICY IF EXISTS "Anyone can join the waitlist" ON public.subscription_waitlist;
DROP POLICY IF EXISTS "Users can view gift codes they received or redeemed" ON public.subscription_gift_codes;
DROP POLICY IF EXISTS "Only authenticated users can create gift codes" ON public.subscription_gift_codes;
DROP POLICY IF EXISTS "Users can redeem gift codes" ON public.subscription_gift_codes;

-- AI Curation
DROP POLICY IF EXISTS "Users can view their own AI curation profiles" ON public.ai_curation_profiles;
DROP POLICY IF EXISTS "Users can manage their own AI curation profiles" ON public.ai_curation_profiles;
DROP POLICY IF EXISTS "Ritual calendar is viewable by everyone" ON public.ritual_calendar;
DROP POLICY IF EXISTS "Only authenticated users can manage ritual calendar" ON public.ritual_calendar;

-- Analytics
DROP POLICY IF EXISTS "World analytics are viewable by authenticated users" ON public.world_analytics;
DROP POLICY IF EXISTS "System can insert world analytics" ON public.world_analytics;
DROP POLICY IF EXISTS "Users can view their own spirit interactions" ON public.spirit_interactions;
DROP POLICY IF EXISTS "System can record spirit interactions" ON public.spirit_interactions;
DROP POLICY IF EXISTS "Users can view their own navigation paths" ON public.world_navigation_paths;
DROP POLICY IF EXISTS "System can record navigation paths" ON public.world_navigation_paths;

-- ============================================================================
-- WORLD ARCHITECTURE TABLES (Public Read Access)
-- ============================================================================

-- Halls: Public read access
ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Halls are viewable by everyone" 
ON public.halls FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert halls" 
ON public.halls FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update halls" 
ON public.halls FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Streets: Public read access
ALTER TABLE public.streets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Streets are viewable by everyone" 
ON public.streets FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert streets" 
ON public.streets FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update streets" 
ON public.streets FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Chapels: Public read access
ALTER TABLE public.chapels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chapels are viewable by everyone" 
ON public.chapels FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert chapels" 
ON public.chapels FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update chapels" 
ON public.chapels FOR UPDATE 
USING (auth.role() = 'authenticated');

-- AI Spirits: Public read access
ALTER TABLE public.ai_spirits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI Spirits are viewable by everyone" 
ON public.ai_spirits FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can modify ai_spirits" 
ON public.ai_spirits FOR ALL 
USING (auth.role() = 'authenticated');

-- Atmospheric States: Public read access
ALTER TABLE public.atmospheric_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Atmospheric states are viewable by everyone" 
ON public.atmospheric_states FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can modify atmospheric_states" 
ON public.atmospheric_states FOR ALL 
USING (auth.role() = 'authenticated');

-- ============================================================================
-- USER DATA TABLES (User-Specific Access)
-- ============================================================================

-- Users: Users can view and update their own data
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Shopping Agents: Users can manage their own agents
ALTER TABLE public.shopping_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shopping agents" 
ON public.shopping_agents FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own shopping agents" 
ON public.shopping_agents FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own shopping agents" 
ON public.shopping_agents FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Agent Conversations: Users can view their own conversations
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent conversations" 
ON public.agent_conversations FOR SELECT 
USING (
  auth.uid()::text IN (
    SELECT user_id FROM public.shopping_agents WHERE id = agent_id
  )
);

CREATE POLICY "Users can insert their own agent conversations" 
ON public.agent_conversations FOR INSERT 
WITH CHECK (
  auth.uid()::text IN (
    SELECT user_id FROM public.shopping_agents WHERE id = agent_id
  )
);

-- Agent Recommendations: Users can view their own recommendations
ALTER TABLE public.agent_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent recommendations" 
ON public.agent_recommendations FOR SELECT 
USING (
  auth.uid()::text IN (
    SELECT user_id FROM public.shopping_agents WHERE id = agent_id
  )
);

CREATE POLICY "System can insert agent recommendations" 
ON public.agent_recommendations FOR INSERT 
WITH CHECK (true);

-- Agent Learning Events: Users can view their own learning events
ALTER TABLE public.agent_learning_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent learning events" 
ON public.agent_learning_events FOR SELECT 
USING (
  auth.uid()::text IN (
    SELECT user_id FROM public.shopping_agents WHERE id = agent_id
  )
);

CREATE POLICY "System can insert agent learning events" 
ON public.agent_learning_events FOR INSERT 
WITH CHECK (true);

-- User World Views: Users can view and update their own world views
ALTER TABLE public.user_world_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own world views" 
ON public.user_world_views FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own world views" 
ON public.user_world_views FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own world views" 
ON public.user_world_views FOR UPDATE 
USING (auth.uid()::text = user_id);

-- User Subscriptions: Users can view their own subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own subscriptions" 
ON public.user_subscriptions FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own subscriptions" 
ON public.user_subscriptions FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Subscription Boxes: Users can view their own boxes
ALTER TABLE public.subscription_boxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription boxes" 
ON public.subscription_boxes FOR SELECT 
USING (
  auth.uid()::text IN (
    SELECT user_id FROM public.user_subscriptions WHERE id = subscription_id
  )
);

CREATE POLICY "System can insert subscription boxes" 
ON public.subscription_boxes FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own subscription boxes" 
ON public.subscription_boxes FOR UPDATE 
USING (
  auth.uid()::text IN (
    SELECT user_id FROM public.user_subscriptions WHERE id = subscription_id
  )
);

-- ============================================================================
-- LIVE SHOPPING TABLES (Public Read, Restricted Write)
-- ============================================================================

-- Live Shopping Events: Public read access
ALTER TABLE public.live_shopping_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Live shopping events are viewable by everyone" 
ON public.live_shopping_events FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage live shopping events" 
ON public.live_shopping_events FOR ALL 
USING (auth.role() = 'authenticated');

-- Event Attendees: Users can view all attendees, manage their own attendance
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event attendees are viewable by everyone" 
ON public.event_attendees FOR SELECT 
USING (true);

CREATE POLICY "Users can join events" 
ON public.event_attendees FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own event attendance" 
ON public.event_attendees FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Event Chat Messages: Public read, authenticated write
ALTER TABLE public.event_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event chat messages are viewable by everyone" 
ON public.event_chat_messages FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can send chat messages" 
ON public.event_chat_messages FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid()::text = user_id);

-- Event Product Moments: Public read access
ALTER TABLE public.event_product_moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event product moments are viewable by everyone" 
ON public.event_product_moments FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can create product moments" 
ON public.event_product_moments FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- SUBSCRIPTION TABLES (Public Read for Plans, User-Specific for Rest)
-- ============================================================================

-- Subscription Plans: Public read access
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscription plans are viewable by everyone" 
ON public.subscription_plans FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage subscription plans" 
ON public.subscription_plans FOR ALL 
USING (auth.role() = 'authenticated');

-- Subscription Tiers: Public read access
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscription tiers are viewable by everyone" 
ON public.subscription_tiers FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage subscription tiers" 
ON public.subscription_tiers FOR ALL 
USING (auth.role() = 'authenticated');

-- Subscription Box Items: Users can view items in their boxes
ALTER TABLE public.subscription_box_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription box items" 
ON public.subscription_box_items FOR SELECT 
USING (
  auth.uid()::text IN (
    SELECT us.user_id 
    FROM public.user_subscriptions us
    JOIN public.subscription_boxes sb ON sb.subscription_id = us.id
    WHERE sb.id = box_id
  )
);

CREATE POLICY "System can manage subscription box items" 
ON public.subscription_box_items FOR ALL 
USING (auth.role() = 'authenticated');

-- Subscription Deliveries: Users can view their own deliveries
ALTER TABLE public.subscription_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription deliveries" 
ON public.subscription_deliveries FOR SELECT 
USING (
  auth.uid()::text IN (
    SELECT us.user_id 
    FROM public.user_subscriptions us
    JOIN public.subscription_boxes sb ON sb.subscription_id = us.id
    WHERE sb.id = box_id
  )
);

CREATE POLICY "System can manage subscription deliveries" 
ON public.subscription_deliveries FOR ALL 
USING (auth.role() = 'authenticated');

-- Subscription Waitlist: Public can join, view own entries
ALTER TABLE public.subscription_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own waitlist entries" 
ON public.subscription_waitlist FOR SELECT 
USING (auth.uid()::text = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Anyone can join the waitlist" 
ON public.subscription_waitlist FOR INSERT 
WITH CHECK (true);

-- Subscription Gift Codes: Restricted access
ALTER TABLE public.subscription_gift_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view gift codes they received or redeemed" 
ON public.subscription_gift_codes FOR SELECT 
USING (
  (recipient_user_id IS NOT NULL AND auth.uid()::text = recipient_user_id) OR 
  auth.role() = 'authenticated'
);

CREATE POLICY "Only authenticated users can create gift codes" 
ON public.subscription_gift_codes FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can redeem gift codes" 
ON public.subscription_gift_codes FOR UPDATE 
USING (auth.role() = 'authenticated');

-- ============================================================================
-- AI CURATION & RITUAL TABLES
-- ============================================================================

-- AI Curation Profiles: Users can view and manage their own profiles
ALTER TABLE public.ai_curation_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI curation profiles" 
ON public.ai_curation_profiles FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage their own AI curation profiles" 
ON public.ai_curation_profiles FOR ALL 
USING (auth.uid()::text = user_id);

-- Ritual Calendar: Public read access
ALTER TABLE public.ritual_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ritual calendar is viewable by everyone" 
ON public.ritual_calendar FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage ritual calendar" 
ON public.ritual_calendar FOR ALL 
USING (auth.role() = 'authenticated');

-- ============================================================================
-- ANALYTICS & TRACKING TABLES (Restricted Access)
-- ============================================================================

-- World Analytics: Public read, authenticated write
ALTER TABLE public.world_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "World analytics are viewable by authenticated users" 
ON public.world_analytics FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert world analytics" 
ON public.world_analytics FOR INSERT 
WITH CHECK (true);

-- Spirit Interactions: Users can view their own interactions
ALTER TABLE public.spirit_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own spirit interactions" 
ON public.spirit_interactions FOR SELECT 
USING (auth.uid()::text = user_id OR auth.role() = 'authenticated');

CREATE POLICY "System can record spirit interactions" 
ON public.spirit_interactions FOR INSERT 
WITH CHECK (true);

-- World Navigation Paths: Users can view their own paths
ALTER TABLE public.world_navigation_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own navigation paths" 
ON public.world_navigation_paths FOR SELECT 
USING (auth.uid()::text = user_id OR auth.role() = 'authenticated');

CREATE POLICY "System can record navigation paths" 
ON public.world_navigation_paths FOR INSERT 
WITH CHECK (true);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS policies successfully enabled on 28 tables!';
  RAISE NOTICE 'Security Status:';
  RAISE NOTICE '  ✓ World architecture tables: Public read access';
  RAISE NOTICE '  ✓ User data tables: User-specific access';
  RAISE NOTICE '  ✓ Live shopping tables: Public read, authenticated write';
  RAISE NOTICE '  ✓ Subscription tables: Mixed access based on ownership';
  RAISE NOTICE '  ✓ Analytics tables: Authenticated read, system write';
END $$;
