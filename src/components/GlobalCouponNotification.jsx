import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Gift, AlertCircle } from 'lucide-react';
import { getAllActiveCoupons, getCouponTimeRemaining, isCouponExpired, removeCouponFromStorage, formatTimeFromMs } from '@/lib/couponPersistence';
import './GlobalCouponNotification.css';

const GlobalCouponNotification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeCoupons, setActiveCoupons] = useState({});
  const [timeRemaining, setTimeRemaining] = useState({});
  const [expiredCoupons, setExpiredCoupons] = useState(new Set());
  const timerRef = useRef(null);

  // Initial load and refresh on location change
  useEffect(() => {
    const loadActiveCoupons = () => {
      const coupons = getAllActiveCoupons();
      setActiveCoupons(coupons);

      const newTimeRemaining = {};
      const newExpiredCoupons = new Set();

      Object.keys(coupons).forEach(productId => {
        const remaining = getCouponTimeRemaining(productId);
        if (remaining !== null && remaining > 0) {
          newTimeRemaining[productId] = remaining;
        } else if (isCouponExpired(productId)) {
          newExpiredCoupons.add(productId);
        }
      });

      setTimeRemaining(newTimeRemaining);
      setExpiredCoupons(newExpiredCoupons);
    };

    loadActiveCoupons();
  }, [location]);

  // Set up countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTimeRemaining = { ...prev };
        const newExpiredCoupons = new Set(expiredCoupons);
        let hasChanges = false;

        Object.keys(newTimeRemaining).forEach(productId => {
          const remaining = getCouponTimeRemaining(productId);

          if (remaining === null || remaining === 0) {
            newExpiredCoupons.add(productId);
            delete newTimeRemaining[productId];
            hasChanges = true;
          } else if (remaining > 0) {
            newTimeRemaining[productId] = remaining;
          }
        });

        if (hasChanges) {
          setExpiredCoupons(newExpiredCoupons);
        }

        return newTimeRemaining;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [expiredCoupons]);

  // Auto-hide expired coupon notifications after 2 seconds
  useEffect(() => {
    if (expiredCoupons.size === 0) return;

    const timeout = setTimeout(() => {
      // Remove expired coupons from active coupons
      setActiveCoupons(prev => {
        const updated = { ...prev };
        expiredCoupons.forEach(productId => {
          delete updated[productId];
        });
        return updated;
      });

      // Clear expired coupons set to hide expiration message
      setExpiredCoupons(new Set());
    }, 2000);

    return () => clearTimeout(timeout);
  }, [expiredCoupons]);


  const handleNavigateToCoupon = (productId) => {
    const coupon = activeCoupons[productId];
    if (coupon && coupon.productId) {
      // Navigate to product detail page using ID (ProductDetailPage will handle the lookup)
      navigate(`/product/coupon/active/${productId}`, { state: { couponApplied: true } });
    }
  };

  // Filter active, non-expired coupons
  const visibleCoupons = Object.keys(activeCoupons).filter(productId => {
    const isCouponExpired = expiredCoupons.has(productId);
    return !isCouponExpired;
  });

  // Filter expired coupons to show expiration message
  const visibleExpiredCoupons = Array.from(expiredCoupons);

  if (visibleCoupons.length === 0 && visibleExpiredCoupons.length === 0) {
    return null;
  }

  return (
    <div className="global-coupon-notification-container">
      {/* Active Coupons */}
      {visibleCoupons.map(productId => {
        const coupon = activeCoupons[productId];
        const timeLeft = timeRemaining[productId];
        const progressPercentage = timeLeft ? (timeLeft / (5 * 60 * 1000)) * 100 : 0;

        return (
          <div
            key={`coupon-${productId}`}
            className="global-coupon-notification active-coupon"
            onClick={() => handleNavigateToCoupon(productId)}
          >
            <div className="coupon-notification-content">
              <div className="coupon-notification-icon">
                <Gift className="icon-size" />
              </div>
              <div className="coupon-notification-text">
                <span className="coupon-notification-title">
                  لديك كوبون فعال على هذا المنتج
                </span>
                <span className="coupon-notification-code">
                  {coupon?.code || 'COUPON'}
                </span>
              </div>
              <div className="coupon-notification-timer">
                <div className="timer-text">
                  ينتهي خلال <span className="timer-value">{formatTimeFromMs(timeLeft)}</span>
                </div>
                <div className="timer-progress-bar-global">
                  <div
                    className="timer-progress-fill-global"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Expired Coupons */}
      {visibleExpiredCoupons.map(productId => (
        <div
          key={`expired-coupon-${productId}`}
          className="global-coupon-notification expired-coupon"
        >
          <div className="coupon-notification-content">
            <div className="coupon-notification-icon-expired">
              <AlertCircle className="icon-size" />
            </div>
            <div className="coupon-notification-text-expired">
              <span className="coupon-notification-title-expired">
                انتهت صلاحية الكوبون
              </span>
              <span className="coupon-notification-message-expired">
                انتهت صلاحية الكوبون لهذا المنتج
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GlobalCouponNotification;
