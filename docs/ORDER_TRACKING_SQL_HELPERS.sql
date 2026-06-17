-- ============================================================================
-- Order Tracking & Cancellation - SQL Helpers & Queries
-- ============================================================================
--
-- This file contains SQL helpers, computed fields, and queries for managing
-- order cancellations with a 6-hour window validation.
--
-- Security & Design:
-- - Server-side timestamp validation is done in Edge Function (cancel-order)
-- - These queries are useful for analytics and administrative tasks
-- - RLS policies should be in place for customer-facing queries
--
-- ============================================================================

-- ============================================================================
-- 1. HELPER FUNCTION: Check if order can be cancelled (6-hour window)
-- ============================================================================
--
-- This function encapsulates the 6-hour cancellation logic in the database
-- Can be used in queries or Edge Functions for validation
--
CREATE OR REPLACE FUNCTION can_cancel_order(order_id UUID)
RETURNS TABLE (
  can_cancel BOOLEAN,
  hours_elapsed NUMERIC,
  hours_remaining NUMERIC,
  message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 3600) <= 6 AS can_cancel,
    EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 3600 AS hours_elapsed,
    GREATEST(0, 6 - (EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 3600)) AS hours_remaining,
    CASE
      WHEN (EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 3600) <= 6
        THEN 'Order can be cancelled'
      ELSE
        'Cancellation window expired (6 hours)'
    END AS message
  FROM orders o
  WHERE o.id = order_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. HELPER VIEW: Orders eligible for cancellation
-- ============================================================================
--
-- Shows all pending orders that are still within the 6-hour cancellation window
-- Useful for admin dashboard or analytics
--
CREATE OR REPLACE VIEW orders_cancellable AS
SELECT
  o.id,
  o.order_code,
  o.customer_name,
  o.customer_phone,
  o.created_at,
  o.total_amount,
  o.order_status,
  EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 3600 AS hours_elapsed,
  GREATEST(0, 6 - (EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 3600)) AS hours_remaining,
  CASE
    WHEN (EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 3600) <= 6 THEN TRUE
    ELSE FALSE
  END AS can_cancel
FROM orders o
WHERE o.order_status = 'pending'
  AND (EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 3600) <= 6
ORDER BY o.created_at DESC;

-- ============================================================================
-- 3. HELPER VIEW: Recently cancelled orders
-- ============================================================================
--
-- Shows orders that were cancelled by customers within the allowed window
-- Useful for tracking customer cancellations and refund processing
--
CREATE OR REPLACE VIEW cancelled_orders_by_customer AS
SELECT
  o.id,
  o.order_code,
  o.customer_name,
  o.customer_phone,
  o.customer_email,
  o.customer_address,
  o.main_store_name,
  o.total_amount,
  o.created_at,
  o.updated_at,
  EXTRACT(EPOCH FROM (o.updated_at - o.created_at)) / 60 AS minutes_until_cancellation,
  (EXTRACT(EPOCH FROM (o.updated_at - o.created_at)) / 3600)::NUMERIC(5, 2) AS hours_until_cancellation
FROM orders o
WHERE o.order_status = 'cancelled'
  AND o.customer_rejected = TRUE
ORDER BY o.updated_at DESC;

-- ============================================================================
-- 4. QUERY: Get pending orders expiring soon (within 1 hour)
-- ============================================================================
--
-- Used to send proactive notifications to customers about expiring cancellation windows
--
SELECT
  id,
  order_code,
  customer_name,
  customer_phone,
  created_at,
  GREATEST(0, 6 - (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600)) AS hours_remaining
FROM orders
WHERE order_status = 'pending'
  AND (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) > 5  -- More than 5 hours old
  AND (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) <= 6 -- But still cancellable
ORDER BY created_at ASC;

-- ============================================================================
-- 5. QUERY: Get non-cancellable pending orders (expired window)
-- ============================================================================
--
-- Shows orders that are pending but no longer cancellable
-- These orders should be transitioned to next status automatically or manually
--
SELECT
  id,
  order_code,
  customer_name,
  customer_phone,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 AS hours_elapsed
FROM orders
WHERE order_status = 'pending'
  AND (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) > 6
ORDER BY created_at DESC;

-- ============================================================================
-- 6. AGGREGATE QUERY: Cancellation statistics
-- ============================================================================
--
-- Provides insights into order cancellation patterns
--
SELECT
  DATE_TRUNC('day', o.updated_at) AS cancellation_date,
  COUNT(*) AS total_cancellations,
  COUNT(*) FILTER (WHERE o.customer_rejected = TRUE) AS customer_initiated,
  COUNT(*) FILTER (WHERE o.customer_rejected = FALSE) AS system_initiated,
  AVG(EXTRACT(EPOCH FROM (o.updated_at - o.created_at)) / 3600)::NUMERIC(5, 2) AS avg_hours_before_cancel,
  SUM(o.total_amount) AS total_refund_amount
FROM orders o
WHERE o.order_status = 'cancelled'
  AND o.updated_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', o.updated_at)
ORDER BY cancellation_date DESC;

-- ============================================================================
-- 7. TRIGGER: Auto-transition pending orders after 6 hours (optional)
-- ============================================================================
--
-- This trigger automatically updates old pending orders to "reviewing" status
-- after 6 hours without manual action. Useful for workflow automation.
--
-- WARNING: Only enable if you want automatic status transitions!
--
-- CREATE OR REPLACE FUNCTION auto_transition_pending_orders()
-- RETURNS void AS $$
-- BEGIN
--   UPDATE orders
--   SET order_status = 'reviewing'
--   WHERE order_status = 'pending'
--     AND (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) > 6;
-- END;
-- $$ LANGUAGE plpgsql;
-- 
-- SELECT cron.schedule('auto-transition-pending-orders', '0 * * * *', 'SELECT auto_transition_pending_orders()');

-- ============================================================================
-- 8. QUERY: Customer cancellation history
-- ============================================================================
--
-- Shows all cancellations by a specific customer for support/admin purposes
--
SELECT
  o.order_code,
  o.created_at,
  o.updated_at,
  o.total_amount,
  CASE
    WHEN o.customer_rejected = TRUE THEN 'Customer Initiated'
    ELSE 'System'
  END AS cancellation_type,
  o.main_store_name
FROM orders o
WHERE o.customer_phone = 'PHONE_NUMBER'
  AND o.order_status = 'cancelled'
ORDER BY o.updated_at DESC;

-- ============================================================================
-- 9. INDEX: Optimize order tracking queries
-- ============================================================================
--
-- These indexes improve performance for order tracking operations
--
-- Index for searching by order code
CREATE INDEX IF NOT EXISTS idx_orders_order_code 
  ON orders(order_code) 
  WHERE order_status != 'delivered';

-- Index for searching by customer phone
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone 
  ON orders(customer_phone) 
  WHERE order_status = 'pending';

-- Index for filtering by status and creation date
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
  ON orders(order_status, created_at DESC) 
  WHERE order_status IN ('pending', 'reviewing', 'accepted');

-- Index for finding recently cancelled orders
CREATE INDEX IF NOT EXISTS idx_orders_cancelled 
  ON orders(customer_rejected, updated_at DESC) 
  WHERE order_status = 'cancelled';

-- ============================================================================
-- 10. RLS POLICY EXAMPLE: Customer can only see their own orders
-- ============================================================================
--
-- Example RLS policy to ensure customers can only track their own orders
-- Adjust to your auth system (authenticated user, customer_id, etc.)
--
-- CREATE POLICY "Customers can view their own orders"
--   ON orders
--   FOR SELECT
--   USING (customer_phone = current_setting('request.jwt.claims'->>'phone'));

-- ============================================================================
-- MIGRATION CHECKLIST
-- ============================================================================
--
-- To implement order tracking & cancellation:
--
-- ✅ Verify 'orders' table has these columns (already exist):
--    - order_code (TEXT, UNIQUE)
--    - order_status (VARCHAR, DEFAULT 'pending')
--    - customer_rejected (BOOLEAN) - Already exists, will be set to TRUE on cancellation
--    - created_at (TIMESTAMP WITH TZ)
--    - updated_at (TIMESTAMP WITH TZ)
--
-- ✅ Create indexes from section 9 (for performance)
-- ✅ Create helper function from section 1 (optional)
-- ✅ Create views from sections 2 & 3 (for analytics/admin)
-- ✅ Deploy cancel-order Edge Function
-- ✅ Telegram environment variables already configured
-- ✅ Test cancellation with order in pending status
-- ✅ Set up RLS policies from section 10 (if using auth)
--
-- ============================================================================
