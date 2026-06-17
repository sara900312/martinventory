import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const ConfirmationModal = ({ isOpen, countdown, orderCode, onCancel, onConfirmImmediately }) => {
  // Disable/enable scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Disable scroll on body
      document.body.style.overflow = 'hidden';
      return () => {
        // Re-enable scroll on cleanup
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blurred Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: 'easeOut'
            }}
            className="confirmation-blur-background"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
              pointerEvents: 'none',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(0, 0, 0, 0.15)'
            }}
          />

          {/* Modal Backdrop Container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="confirmation-modal-backdrop"
            style={{
              zIndex: 50,
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut', delay: 0.05 }}
              className="confirmation-modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ pointerEvents: 'auto' }}
            >
              <div className="confirmation-countdown">{countdown}</div>
              <h3 className="confirmation-title">
                تأكيد الطلب
              </h3>
              <p className="confirmation-order-label">
                رقم طلبك المؤقت: <span className="confirmation-order-code">{orderCode}</span>
              </p>
              <p className="confirmation-message">
                لا تغلق هذه النافذة لتأكيد طلبك. سيتم إرسال الطلب تلقائياً.
              </p>
              <div className="confirmation-button-container">
                <Button
                  onClick={onCancel}
                  className="confirmation-cancel-button"
                >
                  إلغاء الطلب
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
