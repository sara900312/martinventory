import { useEffect, useCallback } from 'react';
import { useActiveCoupons } from './useActiveCoupons';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { markCouponAsExpired } from '@/lib/couponExpirationService';
import { removeCouponFromStorage } from '@/lib/couponPersistence';

/**
 * Hook to track coupon expiration and mark them as expired in the backend
 * Automatically calls the backend when coupons expire
 */
export const useCouponExpirationTracking = () => {
  const { activeCoupons, firstActiveCoupon, isFirstCouponExpired, reloadCoupons } = useActiveCoupons();
  const { user } = useAuth();
  const { supabase } = useSupabase();

  /**
   * Handle first coupon expiration
   */
  const handleCouponExpiration = useCallback(async () => {
    if (!firstActiveCoupon || !supabase) return;

    try {
      // Mark the expired coupon in the backend
      await markCouponAsExpired(
        firstActiveCoupon.couponId,
        firstActiveCoupon.productId,
        user?.id || null,
        supabase
      );

      // Remove from localStorage
      removeCouponFromStorage(firstActiveCoupon.productId);

      // Reload to show next coupon
      setTimeout(() => {
        reloadCoupons();
      }, 500);
    } catch (error) {
      console.error('Error handling coupon expiration:', error);
    }
  }, [firstActiveCoupon, user, supabase, reloadCoupons]);

  /**
   * Monitor first coupon expiration status
   */
  useEffect(() => {
    if (isFirstCouponExpired && firstActiveCoupon) {
      handleCouponExpiration();
    }
  }, [isFirstCouponExpired, firstActiveCoupon, handleCouponExpiration]);

  /**
   * Manually expire a coupon
   */
  const expireCoupon = useCallback(async (couponId, productId) => {
    if (!supabase) return;
    try {
      await markCouponAsExpired(couponId, productId, user?.id || null, supabase);
      removeCouponFromStorage(productId);
      reloadCoupons();
    } catch (error) {
      console.error('Error expiring coupon:', error);
    }
  }, [user, supabase, reloadCoupons]);

  /**
   * Manually expire all coupons
   */
  const expireAllCoupons = useCallback(async () => {
    if (!supabase) return;
    try {
      for (const coupon of activeCoupons) {
        await markCouponAsExpired(
          coupon.couponId,
          coupon.productId,
          user?.id || null,
          supabase
        );
        removeCouponFromStorage(coupon.productId);
      }
      reloadCoupons();
    } catch (error) {
      console.error('Error expiring all coupons:', error);
    }
  }, [activeCoupons, user, supabase, reloadCoupons]);

  return {
    handleCouponExpiration,
    expireCoupon,
    expireAllCoupons,
    activeCouponCount: activeCoupons.length,
  };
};
