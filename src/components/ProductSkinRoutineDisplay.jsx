import React from 'react';
import { getDisplayRoutines, ROUTINE_TYPE_LABELS } from '@/lib/routineTypeConstants';

const ProductSkinRoutineDisplay = ({ product }) => {
  if (!product) return null;

  const {
    skin_problems = [],
    routine_type = '',
    routine_type_secondary = null,
    short_description = '',
    short_description_en = ''
  } = product;

  // Get all display routines for this product (combines both primary and secondary)
  const displayRoutineTypes = getDisplayRoutines(routine_type, routine_type_secondary);

  return (
    <div className="mt-3 space-y-2 text-xs">
      {/* Routine Types */}
      {displayRoutineTypes && displayRoutineTypes.length > 0 && (
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-gray-600 pt-1">الروتين:</span>
          <div className="flex gap-1 flex-wrap">
            {displayRoutineTypes.map((routine, idx) => (
              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold whitespace-nowrap">
                {ROUTINE_TYPE_LABELS[routine] || routine}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skin Problems */}
      {skin_problems && skin_problems.length > 0 && (
        <div>
          <span className="text-gray-600">مشاكل:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {skin_problems.map((problem, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium"
              >
                {problem}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Short Descriptions */}
      {(short_description || short_description_en) && (
        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
          {short_description && (
            <p className="text-gray-700 text-xs mb-1">
              <span className="font-semibold">AR:</span> {short_description}
            </p>
          )}
          {short_description_en && (
            <p className="text-gray-700 text-xs">
              <span className="font-semibold">EN:</span> {short_description_en}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSkinRoutineDisplay;
