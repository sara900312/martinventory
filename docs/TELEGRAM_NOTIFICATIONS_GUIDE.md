# 📢 Telegram Notifications Integration Guide

## Overview

This guide explains how to integrate Telegram notifications for order creation and cancellation using the unified `telegram_notifications` Edge Function.

---

## 1️⃣ Create Order Notification

### Endpoint
```
POST /functions/v1/telegram_notifications
```

### When It's Called
Automatically triggered after successful order creation in `CheckoutPage.jsx` → `processOrderSubmission()`

### Required Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | ✅ | Must be `"create_order"` |
| `customer_name` | string | ✅ | Customer full name |
| `customer_phone` | string | ✅ | Customer phone number |
| `customer_address` | string | ✅ | Delivery address |
| `customer_city` | string | ✅ | City name (e.g., "بغداد" or "محافظات أخرى") |
| `items` | array | ✅ | Array of ordered items |
| `total_amount` | number | ✅ | Total order amount in IQD |
| `order_code` | string | ✅ | Unique order code (e.g., "ORD123456") |
| `main_store_name` | string | ✅ | Store name |

### Items Array Format

Each item in the `items` array must have:

```javascript
{
  "product_name": "اسم المنتج",    // Product name
  "quantity": 2                    // Quantity ordered
}
```

### Request Body Example

```javascript
{
  "action": "create_order",
  "customer_name": "محمد أحمد",
  "customer_phone": "07803693942",
  "customer_address": "بغداد - الكرادة",
  "customer_city": "بغداد",
  "items": [
    {
      "product_name": "فير اند لفلي",
      "quantity": 2
    },
    {
      "product_name": "لوشن مرطب",
      "quantity": 1
    }
  ],
  "total_amount": 75000,
  "order_code": "ORD789ABC",
  "main_store_name": "Cosmetik Store"
}
```

### Response on Success

```javascript
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_name": "محمد أحمد",
    "order_status": "pending",
    "order_code": "ORD789ABC"
    // ... other order fields
  }
}
```

### Response on Error

```javascript
{
  "success": false,
  "message": "Error message in Arabic",
  "error": "ERROR_CODE"
}
```

---

## 2️⃣ Cancel Order Notification

### Endpoint
```
POST /functions/v1/telegram_notifications
```

### When It's Called
Triggered when user clicks "Cancel Order" button in `OrderTrackingPage.jsx`

### Required Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | ✅ | Must be `"cancel_order"` |
| `order_id` | string | ✅ | **UUID format only** (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx) |
| `cancellation_reason` | string | ✅ | Reason for cancellation |

### Request Body Example

```javascript
{
  "action": "cancel_order",
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "cancellation_reason": "العميل غير مهتم بالمنتج"
}
```

### Response on Success

```javascript
{
  "success": true,
  "message": "Order cancelled successfully",
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "order_status": "cancelled",
    "customer_rejected": true,
    "return_reason": "العميل غير مهتم بالمنتج"
  }
}
```

### Response on Error

#### 400 - Bad Request
```javascript
{
  "success": false,
  "message": "البيانات المرسلة غير صحيحة",
  "error": "INVALID_REQUEST_DATA"
}
```

#### 403 - Cancellation Window Expired
```javascript
{
  "success": false,
  "message": "انتهت مهلة إلغاء الطلب (6 ساعات من الإنشاء)",
  "error": "CANCELLATION_WINDOW_EXPIRED"
}
```

#### 404 - Order Not Found
```javascript
{
  "success": false,
  "message": "الطلب غير موجود",
  "error": "ORDER_NOT_FOUND"
}
```

#### 409 - Invalid Order Status
```javascript
{
  "success": false,
  "message": "لا يمكن إلغاء طلب في حالة: shipped",
  "error": "INVALID_ORDER_STATUS"
}
```

---

## 3️⃣ Frontend Service Usage

### Telegram Notification Service

Location: `src/lib/telegramNotificationService.js`

#### 3.1 Send Order Creation Notification

```javascript
import { sendOrderCreationNotification } from '@/lib/telegramNotificationService';

const result = await sendOrderCreationNotification({
  customer_name: "محمد أحمد",
  customer_phone: "07803693942",
  customer_address: "بغداد - الكرادة",
  customer_city: "بغداد",
  items: [
    { product_name: "فير اند لفلي", quantity: 2 }
  ],
  total_amount: 75000,
  order_code: "ORD789ABC",
  main_store_name: "Cosmetik Store"
});

// Result handling
if (result.success) {
  console.log('✅ Notification sent');
} else {
  console.warn('⚠️ Notification failed:', result.message);
}
```

#### 3.2 Send Order Cancellation Notification

```javascript
import { sendOrderCancellationNotification } from '@/lib/telegramNotificationService';

const result = await sendOrderCancellationNotification({
  orderId: "550e8400-e29b-41d4-a716-446655440000",
  cancellationReason: "العميل غير مهتم بالمنتج"
});

if (result.success) {
  console.log('✅ Order cancelled');
  // Show success to user
} else {
  console.error('❌ Cancellation failed:', result.message);
  // Show error to user
}
```

---

## 4️⃣ Important Notes for Frontend Developers

### ✅ DO's

- ✅ **Always validate UUID format** before sending cancel requests
  ```javascript
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(orderId)) throw new Error('Invalid UUID');
  ```

- ✅ **Always send complete JSON** with all required fields
  - Missing fields result in 400 Bad Request

- ✅ **Handle non-blocking failures** in order creation
  - Telegram notification failure should NOT block the order
  - Always use `.catch()` to prevent unhandled rejections

- ✅ **Log request/response data** for debugging
  ```javascript
  console.log('Request body:', requestBody);
  console.log('Response:', result);
  ```

- ✅ **Use Arabic error messages** in toast notifications for users

### ❌ DON'Ts

- ❌ **DO NOT** use the order_code as order_id when cancelling
  - Order cancellation REQUIRES the UUID `id`, not `order_code`
  - Example WRONG: `order_id: "ORD789ABC"` 
  - Example RIGHT: `order_id: "550e8400-e29b-41d4-a716-446655440000"`

- ❌ **DO NOT** mix up field names
  - Use `customer_name` (not `name`)
  - Use `customer_phone` (not `phone`)
  - Use `customer_address` (not `address`)

- ❌ **DO NOT** send objects in items array
  - Items must have exactly `product_name` and `quantity`
  - Additional fields are ignored

- ❌ **DO NOT** send notifications synchronously
  - Always use async/await or promises
  - Never block user actions for notifications

### ⚙️ Configuration in Supabase

Make sure your Edge Function has these environment variables:

| Variable | Where | Purpose |
|----------|-------|---------|
| `SUPABASE_URL` | Supabase Project Settings | Database connection |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings | Database write access |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Settings | Send messages via Telegram |
| `TELEGRAM_CHAT_ID` | Your Chat ID | Destination chat (can be comma-separated for multiple chats) |

---

## 5️⃣ Implementation Checklist

- [ ] Import the Telegram service in your component/page
- [ ] Extract order data (customer info, items, amounts)
- [ ] Map items to required format: `{ product_name, quantity }`
- [ ] Call appropriate function (create/cancel)
- [ ] Handle success response
- [ ] Handle error response
- [ ] Show user-friendly messages in Arabic
- [ ] Test with valid and invalid data
- [ ] Check Supabase Edge Function logs for errors
- [ ] Verify Telegram messages are received

---

## 6️⃣ Debugging Tips

### If Notification Not Received

1. **Check Edge Function Logs**
   - Go to Supabase Project → Functions → telegram_notifications → Logs
   - Look for error messages

2. **Check Request Format**
   - Open Browser DevTools → Console
   - Look for "Request body:" log entries
   - Verify all required fields are present and valid

3. **Verify Environment Variables**
   - Go to Supabase Edge Function Settings
   - Confirm all 4 variables are set:
     - `SUPABASE_URL` ✓
     - `SUPABASE_SERVICE_ROLE_KEY` ✓
     - `TELEGRAM_BOT_TOKEN` ✓
     - `TELEGRAM_CHAT_ID` ✓

4. **Test Telegram Bot Token**
   - Copy the bot token from env variables
   - Replace `YOUR_BOT_TOKEN` in URL below
   - Visit: `https://api.telegram.org/botYOUR_BOT_TOKEN/getMe`
   - Should return bot info (status: 200)

5. **Common Errors**

| Error | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | Missing or invalid fields | Check all required fields in request |
| 403 Cancellation Window Expired | Order too old (>6 hours) | Show user they can't cancel after 6 hours |
| 404 Order Not Found | Order UUID incorrect | Verify order_id is the actual UUID |
| 409 Invalid Order Status | Order already cancelled/shipped | Check order status before allowing cancel |

---

## 7️⃣ Real-World Example Integration

### Example 1: Order Creation in Checkout

```javascript
// After order is successfully created
try {
  const result = await sendOrderCreationNotification({
    customer_name: customerData.name,
    customer_phone: customerData.phone,
    customer_address: customerData.address,
    customer_city: customerData.city,
    items: cartItems.map(item => ({
      product_name: item.name,
      quantity: item.quantity,
    })),
    total_amount: totalAmount,
    order_code: orderCode,
    main_store_name: storeName,
  });

  if (result.success) {
    console.log('✅ Telegram notification sent');
  } else {
    // Non-blocking - notification failed but order succeeded
    console.warn('⚠️ Notification failed (order still created):', result.message);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### Example 2: Order Cancellation in Order Tracking

```javascript
const handleCancelOrder = async () => {
  try {
    const result = await sendOrderCancellationNotification({
      orderId: order.id,  // Must be UUID!
      cancellationReason: userNotes || 'Customer requested cancellation',
    });

    if (result.success) {
      toast({
        title: 'تم الإلغاء بنجاح',
        description: result.message,
      });
      // Refresh order data
      refreshOrderData();
    } else {
      toast({
        title: 'فشل الإلغاء',
        description: result.message,
        variant: 'destructive',
      });
    }
  } catch (error) {
    console.error('Cancellation error:', error);
  }
};
```

---

## 📚 Related Files

- **Service**: `src/lib/telegramNotificationService.js`
- **Checkout Integration**: `src/pages/CheckoutPage.jsx`
- **Order Tracking**: `src/pages/OrderTrackingPage.jsx`
- **Order Tracking Service**: `src/lib/orderTrackingService.js`
- **Edge Function**: `supabase/functions/telegram_notifications/index.ts`

---

## 🚀 Deployment Notes

Before deploying to production:

1. Ensure all environment variables are set in Supabase
2. Test the Telegram bot token manually
3. Test with a real order in the staging environment
4. Verify messages are received in the correct Telegram chat
5. Check Edge Function logs for any errors
6. Deploy and monitor for 24 hours

---

