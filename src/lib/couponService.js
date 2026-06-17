/**
 * Coupon Service Utilities
 * Functions for managing and validating coupons
 */

/**
 * Calculate discount amount based on type
 * @param {number} price - Original price
 * @param {string} discountType - 'percentage' or 'fixed'
 * @param {number} discountValue - Discount percentage or fixed amount
 * @returns {number} Discount amount
 */
export const calculateDiscount = (price, discountType, discountValue) => {
  if (discountType === 'percentage') {
    return (price * discountValue) / 100;
  }
  return discountValue;
};

/**
 * Calculate final price after discount
 * @param {number} price - Original price
 * @param {number} discountAmount - Discount amount
 * @returns {number} Final price (minimum 0)
 */
export const calculateFinalPrice = (price, discountAmount) => {
  return Math.max(0, price - discountAmount);
};

/**
 * Format coupon code for display
 * @param {string} code - Coupon code
 * @returns {string} Formatted code (uppercase)
 */
export const formatCouponCode = (code) => {
  return code.toUpperCase();
};

/**
 * Validate coupon code format (7 alphanumeric characters)
 * @param {string} code - Code to validate
 * @returns {boolean} True if valid format
 */
export const isValidCouponFormat = (code) => {
  return /^[A-Z0-9]{7}$/.test(code.toUpperCase());
};

/**
 * Format time remaining in mm:ss format
 * @param {number} seconds - Remaining seconds
 * @returns {string} Formatted time string
 */
export const formatTimeRemaining = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get percentage of time elapsed
 * @param {number} timeLeft - Remaining seconds
 * @param {number} totalTime - Total seconds (default 300 = 5 minutes)
 * @returns {number} Percentage (0-100)
 */
export const getTimeElapsedPercentage = (timeLeft, totalTime = 300) => {
  return Math.max(0, (timeLeft / totalTime) * 100);
};

/**
 * Create coupon data object for database
 * @param {object} couponData - Coupon information
 * @returns {object} Formatted coupon object
 */
export const createCouponObject = ({
  code,
  discountType,
  discountValue,
  description = '',
  validFrom = new Date(),
  validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  usageLimit = null,
  minimumCartValue = null,
  isActive = true,
}) => {
  return {
    code: code.toUpperCase(),
    discount_type: discountType,
    discount_value: parseFloat(discountValue),
    description,
    valid_from: validFrom.toISOString(),
    valid_until: validUntil.toISOString(),
    usage_limit: usageLimit,
    minimum_cart_value: minimumCartValue,
    is_active: isActive,
  };
};

/**
 * Format discount display text
 * @param {number} discountAmount - Amount saved
 * @param {string} discountType - 'percentage' or 'fixed'
 * @param {number} discountValue - Discount percentage or amount
 * @returns {string} Formatted discount text
 */
export const formatDiscountDisplay = (discountAmount, discountType, discountValue) => {
  if (discountType === 'percentage') {
    return `${discountValue}% خصم`;
  }
  return `${Math.round(discountAmount).toLocaleString('ar-EG')} د.ع خصم`;
};

/**
 * Check if coupon is expiring soon (within 24 hours)
 * @param {Date} validUntil - Expiration date
 * @returns {boolean} True if expiring soon
 */
export const isExpiringsoon = (validUntil) => {
  const now = new Date();
  const expirationDate = new Date(validUntil);
  const hoursUntilExpiry = (expirationDate - now) / (1000 * 60 * 60);
  return hoursUntilExpiry > 0 && hoursUntilExpiry < 24;
};

/**
 * Format expiration date for display
 * @param {Date} date - Expiration date
 * @returns {string} Formatted date in Arabic
 */
export const formatExpirationDate = (date) => {
  return new Date(date).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate coupon usage percentage
 * @param {number} usedCount - Number of times used
 * @param {number} usageLimit - Maximum usage limit
 * @returns {number} Percentage (0-100)
 */
export const calculateUsagePercentage = (usedCount, usageLimit) => {
  if (!usageLimit) return 0;
  return Math.min(100, (usedCount / usageLimit) * 100);
};

/**
 * Check if coupon is available (not expired, not over usage limit)
 * @param {object} coupon - Coupon object from database
 * @returns {object} { isAvailable, reason }
 */
export const checkCouponAvailability = (coupon) => {
  const now = new Date();

  if (!coupon.is_active) {
    return { isAvailable: false, reason: 'الكوبون معطل' };
  }

  if (new Date(coupon.valid_from) > now) {
    return { isAvailable: false, reason: 'الكوبون غير متاح حالياً' };
  }

  if (new Date(coupon.valid_until) < now) {
    return { isAvailable: false, reason: 'انتهت صلاحية الكوبون' };
  }

  return { isAvailable: true, reason: 'الكوبون صحيح' };
};

/**
 * Check if a product is eligible for a coupon
 * @param {number} productId - Product ID to check
 * @param {array} allowedProducts - Array of allowed product IDs for the coupon
 * @returns {boolean} True if product is eligible
 */
export const isProductEligibleForCoupon = (productId, allowedProducts = []) => {
  if (!allowedProducts || allowedProducts.length === 0) {
    // If no specific products are set, coupon applies to all
    return true;
  }
  return allowedProducts.includes(productId);
};

/**
 * Check if coupon usage limit has been reached
 * @param {number} usedCount - Number of times coupon has been used
 * @param {number|null} usageLimit - Maximum usage limit (null means unlimited)
 * @returns {boolean} True if limit has NOT been reached
 */
export const isCouponUsageAvailable = (usedCount = 0, usageLimit = null) => {
  if (usageLimit === null || usageLimit === undefined) {
    return true; // No limit
  }
  return usedCount < usageLimit;
};

/**
 * Determine coupon status based on dates, usage, and product availability
 * @param {object} coupon - Coupon object
 * @param {number} usageCount - How many times the coupon has been used
 * @param {number} availableProductsCount - How many products can still use this coupon
 * @returns {object} { status, label } where status is the key and label is the Arabic label
 */
export const getCouponStatus = (coupon, usageCount = 0, availableProductsCount = 0) => {
  const now = new Date();
  const validFrom = new Date(coupon.valid_from);
  const validUntil = new Date(coupon.valid_until);
  const usageLimit = coupon.usage_limit;

  // 1. Check if coupon hasn't started yet
  if (now < validFrom) {
    return {
      status: 'not-started',
      label: 'لم تبدأ بعد',
      cssClass: 'not-started',
    };
  }

  // 2. Check if coupon is date-expired
  if (now > validUntil) {
    return {
      status: 'expired',
      label: 'منتهية',
      cssClass: 'expired',
    };
  }

  // 3. Check if coupon has reached its usage limit (consumed)
  if (usageLimit && usageCount >= usageLimit) {
    return {
      status: 'consumed',
      label: 'مستهلك',
      cssClass: 'consumed',
    };
  }

  // 4. Check if all target products are exhausted
  if (availableProductsCount === 0) {
    return {
      status: 'exhausted',
      label: 'نفذ',
      cssClass: 'exhausted',
    };
  }

  // 5. Coupon is active
  return {
    status: 'active',
    label: 'نشطة',
    cssClass: 'active',
  };
};

/**
 * Validate coupon for a specific cart item
 * @param {object} coupon - Coupon data from database
 * @param {number} productId - Product ID to validate against
 * @param {number} usedCount - Number of times coupon has been used on this product
 * @param {array} allowedProducts - Array of product IDs the coupon applies to
 * @returns {object} { isValid, reason }
 */
export const validateCouponForProduct = (coupon, productId, usedCount = 0, allowedProducts = []) => {
  // Check if product is eligible
  if (!isProductEligibleForCoupon(productId, allowedProducts)) {
    return {
      isValid: false,
      reason: 'هذا الكوبون لا ينطبق على هذا المنتج',
    };
  }

  // Check if usage limit has been reached
  if (!isCouponUsageAvailable(usedCount, coupon.usage_limit)) {
    return {
      isValid: false,
      reason: `تم استخدام هذا الكوبون بالفعل ${usedCount} مرات. الحد الأقصى: ${coupon.usage_limit}`,
    };
  }

  return {
    isValid: true,
    reason: 'الكوبون صالح لهذا المنتج',
  };
};

/**
 * Apply coupon to cart items respecting product restrictions
 * @param {array} cartItems - Array of cart items
 * @param {object} coupon - Coupon to apply
 * @param {object} usageMap - Map of product_id -> usage_count
 * @param {array} allowedProducts - Array of allowed product IDs
 * @returns {array} Updated cart items with coupon applied where eligible
 */
export const applyCouponToCartItems = (cartItems, coupon, usageMap = {}, allowedProducts = []) => {
  return cartItems.map((item) => {
    const usedCount = usageMap[item.id] || 0;

    // Check if coupon can be applied to this item
    const validation = validateCouponForProduct(coupon, item.id, usedCount, allowedProducts);

    if (validation.isValid) {
      // Apply discount
      const discountAmount = calculateDiscount(item.price, coupon.discount_type, coupon.discount_value);
      const finalPrice = calculateFinalPrice(item.price, discountAmount);

      return {
        ...item,
        originalPrice: item.price,
        price: finalPrice,
        couponApplied: true,
        appliedCoupon: {
          code: coupon.code,
          couponId: coupon.id,
          discountType: coupon.discount_type,
          discountValue: coupon.discount_value,
          discountAmount,
        },
      };
    }

    return item;
  });
};
