-- Function to get trending products based on recent views
CREATE OR REPLACE FUNCTION get_trending_products(
  p_limit int DEFAULT 6,
  p_days int DEFAULT 7
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price numeric,
  image_url text,
  tags text[],
  microstore_id uuid,
  created_at timestamptz,
  view_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.price,
    p.image_url,
    p.tags,
    p.microstore_id,
    p.created_at,
    COUNT(a.id) as view_count
  FROM products p
  LEFT JOIN analytics a ON p.id = a.product_id
    AND a.event_type IN ('view', 'click')
    AND a.created_at > NOW() - (p_days || ' days')::interval
  GROUP BY p.id, p.name, p.description, p.price, p.image_url, p.tags, p.microstore_id, p.created_at
  ORDER BY view_count DESC, p.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_trending_products TO anon, authenticated;
