import React, { useCallback, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, AlertCircle, CheckCircle, Loader, ChevronDown, Sun, Moon, Sparkles, BookOpen, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useSupabase } from "@/contexts/SupabaseContext";
import { useSkinProblemsById } from "@/hooks/useSkinProblemsById";
import { checkProductStock } from "@/lib/inventoryManager";
import { getProductUrl } from "@/lib/slugUtils";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export const ProductRecommendations = ({
  products = [],
  skinProblem = null,
  routineType = null,
  isLoading = false,
}) => {
  const [isImportantTipOpen, setIsImportantTipOpen] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [expandedProblemsId, setExpandedProblemsId] = useState(null);
  const { addToCart } = useCart();
  const { supabase } = useSupabase();
  const navigate = useNavigate();

  // Collect all unique skin problem IDs from products
  const allSkinProblemIds = useMemo(() => {
    const ids = new Set();
    products.forEach(product => {
      if (product.skin_problems && Array.isArray(product.skin_problems)) {
        product.skin_problems.forEach(id => ids.add(id));
      }
    });
    return Array.from(ids);
  }, [products]);

  // Fetch all skin problems data
  const { data: skinProblemsData = [] } = useSkinProblemsById(allSkinProblemIds);

  const getRoutineLabel = (routine) => {
    const labels = {
      morning: "🌅 صباحي",
      night: "🌙 ليلي",
      both: "🌅 🌙 صباحي وليلي",
      special: "✨ خاص",
    };
    return labels[routine] || routine;
  };

  const getRoutineIcon = (routine) => {
    const icons = {
      morning: <Sun size={18} className="text-yellow-600" />,
      night: <Moon size={18} className="text-indigo-600" />,
      both: <Sparkles size={18} className="text-pink-600" />,
      special: <Sparkles size={18} className="text-purple-600" />,
    };
    return icons[routine] || null;
  };

  // Get all routine icons for a product
  const getProductRoutineIcons = (product) => {
    const routines = new Set();

    // Add primary routine
    if (product.routine_type) {
      routines.add(product.routine_type);
    }

    // Add secondary routine if it's different from primary
    if (product.routine_type_secondary && product.routine_type_secondary !== product.routine_type) {
      routines.add(product.routine_type_secondary);
    }

    return Array.from(routines);
  };

  // Get all problem icons for a product
  const getProductProblemIcons = (product) => {
    if (!product.skin_problems || !Array.isArray(product.skin_problems)) {
      return [];
    }
    return product.skin_problems
      .map(problemId => skinProblemsData.find(p => p.id === problemId))
      .filter(Boolean);
  };

  // Get available stock (use stock directly)
  const getAvailableStock = (product) => {
    return product.stock || 0;
  };

  const isProductInStock = (product) => {
    return product.stock > 0;
  };

  const getStockStatus = (product) => {
    const stock = product.stock || 0;
    if (stock === 0) return "غير متوفر";
    if (stock < 5) return `متوفر: ${stock} فقط`;
    return "متوفر";
  };

  const getStockColor = (product) => {
    const stock = product.stock || 0;
    if (stock === 0) return "text-red-600 bg-red-50 border-red-300";
    if (stock < 5) return "text-yellow-600 bg-yellow-50 border-yellow-300";
    return "text-green-600 bg-green-50 border-green-300";
  };

  const handleAddToCart = useCallback(
    async (product, e) => {
      // Prevent navigation if clicking add to cart button
      if (e) {
        e.stopPropagation();
      }

      // Check current stock before adding
      if (!supabase) {
        toast({
          title: "خطأ",
          description: "لم يتم الاتصال بقاعدة البيانات",
          variant: "destructive",
        });
        return;
      }

      const stockCheck = await checkProductStock(supabase, product.id, 1);
      if (!stockCheck.available) {
        toast({
          title: "غير متوفر",
          description: stockCheck.reason,
          variant: "destructive",
        });
        return;
      }

      addToCart(product, 1);
      toast({
        title: "تمت الإضافة",
        description: `تم إضافة "${product.name}" إلى السلة`,
      });
    },
    [supabase, addToCart]
  );

  const handleViewProduct = useCallback(
    (product, e) => {
      if (e) {
        e.stopPropagation();
      }
      navigate(getProductUrl(product));
    },
    [navigate]
  );

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <Loader className="w-12 h-12 text-pink-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">جاري تحميل المنتجات...</p>
      </motion.div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl"
      >
        <span className="text-6xl mb-4">📦</span>
        <p className="text-lg text-gray-700 font-medium">
          لا توجد منتجات مناسبة
        </p>
        <p className="text-sm text-gray-500 mt-2">
          يرجى اختيار مشكلة بشرة أو نوع روتين مختلف
        </p>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      {/* Header info */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="recommendation-info-card mb-6 py-3 px-4"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs text-pink-700 font-semibold mb-1 uppercase tracking-wide">المنتجات المقترحة</p>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-0">
              {products.length} منتج مناسب لك ✨
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            {skinProblem && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-3 py-1.5 rounded-full bg-white border border-pink-300 text-xs font-semibold text-pink-700 shadow-sm hover:shadow-md transition-all"
              >
                {skinProblem.emoji && `${skinProblem.emoji} `}
                {skinProblem.name_ar || skinProblem}
              </motion.div>
            )}
            {routineType && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-3 py-1.5 rounded-full bg-white border border-pink-300 text-xs font-semibold text-pink-700 shadow-sm hover:shadow-md transition-all"
              >
                ⏰ {getRoutineLabel(routineType)}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Products Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
      >
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative rounded-xl overflow-hidden bg-white border border-gray-200 hover:border-pink-300 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Product Image */}
            <div
              className="relative h-32 sm:h-44 lg:h-56 overflow-hidden bg-gray-100"
              onMouseEnter={() => setHoveredProductId(product.id)}
              onMouseLeave={() => setHoveredProductId(null)}
            >
              {product.main_image_url ? (
                <img
                  src={product.main_image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                  <ShoppingCart className="w-12 h-12 text-gray-400" />
                </div>
              )}

              {/* Stock Status Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-lg border ${getStockColor(product)}`}
              >
                {getStockStatus(product)}
              </motion.div>

              {/* Discount badge */}
              {product.is_discounted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
                >
                  خصم
                </motion.div>
              )}
            </div>

            {/* Content - Changes based on expanded state */}
            <AnimatePresence mode="wait">
              {expandedProductId === product.id ? (
                // Info View
                <motion.div
                  key="info"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col flex-1 p-4"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm mb-3 line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg p-3 border border-pink-200 mb-4">
                      {product.short_description && (
                        <p className="text-xs text-gray-700 leading-relaxed mb-2">
                          {product.short_description}
                        </p>
                      )}
                      {product.short_description_en && (
                        <p className="text-xs text-gray-600 leading-relaxed mb-2 italic">
                          {product.short_description_en}
                        </p>
                      )}
                      {!product.short_description && !product.short_description_en && (
                        <p className="text-xs text-gray-600 leading-relaxed">
                          منتج متخصص من {product.brand || 'ماركة موثوقة'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Buttons in info view */}
                  <div className="flex flex-col gap-2">
                    <motion.button
                      onClick={() => handleViewProduct(product)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <Eye size={16} strokeWidth={2} />
                      عرض المنتج
                    </motion.button>
                    <motion.button
                      onClick={() => setExpandedProductId(null)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all"
                    >
                      إغلاق
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                // Product View
                <motion.div
                  key="product"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col flex-1 p-2 sm:p-4"
                >
                  {/* Product name */}
                  <h3 className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-3">
                    {product.name}
                  </h3>

                  {/* Routine Icons - Outside and above pink frame */}
                  <div className="mb-2 sm:mb-3">
                    <div className="flex gap-1.5 sm:gap-2 items-center justify-center flex-wrap">
                      {getProductRoutineIcons(product).length > 0 ? (
                        getProductRoutineIcons(product).map((routine) => (
                          <motion.div
                            key={routine}
                            title={getRoutineLabel(routine)}
                            className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-md border-2 border-pink-400"
                            whileHover={{ scale: 1.15 }}
                          >
                            {getRoutineIcon(routine)}
                          </motion.div>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500 italic">بدون روتين</span>
                      )}
                    </div>
                  </div>

                  {/* Problems - Button that opens modal */}
                  <div className="mb-2 sm:mb-3">
                    <motion.button
                      onClick={() => setExpandedProblemsId(expandedProblemsId === product.id ? null : product.id)}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-200 text-left hover:border-pink-300 transition-all flex items-center justify-between"
                    >
                      <span className="text-xs font-semibold text-gray-700">المشاكل المعالجة:</span>
                      <motion.div
                        animate={{ rotate: expandedProblemsId === product.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={14} className="sm:w-4 sm:h-4 text-pink-600" />
                      </motion.div>
                    </motion.button>
                  </div>

                  {/* Price section */}
                  <div className="mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-base sm:text-lg text-pink-600">
                        {typeof product.price === 'number' && product.price > 1000
                          ? `${(product.discounted_price || product.price).toLocaleString('ar-SA')} د.ع`
                          : `${(product.discounted_price || product.price).toLocaleString('ar-SA')} د.ع`}
                      </span>
                      {product.is_discounted && product.price !== product.discounted_price && (
                        <span className="text-xs text-gray-500 line-through">
                          {typeof product.price === 'number' && product.price > 1000
                            ? `${product.price.toLocaleString('ar-SA')} د.ع`
                            : `${product.price.toLocaleString('ar-SA')} د.ع`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="mb-2 sm:mb-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStockColor(product)}`}>
                      {getStockStatus(product)}
                    </span>
                  </div>

                  {/* Button at bottom */}
                  <motion.button
                    onClick={() => setExpandedProductId(product.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-auto w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-2 sm:py-3 px-4 sm:px-5 text-sm sm:text-base rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <BookOpen size={18} strokeWidth={2} className="sm:w-5 sm:h-5" />
                    قراءة المعلومات
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>

      {/* Problems Modal Popup */}
      <AnimatePresence>
        {expandedProblemsId && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedProblemsId(null)}
              className="fixed inset-0 bg-black/50 z-40"
              style={{ position: 'fixed' }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 z-50 bg-white rounded-2xl shadow-2xl p-4 sm:p-6 max-w-sm"
              style={{
                transform: 'translate(-50%, -50%)',
                position: 'fixed',
                width: '85vw',
                maxWidth: '450px',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxSizing: 'border-box'
              }}
            >
              {/* Close button */}
              <motion.button
                onClick={() => setExpandedProblemsId(null)}
                whileHover={{ scale: 1.1 }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <ChevronDown size={24} className="rotate-180" />
              </motion.button>

              {/* Modal Title */}
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 pr-8">المشاكل المعالجة</h3>

              {/* Problems List */}
              <div className="space-y-2 sm:space-y-3 max-h-[60vh] overflow-y-auto">
                {getProductProblemIcons(
                  products.find(p => p.id === expandedProblemsId) || {}
                ).map((problem, idx) => (
                  <motion.div
                    key={problem.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border-2 border-pink-200 hover:border-pink-400 transition-all"
                  >
                    <span className="text-xl sm:text-2xl flex-shrink-0">{problem.emoji || '🔹'}</span>
                    <span className="text-gray-700 font-semibold text-xs sm:text-sm">{problem.name_ar}</span>
                  </motion.div>
                ))}
              </div>

              {/* Close button at bottom */}
              <motion.button
                onClick={() => setExpandedProblemsId(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full mt-4 sm:mt-6 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-lg transition-all"
              >
                إغلاق
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Important Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-12"
      >
        <button
          onClick={() => setIsImportantTipOpen(!isImportantTipOpen)}
          className="w-full flex items-center justify-between px-6 py-4 rounded-lg bg-cover bg-center bg-no-repeat text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 opacity-74"
          style={{
            backgroundImage: 'url(https://cdn.builder.io/api/v1/image/assets%2F3c8d58e1f29a488cb17d625e65a70c2f%2F8042c0f17c4e44e1b40771cdf55779ea)',
          }}
        >
          <span className="flex items-center gap-2">
            <div className="text-2xl">📌</div>
            <div style={{ fontSize: '21px', lineHeight: '20px', textShadow: '1px 1px 3px rgba(209, 209, 209, 1)' }}>
              نصيحة مهمة
            </div>
          </span>
          <motion.div
            animate={{ rotate: isImportantTipOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </button>

        {/* Expandable Content */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: isImportantTipOpen ? 1 : 0,
            height: isImportantTipOpen ? 'auto' : 0,
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-b-lg border-2 border-t-0 border-pink-200">
            <p className="text-gray-700 text-right leading-relaxed">
              اختاري المنتجات التي تناسب احتياجات بشرتك أو شعرك. يفضل اختيار منتجات من نفس العلامة التجارية لضمان توافقية أفضل بين المكونات.
              ابدئي باستخدام منتج واحد في كل مرة وراقبي استجابة بشرتك قبل إضافة منتجات أخرى.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
