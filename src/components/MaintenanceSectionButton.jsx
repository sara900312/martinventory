import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const MaintenanceSectionButton = ({
  icon: Icon,
  label,
  onClick,
  isUnderMaintenance,
  reason,
  formattedTime,
  disabled = false,
  className = '',
}) => {
  const isDisabled = isUnderMaintenance || disabled;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative flex flex-col items-center gap-2 p-4 rounded-lg
        transition-all duration-200 font-semibold
        ${
          isDisabled
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'
            : 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
        }
        ${className}
      `}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5" />}
        <span>{label}</span>
      </div>

      {isUnderMaintenance && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-1 mt-1"
        >
          <div className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded">
            <AlertCircle className="w-3 h-3" />
            صيانة جارية
          </div>
          {reason && (
            <p className="text-xs text-gray-700 text-center max-w-xs">
              {reason}
            </p>
          )}
          {formattedTime && (
            <div className="flex items-center gap-1 text-xs font-bold text-red-600">
              <Clock className="w-3 h-3" />
              {formattedTime}
            </div>
          )}
        </motion.div>
      )}
    </motion.button>
  );
};

export default MaintenanceSectionButton;
