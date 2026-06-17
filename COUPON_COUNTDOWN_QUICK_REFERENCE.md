# Coupon Countdown System - Quick Reference Guide

## 🎯 Quick Overview

The coupon countdown system displays a real-time MM:SS timer badge on the shopping cart icon for the first active coupon applied to products in the cart. When that coupon expires, the next coupon automatically becomes the primary one being tracked.

## 📍 Where Things Are

| Component | Location | Purpose |
|-----------|----------|---------|
| Badge Display | Header cart icon | Shows MM:SS countdown |
| Details Popup | Modal on screen | Detailed coupon information |
| Countdown Logic | useActiveCoupons hook | Manages timers |
| Expiration Handler | useCouponExpirationTracking hook | Backend sync |
| Backend API | couponExpirationService | Supabase integration |
| Global Monitor | CouponExpirationMonitor | App-level tracking |

## 🚀 Using the Hooks

### Get All Active Coupons
```javascript
import { useActiveCoupons } from '@/hooks/useActiveCoupons';

function MyComponent() {
  const { 
    activeCoupons,           // Array of active coupons
    firstActiveCoupon,       // Current coupon in countdown
    firstCouponTimeRemaining // Remaining time in milliseconds
  } = useActiveCoupons();

  return (
    <div>
      {activeCoupons.length} coupons active
    </div>
  );
}
```

### Format Time Display
```javascript
import { useActiveCoupons } from '@/hooks/useActiveCoupons';

function MyComponent() {
  const { getFirstCouponFormattedTime } = useActiveCoupons();
  
  return <span>{getFirstCouponFormattedTime()}</span>; // Shows "04:32"
}
```

### Track Expiration Events
```javascript
import { useCouponExpirationTracking } from '@/hooks/useCouponExpirationTracking';

function MyComponent() {
  const { 
    handleCouponExpiration,  // Called automatically on expiration
    expireCoupon,            // Manual expiration
    expireAllCoupons,        // Expire all active coupons
    activeCouponCount        // Current count
  } = useCouponExpirationTracking();

  // Manually expire a specific coupon
  const handleExpire = () => {
    expireCoupon(couponId, productId);
  };

  return <button onClick={handleExpire}>Expire Coupon</button>;
}
```

## 🎨 Component Integration

### Using CartCouponManager
The component is already integrated in Header.jsx, but here's how to use it elsewhere:

```javascript
import CartCouponManager from '@/components/CartCouponManager';

function MyComponent() {
  return (
    <div className="relative">
      <YourButton />
      <CartCouponManager /> {/* Badge will appear */}
    </div>
  );
}
```

### Adding Global Monitoring
The CouponExpirationMonitor is already in App.jsx, ensuring all expiration events are tracked globally.

## 📦 Data Structures

### Active Coupon Object
```javascript
{
  productId: 123,
  productName: "Laptop Pro",
  couponCode: "SAVE15",
  couponId: 456,
  discountType: "percentage",      // or "fixed"
  discountValue: 15,                // percentage value or amount
  appliedAt: 1702500000000,         // timestamp when applied
  expiresAt: 1702500300000,         // timestamp when expires
  timeRemaining: 125000,             // milliseconds remaining
  productImage: "https://..."       // product image URL
}
```

### Formatted Time
```javascript
getFirstCouponFormattedTime()  // Returns "04:32" (MM:SS)
```

## 🔄 Event Flow

### When Coupon is Applied
1. User enters coupon code on product page
2. CouponInput validates and applies coupon
3. Coupon saved to localStorage via `saveCouponToStorage()`
4. useActiveCoupons detects and loads it
5. CartCouponManager displays badge

### When Coupon Expires
1. Countdown reaches zero
2. useActiveCoupons detects expiration
3. useCouponExpirationTracking triggers
4. `markCouponAsExpired()` updates backend
5. localStorage is cleared
6. If next coupon exists, it becomes primary
7. Badge updates automatically

## 🛠️ Common Tasks

### Check if Coupons are Active
```javascript
const { activeCoupons } = useActiveCoupons();

if (activeCoupons.length > 0) {
  console.log(`${activeCoupons.length} coupons active`);
}
```

### Get Remaining Time in Seconds
```javascript
const { firstCouponTimeRemaining } = useActiveCoupons();
const seconds = Math.ceil(firstCouponTimeRemaining / 1000);
```

### Manually Trigger Expiration
```javascript
const { expireAllCoupons } = useCouponExpirationTracking();

// Expire all active coupons
await expireAllCoupons();
```

### Check if Multiple Coupons
```javascript
const { hasMultipleCoupons } = useActiveCoupons();

if (hasMultipleCoupons()) {
  // Show "more coupons available" message
}
```

### Get Coupon Count
```javascript
const { getActiveCouponCount } = useActiveCoupons();
const count = getActiveCouponCount();
```

## 🎯 Customization Points

### Change Badge Position
In `CartCouponManager.css`:
```css
.coupon-countdown-badge {
  top: -8px;    /* Move vertically */
  right: -8px;  /* Move horizontally */
}
```

### Change Badge Colors
In `CartCouponManager.css`:
```css
.coupon-countdown-badge {
  background: linear-gradient(135deg, #FF2F92 0%, #FF6BA6 100%);
  /* Change these hex values */
}

.coupon-countdown-badge--warning {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
  /* Warning state color */
}
```

### Change Expiration Time
In `couponPersistence.js`:
```javascript
const EXPIRATION_TIME_MS = 5 * 60 * 1000; // 5 minutes
// Change to:
const EXPIRATION_TIME_MS = 10 * 60 * 1000; // 10 minutes
```

### Change Toast Duration
In `CartCouponManager.jsx`:
```javascript
toast({
  // ... other props
  duration: 8000,  // milliseconds
});
```

## 🐛 Debugging

### Check Active Coupons
```javascript
// In browser console
localStorage.getItem('neomart-coupons-{productId}')
```

### Monitor Hook Output
```javascript
const { firstActiveCoupon, firstCouponTimeRemaining } = useActiveCoupons();
console.log('Current coupon:', firstActiveCoupon);
console.log('Time remaining (ms):', firstCouponTimeRemaining);
```

### Check Backend Updates
Look in Supabase:
1. Go to coupon_usage table
2. Filter by status = 'expired'
3. Check expired_at timestamp

### Enable Debug Logging
The components already log key events. Check browser console for:
- "🎁 كوبون نشط" (Active coupon toast)
- "[Coupon Monitor]" (Global monitor logs)
- Backend update confirmations

## 🔐 Security Notes

1. **Always validate coupons server-side** - Never trust client-side validation
2. **User IDs are optional** - Works for anonymous users too
3. **localStorage is per-domain** - Only accessible by same site
4. **Backend sync is async** - Doesn't block UI operations
5. **No sensitive data stored** - Only codes and IDs

## ⚡ Performance Tips

1. **useActiveCoupons is optimized** - Only updates when cart changes
2. **Interval runs every 1 second** - Efficient for real-time display
3. **Backend calls are async** - Non-blocking operations
4. **CSS animations use GPU** - Smooth 60fps performance
5. **No memory leaks** - Proper cleanup on unmount

## 📱 Responsive Behavior

| Device | Badge Size | Popup Width | Touch Target |
|--------|-----------|-------------|--------------|
| Desktop | Normal | 400px max | 32px |
| Tablet | Normal | 90% width | 44px |
| Mobile | Compact | 95% width | 48px |

## 🆘 Troubleshooting

### Badge not showing
1. Check if cart has coupons applied
2. Open DevTools → Application → localStorage
3. Look for `neomart-coupons-{productId}` keys
4. Verify `CartCouponManager` is in Header.jsx

### Countdown not updating
1. Open DevTools → Console
2. Look for "Coupon Monitor" logs
3. Check if countdown reaches 0
4. Verify `useActiveCoupons` is initialized

### Backend not updating
1. Open Supabase console
2. Check if `coupon_usage` table exists
3. Verify user has insert permissions
4. Check network tab for API calls

### Multiple coupons not working
1. Apply coupons to different products
2. Verify each has unique coupon code
3. Check localStorage for multiple entries
4. Look for sorting by `savedAt` timestamp

## 📚 Related Files

- `src/components/CartCouponManager.jsx` - Badge component
- `src/components/CartCouponManager.css` - Styling
- `src/hooks/useActiveCoupons.js` - Main hook
- `src/hooks/useCouponExpirationTracking.js` - Expiration tracking
- `src/lib/couponExpirationService.js` - Backend API
- `src/lib/couponPersistence.js` - localStorage management
- `src/components/CouponInput.jsx` - Coupon application
- `src/components/Header.jsx` - Header integration

## 🎓 Learning Resources

1. Start with `CartCouponManager.jsx` - Understand the UI
2. Read `useActiveCoupons.js` - Understand the logic
3. Check `couponPersistence.js` - Understand storage
4. Review `couponExpirationService.js` - Understand backend sync
5. See `COUPON_COUNTDOWN_SYSTEM.md` - Complete documentation

## 💡 Tips & Tricks

1. **Test with 1-minute timer** - Change EXPIRATION_TIME_MS for faster testing
2. **Use browser DevTools** - Check localStorage and network tabs
3. **Monitor console** - All major events are logged
4. **Check Supabase** - See coupon_usage table updates
5. **Mobile testing** - Use DevTools device emulation for responsive testing

## 🚀 Next Steps

1. **Customize colors** - Change badge colors in CSS
2. **Add sounds** - Play sound on expiration
3. **Add notifications** - Show push notifications
4. **Track analytics** - Monitor coupon usage patterns
5. **Implement gifting** - Share coupons with others

---

**Last Updated:** December 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
