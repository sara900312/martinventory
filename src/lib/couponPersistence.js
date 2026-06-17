/**
 * Coupon Persistence Utility
 * Manages storing and retrieving coupon data from localStorage with per-product tracking
 * Each product can have its own coupon with independent 5-minute expiration timers
 */

const STORAGE_BASE_KEY = 'neomart-coupons';
const EXPIRATION_TIME_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate storage key for per-product coupon
 * @param {number} productId - Product ID
 * @returns {string} Storage key
 */
const getStorageKey = (productId) => {
  return `${STORAGE_BASE_KEY}-${productId}`;
};

/**
 * Save coupon to localStorage with expiration timestamp for a specific product
 * @param {object} couponData - The coupon data to save
 * @param {number} productId - Product ID to apply coupon to
 * @param {boolean} isUsed - Whether the coupon is marked as used (single-use)
 * @returns {void}
 */
export const saveCouponToStorage = (couponData, productId, isUsed = true) => {
  if (!couponData || !productId) {
    if (productId) removeCouponFromStorage(productId);
    return;
  }

  const expiresAt = new Date().getTime() + EXPIRATION_TIME_MS;
  const storedCoupon = {
    ...couponData,
    productId,
    expiresAt,
    savedAt: new Date().getTime(),
    isUsed,
  };

  localStorage.setItem(getStorageKey(productId), JSON.stringify(storedCoupon));
};

/**
 * Get coupon from localStorage for a specific product if it hasn't expired
 * @param {number} productId - Product ID
 * @returns {object|null} Coupon data if valid and not expired, null otherwise
 */
export const getCouponFromStorage = (productId) => {
  try {
    if (!productId) return null;

    const stored = localStorage.getItem(getStorageKey(productId));
    if (!stored) return null;

    const coupon = JSON.parse(stored);
    const now = new Date().getTime();

    // Check if coupon has expired
    if (coupon.expiresAt && coupon.expiresAt <= now) {
      removeCouponFromStorage(productId);
      return null;
    }

    return coupon;
  } catch (error) {
    console.error('Error retrieving coupon from storage:', error);
    removeCouponFromStorage(productId);
    return null;
  }
};

/**
 * Remove coupon from localStorage for a specific product
 * @param {number} productId - Product ID
 * @returns {void}
 */
export const removeCouponFromStorage = (productId) => {
  if (!productId) return;
  localStorage.removeItem(getStorageKey(productId));
};

/**
 * Get remaining time for stored coupon in milliseconds for a specific product
 * @param {number} productId - Product ID
 * @returns {number} Remaining time in milliseconds, 0 if expired, null if no coupon
 */
export const getCouponTimeRemaining = (productId) => {
  try {
    if (!productId) return null;

    const stored = localStorage.getItem(getStorageKey(productId));
    if (!stored) return null;

    const coupon = JSON.parse(stored);
    const now = new Date().getTime();
    const remaining = coupon.expiresAt - now;

    if (remaining <= 0) {
      removeCouponFromStorage(productId);
      return 0;
    }

    return Math.max(0, remaining);
  } catch (error) {
    console.error('Error getting coupon time remaining:', error);
    return null;
  }
};

/**
 * Check if coupon has expired for a specific product
 * @param {number} productId - Product ID
 * @returns {boolean} True if coupon exists but is expired
 */
export const isCouponExpired = (productId) => {
  try {
    if (!productId) return false;

    const stored = localStorage.getItem(getStorageKey(productId));
    if (!stored) return false;

    const coupon = JSON.parse(stored);
    const now = new Date().getTime();
    return coupon.expiresAt && coupon.expiresAt <= now;
  } catch (error) {
    return false;
  }
};

/**
 * Check if a stored coupon exists and is valid for a specific product
 * @param {number} productId - Product ID
 * @returns {boolean} True if valid coupon exists
 */
export const isValidCouponStored = (productId) => {
  return getCouponFromStorage(productId) !== null;
};

/**
 * Check if a coupon is marked as used (single-use)
 * @param {number} productId - Product ID
 * @returns {boolean} True if coupon is marked as used
 */
export const isCouponUsed = (productId) => {
  try {
    if (!productId) return false;

    const stored = localStorage.getItem(getStorageKey(productId));
    if (!stored) return false;

    const coupon = JSON.parse(stored);
    return coupon.isUsed === true;
  } catch (error) {
    return false;
  }
};

/**
 * Mark a coupon as used (single-use coupon)
 * @param {number} productId - Product ID
 * @returns {boolean} True if successfully marked as used
 */
export const markCouponAsUsed = (productId) => {
  try {
    if (!productId) return false;

    const stored = localStorage.getItem(getStorageKey(productId));
    if (!stored) return false;

    const coupon = JSON.parse(stored);
    coupon.isUsed = true;
    coupon.usedAt = new Date().getTime();

    localStorage.setItem(getStorageKey(productId), JSON.stringify(coupon));
    return true;
  } catch (error) {
    console.error('Error marking coupon as used:', error);
    return false;
  }
};

/**
 * Clear all stored coupon data
 * @returns {void}
 */
export const clearAllCouponStorage = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_BASE_KEY)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing coupon storage:', error);
  }
};

/**
 * Get all active coupons (per product)
 * @returns {object} Map of productId -> coupon data
 */
export const getAllActiveCoupons = () => {
  try {
    const coupons = {};
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith(STORAGE_BASE_KEY)) {
        try {
          const coupon = JSON.parse(localStorage.getItem(key));
          if (coupon && coupon.productId && coupon.expiresAt) {
            const now = new Date().getTime();
            if (coupon.expiresAt > now) {
              coupons[coupon.productId] = coupon;
            } else {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          // Ignore malformed entries
        }
      }
    });

    return coupons;
  } catch (error) {
    console.error('Error getting all coupons:', error);
    return {};
  }
};

/**
 * Convert milliseconds to formatted time (mm:ss)
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted time string
 */
export const formatTimeFromMs = (ms) => {
  if (!ms) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
