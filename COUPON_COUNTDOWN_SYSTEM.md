# Coupon Countdown Timer System Implementation

## Overview

This document describes the complete implementation of the coupon countdown timer system for the shopping cart. The system displays an active countdown badge on the cart icon, automatically progresses to the next coupon when the first one expires, and syncs with the backend to mark coupons as consumed.

## Architecture

### Core Components

#### 1. **CartCouponManager** (`src/components/CartCouponManager.jsx`)
- Displays a countdown badge on the cart icon showing MM:SS format
- Shows a detailed popup with coupon information when clicked
- Includes a toast notification with coupon details
- Automatically updates as time remaining changes
- Visual warning when coupon is about to expire (< 1 minute)

**Features:**
- Badge displays the first active coupon's remaining time
- Click to view full coupon details (product name, code, discount, time left)
- Shows count of additional coupons in cart
- Responsive design for mobile and desktop

#### 2. **useActiveCoupons Hook** (`src/hooks/useActiveCoupons.js`)
- Manages all active coupons from cart items
- Tracks the first active coupon (sorted by application time)
- Handles countdown timer updates
- Provides formatted time display
- Auto-progresses to next coupon when first one expires

**Exports:**
- `activeCoupons`: Array of all active coupons
- `firstActiveCoupon`: The first applied active coupon
- `firstCouponTimeRemaining`: Remaining time in milliseconds
- `isFirstCouponExpired`: Boolean flag when coupon expires
- `getFirstCouponFormattedTime()`: Returns MM:SS format
- `getActiveCouponCount()`: Total count of active coupons
- `hasMultipleCoupons()`: Boolean check for multiple coupons
- `reloadCoupons()`: Manual reload function

#### 3. **useCouponExpirationTracking Hook** (`src/hooks/useCouponExpirationTracking.js`)
- Monitors coupon expiration events
- Syncs with backend when coupons expire
- Provides manual expiration functions
- Cleans up localStorage on expiration

**Exports:**
- `handleCouponExpiration()`: Called automatically on expiration
- `expireCoupon(couponId, productId)`: Manually expire a coupon
- `expireAllCoupons()`: Expire all active coupons
- `activeCouponCount`: Current count of active coupons

#### 4. **CouponExpirationMonitor** (`src/components/CouponExpirationMonitor.jsx`)
- Global component for monitoring coupon expiration
- Triggers backend updates automatically
- Should be placed near app root

#### 5. **couponExpirationService** (`src/lib/couponExpirationService.js`)
- Backend API integration functions
- Marks coupons as consumed/expired in database
- Records coupon usage statistics
- Handles coupon status queries

**Key Functions:**
- `markCouponAsExpired(couponId, productId, userId, supabase)`
- `markMultipleCouponsAsExpired(expiredCoupons, supabase)`
- `getCouponExpirationStatus(couponId, supabase)`
- `isCouponConsumed(couponId, supabase)`
- `recordCouponUsage(couponId, productId, userId, supabase)`
- `getExpiredCouponsForProduct(productId, supabase)`

## Data Flow

### 1. Coupon Application Flow
```
CouponInput.jsx (applies coupon)
  ↓
saveCouponToStorage() → localStorage
  ↓
useActiveCoupons → loads from localStorage
  ↓
CartCouponManager → displays countdown badge
  ↓
CouponExpirationMonitor → listens for expiration
```

### 2. Coupon Expiration Flow
```
useActiveCoupons (countdown timer)
  ↓
Countdown reaches 0
  ↓
isFirstCouponExpired = true
  ↓
useCouponExpirationTracking
  ↓
markCouponAsExpired() → backend update
  ↓
removeCouponFromStorage()
  ↓
reloadCoupons() → shows next coupon
  ↓
CartCouponManager updates badge
```

## Storage Structure

### localStorage Keys
```
neomart-coupons-{productId}
├── code: "ABC1234"
├── couponId: 123
├── discountType: "percentage" | "fixed"
├── discountValue: 15 | 50000
├── productId: 456
├── savedAt: timestamp
├── expiresAt: timestamp (savedAt + 5 minutes)
```

## Integration Points

### Header.jsx
The cart icon now includes the CartCouponManager badge:
```jsx
<div className="relative">
  <Button onClick={() => setCartOpen(true)}>
    <ShoppingCart />
  </Button>
  <CartCouponManager />
</div>
```

### App.jsx
CouponExpirationMonitor is added to monitor all coupon expiration events:
```jsx
<CartProvider>
  <Router>
    <GlobalCouponNotification />
    <CouponExpirationMonitor />
    {/* routes */}
  </Router>
</CartProvider>
```

## Backend Requirements

### Expected Database Tables

The system expects these tables in Supabase:

#### 1. coupon_usage
```sql
- id (primary)
- coupon_id (foreign key)
- product_id
- user_id (nullable)
- used_at (timestamp)
- status ('pending' | 'expired' | 'consumed')
- expired_at (timestamp, nullable)
```

#### 2. coupon_expiration_log (optional)
```sql
- id (primary)
- coupon_id (foreign key)
- product_id
- user_id (nullable)
- expired_at (timestamp)
- status ('expired')
```

### RPC Functions
The system uses the existing `validate_coupon` RPC function for coupon validation.

## Behavior Details

### Countdown Display
- Format: MM:SS (e.g., 04:32 for 4 minutes 32 seconds)
- Updates every 1 second
- Color changes to red when less than 1 minute remaining
- Pulsing animation when warning state

### Auto-Progression
When the first coupon expires:
1. useActiveCoupons detects expiration
2. useCouponExpirationTracking is triggered
3. Backend is updated via markCouponAsExpired()
4. localStorage is cleaned via removeCouponFromStorage()
5. reloadCoupons() refreshes the list
6. If another coupon exists, it becomes the new "first coupon"
7. Badge updates to show new countdown

### Multiple Coupons Handling
- Only the first applied coupon shows in the countdown badge
- Clicking the badge shows "X more coupons in cart"
- Each coupon has its own 5-minute timer
- Timers are independent per product
- When one expires, the next one automatically takes its place

### Toast Notifications
When the badge is clicked, shows:
- Product name
- Coupon code (monospace font)
- Discount type and value
- Time remaining
- Count of additional coupons (if multiple)
- Auto-closes after 8 seconds

## User Experience

### Desktop
- Badge appears in top-right corner of cart icon
- Hover effect scales badge slightly
- Click shows detailed popup centered on screen
- Popup dismissible by clicking backdrop or close button

### Mobile
- Badge is compact and responsive
- Popup adapts to smaller screens
- Full width popup with touch-friendly buttons
- Scrollable content if needed

## Error Handling

The system gracefully handles:
- Missing supabase client
- Database connection failures
- Malformed localStorage data
- Missing coupon records
- Invalid coupon IDs

All errors are logged to console but don't break the UI.

## Performance Considerations

- useActiveCoupons updates on cart changes (not on every keystroke)
- Countdown timer uses efficient interval (1 second)
- Backend calls are async and non-blocking
- localStorage operations are synchronous and fast
- No unnecessary re-renders with proper dependencies

## Customization

### Change Expiration Duration
In `couponPersistence.js`:
```js
const EXPIRATION_TIME_MS = 5 * 60 * 1000; // Change this value
```

### Change Badge Position
In `CartCouponManager.css`:
```css
.coupon-countdown-badge {
  top: -8px;  /* Change vertical position */
  right: -8px; /* Change horizontal position */
}
```

### Change Colors
Update the CSS variables in `CartCouponManager.css`:
```css
background: linear-gradient(135deg, #FF2F92 0%, #FF6BA6 100%);
/* Change these hex values */
```

## Testing

To test the system:

1. **Apply a Coupon**
   - Navigate to product detail page
   - Enter a valid coupon code
   - See countdown badge appear on cart icon

2. **View Coupon Details**
   - Click the countdown badge
   - Verify popup shows correct information
   - Check toast notification appears

3. **Multiple Coupons**
   - Add multiple products with different coupons
   - Verify each has its own timer
   - Verify only first shows in badge

4. **Expiration**
   - Wait for coupon to expire (5 minutes)
   - Verify badge disappears
   - Verify next coupon appears (if exists)
   - Verify backend is updated

5. **Page Reload**
   - Apply a coupon
   - Reload the page
   - Verify countdown continues from correct time
   - Verify badge reappears

## Troubleshooting

### Badge not showing
- Check if cart has items with applied coupons
- Verify localStorage has the coupon data
- Check browser console for errors
- Verify CartCouponManager is imported in Header

### Countdown not updating
- Check if useActiveCoupons hook is mounted
- Verify interval timer is running (check console)
- Check browser DevTools Network tab for errors

### Backend not updating
- Verify supabase client is initialized
- Check Supabase console for table existence
- Verify coupon_id and product_id are correct
- Check RPC functions are available

### Multiple coupons not working
- Verify each product has unique coupon code
- Check localStorage has multiple entries
- Verify getCouponFromStorage() returns correct data
- Check useActiveCoupons sorting logic

## Files Created/Modified

### New Files
- `src/hooks/useActiveCoupons.js`
- `src/hooks/useCouponExpirationTracking.js`
- `src/components/CartCouponManager.jsx`
- `src/components/CartCouponManager.css`
- `src/components/CouponExpirationMonitor.jsx`
- `src/lib/couponExpirationService.js`

### Modified Files
- `src/components/Header.jsx` (added CartCouponManager import and integration)
- `src/App.jsx` (added CouponExpirationMonitor)

## Future Enhancements

1. **Sound Notifications** - Play sound when coupon is about to expire
2. **Push Notifications** - Notify user when coupon expires
3. **Bulk Coupon Management** - Handle more complex coupon stacking
4. **Analytics Dashboard** - Track coupon usage patterns
5. **Coupon Scheduling** - Queue coupons for automatic application
6. **Coupon Gifting** - Share coupon codes with other users

## Support

For issues or questions, refer to:
- Coupon validation: `src/lib/couponService.js`
- Persistence logic: `src/lib/couponPersistence.js`
- Coupon input component: `src/components/CouponInput.jsx`
