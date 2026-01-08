-- New Features Database Migration (Schema Only)
-- PART 1: Tables, columns, indexes, constraints, triggers, functions (NO RLS)


-- ============================================
-- WISHLISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wishlists (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);

-- ============================================
-- PRODUCT REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_reviews (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
	title TEXT,
	comment TEXT NOT NULL,
	verified_purchase BOOLEAN DEFAULT FALSE,
	helpful_count INTEGER DEFAULT 0,
	images TEXT[], -- Array of image URLs
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	UNIQUE(product_id, user_id) -- One review per user per product
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);

-- Add average_rating column to products table if missing
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,1);

-- ============================================
-- REVIEW HELPFUL VOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS review_helpful_votes (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	type TEXT NOT NULL CHECK (type IN ('order', 'wishlist', 'message', 'follow', 'review', 'general')),
	title TEXT NOT NULL,
	message TEXT NOT NULL,
	link TEXT,
	read BOOLEAN DEFAULT FALSE,
	metadata JSONB DEFAULT '{}',
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- USER FOLLOWERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_followers (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_followers_follower_id ON user_followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_followers_following_id ON user_followers(following_id);

-- ============================================
-- PRODUCT COMPARISONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_comparisons (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
	session_id TEXT, -- For anonymous users
	product_ids UUID[] NOT NULL,
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_comparisons_user_id ON product_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_product_comparisons_session_id ON product_comparisons(session_id);

-- ============================================
-- PRICE DROP ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS price_drop_alerts (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	original_price DECIMAL(10, 2) NOT NULL,
	notified BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_price_drop_alerts_user_id ON price_drop_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_drop_alerts_product_id ON price_drop_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_price_drop_alerts_notified ON price_drop_alerts(notified) WHERE notified = FALSE;
-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	avatar_url TEXT,
	bio TEXT,
	location TEXT,
	website TEXT,
	social_links JSONB DEFAULT '{}',
	is_creator BOOLEAN DEFAULT FALSE,
	is_verified BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	UNIQUE(user_id)
);
ALTER TABLE user_profiles 
	ADD COLUMN IF NOT EXISTS avatar_url TEXT,
	ADD COLUMN IF NOT EXISTS bio TEXT,
	ADD COLUMN IF NOT EXISTS location TEXT,
	ADD COLUMN IF NOT EXISTS website TEXT,
	ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
	ADD COLUMN IF NOT EXISTS is_creator BOOLEAN DEFAULT FALSE,
	ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
DECLARE
	target_review_id UUID;
BEGIN
	target_review_id := COALESCE(NEW.review_id, OLD.review_id);
	UPDATE product_reviews
	SET helpful_count = (
		SELECT COUNT(*) FROM review_helpful_votes WHERE review_id = target_review_id
	)
	WHERE id = target_review_id;
	RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;



-- Trigger for review helpful votes
DROP TRIGGER IF EXISTS trigger_update_review_helpful_count ON review_helpful_votes;
CREATE TRIGGER trigger_update_review_helpful_count
AFTER INSERT OR DELETE ON review_helpful_votes
FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
	UPDATE products
	SET average_rating = (
		SELECT ROUND(AVG(rating)::numeric, 1)
		FROM product_reviews
		WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
	)
	WHERE id = COALESCE(NEW.product_id, OLD.product_id);
	RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_rating ON product_reviews;
CREATE TRIGGER trigger_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Function to create notification for wishlist price drop
CREATE OR REPLACE FUNCTION notify_price_drop()
RETURNS TRIGGER AS $$
DECLARE
	wishlist_user UUID;
BEGIN
	-- Check if price decreased
	IF NEW.price < OLD.price THEN
		FOR wishlist_user IN
			SELECT user_id FROM wishlists WHERE product_id = NEW.id
		LOOP
			INSERT INTO notifications (user_id, type, title, message, link)
			VALUES (
				wishlist_user,
				'wishlist',
				'Price Drop Alert!',
				NEW.name || ' dropped to $' || NEW.price::text,
				'/products/' || NEW.id::text
			);
		END LOOP;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for price drop notifications
DROP TRIGGER IF EXISTS trigger_notify_price_drop ON products;
CREATE TRIGGER trigger_notify_price_drop
AFTER UPDATE OF price ON products
FOR EACH ROW
WHEN (NEW.price < OLD.price)
EXECUTE FUNCTION notify_price_drop();
-- ============================================
-- LOYALTY PROGRAM TABLES
-- ============================================

-- Loyalty Tiers
CREATE TABLE IF NOT EXISTS loyalty_tiers (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	name TEXT NOT NULL UNIQUE,
	min_points INTEGER NOT NULL,
	multiplier DECIMAL(3, 2) DEFAULT 1.0,
	benefits JSONB DEFAULT '{}',
	badge_color TEXT,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO loyalty_tiers (name, min_points, multiplier, benefits, badge_color) VALUES
	('Bronze', 0, 1.0, '{"free_shipping_threshold": 50, "birthday_bonus": 100}', '#CD7F32'),
	('Silver', 1000, 1.2, '{"free_shipping_threshold": 25, "birthday_bonus": 250, "early_access": true}', '#C0C0C0'),
	('Gold', 5000, 1.5, '{"free_shipping": true, "birthday_bonus": 500, "early_access": true, "priority_support": true}', '#FFD700'),
	('Platinum', 15000, 2.0, '{"free_shipping": true, "birthday_bonus": 1000, "early_access": true, "priority_support": true, "exclusive_deals": true}', '#E5E4E2')
ON CONFLICT (name) DO NOTHING;

-- User Loyalty Points
CREATE TABLE IF NOT EXISTS user_loyalty_points (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	total_points INTEGER DEFAULT 0,
	available_points INTEGER DEFAULT 0,
	tier_id UUID REFERENCES loyalty_tiers(id),
	lifetime_spent DECIMAL(10, 2) DEFAULT 0,
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_loyalty_points_user_id ON user_loyalty_points(user_id);

-- Loyalty Transactions
CREATE TABLE IF NOT EXISTS loyalty_transactions (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	points INTEGER NOT NULL,
	type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'bonus', 'refund')),
	description TEXT,
	order_id TEXT,
	expires_at TIMESTAMP WITH TIME ZONE,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at DESC);

-- Loyalty Rewards Catalog
CREATE TABLE IF NOT EXISTS loyalty_rewards (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	name TEXT NOT NULL,
	description TEXT,
	points_cost INTEGER NOT NULL,
	reward_type TEXT NOT NULL CHECK (reward_type IN ('discount', 'product', 'shipping', 'exclusive')),
	reward_value JSONB NOT NULL,
	min_tier_required UUID REFERENCES loyalty_tiers(id),
	stock_quantity INTEGER,
	is_active BOOLEAN DEFAULT TRUE,
	image_url TEXT,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_active ON loyalty_rewards(is_active) WHERE is_active = TRUE;

-- User Reward Redemptions
CREATE TABLE IF NOT EXISTS loyalty_redemptions (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	reward_id UUID NOT NULL REFERENCES loyalty_rewards(id),
	points_spent INTEGER NOT NULL,
	status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'used', 'expired', 'cancelled')),
	coupon_code TEXT,
	expires_at TIMESTAMP WITH TIME ZONE,
	used_at TIMESTAMP WITH TIME ZONE,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_user_id ON loyalty_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_status ON loyalty_redemptions(status);

-- ============================================
-- GIFT FEATURES TABLES
-- ============================================

-- Gift Options (for orders)
CREATE TABLE IF NOT EXISTS order_gift_options (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	order_id TEXT NOT NULL,
	is_gift BOOLEAN DEFAULT FALSE,
	gift_wrap BOOLEAN DEFAULT FALSE,
	gift_message TEXT,
	recipient_name TEXT,
	recipient_email TEXT,
	send_on_date DATE,
	gift_wrap_style TEXT,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_order_gift_options_order_id ON order_gift_options(order_id);

-- Gift Cards
CREATE TABLE IF NOT EXISTS gift_cards (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	code TEXT NOT NULL UNIQUE,
	initial_value DECIMAL(10, 2) NOT NULL,
	current_value DECIMAL(10, 2) NOT NULL,
	currency TEXT DEFAULT 'USD',
	purchaser_id UUID REFERENCES auth.users(id),
	recipient_email TEXT,
	recipient_name TEXT,
	message TEXT,
	is_active BOOLEAN DEFAULT TRUE,
	expires_at TIMESTAMP WITH TIME ZONE,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient_email ON gift_cards(recipient_email);

-- Gift Card Transactions
CREATE TABLE IF NOT EXISTS gift_card_transactions (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
	order_id TEXT,
	amount DECIMAL(10, 2) NOT NULL,
	type TEXT NOT NULL CHECK (type IN ('purchase', 'redeem', 'refund')),
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_gift_card_id ON gift_card_transactions(gift_card_id);

-- Gift Registries
CREATE TABLE IF NOT EXISTS gift_registries (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	title TEXT NOT NULL,
	description TEXT,
	event_type TEXT CHECK (event_type IN ('wedding', 'birthday', 'baby', 'holiday', 'other')),
	event_date DATE,
	is_public BOOLEAN DEFAULT TRUE,
	slug TEXT UNIQUE,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_registries_user_id ON gift_registries(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_registries_slug ON gift_registries(slug);

-- Gift Registry Items
CREATE TABLE IF NOT EXISTS gift_registry_items (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	registry_id UUID NOT NULL REFERENCES gift_registries(id) ON DELETE CASCADE,
	product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	quantity_requested INTEGER DEFAULT 1,
	quantity_purchased INTEGER DEFAULT 0,
	priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
	notes TEXT,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_registry_items_registry_id ON gift_registry_items(registry_id);

-- ============================================
-- LIVE CHAT TABLES
-- ============================================

-- Chat Conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
	session_id TEXT, -- For anonymous users
	agent_id UUID REFERENCES auth.users(id),
	status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved', 'closed')),
	priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
	category TEXT,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_agent_id ON chat_conversations(agent_id);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
	sender_id UUID REFERENCES auth.users(id),
	sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'agent', 'bot')),
	message TEXT NOT NULL,
	attachments TEXT[],
	is_read BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- ============================================
-- LOYALTY FUNCTIONS
-- ============================================

-- Function to update user tier based on points
CREATE OR REPLACE FUNCTION update_user_loyalty_tier()
RETURNS TRIGGER AS $$
DECLARE
	new_tier_id UUID;
BEGIN
	-- Find appropriate tier
	SELECT id INTO new_tier_id
	FROM loyalty_tiers
	WHERE NEW.total_points >= min_points
	ORDER BY min_points DESC
	LIMIT 1;
  
	NEW.tier_id := new_tier_id;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_loyalty_tier ON user_loyalty_points;
CREATE TRIGGER trigger_update_user_loyalty_tier
BEFORE UPDATE OF total_points ON user_loyalty_points
FOR EACH ROW EXECUTE FUNCTION update_user_loyalty_tier();

-- ============================================
-- ============================================
COMMENT ON TABLE wishlists IS 'User wishlist/saved items';
COMMENT ON TABLE product_reviews IS 'Product reviews and ratings';
COMMENT ON TABLE review_helpful_votes IS 'Helpful votes on reviews';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON TABLE user_followers IS 'Social following relationships';
COMMENT ON TABLE product_comparisons IS 'Product comparison lists';
COMMENT ON TABLE price_drop_alerts IS 'Price drop alert preferences';
COMMENT ON TABLE loyalty_tiers IS 'Loyalty program tiers (Bronze, Silver, Gold, Platinum)';
COMMENT ON TABLE user_loyalty_points IS 'User loyalty points and tier status';
COMMENT ON TABLE loyalty_transactions IS 'Points earning and spending history';
COMMENT ON TABLE loyalty_rewards IS 'Rewards catalog for point redemption';
COMMENT ON TABLE loyalty_redemptions IS 'User reward redemptions';
COMMENT ON TABLE order_gift_options IS 'Gift wrapping and message options for orders';
COMMENT ON TABLE gift_cards IS 'Digital gift cards';
COMMENT ON TABLE gift_card_transactions IS 'Gift card usage history';
COMMENT ON TABLE gift_registries IS 'User gift registries for events';
COMMENT ON TABLE gift_registry_items IS 'Products in gift registries';
COMMENT ON TABLE chat_conversations IS 'Live chat conversation threads';
COMMENT ON TABLE chat_messages IS 'Messages in chat conversations';

-- Success message
DO $$
BEGIN
	RAISE NOTICE '✅ Complete features migration completed successfully!';
	RAISE NOTICE '📊 Created tables: wishlists, reviews, notifications, followers, comparisons, alerts';
	RAISE NOTICE '🎁 Gift features: gift_options, gift_cards, registries';
	RAISE NOTICE '⭐ Loyalty program: points, tiers, rewards, redemptions';
	RAISE NOTICE '💬 Live chat: conversations, messages';
	RAISE NOTICE '🔒 All RLS policies enabled';
	RAISE NOTICE '⚡ Triggers and functions created';
END $$;
