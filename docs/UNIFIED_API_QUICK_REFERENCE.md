# Unified API - Quick Reference

## 🎯 TL;DR

Frontend has been updated to use a single unified Edge Function for:
- Canceling orders
- Sending pending notifications

Changes are **backward compatible** - no component updates needed.

---

## 📍 What Changed

### File: `src/lib/orderTrackingService.js`

**Line 7: Endpoint Updated**
```javascript
// Before
const CANCEL_ORDER_FUNCTION = `${SUPABASE_URL}/functions/v1/cancel-order`;

// After
const ORDER_OPERATIONS_FUNCTION = `${SUPABASE_URL}/functions/v1/order-operations`;
```

**Line 217: Action Field Added**
```javascript
// Before
const requestBody = { order_id: orderId, cancellation_reason: ... };

// After
const requestBody = { 
  action: 'cancel_order',              // ✅ New field
  order_id: orderId, 
  cancellation_reason: ... 
};
```

**Lines 287-323: New Function Added**
```javascript
// New function for sending pending notifications
export const sendPendingNotifications = async () => {
  const requestBody = { action: 'send_notification' };
  // ... fetch and return response
};
```

---

## 🚀 How to Use

### Cancel an Order

```javascript
import { cancelOrder } from '@/lib/orderTrackingService';

// In component
const result = await cancelOrder({
  orderId: order.id,                    // ✅ Use order.id (UUID)
  cancellationReason: 'Reason here'     // Optional
});

if (result.success) {
  console.log('Order cancelled');
} else {
  console.log('Error:', result.message);
}
```

### Send Pending Notifications

```javascript
import { sendPendingNotifications } from '@/lib/orderTrackingService';

// In component or admin function
const result = await sendPendingNotifications();

if (result.success) {
  console.log(`Sent ${result.notificationsSent} notifications`);
}
```

---

## 📋 API Request/Response

### Cancel Order Request
```
POST /functions/v1/order-operations

Body:
{
  "action": "cancel_order",
  "order_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "cancellation_reason": "Changed my mind"
}

Response (Success - 200):
{
  "success": true,
  "message": "تم إلغاء الطلب بنجاح...",
  "order": { ...order_data... }
}

Response (Error - 403/404/409):
{
  "error": "Error message",
  "status": 403
}
```

### Send Notifications Request
```
POST /functions/v1/order-operations

Body:
{
  "action": "send_notification"
}

Response (Success - 200):
{
  "success": true,
  "message": "Notifications sent successfully",
  "notifications_sent": 5
}

Response (Error):
{
  "error": "Error message"
}
```

---

## ⚠️ Critical Rules

### Rule 1: Use order.id (UUID), NOT order_code
```javascript
// ✅ CORRECT
orderId: order.id
// Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

// ❌ WRONG
orderId: order.order_code
// Example: "SO09DBWW"
```

### Rule 2: Always Include action Field
```javascript
// ✅ CORRECT
{ action: 'cancel_order', order_id: '...', ... }
{ action: 'send_notification' }

// ❌ WRONG
{ order_id: '...', ... }  // Missing action
```

### Rule 3: Use POST, Not GET
```javascript
// ✅ CORRECT
fetch(url, { method: 'POST', ... })

// ❌ WRONG
fetch(url, { method: 'GET', ... })
```

---

## 🔍 Where Functions Are Used

### `cancelOrder()`
- **File:** `src/lib/orderTrackingService.js` (line 204)
- **Called From:** `src/pages/OrderTrackingPage.jsx` (line 108)
- **When:** User clicks "إلغاء الطلب" (Cancel Order button)

### `sendPendingNotifications()`
- **File:** `src/lib/orderTrackingService.js` (line 287)
- **Called From:** Not used in current code (available for future use)
- **When:** Manual admin trigger or scheduled task

---

## ✅ No Changes Needed In

- ✅ `src/pages/OrderTrackingPage.jsx` - Still works as before
- ✅ `src/components/orders/OrderStatusStepper.jsx` - No changes
- ✅ Checkout flow - Uses different endpoint (order-notification)
- ✅ Other components - Unaffected

---

## 🧪 Testing

### Quick Test: Cancel Order
```javascript
// In browser console on /track-order
// After finding an order...
window.navigator.toString = () => 'Custom'; // dummy
const { cancelOrder } = await import('/src/lib/orderTrackingService.js');
const result = await cancelOrder({
  orderId: document.querySelector('[data-order-id]').value,
  cancellationReason: 'Test'
});
console.log(result);
```

### Quick Test: Send Notifications
```javascript
// In browser console
const { sendPendingNotifications } = await import('/src/lib/orderTrackingService.js');
const result = await sendPendingNotifications();
console.log(result);
```

---

## 📊 Before & After Comparison

| Aspect | Before | After |
|--------|--------|-------|
| **Endpoint** | Multiple (`cancel-order`, `order-notification`) | Single (`order-operations`) |
| **HTTP Method** | POST (same) | POST (same) |
| **Request Field** | `order_id` only | `action` + `order_id` |
| **URL Parameter** | Not needed | `action` in body |
| **Breaking Changes** | N/A | None - backward compatible |
| **Testing Needed** | Cancel, Notifications | Cancel, Notifications (same tests) |

---

## 🚨 Error Responses

| Status | Meaning | User Message |
|--------|---------|--------------|
| 200 | Success | Success! |
| 403 | Cancellation window expired (>6 hours) | "انتهت مهلة إلغاء الطلب" |
| 404 | Order not found | "الطلب غير موجود" |
| 409 | Order status doesn't allow cancellation | "حالة الطلب لا تسمح بالإلغاء" |
| 400 | Bad request (missing fields) | Check request format |
| 500 | Server error | "خطأ من السيرفر" |

---

## 🔗 Related Documentation

- **Full Integration Guide:** `docs/UNIFIED_API_INTEGRATION.md`
- **Deployment Guide:** `docs/UNIFIED_API_DEPLOYMENT_GUIDE.md`
- **Order Code Fix:** `docs/ORDER_CODE_FIX_SUMMARY.md`

---

## ❓ FAQ

**Q: Do I need to update OrderTrackingPage.jsx?**
A: No. It still works with the updated functions.

**Q: Why is order_id different from order_code?**
A: `order_id` is the UUID (database ID), `order_code` is the string users see (e.g., "SO09DBWW").

**Q: Can I use order_code with the new API?**
A: No. The API expects UUID. Convert with: `order.id` not `order.order_code`.

**Q: What if I pass the wrong parameter?**
A: You'll get a 400 or 404 error from the backend.

**Q: Can I call both actions in one request?**
A: No. Each request has one `action`. Send separate requests for multiple operations.

---

**Quick Links:**
- 🔧 Update endpoint: `src/lib/orderTrackingService.js` line 7
- 📝 Main function: `src/lib/orderTrackingService.js` line 204
- 📧 New function: `src/lib/orderTrackingService.js` line 287
- 🧪 Test location: `src/pages/OrderTrackingPage.jsx` line 108

---

**Version:** 1.0 (Unified API)
**Status:** ✅ Ready to Deploy
**Last Updated:** January 2024
