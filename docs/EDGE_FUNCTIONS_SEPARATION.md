# 🏗️ Edge Functions - Separation of Concerns

## Overview

The order management system uses **two separate Edge Functions** to maintain clear separation of responsibilities:

```
Frontend
   ↓
   ├──────────────────────────────────────────┐
   │                                          │
   ▼                                          ▼
order-notification              telegram_notifications
(Create Orders)                 (Cancel Orders)
```

---

## 1️⃣ `order-notification` Edge Function

### Purpose
**Create and manage new orders** with automatic Telegram notifications

### Responsibilities
- ✅ Insert new orders into `orders` table
- ✅ Insert items into `order_items` table
- ✅ Validate idempotency key to prevent duplicates
- ✅ Support two shipping types: `fast` and `unified`
- ✅ Send Telegram notifications about new orders
- ✅ Generate notifications for admins/stores

### When It's Called
After customer submits checkout form → `CheckoutPage.jsx` calls endpoint

### Request Format
```javascript
POST /functions/v1/order-notification

{
  "customer_name": "محمد أحمد",
  "customer_phone": "07803693942",
  "customer_address": "بغداد - الكرادة",
  "customer_city": "بغداد",
  "customer_notes": "توصيل سريع",
  "items": [
    {
      "product_id": "123e4567-e89b-12d3-a456-426614174000",
      "product_name": "فير اند لفلي",
      "quantity": 2,
      "price": 25000,
      "discounted_price": 20000,
      "main_store_name": "Cosmetik Store"
    }
  ],
  "total_amount": 40000,
  "subtotal": 40000,
  "discounted_price": 5000,
  "order_code": "ORD789ABC",
  "main_store_name": "Cosmetik Store",
  "idempotency_key": "unique-key-12345",
  "shipping_type": "unified",  // or "fast"
  "user_id": null
}
```

### Response Format
```javascript
{
  "success": true,
  "message": "تم إنشاء الطلب بنجاح",
  "orders": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "order_code": "ORD789ABC",
      "order_status": "pending",
      "customer_name": "محمد أحمد",
      "total_amount": 40000,
      "created_at": "2024-01-16T10:30:00Z"
      // ... other fields
    }
  ]
}
```

### What Happens Inside
1. **Validation**: Check required fields and idempotency key
2. **Duplicate Check**: For unified shipping, verify no existing order with same key
3. **Order Creation**:
   - Fast shipping: Creates separate order for each product
   - Unified shipping: Creates single order for all products
4. **Item Insertion**: Inserts all order items
5. **Notification**: Sends Telegram message to admins/stores
6. **Response**: Returns created order(s) with 200 status

### Error Responses
- `400`: Missing or invalid required fields
- `409`: Order already exists (duplicate idempotency key)
- `500`: Database or Telegram service error

### Frontend Integration
```javascript
// In CheckoutPage.jsx
const edgeFunctionUrl = 'https://ykyzviqwscrjjkucorlp.supabase.co/functions/v1/order-notification';
const notificationResult = await submitOrderToBackend(orderDataForEdgeFunction, edgeFunctionUrl);

if (notificationResult.success) {
  // Order created successfully
  toast({ title: 'تم إرسال الطلب بنجاح' });
} else {
  // Handle error
  toast({ title: 'خطأ في الطلب', variant: 'destructive' });
}
```

---

## 2️⃣ `telegram_notifications` Edge Function

### Purpose
**Cancel pending orders** with automatic Telegram notifications

### Responsibilities
- ✅ Validate order exists and is in `pending` status
- ✅ Check 6-hour cancellation window
- ✅ Update order status to `cancelled`
- ✅ Set `customer_rejected` flag to true
- ✅ Add cancellation reason to `return_reason` field
- ✅ Send Telegram notification about cancellation

### When It's Called
When customer clicks "Cancel Order" button → `OrderTrackingPage.jsx` calls endpoint

### Request Format
```javascript
POST /functions/v1/telegram_notifications

{
  "action": "cancel_order",
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "cancellation_reason": "العميل غير مهتم بالمنتج"
}
```

### Response Format
```javascript
{
  "success": true,
  "message": "تم إلغاء الطلب بنجاح",
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "order_code": "ORD789ABC",
    "order_status": "cancelled",
    "customer_rejected": true,
    "return_reason": "العميل غير مهتم بالمنتج",
    "updated_at": "2024-01-16T10:35:00Z"
    // ... other fields
  }
}
```

### What Happens Inside
1. **Validation**: 
   - Check order_id is valid UUID
   - Verify order exists
   - Confirm order status is `pending`
2. **Time Check**: Validate order was created within last 6 hours
3. **Update Order**:
   - Set `order_status` = "cancelled"
   - Set `customer_rejected` = true
   - Set `return_reason` = cancellation_reason
4. **Notification**: Send Telegram message to admins
5. **Response**: Return updated order with 200 status

### Error Responses
- `400`: Invalid order_id format or missing fields
- `403`: Cancellation window expired (>6 hours)
- `404`: Order not found
- `409`: Order not in pending status
- `500`: Database or Telegram service error

### Frontend Integration
```javascript
// In telegramNotificationService.js
import { sendOrderCancellationNotification } from '@/lib/telegramNotificationService';

const result = await sendOrderCancellationNotification({
  orderId: order.id,  // Must be UUID!
  cancellationReason: 'سبب الإلغاء',
});

if (result.success) {
  toast({ title: 'تم الإلغاء بنجاح', description: result.message });
  refreshOrderData();
} else {
  toast({ title: 'فشل الإلغاء', description: result.message, variant: 'destructive' });
}
```

---

## Comparison Table

| Aspect | order-notification | telegram_notifications |
|--------|-------------------|----------------------|
| **Purpose** | Create new orders | Cancel pending orders |
| **Action Parameter** | N/A (only creates) | `"cancel_order"` |
| **Database Operation** | INSERT into orders + order_items | UPDATE orders table |
| **Validation** | Idempotency key, required fields | Order exists, 6-hour window |
| **Key Input** | `idempotency_key` | `order_id` (UUID) |
| **Status Change** | Sets to `pending` | Changes to `cancelled` |
| **Telegram Msg** | "New order" notification | "Order cancelled" notification |
| **Frontend Entry Point** | CheckoutPage.jsx | OrderTrackingPage.jsx |

---

## Why Separation of Concerns?

### ✅ Benefits

1. **Clear Responsibility**
   - Each function does one thing well
   - Easy to understand and maintain
   - Reduces cognitive complexity

2. **Reduced Duplication**
   - No shared code between functions
   - Each can be optimized independently
   - Easier to test individually

3. **Error Handling**
   - Specific error responses for each operation
   - Clear failure paths
   - Easier debugging

4. **Scaling**
   - Can scale functions independently
   - Cancel operations won't affect order creation
   - Easier to add features later

5. **Security**
   - Different validation rules per function
   - Clear permission boundaries
   - Reduced surface area for bugs

### ❌ What NOT to Do

**Don't merge them!** ❌
```javascript
// BAD - This violates separation of concerns
{
  "action": "create_order" OR "cancel_order",  // One function for everything
  // ... mixed parameters
}
```

**Reason**: Creates a complex, hard-to-maintain function that handles multiple responsibilities.

---

## Frontend Services

### `telegramNotificationService.js`
```javascript
export { sendOrderCancellationNotification }
```
- **Sole Purpose**: Handle order cancellations
- **Used By**: OrderTrackingPage.jsx
- **Endpoint**: `/functions/v1/telegram_notifications`
- **Action**: Always `"cancel_order"`

### `orderService.js` / `submitOrderToBackend()`
```javascript
export { submitOrderToBackend }
```
- **Sole Purpose**: Create new orders
- **Used By**: CheckoutPage.jsx
- **Endpoint**: `/functions/v1/order-notification`
- **No Action Parameter**: Function only creates

---

## Environment Variables Required

Both functions use:
- `SUPABASE_URL` - Database connection
- `SUPABASE_SERVICE_ROLE_KEY` - Write permissions
- `TELEGRAM_BOT_TOKEN` - Bot credentials
- `TELEGRAM_CHAT_ID` - Notification destination (can be comma-separated)

---

## Testing Checklist

### order-notification Tests
- [ ] New order creates successfully
- [ ] Order items are inserted
- [ ] Idempotency key prevents duplicates
- [ ] Fast shipping creates separate orders
- [ ] Unified shipping creates single order
- [ ] Telegram notification is sent
- [ ] Invalid request returns 400

### telegram_notifications Tests
- [ ] Cancellation succeeds within 6 hours
- [ ] Cancellation fails after 6 hours (403)
- [ ] Non-existent order returns 404
- [ ] Non-pending order returns 409
- [ ] Invalid UUID returns 400
- [ ] Telegram notification is sent
- [ ] Order status updates to "cancelled"

---

## Quick Reference

### Creating an Order
```
1. User fills checkout form
2. CheckoutPage prepares orderData
3. Calls submitOrderToBackend() with order-notification URL
4. Edge Function creates order + sends Telegram notification
5. Frontend receives confirmation
6. Clear cart and show success
```

### Cancelling an Order
```
1. User views order details
2. Clicks "إلغاء الطلب"
3. OrderTrackingPage calls sendOrderCancellationNotification()
4. Edge Function validates 6-hour window
5. Updates order status to "cancelled"
6. Sends Telegram notification
7. Frontend refreshes order data
```

---

## Future Considerations

- Consider adding webhook for real-time updates
- Implement batch processing for high volume
- Add more detailed logging/analytics
- Implement rate limiting per customer
- Add SMS notifications as alternative to Telegram

---

