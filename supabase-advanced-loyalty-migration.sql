-- ============================================
-- ADVANCED LOYALTY PROGRAM FEATURES
-- ============================================

-- Referral Program Tables
CREATE TABLE IF NOT EXISTS loyalty_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'completed', 'expired')),
  bonus_points INTEGER DEFAULT 500,
  bonus_awarded BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_loyalty_referrals_referrer_id ON loyalty_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_referrals_referral_code ON loyalty_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_loyalty_referrals_status ON loyalty_referrals(status);

-- Points Expiration Tracking
CREATE TABLE IF NOT EXISTS loyalty_points_expiration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  source_transaction_id UUID REFERENCES loyalty_transactions(id),
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_points_expiration_user_id ON loyalty_points_expiration(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_expiration_expires_at ON loyalty_points_expiration(expires_at);

-- Leaderboard Cache (updated daily)
CREATE TABLE IF NOT EXISTS loyalty_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL,
  tier_name TEXT NOT NULL,
  rank INTEGER NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('all_time', 'monthly', 'weekly')),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_leaderboard_period_rank ON loyalty_leaderboard(period, rank);
CREATE INDEX IF NOT EXISTS idx_loyalty_leaderboard_user_id ON loyalty_leaderboard(user_id);

-- Challenges/Missions System
CREATE TABLE IF NOT EXISTS loyalty_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('purchase', 'review', 'referral', 'social', 'seasonal')),
  requirements JSONB NOT NULL, -- e.g., {"min_spend": 100, "count": 3}
  reward_points INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  max_completions INTEGER, -- per user, null for unlimited
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES loyalty_challenges(id) ON DELETE CASCADE,
  progress JSONB DEFAULT '{}',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user_id ON user_challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_completed ON user_challenge_progress(completed) WHERE completed = FALSE;

-- Enable RLS
ALTER TABLE loyalty_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points_expiration ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own referrals" ON loyalty_referrals;
CREATE POLICY "Users can view own referrals" ON loyalty_referrals
  FOR SELECT USING (auth.uid() IS NOT NULL AND referrer_id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Users can create referrals" ON loyalty_referrals;
CREATE POLICY "Users can create referrals" ON loyalty_referrals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND referrer_id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Users can view own expiring points" ON loyalty_points_expiration;
CREATE POLICY "Users can view own expiring points" ON loyalty_points_expiration
  FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Anyone can view leaderboard" ON loyalty_leaderboard;
CREATE POLICY "Anyone can view leaderboard" ON loyalty_leaderboard
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Anyone can view active challenges" ON loyalty_challenges;
CREATE POLICY "Anyone can view active challenges" ON loyalty_challenges
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Users can view own challenge progress" ON user_challenge_progress;
CREATE POLICY "Users can view own challenge progress" ON user_challenge_progress
  FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::uuid);

-- Functions and Triggers

-- Function to update leaderboard
CREATE OR REPLACE FUNCTION update_loyalty_leaderboard()
RETURNS VOID AS $$
BEGIN
  -- Clear old leaderboard
  DELETE FROM loyalty_leaderboard WHERE calculated_at < NOW() - INTERVAL '1 day';

  -- Insert all-time leaderboard
  INSERT INTO loyalty_leaderboard (user_id, total_points, tier_name, rank, period)
  SELECT
    ulp.user_id,
    ulp.total_points,
    lt.name as tier_name,
    ROW_NUMBER() OVER (ORDER BY ulp.total_points DESC) as rank,
    'all_time' as period
  FROM user_loyalty_points ulp
  JOIN loyalty_tiers lt ON ulp.tier_id = lt.id
  WHERE ulp.total_points > 0
  ORDER BY ulp.total_points DESC
  LIMIT 100;

  -- Insert monthly leaderboard
  INSERT INTO loyalty_leaderboard (user_id, total_points, tier_name, rank, period)
  SELECT
    ulp.user_id,
    COALESCE(SUM(CASE WHEN lt.created_at >= DATE_TRUNC('month', NOW()) THEN lt.points ELSE 0 END), 0) as monthly_points,
    t.name as tier_name,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(CASE WHEN lt.created_at >= DATE_TRUNC('month', NOW()) THEN lt.points ELSE 0 END), 0) DESC) as rank,
    'monthly' as period
  FROM user_loyalty_points ulp
  LEFT JOIN loyalty_transactions lt ON ulp.user_id = lt.user_id
  JOIN loyalty_tiers t ON ulp.tier_id = t.id
  GROUP BY ulp.user_id, t.name
  HAVING COALESCE(SUM(CASE WHEN lt.created_at >= DATE_TRUNC('month', NOW()) THEN lt.points ELSE 0 END), 0) > 0
  ORDER BY monthly_points DESC
  LIMIT 50;

  -- Insert weekly leaderboard
  INSERT INTO loyalty_leaderboard (user_id, total_points, tier_name, rank, period)
  SELECT
    ulp.user_id,
    COALESCE(SUM(CASE WHEN lt.created_at >= DATE_TRUNC('week', NOW()) THEN lt.points ELSE 0 END), 0) as weekly_points,
    t.name as tier_name,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(CASE WHEN lt.created_at >= DATE_TRUNC('week', NOW()) THEN lt.points ELSE 0 END), 0) DESC) as rank,
    'weekly' as period
  FROM user_loyalty_points ulp
  LEFT JOIN loyalty_transactions lt ON ulp.user_id = lt.user_id
  JOIN loyalty_tiers t ON ulp.tier_id = t.id
  GROUP BY ulp.user_id, t.name
  HAVING COALESCE(SUM(CASE WHEN lt.created_at >= DATE_TRUNC('week', NOW()) THEN lt.points ELSE 0 END), 0) > 0
  ORDER BY weekly_points DESC
  LIMIT 25;

END;
$$ LANGUAGE plpgsql;

-- Function to handle referral completion
CREATE OR REPLACE FUNCTION complete_referral()
RETURNS TRIGGER AS $$
BEGIN
  -- If a referred user just registered and referral exists
  IF NEW.status = 'registered' AND OLD.status = 'pending' THEN
    -- Award bonus points to referrer
    INSERT INTO loyalty_transactions (user_id, points, type, description)
    SELECT
      referrer_id,
      bonus_points,
      'bonus',
      'Referral bonus for ' || NEW.referred_email
    FROM loyalty_referrals
    WHERE referred_user_id = NEW.id AND status = 'pending';

    -- Mark referral as completed and bonus as awarded
    UPDATE loyalty_referrals
    SET status = 'completed', completed_at = NOW(), bonus_awarded = TRUE
    WHERE referred_user_id = NEW.id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check challenge completion
CREATE OR REPLACE FUNCTION check_challenge_completion()
RETURNS TRIGGER AS $$
DECLARE
  challenge_record RECORD;
  user_progress RECORD;
  requirements_met BOOLEAN := TRUE;
  req_key TEXT;
  req_value INTEGER;
BEGIN
  -- Check all active challenges
  FOR challenge_record IN SELECT * FROM loyalty_challenges WHERE is_active = TRUE LOOP
    -- Get or create user progress
    SELECT * INTO user_progress
    FROM user_challenge_progress
    WHERE user_id = NEW.user_id AND challenge_id = challenge_record.id;

    IF user_progress IS NULL THEN
      INSERT INTO user_challenge_progress (user_id, challenge_id, progress)
      VALUES (NEW.user_id, challenge_record.id, '{}');
      SELECT * INTO user_progress
      FROM user_challenge_progress
      WHERE user_id = NEW.user_id AND challenge_id = challenge_record.id;
    END IF;

    -- Skip if already completed
    IF user_progress.completed THEN
      CONTINUE;
    END IF;

    -- Update progress based on challenge type
    CASE challenge_record.challenge_type
      WHEN 'purchase' THEN
        -- Count purchases over minimum amount
        IF NEW.type = 'earn' AND NEW.description LIKE '%purchase%' THEN
          user_progress.progress = jsonb_set(
            COALESCE(user_progress.progress, '{}'),
            '{purchases}',
            (COALESCE(user_progress.progress->>'purchases', '0')::INTEGER + 1)::TEXT::jsonb
          );
        END IF;

      WHEN 'review' THEN
        -- Count reviews written
        IF NEW.type = 'earn' AND NEW.description LIKE '%review%' THEN
          user_progress.progress = jsonb_set(
            COALESCE(user_progress.progress, '{}'),
            '{reviews}',
            (COALESCE(user_progress.progress->>'reviews', '0')::INTEGER + 1)::TEXT::jsonb
          );
        END IF;

      WHEN 'referral' THEN
        -- Count successful referrals
        IF NEW.type = 'bonus' AND NEW.description LIKE '%referral%' THEN
          user_progress.progress = jsonb_set(
            COALESCE(user_progress.progress, '{}'),
            '{referrals}',
            (COALESCE(user_progress.progress->>'referrals', '0')::INTEGER + 1)::TEXT::jsonb
          );
        END IF;
    END CASE;

    -- Check if requirements are met
    requirements_met := TRUE;
    FOR req_key, req_value IN SELECT * FROM jsonb_object_keys(challenge_record.requirements) k CROSS JOIN jsonb_extract_path_text(challenge_record.requirements, k) v LOOP
      IF COALESCE(user_progress.progress->>req_key, '0')::INTEGER < req_value THEN
        requirements_met := FALSE;
        EXIT;
      END IF;
    END LOOP;

    -- Mark as completed if requirements met
    IF requirements_met THEN
      UPDATE user_challenge_progress
      SET completed = TRUE, completed_at = NOW()
      WHERE id = user_progress.id;

      -- Award points
      INSERT INTO loyalty_transactions (user_id, points, type, description)
      VALUES (NEW.user_id, challenge_record.reward_points, 'bonus', 'Challenge completed: ' || challenge_record.title);
    ELSE
      -- Update progress
      UPDATE user_challenge_progress
      SET progress = user_progress.progress
      WHERE id = user_progress.id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS trigger_complete_referral ON auth.users;
CREATE TRIGGER trigger_complete_referral
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION complete_referral();

DROP TRIGGER IF EXISTS trigger_check_challenge_completion ON loyalty_transactions;
CREATE TRIGGER trigger_check_challenge_completion
  AFTER INSERT ON loyalty_transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_challenge_completion();

-- Insert sample challenges
INSERT INTO loyalty_challenges (title, description, challenge_type, requirements, reward_points, start_date, end_date) VALUES
  ('First Purchase', 'Make your first purchase to earn bonus points', 'purchase', '{"purchases": 1}', 100, NOW(), NOW() + INTERVAL '1 year'),
  ('Review Writer', 'Write 3 product reviews', 'review', '{"reviews": 3}', 150, NOW(), NOW() + INTERVAL '1 year'),
  ('Social Sharer', 'Share 5 products on social media', 'social', '{"shares": 5}', 200, NOW(), NOW() + INTERVAL '1 year'),
  ('Referral Champion', 'Successfully refer 2 friends', 'referral', '{"referrals": 2}', 500, NOW(), NOW() + INTERVAL '1 year'),
  ('Holiday Shopper', 'Spend $200 during holiday season', 'purchase', '{"min_spend": 200}', 300, NOW() + INTERVAL '2 months', NOW() + INTERVAL '4 months')
ON CONFLICT DO NOTHING;