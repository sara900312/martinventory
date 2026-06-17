import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const TypeFilterPopover = ({
  isOpen,
  onClose,
  subcategories,
  selectedSubcategories,
  onApply,
  onClear,
  loading = false,
  buttonRef = null,
}) => {
  const [localSelected, setLocalSelected] = useState([]);
  const popoverRef = useRef(null);

  useEffect(() => {
    setLocalSelected(selectedSubcategories);
  }, [isOpen, selectedSubcategories]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        buttonRef?.current &&
        !buttonRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, buttonRef]);

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
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="type-filter-popover"
        >
          {/* Popover Header */}
          <div className="type-filter-popover-header">
            <h3 className="type-filter-popover-title">تصفية حسب النوع</h3>
          </div>

          {/* Popover Content */}
          <div className="type-filter-popover-content">
            {loading ? (
              <div className="type-filter-popover-loading">
                <div className="inline-block w-6 h-6 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin"></div>
              </div>
            ) : subcategories.length > 0 ? (
              <div className="type-filter-popover-chips-grid">
                {subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleToggleSubcategory(sub.id)}
                    className={`type-filter-popover-chip ${
                      localSelected.includes(sub.id)
                        ? 'type-filter-popover-chip-selected'
                        : ''
                    }`}
                  >
                    {sub.name_ar || sub.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="type-filter-popover-empty">
                لا توجد أنواع متاحة
              </div>
            )}
          </div>

          {/* Popover Footer */}
          <div className="type-filter-popover-footer">
            <Button
              onClick={handleClear}
              variant="outline"
              className="type-filter-popover-clear-btn"
            >
              ❌ مسح
            </Button>
            <Button
              onClick={handleApply}
              disabled={loading}
              className="type-filter-popover-apply-btn"
            >
              ✅ تطبيق
            </Button>
          </div>

          {/* Arrow */}
          <div className="type-filter-popover-arrow" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TypeFilterPopover;
