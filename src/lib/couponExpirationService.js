/**
 * Coupon Expiration Service
 * Handles marking coupons as consumed/expired in the backend
 * and manages coupon status updates
 */

/**
 * Mark a coupon as consumed/expired in the backend
 * @param {number} couponId - Coupon ID
 * @param {number} productId - Product ID the coupon was applied to
 * @param {string} userId - User ID (optional)
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<void>}
 */
export const markCouponAsExpired = async (couponId, productId, userId = null, supabase = null) => {
  try {
    if (!couponId) {
      console.warn('Cannot mark coupon as expired: missing couponId');
      return;
    }

    if (!supabase) {
      console.warn('Cannot mark coupon as expired: missing supabase client');
      return;
    }

    // Record the coupon expiration in the coupon_usage table
    const expirationData = {
      coupon_id: couponId,
      product_id: productId,
      user_id: userId,
      expired_at: new Date().toISOString(),
      status: 'expired',
    };

    // Try to insert into an expiration tracking table if it exists
    try {
      const { error } = await supabase
        .from('coupon_expiration_log')
        .insert([expirationData]);

      if (error) {
        console.warn('Could not log coupon expiration:', error);
      }
    } catch (err) {
      // Table might not exist, continue
      console.warn('Coupon expiration log table not available:', err.message);
    }

    // Update coupon usage count to reflect that it was used/expired
    try {
      // Get current coupon usage
      const { data: usageData, error: usageError } = await supabase
        .from('coupon_usage')
        .select('*')
        .eq('coupon_id', couponId)
        .eq('product_id', productId)
        .limit(1);

      if (usageError) {
        console.warn('Could not fetch coupon usage:', usageError);
        return;
      }

      if (usageData && usageData.length > 0) {
        // Update existing usage record to mark as expired
        const { error: updateError } = await supabase
          .from('coupon_usage')
          .update({
            status: 'expired',
            expired_at: new Date().toISOString(),
          })
          .eq('coupon_id', couponId)
          .eq('product_id', productId)
          .eq('id', usageData[0].id);

        if (updateError) {
          console.warn('Could not update coupon usage:', updateError);
        }
      } else {
        // Create new usage record marking it as expired
        const { error: insertError } = await supabase
          .from('coupon_usage')
          .insert([
            {
              coupon_id: couponId,
              product_id: productId,
              user_id: userId,
              used_at: new Date().toISOString(),
              status: 'expired',
              expired_at: new Date().toISOString(),
            }
          ]);

        if (insertError) {
          console.warn('Could not insert coupon usage:', insertError);
        }
      }
    } catch (err) {
      console.warn('Error updating coupon usage:', err.message);
    }
  } catch (error) {
    console.error('Error marking coupon as expired:', error);
  }
};

/**
 * Batch mark multiple coupons as expired
 * @param {Array} expiredCoupons - Array of {couponId, productId, userId}
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<void>}
 */
export const markMultipleCouponsAsExpired = async (expiredCoupons, supabase = null) => {
  try {
    if (!Array.isArray(expiredCoupons) || expiredCoupons.length === 0) {
      return;
    }

    if (!supabase) {
      console.warn('Cannot mark multiple coupons as expired: missing supabase client');
      return;
    }

    // Mark each coupon as expired
    const promises = expiredCoupons.map((coupon) =>
      markCouponAsExpired(coupon.couponId, coupon.productId, coupon.userId, supabase)
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error marking multiple coupons as expired:', error);
  }
};

/**
 * Get coupon expiration status
 * @param {number} couponId - Coupon ID
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<object|null>} Coupon status or null
 */
export const getCouponExpirationStatus = async (couponId, supabase = null) => {
  try {
    if (!couponId || !supabase) return null;

    const { data, error } = await supabase
      .from('coupon_usage')
      .select('*')
      .eq('coupon_id', couponId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Could not fetch coupon status:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error getting coupon expiration status:', error);
    return null;
  }
};

/**
 * Check if coupon has expired (not just time-based but also usage-based)
 * @param {number} couponId - Coupon ID
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<boolean>} True if coupon is expired/consumed
 */
export const isCouponConsumed = async (couponId, supabase = null) => {
  try {
    const status = await getCouponExpirationStatus(couponId, supabase);

    if (!status) return false;

    return status.status === 'expired' || status.status === 'consumed';
  } catch (error) {
    console.error('Error checking if coupon is consumed:', error);
    return false;
  }
};

/**
 * Record coupon usage for analytics and tracking
 * @param {number} couponId - Coupon ID
 * @param {number} productId - Product ID
 * @param {string} userId - User ID (optional)
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<void>}
 */
export const recordCouponUsage = async (couponId, productId, userId = null, supabase = null) => {
  try {
    if (!supabase) {
      console.warn('Cannot record coupon usage: missing supabase client');
      return;
    }

    const { error } = await supabase
      .from('coupon_usage')
      .insert([
        {
          coupon_id: couponId,
          product_id: productId,
          user_id: userId,
          used_at: new Date().toISOString(),
        }
      ]);

    if (error) {
      console.warn('Could not record coupon usage:', error);
    }
  } catch (error) {
    console.error('Error recording coupon usage:', error);
  }
};

/**
 * Get all expired coupons for a specific product
 * @param {number} productId - Product ID
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<Array>} Array of expired coupons
 */
export const getExpiredCouponsForProduct = async (productId, supabase = null) => {
  try {
    if (!supabase) {
      console.warn('Cannot get expired coupons: missing supabase client');
      return [];
    }

    const { data, error } = await supabase
      .from('coupon_usage')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'expired')
      .order('expired_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch expired coupons:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting expired coupons:', error);
    return [];
  }
};
