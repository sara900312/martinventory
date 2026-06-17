# Order Code Query Fix - Summary

## Issue Identified ✅ Fixed

The `fetchOrderByIdAndPhone` function in `src/lib/orderTrackingService.js` was using the wrong database column for searching.

### Before (❌ Incorrect)
```javascript
.eq('id', orderId.trim())  // Using database ID (UUID)
```

The problem: The variable named `orderId` is actually the **order code** (user-facing number like "SO09DBWW"), not the internal database ID. Searching by database `id` with this value would never find the order.

### After (✅ Correct)
```javascript
.eq('order_code', orderCode.trim().toUpperCase())  // Using order code
```

Now it correctly searches the `order_code` field, matching how users search for their orders.

---

## What Changed

### File: `src/lib/orderTrackingService.js`

**Function:** `fetchOrderByIdAndPhone()`
**Lines:** 127-194

**Key changes:**
1. Parameter name: `orderId` → `orderCode` (for clarity)
2. Query field: `.eq('id', ...)` → `.eq('order_code', ...)`
3. Case handling: Added `.toUpperCase()` (order codes are stored in uppercase)
4. Comments updated to reflect order_code usage

**Full function signature:**
```javascript
export const fetchOrderByIdAndPhone = async (
  supabase,
  orderCode,      // Order code like "SO09DBWW"
  phoneNumber     // Phone number like "07803693942"
) => {
  // ... queries with:
  .eq('order_code', orderCode.trim().toUpperCase())
  .eq('customer_phone', phoneNumber.trim())
}
```

---

## Impact

### Where It's Used
- **OrderTrackingPage.jsx** (line 73)
  - "البحث برقم الهاتف" (Search by order code and phone) tab
  - When users provide order code + phone number

### Affected Users
- Users searching for orders using "Order Code + Phone Number" method
- Now correctly finds orders by their public-facing order code
- Guest order tracking works properly

### Backwards Compatibility
✅ **No breaking changes** - Only fixes existing queries to use correct field names

---

## Testing the Fix

### Test Case: Search by Order Code & Phone
```
1. Customer has order with:
   - Order Code: "SO09DBWW"
   - Phone: "07803693942"

2. Navigate to: /track-order
3. Click: "البحث برقم الهاتف" (Search by phone)
4. Enter:
   - Code: SO09DBWW
   - Phone: 07803693942
5. Click: "بحث" (Search)
6. Result: ✅ Order found and displayed
```

### Before Fix
- ❌ "لم يتم العثور على الطلب" (Order not found)
- Reason: Searching `id` field instead of `order_code`

### After Fix
- ✅ Order details display correctly
- All order information shows
- Status timeline visible

---

## Database Schema Reference

### orders Table
```sql
-- The correct columns for searching orders:

id UUID PRIMARY KEY         -- Internal database ID
order_code VARCHAR NOT NULL -- Public order number (e.g., "SO09DBWW")
customer_phone VARCHAR      -- Customer phone number (e.g., "07803693942")
order_status VARCHAR        -- Status field
...
```

### Query Examples

**By Order Code (Most Reliable)**
```javascript
.eq('order_code', 'SO09DBWW')
```

**By Order Code + Phone (Verification)**
```javascript
.eq('order_code', 'SO09DBWW')
.eq('customer_phone', '07803693942')
```

**NOT by Database ID**
```javascript
// ❌ Don't use this - users don't know the database ID
.eq('id', 'abc-123-uuid')
```

---

## Related Functions (Already Correct)

✅ **`fetchOrderByCode()`** (Line 75)
- Already using: `.eq('order_code', orderCode.trim().toUpperCase())`
- Status: CORRECT

✅ **`searchUserOrderByCode()`** in userOrdersService.js (Line 177)
- Already using: `.eq('order_code', orderCode.toUpperCase())`
- Status: CORRECT

✅ **`verifyUserOwnsOrder()`** in userOrdersService.js (Line 224)
- Already using: `.eq('order_code', orderCode.toUpperCase())`
- Status: CORRECT

---

## Deployment Notes

### Before Deploying
- ✅ No database migrations needed
- ✅ No schema changes required
- ✅ Backwards compatible

### After Deploying
- Test the fix with real order codes
- Monitor error logs for any issues
- Verify search functionality works

### Rollback (if needed)
- Revert the single file change: `src/lib/orderTrackingService.js`
- No data cleanup required

---

## Summary

**Issue:** Query was using wrong database column (`id` instead of `order_code`)
**Solution:** Changed query to use correct column name and apply proper case handling
**Files Changed:** 1 file (src/lib/orderTrackingService.js)
**Lines Changed:** ~67 lines (mainly documentation)
**Risk Level:** Very Low - simple field name correction
**Testing:** Manual testing confirmed working

---

**Status:** ✅ Fixed and Ready
**Last Updated:** January 2024
