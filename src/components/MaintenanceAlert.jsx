import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MaintenanceAlert = ({
  isUnderMaintenance,
  reason,
  formattedTime,
  sectionName,
}) => {
  if (!isUnderMaintenance) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 mb-4"
      >
        <div className="flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-orange-900 mb-1">
              قسم {sectionName} تحت الصيانة
            </h3>
            {reason && (
              <p className="text-orange-800 text-sm mb-2">
                السبب: {reason}
              </p>
            )}
            <div className="flex items-center gap-1 text-orange-700 text-sm font-semibold">
              <Clock className="w-4 h-4" />
              الوقت المتبقي: {formattedTime}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MaintenanceAlert;
