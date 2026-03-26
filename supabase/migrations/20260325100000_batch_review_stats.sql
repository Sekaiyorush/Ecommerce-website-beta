-- Batch review stats RPC: returns avg_rating and review_count for ALL products in one query
-- Eliminates N+1 queries from ProductRating components on the products page
CREATE OR REPLACE FUNCTION get_all_product_review_stats()
RETURNS TABLE (
  product_id uuid,
  avg_rating numeric,
  review_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    r.product_id,
    COALESCE(AVG(r.rating), 0) AS avg_rating,
    COUNT(*)::bigint AS review_count
  FROM reviews r
  GROUP BY r.product_id;
$$;
