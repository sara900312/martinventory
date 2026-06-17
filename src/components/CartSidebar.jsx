import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingCart, Lock, ExternalLink, Gift, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/data/products';
import { useNavigate, Link } from 'react-router-dom';
import ProductPriceDisplay from '@/components/ProductPriceDisplay';
import { getCouponFromStorage, formatTimeFromMs, getCouponTimeRemaining } from '@/lib/couponPersistence';
import { getProductUrl } from '@/lib/slugUtils';
import CartCouponManager from '@/components/CartCouponManager';

const CartSidebar = () => {
  const { cartItems, isOpen, setIsOpen, updateQuantity, removeFromCart, getTotalPrice } = useCart();
  const navigate = useNavigate();
  const [activeCoupons, setActiveCoupons] = useState({});
  const [couponTimers, setCouponTimers] = useState({});

  // Check for active coupons on cart items
  useEffect(() => {
    const couponsMap = {};
    const timersMap = {};
    cartItems.forEach((item) => {
      const coupon = getCouponFromStorage(item.id);
      if (coupon) {
        couponsMap[item.id] = coupon;
        const timeRemaining = getCouponTimeRemaining(item.id);
        if (timeRemaining !== null) {
          timersMap[item.id] = timeRemaining;
        }
      }
    });
    setActiveCoupons(couponsMap);
    setCouponTimers(timersMap);
  }, [cartItems]);

  // Monitor coupon expiration and refresh the lock status
  useEffect(() => {
    if (Object.keys(activeCoupons).length === 0) return;

    const interval = setInterval(() => {
      const couponsMap = {};
      const timersMap = {};
      cartItems.forEach((item) => {
        const coupon = getCouponFromStorage(item.id);
        if (coupon) {
          couponsMap[item.id] = coupon;
          const timeRemaining = getCouponTimeRemaining(item.id);
          if (timeRemaining !== null) {
            timersMap[item.id] = timeRemaining;
          }
        }
      });
      setActiveCoupons(couponsMap);
      setCouponTimers(timersMap);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCoupons, cartItems]);

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  const hasCoupon = (productId) => {
    return activeCoupons[productId] !== undefined;
  };

  const CartIcon = ShoppingCart; 

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-50"
            aria-hidden="true"
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-pink-200/30 z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-sidebar-title"
          >
            <div className="flex items-center justify-between p-4 border-b border-pink-200/30">
              <h2 id="cart-sidebar-title" className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
                <CartIcon className="h-5 w-5" strokeWidth={2} />
                سلة التسوق
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-[#5A3E55] hover:bg-transparent"
                aria-label="Close shopping cart"
              >
                <X className="h-5 w-5" strokeWidth={2}/>
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="text-center text-[#1A1A1A] mt-8">
                  <CartIcon className="h-16 w-16 mx-auto mb-4 opacity-100" strokeWidth={1.5} />
                  <p>السلة فارغة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.cartItemId || item.id}
                      layout
                      className="rounded-lg p-4 border border-pink-200 bg-white"
                    >
                      <div className="flex gap-3">
                        <Link
                          to={getProductUrl(item)}
                          className="shrink-0"
                        >
                          <img
                            src={item.main_image_url || 'https://via.placeholder.com/100'}
                            alt={item.name}
                            crossOrigin="anonymous"
                            onError={(e) => {e.target.src = 'https://via.placeholder.com/100';}}
                            className="w-16 h-16 object-cover rounded-lg hover:opacity-80 transition-opacity"
                          />
                        </Link>
                        <div className="flex-1">
                          <Link
                            to={getProductUrl(item)}
                            className="block group"
                          >
                            <h3 className="text-[#1A1A1A] font-medium text-sm mb-1 group-hover:text-pink-500 transition-colors flex items-center gap-1">
                              {item.name}
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h3>
                          </Link>
                          {item.discountedQuantity > 0 && item.discountedPrice !== null ? (
                            <div className="flex flex-col gap-1 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-pink-500 font-bold">
                                  {item.discountedQuantity} × {formatPrice(item.discountedPrice)}
                                </span>
                                <span className="text-gray-500 text-[10px]">بعد الخصم</span>
                              </div>
                              {item.regularQuantity > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[#1A1A1A] font-bold">
                                    {item.regularQuantity} × {formatPrice(item.regularPrice)}
                                  </span>
                                  <span className="text-gray-500 text-[10px]">السعر الأصلي</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between border-t border-gray-200 pt-1 mt-1">
                                <span className="text-gray-600 text-[10px]">المجموع:</span>
                                <span className="text-pink-500 font-bold">
                                  {formatPrice(
                                    item.discountedQuantity * item.discountedPrice +
                                    item.regularQuantity * item.regularPrice
                                  )}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <ProductPriceDisplay
                              price={item.price}
                              discountedPrice={item.discounted_price}
                              finalPriceClassName="text-pink-500 font-bold text-sm"
                              originalPriceClassName="text-[#1A1A1A] text-xs line-through mr-1"
                              discountTextClassName="text-pink-500 text-xs ml-1"
                            />
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity - 1)}
                                className={`h-8 w-8 ${
                                  item.couponApplied
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-[#1A1A1A] hover:bg-transparent'
                                }`}
                                aria-label={`Decrease quantity of ${item.name}`}
                                disabled={item.couponApplied}
                                title={item.couponApplied ? 'الكمية مقفلة - الكوبون نشط' : 'تقليل الكمية'}
                              >
                                <Minus className="h-4 w-4" strokeWidth={2} />
                              </Button>
                              <span className="text-[#1A1A1A] w-8 text-center font-semibold" aria-live="polite">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity + 1)}
                                className={`h-8 w-8 ${
                                  item.couponApplied || item.quantity >= item.stock
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-[#1A1A1A] hover:bg-transparent'
                                }`}
                                aria-label={`Increase quantity of ${item.name}`}
                                disabled={item.couponApplied || item.quantity >= item.stock}
                                title={item.couponApplied ? 'الكمية مقفلة - الكوبون نشط' : 'زيادة الكمية'}
                              >
                                <Plus className="h-4 w-4" strokeWidth={2} />
                              </Button>
                            </div>
                            {item.couponApplied ? (
                              <div
                                className="text-amber-600 flex items-center gap-1 text-xs font-bold px-2 py-1 bg-amber-50 rounded-md"
                                title="لا يمكن تعديل الكمية أثناء تفعيل الكوبون"
                              >
                                <Lock className="h-4 w-4" />
                                مقفلة
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.cartItemId || item.id)}
                                className="text-rose-400 hover:text-rose-500 hover:bg-transparent"
                                aria-label={`Remove ${item.name} from cart`}
                              >
                                حذف
                              </Button>
                            )}
                          </div>
                           {item.couponApplied && (
                              <p className="text-amber-600 text-xs mt-2 font-medium flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                الكمية مقفلة بسبب الكوبون
                              </p>
                           )}
                           {item.quantity >= item.stock && !item.couponApplied && (
                              <p className="text-rose-400 text-xs mt-1">الحد الأقصى للكمية المتاحة</p>
                           )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4 border-t border-pink-200/30 space-y-4">
                <div className="flex justify-center">
                  <CartCouponManager />
                </div>


                <div className="flex justify-between items-center">
                  <span className="text-[#1A1A1A] font-bold">المجموع:</span>
                  <span className="text-pink-500 font-bold text-lg">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full gradient-bg hover:opacity-90 text-white font-bold"
                >
                  إتمام الطلب
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
