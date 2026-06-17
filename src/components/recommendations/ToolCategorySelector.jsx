import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader } from "lucide-react";

export const ToolCategorySelector = ({
  categories = [],
  onSelect = () => {},
  isLoading = false,
}) => {
  // Helper function to detect if URL is a video
  const isVideoUrl = (url) => {
    if (!url) return false;
    const videoExtensions = ['.webm', '.mp4', '.ogg', '.avi', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <Loader className="w-12 h-12 text-pink-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">جاري تحميل الفئات...</p>
      </motion.div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl"
      >
        <span className="text-6xl mb-4">📦</span>
        <p className="text-lg text-gray-700 font-medium">
          لا توجد فئات متاحة
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 w-full"
    >
      {categories.map((category, index) => (
        <motion.button
          key={category.tool_title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{
            y: -8,
            boxShadow: category.tool_title.includes("الشعر")
              ? "0 20px 40px rgba(147, 51, 234, 0.3)"
              : "0 20px 40px rgba(236, 72, 153, 0.3)",
          }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(category.tool_title)}
          className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer text-left flex flex-col items-center justify-end min-h-[250px] sm:min-h-[350px] lg:min-h-[450px] ${
            category.tool_title.includes("الشعر")
              ? "border-purple-300 hover:border-purple-400"
              : "border-pink-300 hover:border-pink-400"
          }`}
        >
          {/* Background Image/Video */}
          <div
            className="absolute inset-0"
            style={
              category.tool_title.includes("الشعر")
                ? { background: "linear-gradient(to bottom right, #DDD6FE 0%, #E9D5FF 100%)" }
                : { background: "linear-gradient(to bottom right, #FEE2E2 0%, #FDF2F8 100%)" }
            }
          >
            {category.tool_media_url ? (
              isVideoUrl(category.tool_media_url) ? (
                <video
                  src={category.tool_media_url}
                  alt={category.tool_title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  autoPlay
                  muted
                  loop
                  playsInline
                  crossOrigin="anonymous"
                  preload="metadata"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <img
                  src={category.tool_media_url}
                  alt={category.tool_title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    e.target.parentElement.style.display = "none";
                  }}
                />
              )
            ) : null}
          </div>

          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-70 group-hover:opacity-80 transition-opacity duration-300" />

          {/* Content - at bottom */}
          <div className="relative z-10 text-center flex flex-col items-center justify-center pb-6 px-4 sm:pb-8 sm:px-6 w-full">
            {/* Fallback emoji if no image */}
            {!category.tool_media_url && (
              <div className="text-6xl md:text-7xl mb-4">
                {category.tool_title.includes("البشرة")
                  ? "🧴"
                  : category.tool_title.includes("الشعر")
                  ? "💇"
                  : "✨"}
              </div>
            )}

            {/* Title */}
            <h3
              className="recommendation-category-card-title mb-3 drop-shadow-lg"
              style={{
                color: "#ffffff",
                textShadow: category.tool_title.includes("البشرة")
                  ? "rgb(255, 79, 196) 1px 1px 3px"
                  : category.tool_title.includes("الشعر")
                  ? "rgb(125, 2, 255) 0px 1px 7px"
                  : "rgb(255, 255, 255) 1px 1px 3px",
              }}
            >
              {category.tool_title}
            </h3>

            {/* Description */}
            {category.tool_description && (
              <p
                className="recommendation-category-card-description drop-shadow-md"
                style={{
                  color: "#ffffff",
                  textShadow: "rgb(255, 255, 255) 1px 1px 3px",
                }}
              >
                {category.tool_description}
              </p>
            )}

            {/* Arrow indicator */}
            <div
              className="mt-6 opacity-80 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                color: "#ffffff",
                filter: "drop-shadow(0 0 8px rgba(255, 47, 146, 0.6)) drop-shadow(0 0 12px rgba(255, 47, 146, 0.3))",
              }}
            >
              <svg
                className="w-6 h-6 animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
};
