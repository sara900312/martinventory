import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Gift, ChevronRight, ChevronLeft } from 'lucide-react';
import { useActiveCoupons } from '@/hooks/useActiveCoupons';
import { formatPrice } from '@/data/products';
import './CartCouponManager.css';

const CartCouponManager = () => {
  const {
    activeCoupons,
    firstActiveCoupon,
    firstCouponTimeRemaining,
    getFirstCouponFormattedTime,
    getActiveCouponCount,
    hasMultipleCoupons,
  } = useActiveCoupons();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCouponIndex, setSelectedCouponIndex] = useState(0);

  // Format coupon time remaining to MM:SS format
  const formatCouponTime = (timeRemaining) => {
    if (!timeRemaining) return '0:00';
    const totalSeconds = Math.ceil(timeRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Open details modal when clicking the countdown badge
  const handleBadgeClick = () => {
    if (!firstActiveCoupon) return;
    setIsDetailsOpen(true);
    setSelectedCouponIndex(0);
  };

  if (!firstActiveCoupon) {
    return null;
  }

  const timeDisplay = getFirstCouponFormattedTime();
  const isLowTime = firstCouponTimeRemaining !== null && firstCouponTimeRemaining < 60000;
  const couponCount = getActiveCouponCount();
  const selectedCoupon = activeCoupons[selectedCouponIndex] || firstActiveCoupon;

  const handleNextCoupon = () => {
    setSelectedCouponIndex((prev) => (prev + 1) % activeCoupons.length);
  };

  const handlePrevCoupon = () => {
    setSelectedCouponIndex((prev) => (prev - 1 + activeCoupons.length) % activeCoupons.length);
  };

  return (
    <>
      {/* Countdown Badge with Product Count */}
      <div className="coupon-badge-container">
        <motion.button
          onClick={handleBadgeClick}
          className={`coupon-countdown-badge ${isLowTime ? 'coupon-countdown-badge--warning' : ''}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="انقر لعرض تفاصيل الكوبون"
          aria-label={`كوبون نشط - ${timeDisplay} متبقي`}
        >
          <Clock className="coupon-countdown-icon" />
          <span className="coupon-countdown-time">{timeDisplay}</span>
        </motion.button>

        {couponCount > 0 && (
          <motion.div
            className="coupon-product-count"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 8, stiffness: 150 }}
            title={`${couponCount} منتج به كوبون نشط`}
          >
            {couponCount}
          </motion.div>
        )}
      </div>

      {/* Detailed Coupon Popup */}
      <AnimatePresence>
        {isDetailsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsOpen(false)}
              className="coupon-details-backdrop"
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="coupon-details-popup"
              role="dialog"
              aria-modal="true"
              aria-labelledby="coupon-details-title"
            >
              {/* Header */}
              <div className="coupon-details-header">
                <div className="coupon-details-title-section">
                  <Gift className="coupon-details-title-icon" />
                  <h3 id="coupon-details-title" className="coupon-details-title">
                    الخصومات النشطة ({couponCount})
                  </h3>
                </div>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="coupon-details-close"
                  aria-label="إغلاق"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Indicators */}
              {couponCount > 1 && (
                <div className="coupon-details-navigation">
                  <div className="coupon-pagination-info">
                    {selectedCouponIndex + 1} من {couponCount}
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="coupon-details-body">
                <motion.div
                  key={selectedCouponIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="coupon-details-content"
                >
                  {/* Product Image */}
                  {selectedCoupon.productImage && (
                    <motion.img
                      src={selectedCoupon.productImage}
                      alt={selectedCoupon.productName}
                      className="coupon-details-product-image"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}

                  {/* Coupon Details */}
                  <div className="coupon-details-fields">
                    <div className="coupon-details-field">
                      <span className="coupon-details-label">المنتج:</span>
                      <span className="coupon-details-value">{selectedCoupon.productName}</span>
                    </div>

                    <div className="coupon-details-field">
                      <span className="coupon-details-label">رمز الكوبون:</span>
                      <span className="coupon-details-value coupon-details-code">
                        {selectedCoupon.couponCode}
                      </span>
                    </div>

                    <div className="coupon-details-field">
                      <span className="coupon-details-label">نوع الخصم:</span>
                      <span className="coupon-details-value">
                        {selectedCoupon.discountType === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                      </span>
                    </div>

                    <div className="coupon-details-field">
                      <span className="coupon-details-label">قيمة الخصم:</span>
                      <span className="coupon-details-value coupon-details-discount">
                        {selectedCoupon.discountType === 'percentage'
                          ? `${selectedCoupon.discountValue}%`
                          : formatPrice(selectedCoupon.discountValue)}
                      </span>
                    </div>

                    <div className="coupon-details-field coupon-details-field--highlight">
                      <span className="coupon-details-label">الوقت المتبقي:</span>
                      <span className={`coupon-details-value coupon-details-timer ${isLowTime && selectedCouponIndex === 0 ? 'coupon-details-timer--warning' : ''}`}>
                        {selectedCouponIndex === 0 ? getFirstCouponFormattedTime() : formatCouponTime(selectedCoupon.timeRemaining)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Navigation Controls */}
              {couponCount > 1 && (
                <div className="coupon-details-navigation-controls">
                  <button
                    onClick={handlePrevCoupon}
                    className="coupon-nav-button coupon-nav-button--prev"
                    aria-label="الكوبون السابق"
                  >
                    <ChevronRight className="coupon-nav-icon" />
                  </button>

                  <div className="coupon-carousel-dots">
                    {activeCoupons.map((_, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setSelectedCouponIndex(index)}
                        className={`coupon-dot ${index === selectedCouponIndex ? 'coupon-dot--active' : ''}`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={`انتقل إلى الكوبون ${index + 1}`}
                        aria-current={index === selectedCouponIndex}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNextCoupon}
                    className="coupon-nav-button coupon-nav-button--next"
                    aria-label="الكوبون التالي"
                  >
                    <ChevronLeft className="coupon-nav-icon" />
                  </button>
                </div>
              )}

              {/* Footer */}
              <div className="coupon-details-footer">
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="coupon-details-close-button"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CartCouponManager;
