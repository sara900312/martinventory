# Coupon Persistence Implementation

## Overview

This implementation adds persistent coupon functionality to the NeomART store, allowing coupons to remain active for 5 minutes even after page refresh or navigation. It also includes product-specific coupon validation.

## What Was Implemented

### 1. **Coupon Persistence Utility** (`src/lib/couponPersistence.js`)

A utility module that manages saving and retrieving coupons from localStorage with automatic expiration after 5 minutes.

**Key Functions:**
- `saveCouponToStorage(couponData)` - Saves coupon with expiration timestamp
- `getCouponFromStorage()` - Retrieves valid coupon or null if expired
- `removeCouponFromStorage()` - Clears the stored coupon
- `getCouponTimeRemaining()` - Gets remaining time in milliseconds
- `isValidCouponStored()` - Checks if valid coupon exists
- `formatTimeFromMs(ms)` - Formats time as mm:ss

### 2. **useCouponPersistence Hook** (`src/hooks/useCouponPersistence.js`)

A React hook that manages coupon persistence lifecycle:

**Returns:**
- `savedCoupon` - The persisted coupon object
- `timeRemaining` - Remaining time in milliseconds
- `isLoading` - Loading state
- `persistCoupon(couponData)` - Function to save a coupon
- `clearPersistedCoupon()` - Function to remove coupon
- `getFormattedTimeRemaining()` - Get formatted time (mm:ss)

**Behavior:**
- Automatically loads coupon from localStorage on mount
- Sets up countdown timer that updates every second
- Automatically clears expired coupons
- Auto-clears when timer reaches zero

### 3. **Updated CouponInput Component** (`src/components/CouponInput.jsx`)

Enhanced to use localStorage persistence with these features:

**New Features:**
- ✅ Persists applied coupon to localStorage with 5-minute expiration
- ✅ Restores coupon on page load if still valid
- ✅ Validates persisted coupon against current product (ensures product eligibility)
- ✅ Displays countdown timer with progress bar
- ✅ Automatically removes expired coupons
- ✅ Shows "restored from session" message for persisted coupons
- ✅ Records coupon usage in database

**Flow:**
1. User enters coupon code → validates against Supabase
2. If valid → saves to localStorage with 5-min expiration
3. User refreshes page → coupon automatically restored
4. Timer counts down → when expired, coupon is auto-removed
5. Invalid/expired coupons are auto-cleared

### 4. **Enhanced CartContext** (`src/contexts/CartContext.jsx`)

Updated to handle persisted coupons:

**Changes:**
- Loads persisted coupon on context initialization
- Exposes `persistedCoupon` in context value
- Properly calculates totals with coupon-applied items

### 5. **Product-Specific Coupon Validation** (`src/lib/couponService.js`)

Added new validation functions for product-specific coupons:

**Functions:**
- `isProductEligibleForCoupon(productId, allowedProducts)` - Check if product can use coupon
- `isCouponUsageAvailable(usedCount, usageLimit)` - Check usage limits
- `validateCouponForProduct(coupon, productId, usedCount, allowedProducts)` - Full validation
- `applyCouponToCartItems(cartItems, coupon, usageMap, allowedProducts)` - Apply to multiple items

## How It Works

### Coupon Application Flow

```
User enters code
      ↓
Validate against database (product-specific)
      ↓
Calculate discount
      ↓
Save to localStorage with expiresAt = now + 5 minutes
      ↓
Display with countdown timer
```

### Page Refresh Flow

```
Page loads
      ↓
useCouponPersistence hook checks localStorage
      ↓
If coupon exists and not expired:
  - Re-validate against current product
  - Restore state with countdown timer
      ↓
If coupon expired or product ineligible:
  - Clear from localStorage
  - Reset UI
```

### Storage Structure

```javascript
localStorage.neomart-applied-coupon = {
  code: "COUPON7",
  couponId: 123,
  discountType: "percentage",
  discountValue: 20,
  expiresAt: 1702123456789,    // 5 minutes from now
  savedAt: 1702123156789
}
```

## Technical Details

### 5-Minute Expiration

- Expiration time is calculated when coupon is applied: `now + 5 * 60 * 1000 ms`
- Checked on retrieval from storage
- Countdown timer updates UI every second
- Auto-removed when timer reaches zero

### Product-Specific Validation

When a coupon is restored from localStorage, it's re-validated against:
1. The current product ID
2. Coupon eligibility list (which products it applies to)
3. Usage limits (how many times it can be used per product)

If validation fails, the coupon is automatically cleared.

### Database Integration

- Coupon validation uses Supabase RPC: `validate_coupon(p_code, p_product_id)`
- Returns: `final_price`, `discount_type`, `discount_value`, `coupon_id`
- Usage is recorded in `coupon_usage` table
- Usage limits checked against `coupon_usage` records

## User Experience

### On Product Detail Page

1. **Before Coupon:** User sees coupon input field
2. **After Coupon:** Shows applied coupon with countdown timer (MM:SS format)
3. **On Refresh:** Coupon is automatically restored and timer resumes
4. **After 5 Minutes:** Coupon auto-expires and is removed

### On Checkout Page

1. Coupon discount is preserved if within 5-minute window
2. Invalid/expired coupons are automatically cleared
3. Product-specific restrictions are honored

## Limitations and Considerations

1. **5-Minute Window:** Coupon is only valid for 5 minutes from application
2. **Product-Specific:** Coupon must be eligible for the current product
3. **Usage Limits:** Coupon respects per-product usage limits from database
4. **Cross-Tab:** Each tab has its own localStorage (not shared)
5. **Browser Dependent:** Coupons are cleared if browser cache is cleared

## Testing the Feature

### Test Case 1: Basic Persistence
1. Apply a coupon on a product
2. Refresh the page
3. Coupon should be automatically restored

### Test Case 2: Expiration
1. Apply a coupon
2. Wait 5 minutes (or modify the EXPIRATION_TIME_MS for testing)
3. Coupon should auto-expire and be removed

### Test Case 3: Product Eligibility
1. Apply coupon on product A
2. Navigate to product B (different product)
3. Go back to product A - coupon should still be there
4. Navigate to product C (ineligible) - coupon should be removed

### Test Case 4: Page Navigation
1. Apply coupon on product detail page
2. Navigate to cart
3. Navigate back to same product
4. Coupon should still be active

## File Changes Summary

| File | Changes |
|------|---------|
| `src/lib/couponPersistence.js` | NEW - Utility for localStorage management |
| `src/hooks/useCouponPersistence.js` | NEW - React hook for coupon persistence |
| `src/components/CouponInput.jsx` | UPDATED - Uses localStorage & auto-restore |
| `src/contexts/CartContext.jsx` | UPDATED - Loads persisted coupon |
| `src/lib/couponService.js` | UPDATED - Added product validation functions |

## Future Enhancements

1. **Session Storage:** Option to use sessionStorage instead of localStorage
2. **Sync Across Tabs:** Use BroadcastChannel API to sync coupons across tabs
3. **Backend Validation:** Store coupon state on server for multi-device support
4. **Analytics:** Track coupon persistence and usage patterns
5. **Notification:** Show warning when coupon is about to expire
