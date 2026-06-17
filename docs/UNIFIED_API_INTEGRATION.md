# Unified Edge Function API Integration

## Overview

The backend has consolidated notifications and order cancellation into a **single unified Edge Function**. This reduces complexity and allows flexible operation management through an `action` parameter.

---

## API Endpoint

```
POST https://<SUPABASE-URL>/functions/v1/order-operations
```

### Current Implementation
```javascript
const ORDER_OPERATIONS_FUNCTION = `${SUPABASE_URL}/functions/v1/order-operations`;
```

**Location:** `src/lib/orderTrackingService.js` (line 7)

---

## Supported Actions

### 1. Cancel Order

**Action:** `cancel_order`

**Request Body:**
```json
{
  "action": "cancel_order",
  "order_id": "uuid-of-the-order",
  "cancellation_reason": "Optional reason for cancellation"
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | ✅ Yes | Must be `"cancel_order"` |
| `order_id` | UUID | ✅ Yes | The database ID of the order (NOT order_code) |
| `cancellation_reason` | string | ❌ No | Reason for cancellation |

**Success Response:**
```json
{
  "success": true,
  "message": "تم إلغاء الطلب بنجاح. سيتم معالجة استرجاع المبلغ خلال 3-5 أيام عمل.",
  "order": { ...order_data... }
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "status": 400 // or 403, 404, 409 depending on the error
}
```

### 2. Send Notifications

**Action:** `send_notification`

**Request Body:**
```json
{
  "action": "send_notification"
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | ✅ Yes | Must be `"send_notification"` |

**Success Response:**
```json
{
  "success": true,
  "message": "Notifications sent successfully",
  "notifications_sent": 5
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

---

## Frontend Implementation

### 1. Cancel Order Function

**Location:** `src/lib/orderTrackingService.js` (line 204)

```javascript
export const cancelOrder = async ({
  orderId,
  cancellationReason = 'Cancelled by customer within allowed window',
  userToken = null,
}) => {
  const requestBody = {
    action: 'cancel_order',          // ✅ Action field required
    order_id: orderId,                // ✅ Must be UUID, not order_code
    cancellation_reason: cancellationReason,
  };

  const response = await fetch(ORDER_OPERATIONS_FUNCTION, {
    method: 'POST',                   // ✅ POST request
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  return await response.json();
};
```

### 2. Send Notifications Function

**Location:** `src/lib/orderTrackingService.js` (line 287)

```javascript
export const sendPendingNotifications = async () => {
  const requestBody = {
    action: 'send_notification',      // ✅ Action field required
  };

  const response = await fetch(ORDER_OPERATIONS_FUNCTION, {
    method: 'POST',                   // ✅ POST request
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  return await response.json();
};
```

---

## Key Implementation Notes for Developers

### ✅ CORRECT Usage

```javascript
// Cancel order with UUID
const result = await cancelOrder({
  orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  // ✅ UUID
  cancellationReason: 'Changed my mind'
});

// Send notifications
const notifResult = await sendPendingNotifications();
```

### ❌ INCORRECT Usage

```javascript
// DON'T use order_code
const result = await cancelOrder({
  orderId: 'SO09DBWW'  // ❌ WRONG - This is order_code, not UUID
});

// DON'T forget the action field
fetch(ORDER_OPERATIONS_FUNCTION, {
  method: 'POST',
  body: JSON.stringify({
    order_id: 'uuid',
    // ❌ Missing action field
  })
});

// DON'T use GET request
fetch(ORDER_OPERATIONS_FUNCTION, {
  method: 'GET',  // ❌ WRONG - Must be POST
  // ...
});
```

---

## Order ID vs Order Code

### Critical Difference

| Field | Type | Example | Usage |
|-------|------|---------|-------|
| **order_id** | UUID | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` | Database operations, cancellations |
| **order_code** | String | `SO09DBWW` | User-facing, search, display |

### How to Get the Order ID

When you fetch an order using `fetchOrderByCode()` or `fetchOrderByIdAndPhone()`, the returned object includes both fields:

```javascript
const order = await fetchOrderByCode(supabase, 'SO09DBWW');

// order.id ← Use this for cancellation
// order.order_code ← Use this for display
```

### Usage in OrderTrackingPage

```javascript
const handleCancelOrder = async () => {
  const result = await cancelOrder({
    orderId: order.id,  // ✅ CORRECT - Use the UUID
    cancellationReason: cancellationNotes,
  });
};
```

---

## Error Handling

### HTTP Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| `200` | Success | Process the response data |
| `400` | Bad Request | Check request format, missing fields |
| `403` | Forbidden | Cancellation window expired (6+ hours) |
| `404` | Not Found | Order doesn't exist |
| `409` | Conflict | Order status doesn't allow cancellation |
| `500` | Server Error | Report to backend team |

### Example Error Handling

```javascript
if (response.status === 403) {
  // Cancellation window expired
  toast('انتهت مهلة إلغاء الطلب (6 ساعات)');
} else if (response.status === 404) {
  // Order not found
  toast('الطلب غير موجود');
} else if (response.status === 409) {
  // Invalid status for cancellation
  toast('حالة الطلب لا تسمح بالإلغاء');
}
```

---

## Files Modified

### Updated Files
1. **`src/lib/orderTrackingService.js`**
   - Changed endpoint from `cancel-order` to `order-operations`
   - Added `action` field to `cancelOrder()` request
   - Added new `sendPendingNotifications()` function
   - Updated function descriptions

### No Changes Required In:
- `src/pages/OrderTrackingPage.jsx` - Existing calls to `cancelOrder()` still work
- `src/components/orders/OrderStatusStepper.jsx` - No API calls needed
- All other components

---

## Testing Checklist

### Test 1: Cancel Order
```javascript
// ✅ Should succeed with valid UUID
await cancelOrder({
  orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  cancellationReason: 'Testing'
});

// ✅ Should handle 403 (window expired)
// ✅ Should handle 404 (not found)
// ✅ Should handle 409 (invalid status)
```

### Test 2: Send Notifications
```javascript
// ✅ Should send pending notifications
const result = await sendPendingNotifications();
console.log(result.notifications_sent); // Should show count
```

### Test 3: Real Scenario - Cancel from OrderTrackingPage
```
1. Visit /track-order
2. Search for order
3. Order status = "pending" and age < 6 hours
4. Click "Cancel Order"
5. Enter reason
6. Confirm
7. ✅ Success message
8. Order status updates to "cancelled"
```

---

## Migration Notes

### From Old Implementation
The system was previously:
- ❌ Multiple Edge Functions (`cancel-order`, separate notifications)
- ❌ Different endpoints for different operations
- ❌ Some confusion about when to use GET vs POST

### To New Implementation
The system is now:
- ✅ Single unified endpoint with `action` parameter
- ✅ All operations through same function
- ✅ Consistent POST requests
- ✅ Clearer request/response structure

### Backward Compatibility
- ✅ All existing function calls still work
- ✅ No breaking changes to OrderTrackingPage
- ✅ Only the underlying endpoint changed

---

## Important Reminders

### 1. Always Use UUID for order_id
```javascript
// ✅ CORRECT
order_id: order.id  // This is a UUID

// ❌ WRONG
order_id: order.order_code  // This is a string like "SO09DBWW"
```

### 2. Always Send POST Request
```javascript
// ✅ CORRECT
fetch(url, { method: 'POST', ... })

// ❌ WRONG
fetch(url, { method: 'GET', ... })
```

### 3. Always Include action Field
```javascript
// ✅ CORRECT
{ action: 'cancel_order', order_id: '...', ... }

// ❌ WRONG
{ order_id: '...', ... }  // Missing action
```

---

## FAQ

**Q: Why do we need the action field?**
A: It tells the Edge Function which operation to perform. One function can now handle multiple operations.

**Q: What if the order_code is different from order_id?**
A: Always use `order.id` (the UUID) for API calls. Use `order.order_code` only for display to users.

**Q: Can I pass order_code instead of order_id?**
A: No. The backend expects UUID. Use `order.id` from the order object.

**Q: What if the Edge Function URL changes?**
A: Update `ORDER_OPERATIONS_FUNCTION` in `src/lib/orderTrackingService.js` (line 7).

**Q: Do I need to change OrderTrackingPage.jsx?**
A: No. All function calls remain the same. The implementation is backward compatible.

---

## Support & Troubleshooting

### If you get "Method Not Allowed" error
- ❌ Wrong: Using GET request
- ✅ Fix: Use `method: 'POST'`

### If you get "Invalid order_id" error
- ❌ Wrong: Passing order_code like "SO09DBWW"
- ✅ Fix: Use the UUID from `order.id`

### If the function doesn't respond
- Check the Supabase dashboard Edge Functions logs
- Verify the endpoint URL is correct
- Ensure request headers include `Content-Type: application/json`

---

**Status:** ✅ Implementation Complete
**Last Updated:** January 2024
**Version:** 1.0 (Unified API)
