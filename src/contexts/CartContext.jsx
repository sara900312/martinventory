import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { playSound } from '@/lib/soundPlayer';
import { checkProductStock } from '@/lib/inventoryManager';
import { useSupabase } from '@/contexts/SupabaseContext';
import { getCouponFromStorage, clearAllCouponStorage, isValidCouponStored, getCouponTimeRemaining, removeCouponFromStorage } from '@/lib/couponPersistence';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [persistedCoupon, setPersistedCoupon] = useState(null);

  useEffect(() => {
    const savedCart = localStorage.getItem('neomart-cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      // Ensure all items have cartItemId for unique identification
      const migratedCart = parsedCart.map(item => {
        if (!item.cartItemId) {
          const cartItemId = item.couponApplied && item.appliedCoupon
            ? `${item.id}-${item.appliedCoupon.code}`
            : `${item.id}`;
          return { ...item, cartItemId };
        }
        return item;
      });
      setCartItems(migratedCart);
    }

    // Load persisted coupon from localStorage
    const coupon = getCouponFromStorage();
    if (coupon) {
      setPersistedCoupon(coupon);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('neomart-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (toastMessage) {
      toast(toastMessage);
      setToastMessage(null);
    }
  }, [toastMessage]);

  const calculateSplitPricing = (product, totalQuantity) => {
    const hasCoupon = product.couponApplied && product.appliedCoupon;

    if (!hasCoupon || !product.appliedCoupon.maximumQuantity) {
      // No coupon or no max quantity limit - all units at same price
      return {
        discountedQuantity: 0,
        regularQuantity: totalQuantity,
        discountedPrice: null,
        regularPrice: product.price,
      };
    }

    const maxQty = product.appliedCoupon.maximumQuantity;
    const discountedQty = Math.min(totalQuantity, maxQty);
    const regularQty = totalQuantity - discountedQty;

    // Get the original price from the coupon, with fallback to product.price if not set
    const originalPrice = product.appliedCoupon.originalPrice || product.price;

    return {
      discountedQuantity: discountedQty,
      regularQuantity: regularQty,
      discountedPrice: product.price, // The product.price is already the discounted price when coupon is applied
      regularPrice: originalPrice, // The original price before discount
    };
  };

  const addToCartLogic = (currentCart, product, quantity) => {
    const cartItemId = product.couponApplied && product.appliedCoupon
      ? `${product.id}-${product.appliedCoupon.code}`
      : `${product.id}`;

    const availableStock = product.stock || 0;
    const hasCoupon = product.couponApplied && product.appliedCoupon;
    const maxCouponQty = hasCoupon ? product.appliedCoupon.maximumQuantity : null;

    // Find existing item with the same product ID (regardless of coupon)
    const existingCouponedIndex = currentCart.findIndex(
      item => item.id === product.id && item.couponApplied && item.appliedCoupon?.code === product.appliedCoupon?.code
    );

    // Check if adding to existing coupon item would exceed the maximum quantity
    if (existingCouponedIndex > -1 && maxCouponQty) {
      const existingItem = currentCart[existingCouponedIndex];
      const wouldExceedLimit = existingItem.quantity + quantity > maxCouponQty;

      if (wouldExceedLimit) {
        // Create a new item without coupon for the overflow quantity
        const quantityThatFitsUnderCoupon = Math.max(0, maxCouponQty - existingItem.quantity);
        const quantityWithoutCoupon = quantity - quantityThatFitsUnderCoupon;

        // Add the quantity that doesn't fit the coupon as a new item WITHOUT coupon
        if (quantityWithoutCoupon > 0) {
          const newCartItemId = `${product.id}`;
          const originalPrice = product.appliedCoupon?.originalPrice || product.price;
          const newProduct = {
            ...product,
            cartItemId: newCartItemId,
            quantity: quantityWithoutCoupon,
            couponApplied: false,
            appliedCoupon: null,
            price: originalPrice,
            main_image_url: product.main_image_url || (product.images && product.images.length > 0 ? product.images[0] : null) || 'https://via.placeholder.com/100',
            discountedQuantity: 0,
            regularQuantity: quantityWithoutCoupon,
            discountedPrice: null,
            regularPrice: originalPrice,
          };
          currentCart.push(newProduct);

          setToastMessage({
            title: "تم إضافة المنتج",
            description: `تم إضافة ${quantityWithoutCoupon} منتج بدون خصم (تم استنفاد حد الكوبون)`,
          });
        }
        return currentCart;
      }
    }

    // Standard logic for items that don't exceed coupon limits
    const existingIndex = currentCart.findIndex(item => item.cartItemId === cartItemId);

    if (existingIndex > -1) {
      const existingItem = currentCart[existingIndex];
      let newQuantity = existingItem.quantity + quantity;

      if (newQuantity > availableStock) {
        setToastMessage({
          title: "كمية غير متوفرة",
          description: `لا يمكنك إضافة أكثر من ${availableStock} قطعة من هذا المنتج.`,
          variant: "destructive",
        });
        newQuantity = availableStock;
      } else {
        setToastMessage({
          title: "تم تحديث السلة",
          description: `تم زيادة كمية ${product.name}`,
        });
      }

      // Check if new quantity exceeds coupon limit
      if (maxCouponQty && newQuantity > maxCouponQty) {
        newQuantity = maxCouponQty;
      }

      // Calculate split pricing for updated quantity
      const splitPricing = calculateSplitPricing(product, newQuantity);

      currentCart[existingIndex] = {
        ...existingItem,
        quantity: newQuantity,
        discountedQuantity: splitPricing.discountedQuantity,
        regularQuantity: splitPricing.regularQuantity,
        discountedPrice: splitPricing.discountedPrice,
        regularPrice: splitPricing.regularPrice,
      };
    } else {
      // New item
      let finalQuantity = quantity;
      if (finalQuantity > availableStock) {
        setToastMessage({
          title: "كمية غير متوفرة",
          description: `لا يمكنك إضافة أكثر من ${availableStock} قطعة من هذا المنتج.`,
          variant: "destructive",
        });
        finalQuantity = availableStock;
      } else {
        setToastMessage({
          title: "تم إضافة المنتج",
          description: `تم إضافة ${product.name} إلى السلة`,
        });
      }

      // Cap quantity at coupon limit if applicable
      if (maxCouponQty) {
        finalQuantity = Math.min(finalQuantity, maxCouponQty);
      }

      // Calculate split pricing for new item
      const splitPricing = calculateSplitPricing(product, finalQuantity);

      const productToAdd = {
        ...product,
        cartItemId,
        quantity: finalQuantity,
        main_image_url: product.main_image_url || (product.images && product.images.length > 0 ? product.images[0] : null) || 'https://via.placeholder.com/100',
        discountedQuantity: splitPricing.discountedQuantity,
        regularQuantity: splitPricing.regularQuantity,
        discountedPrice: splitPricing.discountedPrice,
        regularPrice: splitPricing.regularPrice,
      };
      currentCart.push(productToAdd);
    }
    return currentCart;
  };

  const addToCart = (product, quantity = 1) => {
    if (!product || !product.id) {
        console.error("Attempted to add an invalid product to the cart.");
        return;
    }

    setCartItems(prev => {
      let newCart = addToCartLogic([...prev], product, quantity);
      playSound('addToCart');
      return newCart;
    });
  };

  const removeFromCart = (cartItemId) => {
    // Remove the product from cart using unique cartItemId
    setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));

    setToastMessage({
      title: "تم حذف المنتج",
      description: "تم حذف المنتج من السلة",
    });
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    setCartItems(prev => {
      const itemIndex = prev.findIndex(item => item.cartItemId === cartItemId);
      if (itemIndex === -1) return prev;

      const itemToUpdate = prev[itemIndex];
      const availableStock = itemToUpdate.stock || 0;
      const hasCoupon = isValidCouponStored(itemToUpdate.id) && itemToUpdate.couponApplied;
      const maxCouponQty = hasCoupon && itemToUpdate.appliedCoupon?.maximumQuantity
        ? itemToUpdate.appliedCoupon.maximumQuantity
        : null;

      // LOCK: Prevent ANY quantity changes while coupon is active
      if (hasCoupon && newQuantity !== itemToUpdate.quantity) {
        setToastMessage({
          title: "لا يمكن تعديل الكمية",
          description: "الكمية مقفلة أثناء تفعيل الكوبون. يرجى إزالة الكوبون أولاً.",
          variant: "destructive",
        });
        return prev;
      }

      if (newQuantity <= 0) {
        setToastMessage({
          title: "تم حذف المنتج",
          description: "تم حذف المنتج من السلة",
        });
        return prev.filter(item => item.cartItemId !== cartItemId);
      }

      if (newQuantity > availableStock) {
        setToastMessage({
          title: "كمية غير متوفرة",
          description: `الكمية المتاحة هي ${availableStock} فقط.`,
          variant: "destructive",
        });
        newQuantity = availableStock;
      }

      // Calculate split pricing for updated quantity
      const splitPricing = calculateSplitPricing(itemToUpdate, newQuantity);

      const newCart = [...prev];
      newCart[itemIndex] = {
        ...itemToUpdate,
        quantity: newQuantity,
        discountedQuantity: splitPricing.discountedQuantity,
        regularQuantity: splitPricing.regularQuantity,
        discountedPrice: splitPricing.discountedPrice,
        regularPrice: splitPricing.regularPrice,
      };
      return newCart;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('neomart-cart');
    // Clear all associated coupons when entire cart is cleared
    clearAllCouponStorage();
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      // Handle split pricing if coupon with max quantity is applied
      if (item.discountedQuantity > 0 && item.discountedPrice !== null) {
        const discountedTotal = item.discountedQuantity * item.discountedPrice;
        const regularTotal = item.regularQuantity * item.regularPrice;
        return total + discountedTotal + regularTotal;
      }

      // For items without split pricing, use regular calculation
      return total + (item.price * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Check and remove expired coupons from cart items
  const cleanExpiredCoupons = () => {
    setCartItems(prev => {
      let hasExpiredCoupons = false;
      const updatedCart = prev.map(item => {
        if (item.couponApplied && item.appliedCoupon) {
          const timeRemaining = getCouponTimeRemaining(item.id);
          // If time remaining is null or <= 0, coupon is expired
          if (timeRemaining === null || timeRemaining <= 0) {
            hasExpiredCoupons = true;
            // Remove coupon from storage
            removeCouponFromStorage(item.id);

            // Toast notification
            setToastMessage({
              title: 'انتهت صلاحية الكوبون',
              description: `تم إزالة الكوبون من ${item.name}. الكمية أصبحت غير مقفلة.`,
            });

            // Return item without coupon
            return {
              ...item,
              couponApplied: false,
              appliedCoupon: null,
              price: item.appliedCoupon?.originalPrice || item.price,
              discountedQuantity: 0,
              regularQuantity: item.quantity,
              discountedPrice: null,
              regularPrice: item.appliedCoupon?.originalPrice || item.price,
            };
          }
        }
        return item;
      });

      return hasExpiredCoupons ? updatedCart : prev;
    });
  };

  // Monitor for expired coupons periodically
  useEffect(() => {
    const interval = setInterval(() => {
      cleanExpiredCoupons();
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    isOpen,
    setIsOpen,
    persistedCoupon,
    cleanExpiredCoupons,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
