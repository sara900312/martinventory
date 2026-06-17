import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/data/products";
import { getProductUrl } from "@/lib/slugUtils";
import { useSkinProblems } from "@/hooks/useSkinProblems";
import { useRoutineTypes } from "@/hooks/useRoutineTypes";
import { useRecommendedProducts } from "@/hooks/useRecommendedProducts";
import { getProductRoutines, ROUTINE_TYPE_LABELS } from "@/lib/routineTypeConstants";

const ProductRecommendationWidget = ({ isOpen, onClose }) => {
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [currentStep, setCurrentStep] = useState("problems");
  const navigate = useNavigate();

  const { data: skinProblems = [], isLoading: loadingProblems } = useSkinProblems();
  const { data: routineTypes = [], isLoading: loadingRoutines } = useRoutineTypes(selectedProblem);
  const { data: products = [], isLoading: loadingProducts } = useRecommendedProducts(selectedProblem, selectedRoutine);

  const getSelectedProblemData = useCallback(() => {
    return skinProblems.find(p => p.name === selectedProblem || p.id === selectedProblem);
  }, [skinProblems, selectedProblem]);

  const handleProblemSelect = useCallback((problem) => {
    setSelectedProblem(problem);
    setSelectedRoutine(null);
    setCurrentStep("routines");
  }, []);

  const handleRoutineSelect = useCallback((routine) => {
    setSelectedRoutine(routine);
    setCurrentStep("products");
  }, []);

  const handleProductClick = (product) => {
    navigate(getProductUrl(product));
    onClose();
  };

  const handleBack = useCallback(() => {
    if (currentStep === "routines") {
      setSelectedProblem(null);
      setCurrentStep("problems");
    } else if (currentStep === "products") {
      setSelectedRoutine(null);
      setCurrentStep("routines");
    }
  }, [currentStep]);

  const handleReset = useCallback(() => {
    setSelectedProblem(null);
    setSelectedRoutine(null);
    setCurrentStep("problems");
  }, []);

  const getRoutineLabel = (routine) => {
    const labels = {
      morning: "🌅 صباحي",
      night: "🌙 ليلي",
      special: "✨ خاص",
    };
    return labels[routine] || routine;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed left-0 top-0 h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-400 to-rose-300 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6" />
                <h2 className="text-xl font-bold">أداة التوصيات</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" strokeWidth={2} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6">
              {currentStep === "problems" ? (
                // Step 1: Problem Selection
                <div>
                  <p className="text-gray-600 mb-6 text-sm">
                    اختري المشكلة التي تواجهينها لنقدم لك المنتجات المناسبة
                  </p>

                  {loadingProblems ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="inline-block w-10 h-10 rounded-full border-3 border-pink-200 border-t-pink-500 animate-spin"></div>
                      <p className="text-sm text-gray-600 mt-4">جاري تحميل المشاكل...</p>
                    </div>
                  ) : skinProblems.length > 0 ? (
                    <div className="space-y-3">
                      {skinProblems.map((problem) => (
                        <motion.button
                          key={problem.id}
                          onClick={() => handleProblemSelect(problem.name || problem.id)}
                          className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 hover:border-pink-400 hover:bg-pink-50 transition-all group"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-3 text-right">
                            <span className="text-3xl">{problem.emoji || problem.icon || "💊"}</span>
                            <div className="text-right">
                              <div className="font-semibold text-gray-800">{problem.name_ar || problem.name}</div>
                              {problem.name_en && (
                                <div className="text-xs text-gray-500">{problem.name_en}</div>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-pink-500 transition-colors" />
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="text-gray-300 text-3xl mb-3">🔍</div>
                      <p className="text-gray-600 text-sm">لم يتم العثور على مشاكل بشرة</p>
                    </div>
                  )}
                </div>
              ) : currentStep === "routines" ? (
                // Step 2: Routine Selection
                <div>
                  <motion.button
                    onClick={handleBack}
                    className="mb-4 text-pink-600 hover:text-pink-700 font-semibold flex items-center gap-2 text-sm"
                    whileHover={{ x: 4 }}
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    عودة
                  </motion.button>

                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{getSelectedProblemData()?.emoji || getSelectedProblemData()?.icon || "💊"}</span>
                      <h3 className="text-lg font-bold text-gray-800">
                        {getSelectedProblemData()?.name_ar || getSelectedProblemData()?.name}
                      </h3>
                    </div>
                    {getSelectedProblemData()?.description && (
                      <p className="text-sm text-gray-600">
                        {getSelectedProblemData().description}
                      </p>
                    )}
                  </div>

                  <p className="text-gray-600 mb-4 text-sm">
                    اختري الروتين المناسب:
                  </p>

                  {loadingRoutines ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="inline-block w-10 h-10 rounded-full border-3 border-pink-200 border-t-pink-500 animate-spin"></div>
                      <p className="text-sm text-gray-600 mt-4">جاري تحميل الروتين...</p>
                    </div>
                  ) : routineTypes.length > 0 ? (
                    <div className="space-y-3">
                      {routineTypes.map((routine) => (
                        <motion.button
                          key={routine}
                          onClick={() => handleRoutineSelect(routine)}
                          className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-3 text-right">
                            <span className="text-3xl">{getRoutineLabel(routine).split(" ")[0]}</span>
                            <div className="font-semibold text-gray-800">{getRoutineLabel(routine)}</div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="text-gray-300 text-3xl mb-3">🔍</div>
                      <p className="text-gray-600 text-sm">لا توجد أنواع روتين متاحة لهذه المشكلة</p>
                      <Button
                        onClick={handleBack}
                        className="mt-4 gradient-bg text-white"
                        size="sm"
                      >
                        اختر مشكلة أخرى
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                // Step 3: Products View
                <div>
                  <motion.button
                    onClick={handleReset}
                    className="mb-4 text-pink-600 hover:text-pink-700 font-semibold flex items-center gap-2 text-sm"
                    whileHover={{ x: 4 }}
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    عودة
                  </motion.button>

                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{getSelectedProblemData()?.emoji || getSelectedProblemData()?.icon || "💊"}</span>
                      <h3 className="text-lg font-bold text-gray-800">
                        {getSelectedProblemData()?.name_ar || getSelectedProblemData()?.name}
                      </h3>
                    </div>
                    <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mt-2">
                      {getRoutineLabel(selectedRoutine)}
                    </div>
                  </div>

                  {loadingProducts ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="inline-block w-12 h-12 rounded-full border-3 border-pink-200 border-t-pink-500 animate-spin"></div>
                      <p className="text-sm text-gray-600 mt-4">
                        جاري البحث عن المنتجات...
                      </p>
                    </div>
                  ) : products.length > 0 ? (
                    <div className="space-y-4">
                      {products.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleProductClick(product)}
                          className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-pink-50 hover:to-rose-50 cursor-pointer transition-all group border border-gray-200 hover:border-pink-300"
                        >
                          {/* Product Image */}
                          {product.main_image_url && (
                            <div className="w-full h-32 bg-white rounded-lg overflow-hidden mb-3 border border-gray-200">
                              <img
                                src={product.main_image_url}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          )}

                          {/* Product Info */}
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2">
                              {product.name}
                            </h4>

                            {/* Short Description */}
                            {product.short_description && (
                              <p className="text-xs text-gray-700 mb-2 line-clamp-2">
                                {product.short_description}
                              </p>
                            )}

                            {/* Routine Type Badges - Display both primary and secondary */}
                            {(product.routine_type || product.routine_type_secondary) && (
                              <div className="mb-2 flex flex-wrap gap-2">
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

                            {/* Price and Button */}
                            <div className="flex items-center justify-between">
                              <p className="text-pink-600 font-bold text-sm">
                                {formatPrice(
                                  product.is_discounted && product.discounted_price
                                    ? product.discounted_price
                                    : product.price
                                )}
                              </p>
                              <Button
                                size="sm"
                                className="gradient-bg text-white text-xs py-1 h-auto px-3"
                              >
                                عرض
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="text-gray-300 text-3xl mb-3">🔍</div>
                      <p className="text-gray-600 text-sm text-center mb-3">
                        عذراً، لا توجد منتجات متاحة لهذا التوليف من المشكلة والروتين حالياً.
                      </p>
                      <Button
                        onClick={handleBack}
                        className="mt-4 gradient-bg text-white"
                        size="sm"
                      >
                        اختر روتين آخر
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductRecommendationWidget;
