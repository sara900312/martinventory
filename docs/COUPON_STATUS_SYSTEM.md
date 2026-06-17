# Coupon Status System Documentation

## Overview

The coupon management system now displays five different status states that accurately reflect the availability and usage state of each coupon. Status is determined based on:

1. **Coupon validity dates** (valid_from, valid_until)
2. **Coupon usage limits** (usage_limit vs coupon_usage count)
3. **Product availability** (available vs exhausted products)

## Status States

### 1. **نشطة (Active)** 🟢
**Display Color:** Light Green (`#d1fae5` background, `#065f46` text)

**Shows when:**
- Today is between valid_from and valid_until
- Usage count has NOT exceeded usage_limit (if set)
- At least one product is available for the coupon
- Coupon is_active = true

**Example:** A coupon valid from Dec 17-25 with limit of 5 uses, currently used 3 times

---

### 2. **منتهية (Expired)** 🔴
**Display Color:** Red (`#fecaca` background, `#7f1d1d` text)

**Shows when:**
- Today is AFTER valid_until date
- Regardless of usage count or products

**Example:** A coupon expired on Dec 15, even if only used twice out of limit of 5

---

### 3. **لم تبدأ بعد (Not Started Yet)** 🟡
**Display Color:** Amber (`#fef3c7` background, `#92400e` text)

**Shows when:**
- Today is BEFORE valid_from date
- Regardless of usage count or products

**Example:** A coupon starting on Dec 25, today is Dec 17

---

### 4. **مستهلك (Consumed)** 🟠
**Display Color:** Rose (`#fde2e4` background, `#9f1239` text)

**Shows when:**
- Coupon has reached its usage_limit
- Coupon is still within its valid date range (valid_from ≤ today ≤ valid_until)
- Coupon is_active = true

**Key Difference from "منتهية":** The coupon hasn't expired DATE-wise, but it's exhausted usage-wise

**Example:** usage_limit=5, currently used 5 times, valid until Dec 25, today is Dec 20

---

### 5. **نفذ (Exhausted)** 🟣
**Display Color:** Purple (`#f3e8ff` background, `#6b21a8` text)

**Shows when:**
- Coupon is still within its valid date range
- All target products have been fully consumed/used
- The coupon is_active = true

**Key Difference from "مستهلك":** The coupon itself hasn't reached its global usage limit, but ALL eligible products have

**Example:** 3 products assigned to coupon, all 3 have reached their individual usage, coupon is still valid date-wise

---

## Status Determination Logic

The status is determined in this order (first match wins):

```
1. IF today < valid_from
   → "لم تبدأ بعد" (Not Started)

2. ELSE IF today > valid_until
   → "منتهية" (Expired)

3. ELSE IF usage_limit exists AND usage_count >= usage_limit
   → "مستهلك" (Consumed)

4. ELSE IF availableProductsCount == 0
   → "نفذ" (Exhausted)

5. ELSE IF is_active == true
   → "نشطة" (Active)

6. ELSE
   → "معطلة" (Disabled - separate from the 5 states above)
```

## Implementation Details

### Database Queries

The coupon management page fetches:

```javascript
{
  data: {
    *,                              // All coupon fields
    coupons_products(count),        // Count of assigned products
    coupon_usage(count)             // Count of usage records
  }
}
```

### Calculating Status

```javascript
const couponStatusInfo = getCouponStatus(
  coupon,                           // Full coupon object
  usageCount,                       // Total usage count
  applicableProductsCount           // Count of assigned products
);

// Returns:
// {
//   status: 'active' | 'expired' | 'not-started' | 'consumed' | 'exhausted',
//   label: 'نشطة' | 'منتهية' | 'لم تبدأ بعد' | 'مستهلك' | 'نفذ',
//   cssClass: 'active' | 'expired' | 'not-started' | 'consumed' | 'exhausted'
// }
```

## UI Display

### Coupon Item Layout

Each coupon card shows:

```
┌─────────────────────────────────────┐
│ COUPON7  📋      [Status Badge]     │
├─────────────────────────────────────┤
│ نوع الخصم: 20%                       │
│ الوصف: خصم صيفي                      │
│ الفترة الزمنية: 17/12/2025 إلى 25/12 │
│ حد الاستخدام: 5/5 مرات             │
│ المنتجات المطبقة: 3 منتجات          │
├─────────────────────────────────────┤
│ [تفعيل]  [تعديل]  [حذف]             │
└─────────────────────────────────────┘
```

### Usage Display

- **With usage_limit:** Shows `current/limit` (e.g., "3/5 مرات")
- **Without usage_limit:** Shows total count (e.g., "7 مرات")

## CSS Styling

Each status has its own color scheme:

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| Active (نشطة) | `#d1fae5` | `#065f46` | `#ffe4f0` |
| Expired (منتهية) | `#fecaca` | `#7f1d1d` | `#fca5a5` |
| Not Started (لم تبدأ) | `#fef3c7` | `#92400e` | `#fcd34d` |
| Consumed (مستهلك) | `#fde2e4` | `#9f1239` | `#fce7f3` |
| Exhausted (نفذ) | `#f3e8ff` | `#6b21a8` | `#e9d5ff` |
| Disabled (معطلة) | `#fee2e2` | `#991b1b` | `#ffe4f0` |

## Usage Tracking

### coupon_usage Table

Records when a coupon is used:

```sql
INSERT INTO coupon_usage (coupon_id, product_id, user_id, used_at)
VALUES (123, 456, 'user-id', now())
```

Each record represents ONE use of the coupon. The status calculation counts these records:

```javascript
usageCount = coupon_usage.length  // Total number of records
```

## Examples

### Example 1: Active Coupon
```
code: "SUMMER20"
valid_from: 2025-12-15
valid_until: 2025-12-31
usage_limit: 10
usage_count: 3
product_count: 5
is_active: true
Today: 2025-12-20

Status: نشطة (Active)
Reason: Within date range, used 3/10, products available
```

### Example 2: Consumed Coupon
```
code: "FLASH99"
valid_from: 2025-12-15
valid_until: 2025-12-25
usage_limit: 5
usage_count: 5
product_count: 3
is_active: true
Today: 2025-12-20

Status: مستهلك (Consumed)
Reason: Still within date range, but reached usage limit
```

### Example 3: Exhausted Coupon
```
code: "LAPTOP5"
valid_from: 2025-12-10
valid_until: 2025-12-31
usage_limit: null  // Unlimited
usage_count: 15
product_count: 0   // All products exhausted
is_active: true
Today: 2025-12-20

Status: نفذ (Exhausted)
Reason: Within date range, no products available
```

## Files Modified

1. **`src/lib/couponService.js`**
   - Added `getCouponStatus()` function

2. **`src/pages/CouponManagementPage.jsx`**
   - Updated `fetchCoupons()` to fetch usage data
   - Added usage count calculation
   - Updated status badge display logic
   - Added usage count display in coupon details

3. **`src/components/CouponManagement.css`**
   - Added `.status-badge.consumed` styles
   - Added `.status-badge.exhausted` styles
   - Added `.coupon-item.consumed` styles
   - Added `.coupon-item.exhausted` styles

## Testing Checklist

- [ ] Active coupon displays "نشطة" with green badge
- [ ] Expired coupon (past date) displays "منتهية" with red badge
- [ ] Not-started coupon (future date) displays "لم تبدأ بعد" with amber badge
- [ ] Consumed coupon (usage limit reached) displays "مستهلك" with rose badge
- [ ] Exhausted coupon (all products used) displays "نفذ" with purple badge
- [ ] Disabled coupon displays "معطلة" with gray badge
- [ ] Usage count shows as "current/limit" when limit is set
- [ ] Usage count shows as total when no limit is set
- [ ] Status updates correctly after changing dates or usage
