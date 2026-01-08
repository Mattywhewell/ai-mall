-- Analytics helper functions for the dashboard

-- Function to get top products by event type
CREATE OR REPLACE FUNCTION get_top_products_by_event(
  p_event_type text,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  event_count bigint,
  microstore_name text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as product_id,
    p.name as product_name,
    COUNT(a.id) as event_count,
    m.name as microstore_name
  FROM analytics a
  JOIN products p ON a.product_id = p.id
  JOIN microstores m ON p.microstore_id = m.id
  WHERE a.event_type = p_event_type
    AND a.product_id IS NOT NULL
  GROUP BY p.id, p.name, m.name
  ORDER BY event_count DESC
  LIMIT p_limit;
END;
$$;

-- Function to get district/microstore popularity
CREATE OR REPLACE FUNCTION get_district_popularity(
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  microstore_id uuid,
  microstore_name text,
  category text,
  total_events bigint,
  views bigint,
  purchases bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id as microstore_id,
    m.name as microstore_name,
    m.category,
    COUNT(a.id) as total_events,
    COUNT(CASE WHEN a.event_type = 'view' THEN 1 END) as views,
    COUNT(CASE WHEN a.event_type = 'purchase' THEN 1 END) as purchases
  FROM analytics a
  JOIN microstores m ON a.microstore_id = m.id
  WHERE a.microstore_id IS NOT NULL
  GROUP BY m.id, m.name, m.category
  ORDER BY total_events DESC
  LIMIT p_limit;
END;
$$;

-- Function to get analytics summary
CREATE OR REPLACE FUNCTION get_analytics_summary()
RETURNS TABLE (
  totalViews bigint,
  totalClicks bigint,
  totalAddToCarts bigint,
  totalPurchases bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(CASE WHEN event_type = 'view' THEN 1 END) as totalViews,
    COUNT(CASE WHEN event_type = 'click' THEN 1 END) as totalClicks,
    COUNT(CASE WHEN event_type = 'add_to_cart' THEN 1 END) as totalAddToCarts,
    COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as totalPurchases
  FROM analytics;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_top_products_by_event TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_district_popularity TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_summary TO anon, authenticated;
