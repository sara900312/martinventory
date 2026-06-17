import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TypeFilterDrawer = ({
  isOpen,
  onClose,
  subcategories,
  selectedSubcategories,
  onApply,
  onClear,
  loading = false,
}) => {
  const [localSelected, setLocalSelected] = useState([]);

  useEffect(() => {
    setLocalSelected(selectedSubcategories);
  }, [isOpen, selectedSubcategories]);

  const handleToggleSubcategory = (subcategoryId) => {
    setLocalSelected((prev) => {
      const index = prev.indexOf(subcategoryId);
      if (index > -1) {
        return prev.filter((id) => id !== subcategoryId);
      } else {
        return [...prev, subcategoryId];
      }
    });
  };

  const handleApply = () => {
    onApply(localSelected);
    onClose();
  };

  const handleClear = () => {
    setLocalSelected([]);
    onClear();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="type-filter-drawer"
          >
            {/* Header */}
            <div className="type-filter-header">
              <h2 className="type-filter-title">تصفية حسب النوع</h2>
              <button
                onClick={onClose}
                className="type-filter-close-btn"
                aria-label="Close filter drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="type-filter-content">
              {loading ? (
                <div className="type-filter-loading">
                  <div className="inline-block w-8 h-8 rounded-full border-3 border-pink-200 border-t-pink-500 animate-spin"></div>
                  <p className="text-sm text-pink-600 mt-2 font-medium">جاري تحميل...</p>
                </div>
              ) : subcategories.length > 0 ? (
                <div className="type-filter-chips-grid">
                  {subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => handleToggleSubcategory(sub.id)}
                      className={`type-filter-chip ${
                        localSelected.includes(sub.id) ? 'type-filter-chip-selected' : ''
                      }`}
                    >
                      {sub.name_ar || sub.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="type-filter-empty">
                  <p>لا توجد أنواع متاحة في هذه الفئة</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="type-filter-footer">
              <Button
                onClick={handleClear}
                variant="outline"
                className="type-filter-clear-btn"
              >
                ❌ مسح
              </Button>
              <Button
                onClick={handleApply}
                disabled={loading}
                className="type-filter-apply-btn"
              >
                ✅ تطبيق
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TypeFilterDrawer;
