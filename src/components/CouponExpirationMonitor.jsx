import { useEffect } from 'react';
import { useCouponExpirationTracking } from '@/hooks/useCouponExpirationTracking';

/**
 * Global component that monitors coupon expiration and syncs with backend
 * Should be placed near the root of the app to track all coupon expiration events
 */
const CouponExpirationMonitor = () => {
  const { activeCouponCount } = useCouponExpirationTracking();

  // This component is primarily for side effects (monitoring)
  // It doesn't render anything visible
  useEffect(() => {
    // Optional: Log active coupons count for debugging
    if (activeCouponCount > 0) {
      console.log(`[Coupon Monitor] Active coupons: ${activeCouponCount}`);
    }
  }, [activeCouponCount]);

  return null;
};

export default CouponExpirationMonitor;
