import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Sparkles } from "lucide-react";

export const SkinProblemCard = ({ problem, isSelected, onSelect }) => {
  const [hoveredImage, setHoveredImage] = useState(null);

  if (!problem) return null;

  // Helper function to detect if URL is a video
  const isVideoUrl = (url) => {
    if (!url) return false;
    const videoExtensions = ['.webm', '.mp4', '.ogg', '.avi', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const hasImages = {
    morning: !!problem.morning_image_url,
    evening: !!problem.evening_image_url,
    special: !!problem.special_care_image_url,
  };

  const handleClick = () => {
    onSelect(problem.id);
  };

  const displayName = problem.name_ar || problem.name_en || "منتج";

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.95 }}
      className={`relative w-full rounded-lg overflow-visible transition-all duration-300 group flex flex-col border-2 ${
        isSelected
          ? "border-pink-500 shadow-lg shadow-pink-300 ring-2 ring-pink-400"
          : "border-gray-200 hover:border-pink-300 shadow-sm hover:shadow-md"
      }`}
      style={{ minHeight: "320px" }}
    >
      {/* Image/Video Container at Top */}
      <div className="w-full h-32 sm:h-40 bg-gradient-to-br from-pink-100 to-rose-100 flex-shrink-0 overflow-hidden relative">
        {problem.card_image_url ? (
          isVideoUrl(problem.card_image_url) ? (
            <video
              src={problem.card_image_url}
              alt={displayName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              autoPlay
              muted
              loop
              playsInline
              crossOrigin="anonymous"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <img
              src={problem.card_image_url}
              alt={displayName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl md:text-6xl">
            {problem.emoji || "🧴"}
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="relative flex flex-col items-center p-2 sm:p-3 md:p-4 flex-grow overflow-visible">
        {/* Emoji/Icon (show only if no card image) */}
        {!problem.card_image_url && (
          <div className="text-3xl md:text-4xl mb-2 flex-shrink-0">
            {problem.emoji || "🧴"}
          </div>
        )}

        {/* Name in Arabic */}
        <h3 className="recommendation-problem-card-title text-gray-900 text-center mb-1 line-clamp-2">
          {displayName}
        </h3>

        {/* Name in English if different */}
        {problem.name_en && problem.name_ar && (
          <p className="text-xs text-gray-600 text-center mb-2 line-clamp-1 font-medium">
            {problem.name_en}
          </p>
        )}

        {/* Description */}
        <p className="text-xs text-gray-700 text-center line-clamp-2 flex-grow leading-relaxed">
          {problem.description}
        </p>

        {/* Image type indicators at bottom */}
        {(hasImages.morning || hasImages.evening || hasImages.special) && (
          <div className="flex gap-1 justify-center flex-wrap w-full pt-2 mt-auto">
            {hasImages.morning && (
              <motion.div
                whileHover={{ scale: 1.2 }}
                title="صورة الصباح"
                className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-200 text-pink-700 shadow-sm cursor-help flex-shrink-0"
                onMouseEnter={() => setHoveredImage("morning")}
                onMouseLeave={() => setHoveredImage(null)}
              >
                <Sun size={12} />
              </motion.div>
            )}
            {hasImages.evening && (
              <motion.div
                whileHover={{ scale: 1.2 }}
                title="صورة المساء"
                className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 shadow-sm cursor-help flex-shrink-0"
                onMouseEnter={() => setHoveredImage("evening")}
                onMouseLeave={() => setHoveredImage(null)}
              >
                <Moon size={12} />
              </motion.div>
            )}
            {hasImages.special && (
              <motion.div
                whileHover={{ scale: 1.2 }}
                title="صورة العناية الخاصة"
                className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-200 text-purple-700 shadow-sm cursor-help flex-shrink-0"
                onMouseEnter={() => setHoveredImage("special")}
                onMouseLeave={() => setHoveredImage(null)}
              >
                <Sparkles size={12} />
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Selection checkmark */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            className="absolute top-2 right-2 w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center shadow-lg z-20"
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
        {hoveredImage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
          >
            <div className="relative">
              {isVideoUrl(
                hoveredImage === "morning"
                  ? problem.morning_image_url
                  : hoveredImage === "evening"
                  ? problem.evening_image_url
                  : problem.special_care_image_url
              ) ? (
                <video
                  src={
                    hoveredImage === "morning"
                      ? problem.morning_image_url
                      : hoveredImage === "evening"
                      ? problem.evening_image_url
                      : problem.special_care_image_url
                  }
                  className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg shadow-xl border-2 border-white"
                  autoPlay
                  muted
                  loop
                  playsInline
                  crossOrigin="anonymous"
                />
              ) : (
                <img
                  src={
                    hoveredImage === "morning"
                      ? problem.morning_image_url
                      : hoveredImage === "evening"
                      ? problem.evening_image_url
                      : problem.special_care_image_url
                  }
                  alt={`${hoveredImage} image`}
                  className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg shadow-xl border-2 border-white"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
