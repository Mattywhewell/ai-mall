
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlists;
CREATE POLICY "Users can view own wishlist" ON wishlists
	FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);
DROP POLICY IF EXISTS "Users can add to own wishlist" ON wishlists;
CREATE POLICY "Users can add to own wishlist" ON wishlists
	FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);
DROP POLICY IF EXISTS "Users can remove from own wishlist" ON wishlists;
CREATE POLICY "Users can remove from own wishlist" ON wishlists
	FOR DELETE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view reviews" ON product_reviews;
CREATE POLICY "Anyone can view reviews" ON product_reviews
	FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create own reviews" ON product_reviews;
CREATE POLICY "Users can create own reviews" ON product_reviews
	FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);
DROP POLICY IF EXISTS "Users can update own reviews" ON product_reviews;
CREATE POLICY "Users can update own reviews" ON product_reviews
	FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);
DROP POLICY IF EXISTS "Users can delete own reviews" ON product_reviews;
CREATE POLICY "Users can delete own reviews" ON product_reviews
	FOR DELETE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can vote on reviews" ON review_helpful_votes;
CREATE POLICY "Users can vote on reviews" ON review_helpful_votes
	FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
	FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
	FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

ALTER TABLE user_followers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view followers" ON user_followers;
CREATE POLICY "Users can view followers" ON user_followers
	FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can follow others" ON user_followers;
CREATE POLICY "Users can follow others" ON user_followers
	FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND follower_id = auth.uid()::uuid);
DROP POLICY IF EXISTS "Users can unfollow" ON user_followers;
CREATE POLICY "Users can unfollow" ON user_followers
	FOR DELETE USING (auth.uid() IS NOT NULL AND follower_id = auth.uid()::uuid);

ALTER TABLE product_comparisons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own comparisons" ON product_comparisons;
CREATE POLICY "Users can view own comparisons" ON product_comparisons
	FOR SELECT USING ((user_id IS NOT NULL AND auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid) OR (user_id IS NULL AND session_id IS NOT NULL));
DROP POLICY IF EXISTS "Users can create comparisons" ON product_comparisons;
CREATE POLICY "Users can create comparisons" ON product_comparisons
	FOR INSERT WITH CHECK ((user_id IS NOT NULL AND auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid) OR (user_id IS NULL AND session_id IS NOT NULL));
DROP POLICY IF EXISTS "Users can update own comparisons" ON product_comparisons;
CREATE POLICY "Users can update own comparisons" ON product_comparisons
	FOR UPDATE USING ((user_id IS NOT NULL AND auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid) OR (user_id IS NULL AND session_id IS NOT NULL));

ALTER TABLE price_drop_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own alerts" ON price_drop_alerts;
CREATE POLICY "Users can manage own alerts" ON price_drop_alerts
	FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

ALTER TABLE user_loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own loyalty points" ON user_loyalty_points;
CREATE POLICY "Users can view own loyalty points" ON user_loyalty_points
	FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);
DROP POLICY IF EXISTS "Users can view own transactions" ON loyalty_transactions;
CREATE POLICY "Users can view own transactions" ON loyalty_transactions
	FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);
DROP POLICY IF EXISTS "Anyone can view active rewards" ON loyalty_rewards;
CREATE POLICY "Anyone can view active rewards" ON loyalty_rewards
	FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Users can view own redemptions" ON loyalty_redemptions;
CREATE POLICY "Users can view own redemptions" ON loyalty_redemptions
	FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

ALTER TABLE order_gift_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_registries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_registry_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own order gift options" ON order_gift_options;
CREATE POLICY "Users can view own order gift options" ON order_gift_options
	FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view active gift cards they know code for" ON gift_cards;
CREATE POLICY "Anyone can view active gift cards they know code for" ON gift_cards
	FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Users can view public registries" ON gift_registries;
CREATE POLICY "Users can view public registries" ON gift_registries
	FOR SELECT USING (
		is_public = TRUE OR (user_id IS NOT NULL AND auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid)
	);
DROP POLICY IF EXISTS "Users can manage own registries" ON gift_registries;
CREATE POLICY "Users can manage own registries" ON gift_registries
	FOR ALL USING (
		(user_id IS NOT NULL) AND (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid)
	);
DROP POLICY IF EXISTS "Anyone can view public registry items" ON gift_registry_items;
CREATE POLICY "Anyone can view public registry items" ON gift_registry_items
	FOR SELECT USING (
		registry_id IN (SELECT id FROM gift_registries WHERE is_public = TRUE)
	);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own conversations" ON chat_conversations;
CREATE POLICY "Users can view own conversations" ON chat_conversations
	FOR SELECT USING ((user_id IS NOT NULL AND auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid) OR (user_id IS NULL AND session_id IS NOT NULL));
DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
CREATE POLICY "Users can create conversations" ON chat_conversations
	FOR INSERT WITH CHECK ((user_id IS NOT NULL AND auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid) OR (user_id IS NULL AND session_id IS NOT NULL));
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
CREATE POLICY "Users can view messages in their conversations" ON chat_messages
	FOR SELECT USING (
		conversation_id IN (SELECT id FROM chat_conversations WHERE (user_id IS NOT NULL AND auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid) OR (user_id IS NULL AND session_id IS NOT NULL))
	);
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
CREATE POLICY "Users can send messages" ON chat_messages
	FOR INSERT WITH CHECK (
		conversation_id IN (SELECT id FROM chat_conversations WHERE (user_id IS NOT NULL AND auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid) OR (user_id IS NULL AND session_id IS NOT NULL))
	);
