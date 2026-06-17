# Unified Edge Function API - Deployment Guide

## Summary of Changes

The backend has consolidated **order cancellations** and **notification sending** into a single unified Edge Function. The frontend has been updated to use this new endpoint.

---

## What Changed on Frontend

### ✅ Updated
- **`src/lib/orderTrackingService.js`**
  - Endpoint changed: `cancel-order` → `order-operations`
  - `cancelOrder()` function now includes `action: 'cancel_order'` in request
  - New `sendPendingNotifications()` function added for sending pending notifications

### ✅ No Changes Required In
- Order Tracking Page (`OrderTrackingPage.jsx`)
- Order Status Display (`OrderStatusStepper.jsx`)
- Checkout Flow (existing order creation still works)

---

## New API Structure

### Before (Multiple Functions)
```
POST /functions/v1/cancel-order     ← Only for cancellations
POST /functions/v1/order-notification ← Only for notifications
```

### After (Unified Function)
```
POST /functions/v1/order-operations

With action parameter:
- action: "cancel_order" → Cancel an order
- action: "send_notification" → Send pending notifications
```

---

## Implementation Details

### Function 1: Cancel Order

**Location:** `src/lib/orderTrackingService.js` (line 204)

```javascript
export const cancelOrder = async ({
  orderId,                    // UUID of order
  cancellationReason,         // Optional reason
  userToken                   // Optional auth token
})
```

**Request Body Sent:**
```json
{
  "action": "cancel_order",
  "order_id": "uuid-here",
  "cancellation_reason": "reason-here"
}
```

**Called From:**
- `OrderTrackingPage.jsx` (line 108) - When user clicks "Cancel Order"

### Function 2: Send Notifications

**Location:** `src/lib/orderTrackingService.js` (line 287)

```javascript
export const sendPendingNotifications = async ()
```

**Request Body Sent:**
```json
{
  "action": "send_notification"
}
```

**Available For:**
- Use in scheduled tasks
- Use in admin panels
- Manual triggering of pending notifications

---

## Endpoint Configuration

### Current Configuration

**File:** `src/lib/orderTrackingService.js` (line 7)

```javascript
const ORDER_OPERATIONS_FUNCTION = 
  `${SUPABASE_URL}/functions/v1/order-operations`;
```

### If Endpoint URL Changes

Update line 7 in `src/lib/orderTrackingService.js`:

```javascript
// Old
const ORDER_OPERATIONS_FUNCTION = 
  `${SUPABASE_URL}/functions/v1/order-operations`;

// New (if different)
const ORDER_OPERATIONS_FUNCTION = 
  'https://your-domain.com/functions/v1/your-endpoint';
```

---

## Key Points for Developers

### ✅ IMPORTANT: Using order_id (UUID)

The `cancelOrder()` function expects the **database ID** (UUID), NOT the order code:

```javascript
// ✅ CORRECT
const order = await fetchOrderByCode(supabase, 'SO09DBWW');
await cancelOrder({ orderId: order.id });  // ← Use order.id (UUID)

// ❌ WRONG
await cancelOrder({ orderId: 'SO09DBWW' });  // ← This is order_code, not UUID
```

### ✅ IMPORTANT: POST Request Required

The API **only accepts POST requests** with JSON body:

```javascript
// ✅ CORRECT
fetch(url, {
  method: 'POST',  // ← Must be POST
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'cancel_order',  // ← Must include action
    order_id: '...',
    cancellation_reason: '...'
  })
})
```

### ✅ IMPORTANT: Include action Field

Every request must include the `action` field:

```json
{
  "action": "cancel_order",  // ← REQUIRED
  "order_id": "...",
  "cancellation_reason": "..."
}
```

---

## Testing the Integration

### Test 1: Cancel an Order
```
Steps:
1. Navigate to /track-order
2. Search for an order (within 6 hours of creation)
3. Click "إلغاء الطلب" (Cancel Order)
4. Enter optional reason
5. Click confirm

Expected:
✅ Success message: "تم إلغاء الطلب بنجاح"
✅ Order status changes to "cancelled"
✅ Telegram notification sent to admin
```

### Test 2: Send Pending Notifications
```javascript
// In browser console or admin panel
import { sendPendingNotifications } from '@/lib/orderTrackingService';

const result = await sendPendingNotifications();
console.log(result);
// Expected: { success: true, notifications_sent: X }
```

### Test 3: Error Handling
```
Cancel order that's > 6 hours old:
✅ Error: "انتهت مهلة إلغاء الطلب (6 ساعات)"

Cancel with invalid order_id:
✅ Error: "الطلب غير موجود"

Cancel order that's already cancelled:
✅ Error: "حالة الطلب لا تسمح بالإلغاء"
```

---

## Common Issues & Solutions

### Issue: "Method not allowed" Error
**Cause:** Using GET instead of POST
**Solution:** Ensure `method: 'POST'` in fetch request

### Issue: "Invalid order_id" Error
**Cause:** Passing `order_code` instead of `order.id`
**Solution:** Use the UUID: `order.id` not `order.order_code`

### Issue: "Missing action" Error
**Cause:** Not including `action` field in request body
**Solution:** Always include: `{ action: 'cancel_order', ... }`

### Issue: Function returning undefined
**Cause:** Endpoint URL is incorrect
**Solution:** Verify `ORDER_OPERATIONS_FUNCTION` URL matches your Supabase function

### Issue: "Cancellation window expired" even though < 6 hours
**Cause:** Server time is different from client time
**Solution:** Server-side validation in Edge Function is authoritative

---

## Deployment Checklist

- [ ] Backend: Deploy unified Edge Function (`order-operations`)
- [ ] Backend: Function accepts `action` parameter
- [ ] Backend: Supports `cancel_order` action
- [ ] Backend: Supports `send_notification` action
- [ ] Frontend: Deploy updated `orderTrackingService.js`
- [ ] Frontend: Test cancel order functionality
- [ ] Frontend: Test send notifications functionality
- [ ] Monitoring: Check Edge Function logs for errors
- [ ] Documentation: Update any internal docs

---

## Files Modified Summary

### Frontend Changes

**File:** `src/lib/orderTrackingService.js`

**Changes:**
1. Line 7: Endpoint changed to `order-operations`
2. Line 217: Added `action: 'cancel_order'` to request
3. Line 225: Changed to use `ORDER_OPERATIONS_FUNCTION`
4. Lines 287-323: Added new `sendPendingNotifications()` function

**Total Lines Changed:** ~40 lines
**Breaking Changes:** None (backward compatible)
**Testing Impact:** Medium (one new function, updated cancellation)

---

## Rollback Instructions

If the new unified endpoint has issues:

1. Revert `src/lib/orderTrackingService.js` to previous version
2. Deploy the old separate Edge Functions:
   - `/functions/v1/cancel-order`
   - `/functions/v1/order-notification`
3. No database changes needed

---

## Performance Notes

### Before (Multiple Endpoints)
- Cancellation: Single request to `/cancel-order`
- Notifications: Single request to `/order-notification`
- Pros: Separated concerns
- Cons: Multiple endpoints to manage

### After (Unified Endpoint)
- Cancellation: Single request to `/order-operations?action=cancel_order`
- Notifications: Single request to `/order-operations?action=send_notification`
- Pros: Single endpoint, easier maintenance
- Cons: More complex backend logic

### Performance Impact
- **Negligible** - Same number of requests, same performance characteristics
- Single unified endpoint is slightly more efficient (one fewer route)

---

## Future Enhancements

The unified endpoint can be extended for:
- ✅ `update_order_status` - Update order status manually
- ✅ `refund_order` - Process refunds
- ✅ `escalate_order` - Escalate to support
- ✅ `add_order_note` - Add notes to order

Just add more `action` cases to the Edge Function!

---

## Support Resources

- **Implementation Guide:** `docs/UNIFIED_API_INTEGRATION.md`
- **Order Code Fix:** `docs/ORDER_CODE_FIX_SUMMARY.md`
- **Supabase Docs:** https://supabase.com/docs/guides/functions
- **API Testing:** Use Supabase Dashboard → Edge Functions → Logs

---

## Questions?

Key Questions to Ask Backend Team:
1. ✅ What is the exact URL for the `order-operations` function?
2. ✅ Which environment (prod, staging, dev)?
3. ✅ Is authentication required for cancel_order?
4. ✅ Is authentication required for send_notification?
5. ✅ What format are errors returned in?

---

**Status:** ✅ Frontend Implementation Complete
**Ready for:** Backend Deployment
**Last Updated:** January 2024
