import React, { useRef, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Eye, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useSupabase } from "@/contexts/SupabaseContext";
import { formatPrice, getDiscountedPrice } from "@/data/products";
import { useNavigate } from "react-router-dom";
import ProductPriceDisplay from "@/components/ProductPriceDisplay";
import { getProductUrl } from "@/lib/slugUtils";
import { triggerNeonBurst } from "@/lib/neonBurst";
import { protectProductImage, unprotectProductImage } from "@/lib/imageProtection";
import { getCategoryNameAr } from "@/lib/categoryUtils";
const ProductCard = React.memo(({ product, index = 0, disabled = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const audioRef = useRef(null);
  const imageRef = useRef(null);
  const { addToCart } = useCart();
  const { supabase } = useSupabase();
  const navigate = useNavigate();

  const trackAdd = async (productId) => {
    try {
      const { data, error } = await supabase
        .from('product_add_to_cart')
        .insert([{ product_id: productId }]);

      if (error) {
        console.error('AddCartTrackError(Card):', error.message);
        return;
      }

      console.log('Added to cart tracking:', data);
    } catch (err) {
      console.error('Unexpected error in trackAdd:', err);
    }
  };

  useEffect(() => {
    if (imageRef.current) {
      protectProductImage(imageRef.current);

      return () => {
        unprotectProductImage(imageRef.current);
      };
    }
  }, [product.id]);

  if (!product) {
    return null;
  }

  const handleViewProduct = () => {
    navigate(getProductUrl(product));
  };

  const originalPrice = product.price;
  const isProductDiscounted = product.is_discounted === true || (product.discount_percent && product.discount_percent > 0);
  const finalPrice = isProductDiscounted && product.discounted_price ? product.discounted_price : originalPrice;
  const discountAmount = isProductDiscounted ? Math.max(0, originalPrice - finalPrice) : 0;
  const discountPercentage = isProductDiscounted && discountAmount > 0 && originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) :
                           (isProductDiscounted && product.discount_percent ? product.discount_percent : 0);
  const hasDiscount = isProductDiscounted && (discountAmount > 0 || discountPercentage > 0);

  const mainImage = product.main_image_url || "https://via.placeholder.com/300x200?text=No+Image";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: imageLoaded || imageError ? 1 : 0, y: 0 }}
      transition={{
        duration: imageLoaded || imageError ? 0.2 : 0,
        delay: (imageLoaded || imageError) ? index * 0.05 : 0,
        ease: "easeOut"
      }}
      onClick={(e) => !disabled && handleViewProduct(e)}
      className={`flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-lg border border-pink-200/40 ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-pink-300/60 hover:shadow-2xl cursor-pointer'} transition-shadow duration-300`}
    >
      {/* Image Container - Fixed 1:1 Aspect Ratio */}
      <div className="relative w-full bg-gray-100 overflow-hidden" style={{ aspectRatio: "1 / 1" }}>
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="inline-block w-12 h-12 rounded-full border-3 border-pink-200 border-t-pink-500 animate-spin"></div>
              <p className="text-xs text-pink-600 mt-2 font-medium">جاري التحميل...</p>
            </div>
          </div>
        )}

        {!imageError ? (
          <img
            ref={imageRef}
            src={mainImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            crossOrigin="anonymous"
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${product.stock === 0 ? 'opacity-60' : ''} ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-pink-50 flex flex-col items-center justify-center p-4">
            <div className="text-4xl mb-2">🖼️</div>
            <p className="text-xs text-gray-700 text-center">{product.name}</p>
            <p className="text-xs text-gray-500 mt-1">لم تتمكن من تحميل الصورة</p>
          </div>
        )}

        {hasDiscount && (imageLoaded || imageError) && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg z-20">
            <span className="text-base mr-1">💥</span>
            <span>خصم {discountPercentage}%</span>
          </div>
        )}

        {product.is_featured && (imageLoaded || imageError) && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg z-20">
            محدودة
          </div>
        )}

        {product.stock === 0 && (imageLoaded || imageError) && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
            <div className="text-white text-xl font-bold">غير متوفر</div>
          </div>
        )}

        {imageLoaded && !imageError && !disabled && (
          <div className="absolute inset-0 bg-white/0 group hover:bg-white/70 opacity-0 hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 z-30 group">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleViewProduct();
              }}
              className="bg-gradient-to-r from-pink-100 to-pink-200 text-pink-600 hover:from-pink-200 hover:to-pink-300 text-xs px-3 py-2 border border-pink-500 font-bold"
            >
              <Eye className="h-4 w-4 mr-1" strokeWidth={2} />
              عرض
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                triggerNeonBurst(e.currentTarget);
                addToCart(product);
                trackAdd(product.id);
              }}
              className="add-to-cart-button text-white text-xs px-3 py-2 shadow-lg font-bold relative overflow-visible"
              disabled={product.stock === 0}
            >
              <ShoppingCart className="h-4 w-4 mr-1" strokeWidth={2} />
              إضافة
            </Button>
          </div>
        )}
      </div>

      {/* Content Container */}
      {(imageLoaded || imageError) && (
        <div className="flex flex-col flex-1 p-4 bg-white">
          {/* Product Title */}
          <h3
            className="text-gray-900 mb-3 line-clamp-2 text-center"
            title={product.name}
            style={{ font: '16px/20px Cagliostro, sans-serif' }}
          >
            {product.name}
          </h3>

          {/* Price Display */}
          <div className="mb-3 py-2">
            <ProductPriceDisplay
              price={originalPrice}
              discountedPrice={hasDiscount ? finalPrice : 0}
              className="w-full"
              finalPriceClassName="text-pink-500 font-bold"
              originalPriceClassName="text-gray-500 line-through text-sm"
              discountTextClassName="text-sm font-semibold text-pink-600"
            />
          </div>

          {/* Product Info Row */}
          <div className="py-2 border-t border-gray-200 mb-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
              {/* Barcode/Code */}
              <div className="flex items-center gap-1">
                <span>🏷️</span>
                <span className="font-mono">{product.barcode || 'N/A'}</span>
              </div>

              {/* Separator */}
              <span className="text-gray-400">•</span>

              {/* Category - Clickable */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) {
                    navigate(`/products/${product.category}`);
                  }
                }}
                className={`flex items-center gap-1 transition-colors ${disabled ? 'cursor-not-allowed text-gray-500' : 'hover:text-pink-600 hover:font-semibold'}`}
                title={disabled ? 'غير متاح أثناء الصيانة' : `تصفية حسب: ${getCategoryNameAr(product.category)}`}
                disabled={disabled}
              >
                <span>💎</span>
                <span>{getCategoryNameAr(product.category)}</span>
              </button>

              {/* Separator */}
              <span className="text-gray-400">•</span>

              {/* Stock/Availability */}
              <div className="flex items-center gap-1">
                <span>📦</span>
                <span>{product.stock}</span>
                <span className="text-green-600 font-semibold">متوفر</span>
              </div>
            </div>
          </div>

          {/* Audio Player (if applicable) */}
          {product.audio_url && (
            <div className="mb-3">
              <audio
                ref={audioRef}
                src={product.audio_url}
                preload="none"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const a = audioRef.current;
                  if (!a) return;
                  if (isPlaying) a.pause();
                  else a.play().catch(() => {});
                }}
                className="w-full inline-flex items-center justify-center border-pink-500 text-pink-500 hover:bg-pink-50 text-sm font-bold py-2"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 mr-1" />
                ) : (
                  <Play className="h-4 w-4 mr-1" />
                )}
                <span>{isPlaying ? "إيقاف" : "استماع"}</span>
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-auto">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                triggerNeonBurst(e.currentTarget);
                addToCart(product);
                trackAdd(product.id);
              }}
              aria-label="Add to cart"
              title="أضف إلى السلة"
              className="flex-1 add-to-cart-button text-white text-sm font-bold py-3 px-2 shadow-lg hover:shadow-lg transition-all relative overflow-visible"
              disabled={product.stock === 0}
            >
              <ShoppingCart className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline mr-1">إضافة للسلة</span>
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleViewProduct();
              }}
              variant="outline"
              className="flex-1 border-pink-500 text-pink-500 hover:bg-pink-50 text-sm font-bold py-3 px-2 inline-flex items-center justify-center gap-1 rounded transition-all"
            >
              <Eye className="h-4 w-4" strokeWidth={2} />
              عرض
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip render), false if different (render)
  return (
    prevProps.product?.id === nextProps.product?.id &&
    prevProps.index === nextProps.index
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
