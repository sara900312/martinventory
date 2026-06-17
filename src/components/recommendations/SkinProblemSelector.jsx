import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";

export const SkinProblemSelector = ({
  problems = [],
  selected = null,
  onSelect = () => {},
  isLoading = false,
}) => {
  const [hoveredId, setHoveredId] = useState(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="rounded-lg bg-gray-200 animate-pulse" style={{ aspectRatio: "3/4" }} />
        ))}
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-gray-600">لم يتم العثور على مشاكل بشرة</p>
      </div>
    );
  }

  const handleProblemSelect = (problem) => {
    onSelect(problem.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4"
    >
      {problems.map((problem, index) => {
        const isSelected = selected === problem.id;
        const hasImage = problem.morning_image_url || problem.evening_image_url;

        return (
          <motion.button
            key={problem.id}
            onClick={() => handleProblemSelect(problem)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => setHoveredId(problem.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`relative w-full rounded-lg overflow-hidden cursor-pointer transition-all duration-300 flex flex-col border-2 ${
              isSelected
                ? "border-pink-500 shadow-lg shadow-pink-300 ring-2 ring-pink-400"
                : "border-gray-200 hover:border-pink-300 shadow-sm hover:shadow-md"
            }`}
            style={{ aspectRatio: "3/4" }}
          >
            {/* Background with gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-pink-50 to-white" />

            {/* Image background if available */}
            {hasImage && (
              <>
                <img
                  src={problem.morning_image_url || problem.evening_image_url}
                  alt={problem.name_ar || problem.name_en}
                  className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-pink-100/40" />
              </>
            )}

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-start p-3 md:p-4 h-full">
              {/* Emoji/Icon at top */}
              <div className="text-3xl md:text-4xl mb-2 flex-shrink-0">
                {problem.emoji || problem.card_image_url ? (
                  problem.emoji ? (
                    problem.emoji
                  ) : (
                    <img
                      src={problem.card_image_url}
                      alt={problem.name_ar || problem.name_en}
                      className="w-10 h-10 md:w-12 md:h-12 object-contain"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )
                ) : (
                  "🧴"
                )}
              </div>

              {/* Name in Arabic */}
              <h3 className="font-bold text-gray-900 text-sm md:text-base text-center leading-tight mb-1">
                {problem.name_ar || problem.name_en}
              </h3>

              {/* Name in English if different */}
              {problem.name_en && problem.name_ar && (
                <p className="text-xs text-gray-600 text-center mb-2 line-clamp-1">
                  {problem.name_en}
                </p>
              )}

              {/* Description */}
              <p className="text-xs text-gray-700 text-center line-clamp-3 flex-grow mb-3">
                {problem.description}
              </p>

              {/* Spacer */}
              <div className="flex-grow" />

              {/* Image type indicators at bottom */}
              <div className="flex gap-1 justify-center flex-wrap w-full">
                {problem.morning_image_url && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-pink-200 text-pink-700 rounded-full p-1 flex items-center justify-center"
                    title="صباح"
                  >
                    <Sun size={12} />
                  </motion.div>
                )}
                {problem.evening_image_url && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-indigo-200 text-indigo-700 rounded-full p-1 flex items-center justify-center"
                    title="مساء"
                  >
                    <Moon size={12} />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Selection checkmark */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  className="absolute top-2 right-2 w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center shadow-lg"
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hover effect indicator */}
            <AnimatePresence>
              {hoveredId === problem.id && !isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-pink-100/30 rounded-lg pointer-events-none"
                />
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </motion.div>
  );
};
