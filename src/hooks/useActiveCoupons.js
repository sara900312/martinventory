import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/contexts/CartContext';
import { getCouponFromStorage, getCouponTimeRemaining, clearAllCouponStorage, removeCouponFromStorage } from '@/lib/couponPersistence';

/**
 * Hook to manage active coupons from cart items
 * Tracks all coupons applied to products in the cart and provides
 * information about the first active coupon (for countdown display)
 */
export const useActiveCoupons = () => {
  const { cartItems } = useCart();
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [firstActiveCoupon, setFirstActiveCoupon] = useState(null);
  const [firstCouponTimeRemaining, setFirstCouponTimeRemaining] = useState(null);
  const [isFirstCouponExpired, setIsFirstCouponExpired] = useState(false);

  // Get all active coupons from cart items
  const loadActiveCoupons = useCallback(() => {
    const coupons = [];
    const seenProductIds = new Set();

    cartItems.forEach((item) => {
      if (seenProductIds.has(item.id)) return;

      const coupon = getCouponFromStorage(item.id);
      if (coupon) {
        seenProductIds.add(item.id);
        const timeRemaining = getCouponTimeRemaining(item.id);
        if (timeRemaining !== null && timeRemaining > 0) {
          coupons.push({
            productId: item.id,
            productName: item.name,
            couponCode: coupon.code,
            couponId: coupon.couponId,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            appliedAt: coupon.savedAt,
            expiresAt: coupon.expiresAt,
            timeRemaining,
            productImage: item.main_image_url,
          });
        }
      }
    });

    // Sort by appliedAt (oldest first = first applied = first to show in countdown)
    coupons.sort((a, b) => a.appliedAt - b.appliedAt);
    setActiveCoupons(coupons);

    // Set the first active coupon for countdown display
    if (coupons.length > 0) {
      setFirstActiveCoupon(coupons[0]);
      setFirstCouponTimeRemaining(coupons[0].timeRemaining);
      setIsFirstCouponExpired(false);
    } else {
      setFirstActiveCoupon(null);
      setFirstCouponTimeRemaining(null);
      setIsFirstCouponExpired(false);
    }
  }, [cartItems]);

  // Load coupons on mount and when cartItems change
  useEffect(() => {
    loadActiveCoupons();
  }, [cartItems, loadActiveCoupons]);

  // Set up countdown timer for first active coupon
  useEffect(() => {
    if (!firstActiveCoupon) return;

    const interval = setInterval(() => {
      const timeRemaining = getCouponTimeRemaining(firstActiveCoupon.productId);

      if (timeRemaining === null || timeRemaining <= 0) {
        // First coupon expired, remove only this one and load remaining coupons
        removeCouponFromStorage(firstActiveCoupon.productId);
        loadActiveCoupons();
        setIsFirstCouponExpired(true);
      } else {
        setFirstCouponTimeRemaining(timeRemaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [firstActiveCoupon, loadActiveCoupons]);

  /**
   * Get formatted time for first active coupon (MM:SS)
   */
  const getFirstCouponFormattedTime = useCallback(() => {
    if (!firstCouponTimeRemaining) return '0:00';
    const totalSeconds = Math.ceil(firstCouponTimeRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [firstCouponTimeRemaining]);

  /**
   * Get count of active coupons
   */
  const getActiveCouponCount = useCallback(() => {
    return activeCoupons.length;
  }, [activeCoupons]);

  /**
   * Check if there are multiple active coupons
   */
  const hasMultipleCoupons = useCallback(() => {
    return activeCoupons.length > 1;
  }, [activeCoupons]);

  return {
    activeCoupons,
    firstActiveCoupon,
    firstCouponTimeRemaining,
    isFirstCouponExpired,
    getFirstCouponFormattedTime,
    getActiveCouponCount,
    hasMultipleCoupons,
    reloadCoupons: loadActiveCoupons,
  };
};
