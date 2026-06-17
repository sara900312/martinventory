import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { SkinProblemCard } from "./SkinProblemCard";

export const SkinProblemsGrid = ({
  problems = [],
  selectedProblems = [],
  onSelect = () => {},
  isLoading = false,
  allowMultiSelect = false,
}) => {
  const handleCardSelect = useCallback(
    (problemId) => {
      if (allowMultiSelect) {
        // Multi-select mode
        if (selectedProblems.includes(problemId)) {
          onSelect(selectedProblems.filter((id) => id !== problemId));
        } else {
          onSelect([...selectedProblems, problemId]);
        }
      } else {
        // Single-select mode
        onSelect(selectedProblems.includes(problemId) ? [] : [problemId]);
      }
    },
    [selectedProblems, onSelect, allowMultiSelect]
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg bg-gray-200 animate-pulse"
            style={{ aspectRatio: "3/4" }}
          />
        ))}
      </div>
    );
  }

  if (!problems || problems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl"
      >
        <span className="text-6xl mb-4">🔍</span>
        <p className="text-lg text-gray-700 font-medium">لم يتم العثور على مشاكل بشرة</p>
        <p className="text-sm text-gray-500 mt-2">يرجى المحاولة مرة أخرى لاحقًا</p>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with multi-select info */}
      {allowMultiSelect && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            {selectedProblems.length > 0
              ? `تم تحديد ${selectedProblems.length} مشكلة بشرة`
              : "يمكنك اختيار أكثر من مشكلة في نفس الوقت"}
          </p>
        </div>
      )}

      {/* Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.03 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4"
      >
        {problems.map((problem, index) => (
          <motion.div
            key={problem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <SkinProblemCard
              problem={problem}
              isSelected={selectedProblems.includes(problem.id)}
              onSelect={() => handleCardSelect(problem.id)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
