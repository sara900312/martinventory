# Analytics Setup Guide

## Problem
The Store Analytics Page is not working because the required PostgreSQL RPC functions are missing from your Supabase database. The analytics page tries to call these three functions:
- `get_top_viewed_products` - Returns products ranked by view count
- `get_top_cart_products` - Returns products ranked by add-to-cart count
- `get_conversion_metrics` - Returns conversion rates (views → cart)

## Solution
You need to create these three SQL functions in your Supabase database. Follow these steps:

### Step 1: Open Supabase SQL Editor
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Create the Functions
Copy and paste the SQL code from `code/supabase/migrations/create_analytics_functions.sql` into the SQL editor.

Alternatively, use the SQL code below:

```sql
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
```

### Step 3: Execute the Query
Click **Run** (or press Ctrl+Enter) to execute the SQL and create all three functions.

### Step 4: Verify
After running the SQL, you should see a success message. You can verify the functions were created by:
1. Going to **Database** → **Functions** in the left sidebar
2. Looking for the three new functions: `get_top_viewed_products`, `get_top_cart_products`, and `get_conversion_metrics`

## What These Functions Do

### get_top_viewed_products()
Returns the 50 most-viewed products with:
- Product name
- Total view count
- Last view timestamp

### get_top_cart_products()
Returns the 50 most-added products with:
- Product name
- Total add-to-cart count
- Last add-to-cart timestamp

### get_conversion_metrics()
Returns conversion data for the 50 best-performing products:
- Product name
- Total views
- Total add-to-cart events
- Conversion rate percentage (cart adds ÷ views × 100)

## Prerequisites
These functions require the following tables to exist in your Supabase database:
- `products` table with at least `id` and `name` columns
- `product_views` table with `id`, `product_id`, and `created_at` columns
- `product_add_to_cart` table with `id`, `product_id`, and `created_at` columns

If these tables don't exist, you'll need to create them first. Typically, they should already exist based on your application code.

## After Setup
Once the functions are created, the Analytics page at `/analytics` should start working and displaying:
- Total views count
- Total add-to-cart count
- Active products count
- Tables with top products by views and by add-to-cart
- Conversion metrics chart

The page will also automatically update in real-time as new product views and add-to-cart events are tracked.
