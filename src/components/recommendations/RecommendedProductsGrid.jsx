import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/products";
import { getProductUrl } from "@/lib/slugUtils";
import { getProductRoutines, ROUTINE_TYPE_LABELS } from "@/lib/routineTypeConstants";

export const RecommendedProductsGrid = ({
  products = [],
  isLoading = false,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden">
            <div className="aspect-square bg-gray-200 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد منتجات</h3>
        <p className="text-gray-600">جرب اختيار مشكلة بشرة أو نوع روتين مختلف</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => navigate(getProductUrl(product))}
          className="group cursor-pointer"
        >
          <div className="h-full p-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-pink-400 hover:shadow-xl transition-all flex flex-col">
            {/* Product Image */}
            {product.main_image_url && (
              <div className="w-full h-40 bg-gray-100 rounded-xl overflow-hidden mb-4 border border-gray-200">
                <img
                  src={product.main_image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            )}

            {/* Product Name */}
            <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2">
              {product.name}
            </h3>

            {/* Short Description Arabic */}
            {product.short_description && (
              <p className="text-xs text-gray-700 mb-2 line-clamp-2">
                {product.short_description}
              </p>
            )}

            {/* Short Description English */}
            {product.short_description_en && (
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                {product.short_description_en}
              </p>
            )}

            {/* Routine Type Badges - Display both primary and secondary */}
            {(product.routine_type || product.routine_type_secondary) && (
              <div className="mb-3 flex flex-wrap gap-2">
                {getProductRoutines(product).map((routine) => {
                  const getBadgeColor = (routineType) => {
                    switch (routineType) {
                      case "morning":
                        return "bg-gray-100 text-gray-800";
                      case "night":
                        return "bg-indigo-100 text-indigo-800";
                      case "special":
                        return "bg-purple-100 text-purple-800";
                      default:
                        return "bg-gray-100 text-gray-800";
                    }
                  };

                  return (
                    <span
                      key={routine}
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(routine)}`}
                    >
                      {ROUTINE_TYPE_LABELS[routine] || routine}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Price and Button */}
            <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-200">
              <p className="text-pink-600 font-bold text-sm">
                {formatPrice(
                  product.is_discounted && product.discounted_price
                    ? product.discounted_price
                    : product.price
                )}
              </p>
              <Button
                size="sm"
                className="gradient-bg text-white text-xs h-auto px-3 py-1"
              >
                عرض
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
