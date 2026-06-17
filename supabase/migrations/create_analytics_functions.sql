-- Function 1: Get top viewed products
CREATE OR REPLACE FUNCTION get_top_viewed_products()
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  view_count BIGINT,
  last_viewed TIMESTAMP WITH TIME ZONE
) AS $$
SELECT
  p.id,
  p.name,
  COUNT(pv.id) as view_count,
  MAX(pv.viewed_at) as last_viewed
FROM products p
LEFT JOIN product_views pv ON p.id = pv.product_id
GROUP BY p.id, p.name
HAVING COUNT(pv.id) > 0
ORDER BY view_count DESC
LIMIT 50;
$$ LANGUAGE SQL;

-- Function 2: Get top cart products
CREATE OR REPLACE FUNCTION get_top_cart_products()
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  add_to_cart_count BIGINT,
  last_added TIMESTAMP WITH TIME ZONE
) AS $$
SELECT
  p.id,
  p.name,
  COUNT(pac.id) as add_to_cart_count,
  MAX(pac.added_at) as last_added
FROM products p
LEFT JOIN product_add_to_cart pac ON p.id = pac.product_id
GROUP BY p.id, p.name
HAVING COUNT(pac.id) > 0
ORDER BY add_to_cart_count DESC
LIMIT 50;
$$ LANGUAGE SQL;

-- Function 3: Get conversion metrics
CREATE OR REPLACE FUNCTION get_conversion_metrics()
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  total_views BIGINT,
  total_carts BIGINT,
  conversion_rate NUMERIC
) AS $$
SELECT
  p.id,
  p.name,
  COALESCE(COUNT(DISTINCT pv.id), 0) as total_views,
  COALESCE(COUNT(DISTINCT pac.id), 0) as total_carts,
  CASE
    WHEN COUNT(DISTINCT pv.id) > 0
    THEN ROUND((COUNT(DISTINCT pac.id)::NUMERIC / COUNT(DISTINCT pv.id)) * 100, 2)
    ELSE 0
  END as conversion_rate
FROM products p
LEFT JOIN product_views pv ON p.id = pv.product_id
LEFT JOIN product_add_to_cart pac ON p.id = pac.product_id
GROUP BY p.id, p.name
HAVING COUNT(DISTINCT pv.id) > 0 OR COUNT(DISTINCT pac.id) > 0
ORDER BY conversion_rate DESC, total_views DESC
LIMIT 50;
$$ LANGUAGE SQL;
