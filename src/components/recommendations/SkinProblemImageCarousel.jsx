import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";

export const SkinProblemImageCarousel = ({ problem, isOpen = false }) => {
  const [activeTab, setActiveTab] = useState("morning");

  if (!isOpen || !problem) return null;

  const morningImage = problem.morning_image_url;
  const eveningImage = problem.evening_image_url;

  const hasImages = morningImage || eveningImage;

  if (!hasImages) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mt-4 p-4 bg-gray-50 rounded-xl text-center text-gray-600"
      >
        <p>لا توجد صور متاحة لهذه المشكلة</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mt-4 space-y-3"
    >
      {/* Tab buttons */}
      <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
        {morningImage && (
          <button
            onClick={() => setActiveTab("morning")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all ${
              activeTab === "morning"
                ? "bg-pink-500 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Sun size={18} />
            <span className="text-sm font-medium">الصباح</span>
          </button>
        )}
        {eveningImage && (
          <button
            onClick={() => setActiveTab("evening")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all ${
              activeTab === "evening"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Moon size={18} />
            <span className="text-sm font-medium">المساء</span>
          </button>
        )}
      </div>

      {/* Image display */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-200"
      >
        {activeTab === "morning" && morningImage ? (
          <img
            src={morningImage}
            alt={`${problem.name_ar || problem.name_en} - الصباح`}
            className="w-full h-full object-cover"
          />
        ) : null}

        {activeTab === "evening" && eveningImage ? (
          <img
            src={eveningImage}
            alt={`${problem.name_ar || problem.name_en} - المساء`}
            className="w-full h-full object-cover"
          />
        ) : null}

        {/* Overlay with icon image and time */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex items-end justify-between p-4">
          <div className="text-white drop-shadow-lg">
            <p className="font-semibold">{problem.name_ar || problem.name_en}</p>
            {problem.name_en && (
              <p className="text-sm opacity-90">{problem.name_en}</p>
            )}
          </div>
          {problem.card_image_url && (
            <img
              src={problem.card_image_url}
              alt={problem.name_ar || problem.name_en}
              className="w-14 h-14 object-contain drop-shadow-lg"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
