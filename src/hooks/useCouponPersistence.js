import { useEffect, useState, useCallback } from 'react';
import {
  saveCouponToStorage,
  getCouponFromStorage,
  removeCouponFromStorage,
  getCouponTimeRemaining,
  isCouponExpired,
  formatTimeFromMs,
  isCouponUsed,
  markCouponAsUsed,
} from '@/lib/couponPersistence';

/**
 * Hook for managing coupon persistence across page reloads
 * Handles loading, saving, and expiring coupons from localStorage per product
 * @param {number} productId - Product ID to manage coupon for
 */
export const useCouponPersistence = (productId) => {
  const [savedCoupon, setSavedCoupon] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isUsed, setIsUsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load coupon from storage on mount or when productId changes
  useEffect(() => {
    const coupon = getCouponFromStorage(productId);
    setSavedCoupon(coupon);

    if (coupon) {
      const remaining = getCouponTimeRemaining(productId);
      setTimeRemaining(remaining);
      setIsExpired(false);
      setIsUsed(isCouponUsed(productId));
    } else {
      setIsExpired(isCouponExpired(productId));
      setIsUsed(false);
    }

    setIsLoading(false);
  }, [productId]);

  // Set up countdown timer if coupon is saved
  useEffect(() => {
    if (!savedCoupon || !productId) return;

    const interval = setInterval(() => {
      const remaining = getCouponTimeRemaining(productId);

      if (remaining === null || remaining === 0) {
        setSavedCoupon(null);
        setTimeRemaining(null);
        setIsExpired(true);
        clearInterval(interval);
      } else {
        setTimeRemaining(remaining);
        setIsExpired(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [savedCoupon, productId]);

  /**
   * Persist a coupon to storage for the current product
   */
  const persistCoupon = useCallback((couponData) => {
    if (!productId) return;

    saveCouponToStorage(couponData, productId, true);
    setSavedCoupon(couponData);
    const remaining = getCouponTimeRemaining(productId);
    setTimeRemaining(remaining);
    setIsExpired(false);
    setIsUsed(true);
  }, [productId]);

  /**
   * Clear the persisted coupon for the current product
   */
  const clearPersistedCoupon = useCallback(() => {
    if (!productId) return;

    removeCouponFromStorage(productId);
    setSavedCoupon(null);
    setTimeRemaining(null);
    setIsExpired(false);
    setIsUsed(false);
  }, [productId]);

  /**
   * Get formatted time remaining (mm:ss)
   */
  const getFormattedTimeRemaining = useCallback(() => {
    return formatTimeFromMs(timeRemaining);
  }, [timeRemaining]);

  return {
    savedCoupon,
    timeRemaining,
    isExpired,
    isUsed,
    isLoading,
    persistCoupon,
    clearPersistedCoupon,
    getFormattedTimeRemaining,
  };
};
