import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Sparkles, Loader } from "lucide-react";

const ROUTINE_CONFIG = {
  morning: {
    label: "🌅 صباحي",
    icon: Sun,
    description: "روتين العناية الصباحي",
    color: "from-yellow-400 to-orange-400",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-300",
    textColor: "text-yellow-900",
  },
  night: {
    label: "🌙 ليلي",
    icon: Moon,
    description: "روتين العناية الليلي",
    color: "from-indigo-400 to-blue-400",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-300",
    textColor: "text-indigo-900",
  },
  both: {
    label: "🌅 🌙 صباحي وليلي",
    icon: Sparkles,
    description: "روتين متكامل صباحي وليلي",
    color: "from-pink-400 to-rose-400",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-300",
    textColor: "text-pink-900",
  },
  special: {
    label: "✨ خاص",
    icon: Sparkles,
    description: "علاجات خاصة ومكثفة",
    color: "from-purple-400 to-pink-400",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300",
    textColor: "text-purple-900",
  },
};

export const RoutineTypeSelector = ({
  routines = [],
  selected = null,
  onSelect = () => {},
  isLoading = false,
  selectedProblem = null,
}) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <Loader className="w-12 h-12 text-pink-600 animate-spin mb-4" />
        <p className="text-gray-600">جاري تحميل أنواع الروتين...</p>
      </motion.div>
    );
  }

  if (!routines || routines.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl"
      >
        <span className="text-6xl mb-4">📋</span>
        <p className="text-lg text-gray-700 font-medium">
          لا توجد أنواع روتين متاحة لهذه المشكلة
        </p>
        <p className="text-sm text-gray-500 mt-2">
          يرجى اختيار مشكلة بشرة أخرى
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AnimatePresence>
        {routines.map((routine, index) => {
          const config = ROUTINE_CONFIG[routine] || ROUTINE_CONFIG.morning;
          const Icon = config.icon;
          const isSelected = selected === routine;

          return (
            <motion.button
              key={routine}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(routine)}
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.95 }}
              className={`relative p-8 rounded-2xl transition-all duration-300 ${
                isSelected
                  ? `ring-4 ring-offset-2 shadow-2xl ring-pink-400 ring-offset-white`
                  : `hover:shadow-lg`
              }`}
            >
              {/* Background gradient for selected */}
              {isSelected && (
                <motion.div
                  layoutId="routine-bg"
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${config.color} opacity-10 -z-10`}
                />
              )}

              {/* Content */}
              <div className="relative z-10">
                {/* Image for morning routine if available */}
                {routine === "morning" && selectedProblem?.morning_image_url ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-40 rounded-xl mb-4 overflow-hidden shadow-md"
                  >
                    <img
                      src={selectedProblem.morning_image_url}
                      alt="روتين صباحي"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ) : (
                  /* Icon */
                  <motion.div
                    animate={{ scale: isSelected ? 1.1 : 1 }}
                    className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 bg-gray-100"
                  >
                    <Icon
                      size={32}
                      className={`${
                        routine === "morning"
                          ? "text-yellow-600"
                          : routine === "night"
                          ? "text-indigo-600"
                          : routine === "both"
                          ? "text-pink-600"
                          : "text-purple-600"
                      }`}
                    />
                  </motion.div>
                )}

                {/* Text */}
                <h3 className="recommendation-routine-card-title text-gray-900 mb-2">
                  {config.label}
                </h3>
                <p className="recommendation-routine-card-description text-gray-600">{config.description}</p>

                {/* Selection indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center bg-pink-100 shadow-lg"
                    >
                      <svg
                        className={`w-4 h-4 ${
                          routine === "morning"
                            ? "text-yellow-600"
                            : routine === "night"
                            ? "text-indigo-600"
                            : "text-purple-600"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
