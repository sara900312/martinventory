import React from 'react';
import { motion } from 'framer-motion';
import { formatPrice } from '@/data/products';
import { Package2 } from 'lucide-react';

const OrderSummary = ({ items = [], subtotal }) => {
  const deliveryCost = {
    baghdad: 5000,
    other: 7000
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="order-summary-card rounded-lg p-6"
    >
      <h3 className="text-xl font-bold text-cosmetic-dark-purple mb-4 flex items-center gap-2">
        <Package2 className="h-5 w-5" />
        ملخص الطلب
      </h3>

      <div className="space-y-4 mb-6">
        {items.map((item, index) => {
          // Handle split pricing for coupons with maximum quantity
          const hasSplitPricing = item.discountedQuantity > 0 && item.discountedPrice !== null;
          let itemTotal = 0;

          if (hasSplitPricing) {
            itemTotal = (item.discountedQuantity * item.discountedPrice) + (item.regularQuantity * item.regularPrice);
          } else {
            const finalPrice = item.discounted_price && item.discounted_price < item.price
              ? item.discounted_price
              : item.price;
            itemTotal = finalPrice * item.quantity;
          }

          const finalPrice = item.discounted_price && item.discounted_price < item.price
            ? item.discounted_price
            : item.price;
          const hasDiscount = item.discounted_price && item.discounted_price < item.price;

          return (
            <motion.div
              key={item.cartItemId || item.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="order-summary-item-card rounded-lg p-4 border"
            >
              {/* معلومات المنتج الأساسية */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="order-summary-quantity-badge px-2 py-1 rounded text-sm font-medium">
                      {item.quantity} x
                    </span>
                    <h4 className="order-summary-text font-medium">{item.name}</h4>
                  </div>
                </div>

                {/* السعر */}
                <div className="text-left">
                  <div className="order-summary-discount-price font-bold">
                    {formatPrice(itemTotal)}
                  </div>
                </div>
              </div>

              {/* تفاصيل السعر */}
              <div className="border-t border-cosmetic-lilac-border pt-2 text-xs">
                {hasSplitPricing ? (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="order-summary-label">{item.discountedQuantity} وحدة مع خصم:</span>
                        <span className="order-summary-discount-price font-medium">
                          {formatPrice(item.discountedQuantity * item.discountedPrice)}
                        </span>
                      </div>
                      {item.regularQuantity > 0 && (
                        <div className="flex justify-between">
                          <span className="order-summary-label">{item.regularQuantity} وحدة السعر الأصلي:</span>
                          <span className="order-summary-text font-medium">
                            {formatPrice(item.regularQuantity * item.regularPrice)}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="order-summary-label">سعر القطعة:</span>
                      <span className="flex items-center gap-2">
                        {hasDiscount && (
                          <span className="order-summary-original-price line-through">
                            {formatPrice(item.price)}
                          </span>
                        )}
                        <span className={hasDiscount ? "order-summary-discount-price font-medium" : "order-summary-text"}>
                          {formatPrice(finalPrice)}
                        </span>
                      </span>
                    </div>
                    {hasDiscount && (
                      <div className="flex justify-between mt-1">
                        <span className="order-summary-label">مقدار الخصم:</span>
                        <span className="order-summary-discount-price font-medium">
                          -{formatPrice((item.price - finalPrice) * item.quantity)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="border-t border-cosmetic-lilac-border pt-4 mb-4 subtotal-section">
        <div className="flex justify-between mb-2">
          <span className="order-summary-label">المجموع الفرعي:</span>
          <span className="order-summary-text font-bold">{formatPrice(subtotal)}</span>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 mb-4">
        <div className="delivery-cost-card text-center mb-4 p-4 rounded-lg">
          <h4 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
            <span className="text-2xl">🚚</span>
            تكلفة التوصيل:
          </h4>
          <div className="space-y-2 font-bold">
            <p>بغداد: {formatPrice(deliveryCost.baghdad)}</p>
            <p>المحافظات الأخرى: {formatPrice(deliveryCost.other)}</p>
          </div>
          <p className="mt-3 text-sm">ملاحظة: أسعار التوصيل قابلة للتغيير حسب حجم الطلب وكميته.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderSummary;
