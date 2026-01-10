-- rls-fix-full.sql
-- Idempotent patch to fix RLS policies (cast auth.uid() to UUID where appropriate)
BEGIN;

-- Wishlists
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlists;
CREATE POLICY "Users can view own wishlist" ON wishlists
  FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Users can remove from own wishlist" ON wishlists;
CREATE POLICY "Users can remove from own wishlist" ON wishlists
  FOR DELETE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

-- Product reviews
DROP POLICY IF EXISTS "Users can update own reviews" ON product_reviews;
CREATE POLICY "Users can update own reviews" ON product_reviews
  FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Users can delete own reviews" ON product_reviews;
CREATE POLICY "Users can delete own reviews" ON product_reviews
  FOR DELETE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

-- Review helpful votes
DROP POLICY IF EXISTS "Users can vote on reviews" ON review_helpful_votes;
CREATE POLICY "Users can vote on reviews" ON review_helpful_votes
  FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

-- Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

-- User followers
DROP POLICY IF EXISTS "Users can unfollow" ON user_followers;
CREATE POLICY "Users can unfollow" ON user_followers
  FOR DELETE USING (auth.uid() IS NOT NULL AND follower_id = auth.uid()::uuid);

-- Product comparisons
DROP POLICY IF EXISTS "Users can view own comparisons" ON product_comparisons;
CREATE POLICY "Users can view own comparisons" ON product_comparisons
  FOR SELECT USING ((user_id IS NOT NULL AND auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid) OR (user_id IS NULL AND session_id IS NOT NULL));

DROP POLICY IF EXISTS "Users can update own comparisons" ON product_comparisons;
CREATE POLICY "Users can update own comparisons" ON product_comparisons
  FOR UPDATE USING ((user_id IS NOT NULL AND auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid) OR (user_id IS NULL AND session_id IS NOT NULL));

-- Price drop alerts
DROP POLICY IF EXISTS "Users can manage own alerts" ON price_drop_alerts;
CREATE POLICY "Users can manage own alerts" ON price_drop_alerts
  FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

-- Gift registries
DROP POLICY IF EXISTS "Users can view public registries" ON gift_registries;
CREATE POLICY "Users can view public registries" ON gift_registries
  FOR SELECT USING (is_public = TRUE OR (user_id IS NOT NULL AND auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid));

DROP POLICY IF EXISTS "Users can manage own registries" ON gift_registries;
CREATE POLICY "Users can manage own registries" ON gift_registries
  FOR ALL USING ((user_id IS NOT NULL) AND (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid));

-- Chat conversations/messages
DROP POLICY IF EXISTS "Users can view own conversations" ON chat_conversations;
CREATE POLICY "Users can view own conversations" ON chat_conversations
  FOR SELECT USING ((user_id IS NOT NULL AND auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid) OR (user_id IS NULL AND session_id IS NOT NULL));

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
CREATE POLICY "Users can view messages in their conversations" ON chat_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE (user_id IS NOT NULL AND auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid) OR (user_id IS NULL AND session_id IS NOT NULL)
    )
  );

DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE (user_id IS NOT NULL AND auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid) OR (user_id IS NULL AND session_id IS NOT NULL)
    )
  );

-- Loyalty tables
DROP POLICY IF EXISTS "Users can view own loyalty points" ON user_loyalty_points;
CREATE POLICY "Users can view own loyalty points" ON user_loyalty_points
  FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Users can view own transactions" ON loyalty_transactions;
CREATE POLICY "Users can view own transactions" ON loyalty_transactions
  FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Users can view own redemptions" ON loyalty_redemptions;
CREATE POLICY "Users can view own redemptions" ON loyalty_redemptions
  FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

COMMIT;
