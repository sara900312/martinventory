-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(7) NOT NULL UNIQUE,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  description TEXT,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  usage_limit INTEGER,
  minimum_cart_value DECIMAL(10, 2),
  maximum_quantity INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create coupon_usage table to track how many times each coupon has been used
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_used INTEGER DEFAULT 1,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_id UUID
);

-- Create junction table for product-specific coupons
CREATE TABLE IF NOT EXISTS public.coupons_products (
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (coupon_id, product_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON public.coupons(valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_product_id ON public.coupon_usage(product_id);
CREATE INDEX IF NOT EXISTS idx_coupons_products_product_id ON public.coupons_products(product_id);

-- Function to validate and get coupon details
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code VARCHAR(7),
  p_product_id INTEGER
)
RETURNS TABLE (
  is_valid BOOLEAN,
  coupon_id UUID,
  discount_type VARCHAR(20),
  discount_value DECIMAL,
  maximum_quantity INTEGER,
  message TEXT,
  remaining_uses INTEGER
) AS $$
DECLARE
  v_coupon_id UUID;
  v_coupon_is_active BOOLEAN;
  v_coupon_valid_from TIMESTAMP WITH TIME ZONE;
  v_coupon_valid_until TIMESTAMP WITH TIME ZONE;
  v_coupon_discount_type VARCHAR(20);
  v_coupon_discount_value DECIMAL(10, 2);
  v_coupon_usage_limit INTEGER;
  v_coupon_maximum_quantity INTEGER;
  v_usage_count INTEGER;
  v_is_product_specific BOOLEAN;
BEGIN
  -- Find coupon by code
  SELECT
    c.id, c.is_active, c.valid_from, c.valid_until,
    c.discount_type, c.discount_value, c.usage_limit, c.maximum_quantity
  INTO
    v_coupon_id, v_coupon_is_active, v_coupon_valid_from, v_coupon_valid_until,
    v_coupon_discount_type, v_coupon_discount_value, v_coupon_usage_limit, v_coupon_maximum_quantity
  FROM public.coupons c
  WHERE c.code = UPPER(p_code)
  LIMIT 1;

  IF v_coupon_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR(20), 0::DECIMAL, NULL::INTEGER, 'الكوبون غير موجود', 0::INTEGER;
    RETURN;
  END IF;

  -- Check if coupon is active
  IF NOT v_coupon_is_active THEN
    RETURN QUERY SELECT FALSE, v_coupon_id, NULL::VARCHAR(20), 0::DECIMAL, NULL::INTEGER, 'الكوبون معطل', 0::INTEGER;
    RETURN;
  END IF;

  -- Check if coupon has expired
  IF NOW() > v_coupon_valid_until THEN
    RETURN QUERY SELECT FALSE, v_coupon_id, NULL::VARCHAR(20), 0::DECIMAL, NULL::INTEGER, 'انتهت صلاحية الكوبون', 0::INTEGER;
    RETURN;
  END IF;

  -- Check if coupon hasn't started yet
  IF NOW() < v_coupon_valid_from THEN
    RETURN QUERY SELECT FALSE, v_coupon_id, NULL::VARCHAR(20), 0::DECIMAL, NULL::INTEGER, 'الكوبون غير متاح حالياً', 0::INTEGER;
    RETURN;
  END IF;

  -- Check if coupon is product-specific and if this product is allowed
  SELECT EXISTS(
    SELECT 1
    FROM public.coupons_products cp
    WHERE cp.coupon_id = v_coupon_id
  ) INTO v_is_product_specific;

  IF v_is_product_specific THEN
    IF NOT EXISTS(
      SELECT 1
      FROM public.coupons_products cp
      WHERE cp.coupon_id = v_coupon_id
        AND cp.product_id = p_product_id
    ) THEN
      RETURN QUERY SELECT FALSE, v_coupon_id, NULL::VARCHAR(20), 0::DECIMAL, NULL::INTEGER, 'هذا الكوبون غير صالح لهذا المنتج', 0::INTEGER;
      RETURN;
    END IF;
  END IF;

  -- Check usage limit (count by number of times used)
  IF v_coupon_usage_limit IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_usage_count
    FROM public.coupon_usage cu
    WHERE cu.coupon_id = v_coupon_id;

    IF v_usage_count >= v_coupon_usage_limit THEN
      RETURN QUERY SELECT FALSE, v_coupon_id, NULL::VARCHAR(20), 0::DECIMAL, NULL::INTEGER, 'انتهت حدود استخدام الكوبون', 0::INTEGER;
      RETURN;
    END IF;
  ELSE
    v_usage_count := 0;
  END IF;

  -- Check maximum quantity limit (sum of all quantities used)
  IF v_coupon_maximum_quantity IS NOT NULL THEN
    DECLARE
      v_total_quantity_used INTEGER;
    BEGIN
      SELECT COALESCE(SUM(quantity_used), 0)
      INTO v_total_quantity_used
      FROM public.coupon_usage cu
      WHERE cu.coupon_id = v_coupon_id;

      IF v_total_quantity_used >= v_coupon_maximum_quantity THEN
        RETURN QUERY SELECT FALSE, v_coupon_id, NULL::VARCHAR(20), 0::DECIMAL, NULL::INTEGER, 'انتهت كمية هذا الكوبون', 0::INTEGER;
        RETURN;
      END IF;
    END;
  END IF;

  -- Coupon is valid
  RETURN QUERY SELECT
    TRUE,
    v_coupon_id,
    v_coupon_discount_type,
    v_coupon_discount_value,
    v_coupon_maximum_quantity,
    'الكوبون صحيح ✓',
    COALESCE(v_coupon_usage_limit - v_usage_count, NULL)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to record coupon usage
CREATE OR REPLACE FUNCTION record_coupon_usage(
  p_coupon_id UUID,
  p_product_id INTEGER,
  p_user_id UUID DEFAULT NULL,
  p_quantity_used INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO coupon_usage (coupon_id, product_id, user_id, quantity_used)
  VALUES (p_coupon_id, p_product_id, p_user_id, p_quantity_used);
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
