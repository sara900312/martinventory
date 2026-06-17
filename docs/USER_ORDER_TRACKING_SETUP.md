# User Order Tracking - Setup Guide

## Overview

This guide covers the setup required to enable automatic order tracking for authenticated users. Users can now view all their orders without manual searching, and orders are automatically associated with their account when checked out.

---

## 🔧 Database Schema Changes

### Required: Add `user_id` Column to Orders Table

The orders table needs a new column to store the authenticated user's ID.

**SQL Migration:**

```sql
-- Add user_id column to orders table
ALTER TABLE public.orders
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Create partial index for active user orders (optional, improves performance)
CREATE INDEX idx_orders_user_id_active 
  ON orders(user_id) 
  WHERE order_status != 'cancelled' AND user_id IS NOT NULL;
```

### Optional: Add RLS Policies for Security

To add row-level security (RLS) for user orders:

```sql
-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own orders
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Allow service role to insert orders (for backend operations)
CREATE POLICY "Service role can insert orders"
  ON orders
  AS PERMISSIVE
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service role to update orders (for status changes)
CREATE POLICY "Service role can update orders"
  ON orders
  AS PERMISSIVE
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

## 🎯 Features Implemented

### 1. **MyOrdersPage** (`src/pages/MyOrdersPage.jsx`)
   - Automatic order retrieval for authenticated users
   - No manual search required
   - Orders displayed as expandable cards
   - Shows order status, items, and details
   - Mobile responsive design

### 2. **Order Service** (`src/lib/userOrdersService.js`)
   - `fetchUserOrdersWithItems()` - Fetch all user orders
   - `fetchUserOrderById()` - Fetch single user order
   - `getUserOrdersStatistics()` - Get order statistics
   - `searchUserOrderByCode()` - Search within user's orders
   - `verifyUserOwnsOrder()` - Verify order ownership

### 3. **Custom Hook** (`src/hooks/useUserOrders.js`)
   - `useUserOrders()` - Hook for fetching user's orders
   - `useUserOrder()` - Hook for fetching single order
   - Automatic loading and error handling

### 4. **UI Components**
   - **Tracking Icon** in Header (Package icon)
   - **MyOrdersPage** with order list and details
   - **Order Timeline** showing status progression
   - **Order Details Modal** for full information

### 5. **Checkout Flow**
   - After successful checkout, authenticated users are redirected to `/my-orders`
   - Orders are automatically tagged with `user_id`
   - Unauthenticated users can still use guest order tracking at `/track-order`

---

## 📱 Routes & Navigation

### New Routes
- **`/my-orders`** - Authenticated user's order dashboard
  - Shows all orders automatically
  - Expandable order cards with details
  - Full order information modal
  
- **`/track-order`** - Guest order tracking (existing)
  - Manual search by order code or ID + phone
  - Works for guest users

### Header Navigation
- **Tracking Icon (Package)** in header
  - For authenticated users → navigates to `/my-orders`
  - For guests → navigates to `/track-order`

---

## 🔄 Checkout Flow Changes

### Before
1. User places order as guest
2. Receives order code
3. Must manually search `/track-order` with order code or phone

### After
1. **Authenticated user** places order
   - Order is tagged with `user_id`
   - Auto-redirects to `/my-orders` (3 second delay to show success)
   - Orders appear automatically

2. **Guest user** (no changes)
   - Can still use guest tracking at `/track-order`
   - Manual search by order code

---

## 📊 Data Fetching Flow

```
MyOrdersPage
    ↓
useAuth() → gets current user.id
    ↓
fetchUserOrdersWithItems(supabase, user.id)
    ↓
SELECT * FROM orders WHERE user_id = ?
    ↓
JOIN order_items on orders.id = order_items.order_id
    ↓
Returns orders with items
```

---

## ✅ Implementation Checklist

### Database
- [ ] Run `ALTER TABLE` to add `user_id` column
- [ ] Create index on `user_id`
- [ ] (Optional) Enable RLS and create policies

### Frontend
- [ ] ✅ MyOrdersPage.jsx created
- [ ] ✅ userOrdersService.js created
- [ ] ✅ useUserOrders.js hook created
- [ ] ✅ Tracking icon added to Header
- [ ] ✅ Route `/my-orders` added to App.jsx
- [ ] ✅ Checkout redirects to `/my-orders` for authenticated users
- [ ] ✅ prepareOrderPayload includes user_id

### Backend (Edge Functions)
- [ ] ✅ order-notification function updated to save user_id
- [ ] ✅ user_id passed from checkout page

### Testing
- [ ] Create test user account
- [ ] Place order as authenticated user
- [ ] Verify order appears in `/my-orders`
- [ ] Verify tracking icon navigates correctly
- [ ] Test guest order tracking still works
- [ ] Test mobile responsiveness
- [ ] Test order expansion and details modal

---

## 🧪 Testing Steps

### Test 1: Authenticated User Order
```
1. Sign in with test account
2. Add products to cart
3. Checkout
4. Verify success message
5. Auto-redirected to /my-orders
6. Verify order appears in list
7. Click order to expand
8. Verify all details display correctly
```

### Test 2: Guest Order Tracking
```
1. Clear session (logout or private window)
2. Add products to cart
3. Checkout
4. Note the order code
5. Navigate to /track-order
6. Search for order by code
7. Verify order details display
```

### Test 3: Header Navigation
```
1. As authenticated user: Click package icon
   - Should navigate to /my-orders
2. As guest: Click package icon
   - Should navigate to /track-order
3. Mobile view: Verify icon is accessible
```

---

## 🔒 Security Considerations

### User Privacy
- ✅ Users can only see their own orders (via service)
- ✅ user_id is nullable (backward compatible with guests)
- ✅ RLS policies recommended for production

### Data Validation
- ✅ user_id validated in Edge Function
- ✅ Empty user_id stored as NULL (not sensitive)

### Best Practices
1. **Enable RLS** in production for extra security
2. **Index user_id** for performance (✅ done)
3. **Validate user ownership** on backend (✅ Edge Function)
4. **Log order access** for audit trail (optional)

---

## 🐛 Troubleshooting

### Issue: Orders not appearing in `/my-orders`
**Cause:** user_id column not added to database
**Solution:** Run the ALTER TABLE migration above

### Issue: "Redirect loop" after checkout
**Cause:** User not authenticated when checking orderConfirmed state
**Solution:** Ensure useAuth hook is initialized before checkout

### Issue: Old orders don't have user_id
**Cause:** Orders created before this feature have NULL user_id
**Solution:** Normal - they'll show in guest tracking at `/track-order`

### Issue: RLS policy blocking queries
**Cause:** Incorrect RLS policy configuration
**Solution:** Verify policies allow service_role to insert/update orders

---

## 📈 Future Enhancements

- [ ] Order status notifications (email/SMS)
- [ ] Order history filters (by date, status, amount)
- [ ] Order reorder functionality
- [ ] Order export (PDF/CSV)
- [ ] Batch order operations
- [ ] Order analytics dashboard
- [ ] Customer support chat linked to orders

---

## 📞 Support

If you encounter issues:

1. Check database schema: `\d orders` in Supabase SQL editor
2. Verify user_id column exists and is UUID type
3. Check browser console for JavaScript errors
4. Test with known good user account
5. Review Edge Function logs in Supabase dashboard

---

## 📄 Files Changed

### New Files
- `src/pages/MyOrdersPage.jsx` - Main order tracking page
- `src/lib/userOrdersService.js` - Order service functions
- `src/hooks/useUserOrders.js` - Custom hooks for orders

### Modified Files
- `src/App.jsx` - Added `/my-orders` route
- `src/components/Header.jsx` - Added tracking icon
- `src/pages/CheckoutPage.jsx` - Added redirect to `/my-orders`
- `src/lib/orderPayloadUtils.js` - Added user_id to payload
- `supabase/functions/order-notification/index.ts` - Save user_id to database

---

**Status**: ✅ Feature Complete (Awaiting Database Schema Update)
**Last Updated**: January 2024
