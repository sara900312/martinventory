import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCouponPersistence } from '@/hooks/useCouponPersistence';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import { Gift, X, Check, AlertCircle, ChevronDown } from 'lucide-react';
import './CouponInput.css';

const CouponInput = ({ productId, onCouponApplied, onCouponRemoved, onTimerUpdate, currentPrice }) => {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const { toast } = useToast();
  const { cartItems } = useCart();
  const { savedCoupon, timeRemaining, isExpired, isUsed, persistCoupon, clearPersistedCoupon, getFormattedTimeRemaining } = useCouponPersistence(productId);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [discount, setDiscount] = useState(null);
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [throttleUntil, setThrottleUntil] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const timerRef = useRef(null);
  const throttleTimerRef = useRef(null);

  // Initialize from persisted coupon on mount
  useEffect(() => {
    if (savedCoupon && !appliedCoupon) {
      // Verify the saved coupon is still applicable to this product
      validateAndApplySavedCoupon(savedCoupon);
    }
  }, [savedCoupon, productId]);

  /**
   * Validate and apply a saved coupon from localStorage
   * Trust localStorage expiration time instead of clearing on validation failure
   */
  const validateAndApplySavedCoupon = async (coupon) => {
    try {
      // First check if the coupon is already expired via localStorage timestamp
      // If not expired, we trust it and apply it immediately
      if (!coupon || !coupon.expiresAt) {
        return;
      }

      // Apply the coupon from localStorage data without waiting for RPC validation
      // This ensures it persists even if the validation call fails
      setAppliedCoupon({
        code: coupon.code,
        couponId: coupon.couponId,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        originalPrice: coupon.originalPrice,
        maximumQuantity: coupon.maximumQuantity,
      });

      // Calculate discount from the saved coupon data
      let finalPrice = null;
      let discountAmount = 0;

      if (coupon.discountType === 'percentage') {
        discountAmount = (currentPrice * parseFloat(coupon.discountValue)) / 100;
      } else {
        discountAmount = parseFloat(coupon.discountValue);
      }
      finalPrice = Math.max(0, currentPrice - discountAmount);

      setDiscount({
        amount: discountAmount,
        finalPrice: finalPrice,
        isPercentage: coupon.discountType === 'percentage',
      });

      let successMessage = `✓ تم استعادة الكوبون من الجلسة السابقة`;
      if (coupon.maximumQuantity) {
        successMessage += ` | الحد الأقصى: ${coupon.maximumQuantity} وحدة`;
      }
      setSuccess(successMessage);
      setCouponCode('');

      // Call callback with saved coupon data
      if (onCouponApplied) {
        onCouponApplied({
          couponId: coupon.couponId,
          couponCode: coupon.code,
          discountAmount,
          finalPrice,
          originalPrice: currentPrice,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maximumQuantity: coupon.maximumQuantity,
        });
      }

      // Trigger timer if timeRemaining is available from persistence
      if (onTimerUpdate && timeRemaining) {
        onTimerUpdate(timeRemaining);
      }

      // Optionally verify with database in the background (don't block or clear on failure)
      if (supabase) {
        supabase.rpc('validate_coupon', {
          p_code: coupon.code,
          p_product_id: productId,
        }).catch(err => {
          // Log error but don't clear the coupon
          console.debug('Background coupon validation failed:', err);
        });
      }
    } catch (err) {
      console.error('Error applying saved coupon:', err);
      // Don't clear the coupon on error - trust localStorage expiration instead
    }
  };

  // Format time for display (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Effect to handle coupon expiration
  useEffect(() => {
    if (isExpired && appliedCoupon) {
      handleRemoveCoupon();
      toast({
        title: 'انتهت صلاحية الكوبون',
        description: 'انتهت صلاحية الكوبون لهذا المنتج',
        variant: 'destructive',
        duration: 5000,
      });
    }
  }, [isExpired, appliedCoupon]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, []);

  // Countdown timer effect for applied coupon
  useEffect(() => {
    if (!appliedCoupon || timeRemaining === null) return;

    // Notify parent component of timer update
    if (onTimerUpdate) {
      onTimerUpdate(timeRemaining);
    }

    if (timeRemaining <= 0) {
      handleRemoveCoupon();
      return;
    }
  }, [appliedCoupon, timeRemaining, onTimerUpdate]);

  // Validate coupon code format (7 alphanumeric)
  const isValidCodeFormat = (code) => {
    return /^[A-Z0-9]{7}$/.test(code.toUpperCase());
  };

  // Get error message based on attempt number
  const getErrorMessage = (baseMessage, attemptNumber) => {
    if (attemptNumber === 2) {
      return '🎁 هل تقصد كوبونًا آخر؟ بعض الكوبونات تكون حساسة للأحرف';
    }
    return baseMessage;
  };

  // Handle error with smart throttling
  const handleCouponError = (baseErrorMessage) => {
    const newFailedCount = failedAttempts + 1;
    setFailedAttempts(newFailedCount);

    // Third attempt and beyond: throttle the button
    if (newFailedCount >= 3) {
      const throttleDuration = 20000; // 20 seconds
      setThrottleUntil(Date.now() + throttleDuration);

      // Start countdown to re-enable button
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
      throttleTimerRef.current = setTimeout(() => {
        setThrottleUntil(null);
      }, throttleDuration);

      // Show minimal message
      setError('حاول مرة أخرى بعد قليل');

      // After 4 attempts: collapse the field gracefully
      if (newFailedCount >= 4) {
        setTimeout(() => {
          setIsInputVisible(false);
          setIsCollapsed(true);
          setError('');
        }, 3000);
      }
    } else {
      // First and second attempt: show regular error with auto-dismiss
      const errorMsg = getErrorMessage(baseErrorMessage, newFailedCount);
      setError(errorMsg);

      // Auto-dismiss error after 4 seconds
      setTimeout(() => {
        setError('');
      }, 4000);
    }
  };

  /**
   * Handle coupon application
   */
  const handleApplyCoupon = async () => {
    setError('');
    setSuccess('');

    // Don't allow submissions during throttle period
    if (throttleUntil && Date.now() < throttleUntil) {
      return;
    }

    if (!couponCode.trim()) {
      handleCouponError('يرجى إدخال رمز الكوبون');
      return;
    }

    if (!isValidCodeFormat(couponCode)) {
      handleCouponError('رمز الكوبون يجب أن يكون 7 أحرف/أرقام');
      return;
    }

    setLoading(true);

    try {
      // Validate coupon against current product
      const { data, error: validationError } = await supabase.rpc('validate_coupon', {
        p_code: couponCode.toUpperCase(),
        p_product_id: productId,
      });

      if (validationError) {
        throw new Error(validationError.message);
      }

      if (!data || !data[0]) {
        handleCouponError('❌ الكوبون غير صحيح، تأكد من كتابته بشكل صحيح');
        return;
      }

      const result = data[0];

      // Check for valid coupon response
      const hasValidationMarker =
        result.success === true ||
        result.success === 'true' ||
        result.is_valid === true ||
        result.is_valid === 'true';

      const hasDiscountData =
        (result.final_price && typeof result.final_price === 'number') ||
        (result.discount_value && typeof result.discount_value === 'number');

      if (!hasValidationMarker && !hasDiscountData) {
        handleCouponError(result.message || '❌ الكوبون غير صحيح أو منتهي الصلاحية');
        return;
      }

      // Check quantity limit if maximum_quantity is set
      let effectiveMaximumQuantity = result.maximum_quantity;

      if (result.maximum_quantity) {
        const { data: couponUsageData, error: usageError } = await supabase
          .from('coupon_usage')
          .select('quantity_used')
          .eq('coupon_id', result.coupon_id)
          .eq('user_id', user?.id || null)
          .eq('product_id', productId);

        if (!usageError && couponUsageData) {
          const totalQuantityUsedByUser = couponUsageData.reduce((sum, record) => sum + (record.quantity_used || 1), 0);

          // Also check if product is already in cart with this coupon
          const cartItemWithCoupon = cartItems.find(
            item => item.id === productId && item.couponApplied
          );
          const quantityInCartWithCoupon = cartItemWithCoupon ? cartItemWithCoupon.quantity : 0;

          const totalQuantityAllocated = totalQuantityUsedByUser + quantityInCartWithCoupon;
          const remainingQuantity = result.maximum_quantity - totalQuantityAllocated;

          if (remainingQuantity <= 0) {
            handleCouponError(`انتهت كمية هذا الكوبون لهذا المنتج (تم استخدام ${totalQuantityAllocated}/${result.maximum_quantity} وحدة)`);
            return;
          }

          // Use remaining quantity as the effective maximum for this user/product
          effectiveMaximumQuantity = remainingQuantity;
        }
      }

      // Calculate final price
      let finalPrice = null;
      let discountAmount = 0;

      if (result.final_price && typeof result.final_price === 'number') {
        finalPrice = result.final_price;
        discountAmount = currentPrice - finalPrice;
      } else if (result.discount_value !== undefined && result.discount_value !== null) {
        if (result.discount_type === 'percentage') {
          discountAmount = (currentPrice * parseFloat(result.discount_value)) / 100;
        } else {
          discountAmount = parseFloat(result.discount_value);
        }
        finalPrice = Math.max(0, currentPrice - discountAmount);
      }

      if (!finalPrice || finalPrice === null || isNaN(finalPrice)) {
        handleCouponError('خطأ تقني في معالجة الكوبون، يرجى المحاولة لاحقاً');
        return;
      }

      // Create coupon data object with effective maximum quantity (accounting for previous user/product usage)
      const couponData = {
        code: couponCode.toUpperCase(),
        couponId: result.coupon_id,
        discountType: result.discount_type,
        discountValue: result.discount_value,
        originalPrice: currentPrice,
        maximumQuantity: effectiveMaximumQuantity,
      };

      // Save to localStorage with product ID
      persistCoupon(couponData);

      // Update component state
      setAppliedCoupon(couponData);
      setDiscount({
        amount: discountAmount,
        finalPrice: finalPrice,
        isPercentage: result.discount_type === 'percentage',
      });

      let successMessage = `✓ تم تطبيق الكوبون بنجاح! وفرت ${discountAmount.toLocaleString('ar-EG')} د.ع`;
      if (effectiveMaximumQuantity) {
        successMessage += ` | الحد الأقصى: ${effectiveMaximumQuantity} وحدة`;
      }
      setSuccess(successMessage);
      setError('');
      setCouponCode('');
      setFailedAttempts(0); // Reset failed attempts on success
      setThrottleUntil(null); // Clear any throttle
      setIsCollapsed(false); // Restore field if collapsed

      // Auto-close input field and clear message after showing success
      setTimeout(() => {
        setIsInputVisible(false);
        setSuccess('');
      }, 2000);

      // Callback to parent
      if (onCouponApplied) {
        onCouponApplied({
          couponId: result.coupon_id,
          couponCode: couponCode.toUpperCase(),
          discountAmount,
          finalPrice,
          originalPrice: currentPrice,
          discountType: result.discount_type,
          discountValue: result.discount_value,
          maximumQuantity: effectiveMaximumQuantity,
        });
      }

      // Start timer update callback (5 minutes from now)
      if (onTimerUpdate) {
        onTimerUpdate(5 * 60 * 1000); // 5 minutes in milliseconds
      }

      // Record usage with quantity (default 1 unit per coupon application)
      try {
        await supabase
          .from('coupon_usage')
          .insert([
            {
              coupon_id: result.coupon_id,
              product_id: productId,
              user_id: user?.id || null,
              order_id: null,
              quantity_used: 1,
              used_at: new Date().toISOString(),
            }
          ]);
      } catch (usageError) {
        console.warn('Could not record coupon usage:', usageError);
      }
    } catch (err) {
      handleCouponError('خطأ تقني، يرجى المحاولة لاحقاً');
      console.error('Coupon error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove applied coupon
   */
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(null);
    setSuccess('');
    setError('');
    setIsInputVisible(false);
    setFailedAttempts(0);
    setThrottleUntil(null);
    setIsCollapsed(false);
    clearPersistedCoupon();

    if (onCouponRemoved) {
      onCouponRemoved();
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && !appliedCoupon) {
      handleApplyCoupon();
    }
  };

  const timeDisplay = timeRemaining !== null ? formatTime(Math.ceil(timeRemaining / 1000)) : '0:00';
  const progressPercentage = timeRemaining !== null ? (timeRemaining / (5 * 60 * 1000)) * 100 : 0;

  return (
    <div className="coupon-input-wrapper">
      {isExpired && !appliedCoupon ? (
        <div className="coupon-expired-container">
          <div className="coupon-expired-content">
            <AlertCircle className="coupon-expired-icon" />
            <div>
              <div className="coupon-expired-title">انتهت صلاحية الكوبون</div>
              <div className="coupon-expired-message">انتهت صلاحية الكوبون لهذا المنتج</div>
            </div>
          </div>
          <button
            onClick={() => {
              clearPersistedCoupon();
              setError('');
              setSuccess('');
            }}
            className="coupon-expired-dismiss-button"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : !appliedCoupon ? (
        <>
          {/* Trigger Button */}
          <AnimatePresence>
            {!isInputVisible && !isCollapsed && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsInputVisible(true)}
                className="coupon-trigger-button"
              >
                <Gift className="coupon-trigger-icon" />
                <span>هل لديك كوبون خصم؟</span>
                <ChevronDown className="coupon-trigger-chevron" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Collapsed State - Show small link to reopen */}
          {isCollapsed && !isInputVisible && (
            <button
              onClick={() => {
                setIsCollapsed(false);
                setIsInputVisible(true);
                setFailedAttempts(0);
                setError('');
              }}
              className="coupon-collapsed-link"
              title="أعد فتح حقل الكوبون"
            >
              🎁 لديك كوبون صحيح؟ أظهره
            </button>
          )}

          {/* Input Field Container */}
          <AnimatePresence>
            {isInputVisible && (
              <motion.div
                initial={{ opacity: 0, maxHeight: 0 }}
                animate={{ opacity: 1, maxHeight: 500 }}
                exit={{ opacity: 0, maxHeight: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="coupon-input-container-wrapper"
              >
                <div className="coupon-input-container">
                  <div className="coupon-input-label">
                    <Gift className="coupon-icon" />
                    <label>أدخل رمز الخصم</label>
                  </div>

                  <div className="coupon-input-group">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyPress={handleKeyPress}
                      placeholder="XXXXX7X"
                      maxLength="7"
                      className="coupon-input-field"
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={loading || !couponCode.trim() || (throttleUntil && Date.now() < throttleUntil)}
                      className="coupon-apply-button"
                    >
                      {loading ? (
                        <>
                          <span className="loading-spinner"></span>
                          جاري...
                        </>
                      ) : (
                        <>
                          <Gift className="button-icon" />
                          تطبيق
                        </>
                      )}
                    </button>
                  </div>

                  {error && (
                    <div className="coupon-message error-message">
                      <X className="message-icon" />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="coupon-message success-message">
                      <Check className="message-icon" />
                      {success}
                    </div>
                  )}

                  {throttleUntil && Date.now() < throttleUntil && (
                    <div className="coupon-throttle-notice">
                      ⏳ حاول مرة أخرى بعد قليل
                    </div>
                  )}

                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setIsInputVisible(false);
                      setError('');
                      setSuccess('');
                      setCouponCode('');
                    }}
                    className="coupon-input-close-button"
                    title="إغلاق"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="coupon-applied-container">
          <div className="coupon-applied-header">
            <div className="coupon-applied-info">
              <Check className="coupon-applied-icon" />
              <div>
                <div className="coupon-applied-code">{appliedCoupon.code}</div>
                <div className="coupon-applied-label">تم تطبيق الكوبون</div>
              </div>
            </div>
          </div>

          {discount && (
            <div className="coupon-discount-display">
              <div className="discount-row">
                <span className="discount-label">الخصم:</span>
                <span className="discount-value">
                  -{discount.amount.toLocaleString('ar-EG')} د.ع
                </span>
              </div>
              <div className="discount-row final-price">
                <span className="discount-label">السعر النهائي:</span>
                <span className="discount-value">
                  {discount.finalPrice.toLocaleString('ar-EG')} د.ع
                </span>
              </div>
            </div>
          )}

          <div className="coupon-timer-container">
            <div className="timer-progress-bar">
              <div
                className="timer-progress-fill"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="timer-text">
              تنتهي صلاحية الخصم بعد
              <span className="timer-value">{timeDisplay}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponInput;
