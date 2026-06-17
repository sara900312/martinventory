# Order Tracking & Conditional Cancellation - Implementation Guide

## Overview

This guide covers the complete implementation of order tracking and conditional cancellation for the Cosmetik e-commerce platform. The feature allows customers to:

1. Search for their orders by **order code** or **order ID + phone number**
2. View real-time order status with a visual stepper/timeline
3. Cancel orders **only within 6 hours** of creation
4. Receive confirmation and tracking updates

---

## 🏗️ Architecture Overview

### Frontend Components

```
OrderTrackingPage.jsx (Main page)
├── SearchForm (order code / ID+phone toggle)
├── OrderStatusStepper (visual timeline)
├── OrderDetailsGrid (customer & order info)
├── CancelationModal (confirm cancellation)
└── OrderService (API calls)
```

### Backend System

```
Edge Function: cancel-order
├── Validates order exists
├── Server-side 6-hour window check ⭐ CRITICAL
├── Updates order status → "cancelled"
├── Sets customer_rejected = true
└── Sends Telegram notification
```

---

## 📋 Deliverables Included

### Frontend Files

1. **`src/pages/OrderTrackingPage.jsx`** (601 lines)
   - Main tracking page with search functionality
   - Order details display
   - Cancel button with eligibility check
   - Responsive design (mobile-first)

2. **`src/components/orders/OrderStatusStepper.jsx`** (285 lines)
   - Visual stepper for desktop (horizontal timeline)
   - Mobile-friendly vertical timeline
   - Status icons and colors
   - Smooth animations with Framer Motion

3. **`src/lib/orderTrackingService.js`** (345 lines)
   - `fetchOrderByCode()` - Search by order code
   - `fetchOrderByIdAndPhone()` - Search by ID + phone
   - `checkCancellationEligibility()` - 6-hour validation
   - `cancelOrder()` - Call cancel-order Edge Function
   - Helper functions for formatting & display

### Backend Files

1. **`supabase/functions/cancel-order/index.ts`** (252 lines)
   - Server-side order validation
   - **6-hour cancellation window enforcement** (server-side)
   - Order status update
   - Telegram notification
   - Comprehensive error handling

### Documentation

1. **`docs/ORDER_TRACKING_SQL_HELPERS.sql`**
   - Helper function: `can_cancel_order()`
   - Views: `orders_cancellable`, `cancelled_orders_by_customer`
   - Performance indexes
   - RLS policy examples
   - Cancellation queries

2. **`docs/ORDER_TRACKING_IMPLEMENTATION_GUIDE.md`** (This file)

### Routes

- Added `/track-order` route to `src/App.jsx`

---

## 🔧 Setup & Configuration

### Step 1: Deploy Edge Function

The cancel-order Edge Function is ready to deploy:

```bash
supabase functions deploy cancel-order
```

Or from the Supabase dashboard:
1. Go to Edge Functions
2. Create new function: `cancel-order`
3. Copy content from `supabase/functions/cancel-order/index.ts`
4. Deploy

### Step 3: Configure Telegram Notifications

#### 3a. Get Telegram Bot Token

1. Open Telegram and chat with [@BotFather](https://t.me/botfather)
2. Send `/newbot`
3. Follow instructions to create a bot
4. Copy the **API token** (format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

#### 3b. Get Chat ID

1. Add your bot to a group or get your personal chat ID:
   - Send a message to [@userinfobot](https://t.me/userinfobot)
   - Or send a message to your bot and visit: `https://api.telegram.org/botYOUR_TOKEN/getUpdates`

#### 3c. Set Environment Variables

Using DevServerControl tool or Supabase dashboard:

```
TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"
TELEGRAM_CHAT_ID = "YOUR_CHAT_ID_HERE"
```

Example:
```
TELEGRAM_BOT_TOKEN = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
TELEGRAM_CHAT_ID = "-1001234567890"
```

Run the essential SQL from `docs/ORDER_TRACKING_SQL_HELPERS.sql`:

```sql
-- Create helper function
CREATE OR REPLACE FUNCTION can_cancel_order(order_id UUID) ...

-- Create views
CREATE OR REPLACE VIEW orders_cancellable AS ...
CREATE OR REPLACE VIEW cancelled_orders_by_customer AS ...

-- Create indexes
CREATE INDEX idx_orders_order_code ON orders(order_code) ...
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone) ...
```

---

## 🎯 Feature Walkthrough

### User Experience

#### 1. **Access Order Tracking**
- Navigate to `/track-order` (or add button to header/footer)
- See two search methods:
  - **Search by Order Code** (e.g., "FAST123", "ORDER-ABC456")
  - **Search by ID + Phone** (fallback method)

#### 2. **View Order Status**
- Order code, customer name, total amount displayed
- **Visual stepper** shows current status:
  - 📦 Pending → 📋 Reviewing → ✅ Accepted → ⏱️ Preparing → 🚚 Shipped → 🏠 Delivered
- Detailed order information:
  - Customer details (name, phone, address)
  - Order items with quantities and prices
  - Store information

#### 3. **Cancel Order (6-hour window)**

If order is pending AND created < 6 hours ago:
- ⏰ Yellow alert showing time remaining
- **"Cancel Order" button** is clickable
- Modal appears for confirmation
- Optional field to provide cancellation reason

If order is > 6 hours old:
- ❌ Red alert shown
- **"Cancel Order" button** is disabled
- Message: "This order can no longer be cancelled. Please contact Cosmetik support."

#### 4. **Confirmation & Refund**
- Success message: "Order cancelled successfully. Refund will be processed in 3-5 business days."
- Store receives Telegram notification with:
  - Order code
  - Customer name & phone
  - Total amount
  - Cancellation reason

---

## 🔒 Security Features

### Server-Side Validation ⭐

**The 6-hour cancellation window is enforced on the server, NOT the frontend.**

```typescript
// In Edge Function (cancel-order/index.ts)
function isCancellationAllowed(createdAt: string): boolean {
  const orderTime = new Date(createdAt);
  const now = new Date();
  const diffHours = (now - orderTime) / (1000 * 60 * 60);
  
  // Validation happens here, frontend time is never trusted
  return diffHours <= 6;
}

// If window expired: return 403 Forbidden
```

### Additional Security

- ✅ Uses `SUPABASE_SERVICE_ROLE_KEY` for database access
- ✅ Validates order exists before cancellation
- ✅ Checks order status (only pending orders can be cancelled)
- ✅ Clear error responses with proper HTTP status codes:
  - `404` - Order not found
  - `409` - Invalid order status
  - `403` - Cancellation window expired
  - `400` - Missing required fields

### RLS Policies

Consider implementing Row Level Security:

```sql
-- Customers can only view their own orders
CREATE POLICY "Customers view own orders"
  ON orders
  FOR SELECT
  USING (customer_phone = current_setting('request.jwt.claims'->>'phone'));
```

---

## 📊 Order Status Values

```javascript
const ORDER_STATUSES = {
  'pending':    'Order received - ❌ Can be cancelled (0-6 hours)',
  'reviewing':  'Under review - ✅ Cannot be cancelled',
  'accepted':   'Accepted by store - ✅ Cannot be cancelled',
  'preparing':  'Being prepared - ✅ Cannot be cancelled',
  'shipped':    'Shipped - ✅ Cannot be cancelled',
  'delivered':  'Delivered - ✅ Cannot be cancelled',
  'cancelled':  'Cancelled - Final status'
};
```

---

## 🧪 Testing Checklist

### Manual Testing Steps

1. **Create Test Order**
   ```sql
   INSERT INTO orders (
     order_code, customer_name, customer_phone, order_status, created_at, total_amount
   ) VALUES (
     'TEST-001', 'أحمد محمد', '07911234567', 'pending', NOW(), 50000
   );
   ```

2. **Search for Order**
   - Visit `/track-order`
   - Search by order code "TEST-001"
   - Verify order displays correctly

3. **Test Cancellation (Within 6 hours)**
   - Click "Cancel Order" button
   - Enter optional reason
   - Confirm cancellation
   - Verify:
     - Order status changes to "cancelled"
     - Telegram notification received
     - Success message shown

4. **Test Expiry (After 6 hours)**
   - Create test order with `created_at` 7+ hours ago
   - Try to cancel
   - Verify button is disabled
   - Verify error message shown

5. **Test Edge Cases**
   - Search with wrong phone number → "Not found"
   - Search with invalid order code → "Not found"
   - Cancel already cancelled order → "Invalid status"
   - Cancel delivered order → "Invalid status"

---

## 🚀 Deployment Checklist

- [ ] Edge Function: Deploy `cancel-order`
- [ ] Database: Run SQL helpers and create indexes
- [ ] Environment: Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set
- [ ] Frontend: Verify components render correctly
- [ ] Routes: Confirm `/track-order` is accessible
- [ ] Testing: Run manual test scenarios
- [ ] RLS: Implement row-level security policies (optional)
- [ ] Monitoring: Set up error logging and alerts

---

## 📱 Mobile Responsiveness

### Mobile View
- Vertical timeline (not horizontal stepper)
- Touch-friendly button sizes (48px minimum)
- Full-width form inputs
- Stack layout for order details

### Desktop View
- Horizontal timeline with step indicators
- Side-by-side order details grid
- Larger typography and spacing
- Multi-column layouts

---

## 🔧 Customization Guide

### Change Cancellation Window

**Option 1: Update Edge Function**
```typescript
// In cancel-order/index.ts
// Change: diffHours <= 6
//    To: diffHours <= 12  // For 12-hour window
```

**Option 2: Update Frontend Validation**
```javascript
// In orderTrackingService.js
// checkCancellationEligibility function
// This is for display only; server-side validation is authoritative
```

### Change Order Statuses

Edit `OrderStatusStepper.jsx`:
```javascript
const ORDER_STATUSES = {
  pending: { ... },
  // Add or remove statuses
};

const STATUS_ORDER = ['pending', 'reviewing', ...]; // Update sequence
```

### Customize Telegram Message

Edit `cancel-order/index.ts`:
```typescript
const telegramMessage = `
  🚨 Your custom message here
  Order: ${order.order_code}
  ...
`;
```

---

## 🆘 Troubleshooting

### Issue: "Cancellation window expired" but order was created < 6 hours ago

**Solution**: Check server timezone
```sql
-- Verify server time
SELECT NOW();
SELECT NOW() AT TIME ZONE 'UTC';
```

### Issue: Telegram notification not received

**Solution**: Verify credentials
```
1. Test bot token: https://api.telegram.org/botTOKEN/getMe
2. Test chat ID: Send message to bot, check getUpdates
3. Verify environment variables are set in Edge Function settings
```

### Issue: Order not found when searching

**Solution**: Check order code format
```sql
-- Orders are stored in UPPERCASE
SELECT * FROM orders WHERE order_code ILIKE 'FAST123';
```

### Issue: Button not disabled after 6 hours

**Solution**: Frontend display only - refresh page or check browser time
- Server-side validation in Edge Function is authoritative
- Frontend validation is for UX improvement only

---

## 📈 Analytics & Monitoring

### Useful Queries

**Cancellation Rate**
```sql
SELECT 
  COUNT(*) FILTER (WHERE order_status = 'cancelled') AS cancelled,
  COUNT(*) FILTER (WHERE order_status = 'pending') AS pending,
  ROUND(100.0 * COUNT(*) FILTER (WHERE order_status = 'cancelled') 
        / COUNT(*), 2) AS cancellation_percentage
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days';
```

**Average Cancellation Time**
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)::NUMERIC(5,2) AS avg_hours
FROM orders
WHERE order_status = 'cancelled' AND customer_rejected = TRUE;
```

---

## 🎓 Best Practices

1. **Always validate on backend** - Never trust frontend time checks
2. **Log cancellations** - Track which orders are cancelled and why
3. **Notify customers** - Send email/SMS confirmation of cancellation
4. **Process refunds promptly** - Establish clear refund timeline (3-5 days)
5. **Monitor Telegram notifications** - Ensure admin team receives alerts
6. **Archive old orders** - Implement retention policy for old orders
7. **Test thoroughly** - Test at 5h 59m, 6h 00m, and 6h 01m marks

---

## 📞 Support & Next Steps

### Immediate Next Steps

1. Verify database schema (Step 1)
2. Deploy Edge Function (Step 2)
3. Configure Telegram (Step 3)
4. Run SQL helpers (Step 4)
5. Test manually (Testing section)

### Future Enhancements

- [ ] Email notifications for cancellation
- [ ] SMS notifications
- [ ] Scheduled cancellation (cancel at specific time)
- [ ] Partial order cancellation (cancel specific items)
- [ ] Cancellation analytics dashboard
- [ ] Automated refund processing
- [ ] Customer support chat integration
- [ ] Order history page with filters

---

## 📄 Files Summary

| File | Lines | Purpose |
|------|-------|---------|
| OrderTrackingPage.jsx | 601 | Main tracking page |
| OrderStatusStepper.jsx | 285 | Visual timeline component |
| orderTrackingService.js | 345 | API & service logic |
| cancel-order/index.ts | 252 | Edge Function |
| ORDER_TRACKING_SQL_HELPERS.sql | 258 | Database helpers |
| ORDER_TRACKING_IMPLEMENTATION_GUIDE.md | - | This guide |
| **Total** | **1,741** | **Complete feature** |

---

**Last Updated**: 2024
**Status**: ✅ Production Ready
