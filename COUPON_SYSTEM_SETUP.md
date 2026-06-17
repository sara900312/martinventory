# Coupon System Setup Guide

## Overview
The coupon system includes:
- ✅ Modern coupon input component with countdown timer (5 minutes)
- ✅ Animated success/error messages
- ✅ Product-specific coupon support
- ✅ Usage limit tracking
- ✅ Expiration date validation
- ✅ Percentage and fixed amount discounts
- ✅ Mobile-friendly design

## Step 1: Set Up Database Tables and Functions

### Create Tables in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **SQL Editor** → **New Query**
3. Copy and paste the entire SQL code from:
   ```
   code/supabase/migrations/create_coupon_system.sql
   ```
4. Click **Run** to execute

This will create:
- `coupons` table - Stores coupon configurations
- `coupon_usage` table - Tracks coupon usage
- `coupons_products` table - Links coupons to specific products
- RPC functions: `validate_coupon()` and `record_coupon_usage()`

## Step 2: Component Integration

The coupon feature has been integrated into `code/src/pages/ProductDetailPage.jsx`:

### Files Added:
- `code/src/components/CouponInput.jsx` - Main coupon component
- `code/src/components/CouponInput.css` - Styling with animations

### Files Modified:
- `code/src/pages/ProductDetailPage.jsx` - Added coupon functionality

## Step 3: Create Sample Coupons (Testing)

Open Supabase SQL Editor and create test coupons:

```sql
-- Sample: 20% discount on all products
INSERT INTO public.coupons (
  code,
  discount_type,
  discount_value,
  description,
  valid_from,
  valid_until,
  usage_limit,
  is_active
) VALUES (
  'SAVE20K',
  'percentage',
  20,
  '20% off all products',
  NOW(),
  NOW() + INTERVAL '30 days',
  100,
  TRUE
);

-- Sample: 5,000 د.ع fixed discount
INSERT INTO public.coupons (
  code,
  discount_type,
  discount_value,
  description,
  valid_from,
  valid_until,
  usage_limit,
  is_active
) VALUES (
  'WELCOME5',
  'fixed',
  5000,
  '5,000 د.ع off your order',
  NOW(),
  NOW() + INTERVAL '7 days',
  50,
  TRUE
);

-- Sample: Product-specific coupon (10% off product ID 5)
INSERT INTO public.coupons (
  code,
  discount_type,
  discount_value,
  description,
  valid_from,
  valid_until,
  usage_limit,
  is_active
) VALUES (
  'PRODUCT10',
  'percentage',
  10,
  'Special 10% off this product',
  NOW(),
  NOW() + INTERVAL '14 days',
  25,
  TRUE
);

-- Link the product-specific coupon to a product
INSERT INTO public.coupons_products (coupon_id, product_id)
SELECT id, 5 FROM coupons WHERE code = 'PRODUCT10';
```

## Step 4: Testing the Coupon Feature

### Test Coupon Codes:
1. **SAVE20K** - 20% discount on any product
2. **WELCOME5** - 5,000 د.ع fixed discount
3. **PRODUCT10** - 10% off (only works on product ID 5)

### How to Test:
1. Navigate to any product page
2. Below the quantity selector, you'll see **"أدخل رمز الكوبون"** (Enter Coupon Code)
3. Type one of the test codes (e.g., `SAVE20K`)
4. Click the **"تطبيق"** (Apply) button
5. You should see:
   - ✓ Green success message with discount amount
   - Applied coupon code displayed
   - 5-minute countdown timer
   - Discounted price calculation
   - Progress bar showing time remaining

### Test Invalid Codes:
Try these to test error handling:
- `INVALID` - Should show "رمز الكوبون غير موجود" (Coupon not found)
- `EXPIRED` - If you create and expire a coupon
- `WRONG99` - Wrong product (if product-specific)

## UI/UX Features

### Coupon Input State
**Before applying:**
- Modern input field with gradient pink-gold button
- Placeholder: "XXXXX7X"
- Real-time format validation (7 alphanumeric characters)
- Enter key support

**After applying:**
- Green success state with checkmark
- Shows coupon code and discount amount
- Final price display
- 5-minute countdown timer with animated progress bar
- Quick remove button (X)

### Animations
- Smooth slide-up entry
- Hover effects on button
- Loading spinner during validation
- Success/error message animations
- Progress bar smooth fill

### Mobile Responsive
- Full-width input field on mobile
- Stacked button layout on small screens
- Touch-friendly button sizes (minimum 44x44px)
- Horizontal layout on tablets and desktop

## Managing Coupons in Production

### Add New Coupon (SQL):
```sql
INSERT INTO public.coupons (
  code,
  discount_type,
  discount_value,
  description,
  valid_from,
  valid_until,
  usage_limit,
  is_active
) VALUES (
  'NEWCODE',
  'percentage',  -- or 'fixed'
  15,            -- discount value
  'Your description',
  NOW(),
  NOW() + INTERVAL '7 days',
  100,           -- usage limit
  TRUE
);
```

### Disable Coupon:
```sql
UPDATE public.coupons
SET is_active = FALSE
WHERE code = 'SAVE20K';
```

### Check Coupon Usage:
```sql
SELECT 
  c.code,
  c.discount_value,
  c.discount_type,
  COUNT(cu.id) as used_count,
  c.usage_limit,
  (c.usage_limit - COUNT(cu.id)) as remaining_uses
FROM public.coupons c
LEFT JOIN public.coupon_usage cu ON c.id = cu.coupon_id
GROUP BY c.id, c.code, c.discount_value, c.discount_type, c.usage_limit
ORDER BY used_count DESC;
```

### Link Coupon to Specific Products:
```sql
-- Make a coupon product-specific
INSERT INTO public.coupons_products (coupon_id, product_id)
SELECT id, 42 FROM coupons WHERE code = 'MYCODE';
```

## Coupon Parameters Explained

| Field | Description | Example |
|-------|-------------|---------|
| `code` | 7-character code (alphanumeric) | SAVE20K |
| `discount_type` | "percentage" or "fixed" | percentage |
| `discount_value` | Percentage (0-100) or amount | 20 or 5000 |
| `description` | Human-readable description | "20% off all products" |
| `valid_from` | Start date/time | NOW() |
| `valid_until` | Expiration date/time | NOW() + INTERVAL '30 days' |
| `usage_limit` | Max usage count (NULL = unlimited) | 100 |
| `minimum_cart_value` | Min cart value (NULL = any) | 50000 |
| `is_active` | Enable/disable coupon | TRUE |

## Error Messages

The system provides user-friendly Arabic error messages:

- ✓ **"الكوبون صحيح ✓"** - Valid coupon
- ❌ **"الكوبون غير موجود"** - Code doesn't exist
- ❌ **"انتهت صلاحية الكوبون"** - Coupon expired
- ❌ **"الكوبون معطل"** - Coupon disabled
- ❌ **"الكوبون غير متاح حالياً"** - Not yet valid
- ❌ **"هذا الكوبون غير صالح لهذا المنتج"** - Wrong product
- ❌ **"انتهت حدود استخدام الكوبون"** - Usage limit reached
- ⚠️ **"يرجى إدخال رمز الكوبون"** - Empty field
- ⚠️ **"رمز الكوبون يجب أن يكون 7 أحرف/أرقام"** - Invalid format

## Features Implemented

✅ **Discount Types:**
- Percentage-based discounts
- Fixed amount discounts

✅ **Restrictions:**
- Product-specific coupons
- Usage limit tracking
- Expiration dates
- Validity date range (valid_from → valid_until)

✅ **Display:**
- Real-time discount amount calculation
- Updated product price display
- 5-minute countdown timer
- Animated progress bar
- Success/error messaging

✅ **Mobile/UX:**
- Fully responsive design
- Smooth animations
- Touch-friendly controls
- Modern gradient styling
- Accessible form controls

## Troubleshooting

### Coupon validation not working
1. Check that the SQL functions were created successfully
   - Go to **Database → Functions** in Supabase
   - Look for `validate_coupon` and `record_coupon_usage`

2. Ensure coupon exists and is active
   ```sql
   SELECT * FROM coupons WHERE code = 'YOURCODE';
   ```

3. Check coupon dates are correct
   ```sql
   SELECT code, valid_from, valid_until, NOW() FROM coupons;
   ```

### Discount not calculating correctly
- Verify `discount_type` is "percentage" or "fixed"
- Check `discount_value` is correct for the type
- Test with simple percentage first (e.g., 10%)

### Timer not working
- Check browser console for errors
- Ensure JavaScript is enabled
- Clear browser cache and reload

## Next Steps (Optional Enhancements)

Consider adding:
1. **Admin Panel** - Coupon management interface
2. **Analytics** - Coupon usage reports and statistics
3. **Email Integration** - Send coupon codes to users
4. **Bulk Upload** - Import coupons from CSV
5. **Auto-generate** - Create random coupon codes
6. **Referral Program** - Coupon codes for referrals
7. **Tiered Discounts** - Different discounts at different price points

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify all database tables exist
3. Check RPC function definitions in Supabase
4. Test with sample coupons first
5. Contact support with error details
