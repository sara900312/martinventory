import { useState, useEffect, useCallback, useRef } from 'react';
import { useActivePopupQueue } from './usePopupHero';

/**
 * Hook to manage a queue of popups
 * - Maintains a queue of active popups
 * - Shows only the first popup in the queue
 * - Automatically shows the next popup when current is closed
 */
export const usePopupQueue = () => {
  const { data: activePopups = [], isLoading, error } = useActivePopupQueue();
  const [queue, setQueue] = useState([]);
  const [currentPopup, setCurrentPopup] = useState(null);

  // Use refs to track the current state for callbacks without dependencies
  const queueRef = useRef(queue);
  const currentPopupRef = useRef(currentPopup);
  const initializedRef = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    queueRef.current = queue;
    currentPopupRef.current = currentPopup;
  }, [queue, currentPopup]);

  // Initialize or update queue when popups change
  useEffect(() => {
    if (activePopups && activePopups.length > 0) {
      // Check if queue actually changed to avoid unnecessary updates
      const queueChanged =
        queueRef.current.length !== activePopups.length ||
        queueRef.current.some((p, i) => p.id !== activePopups[i]?.id);

      if (queueChanged) {
        setQueue(activePopups);

        // Only initialize current popup once
        if (!initializedRef.current && !currentPopupRef.current) {
          setCurrentPopup(activePopups[0]);
          initializedRef.current = true;
        }
      }
    } else {
      // No active popups
      if (queueRef.current.length > 0 || currentPopupRef.current) {
        setQueue([]);
        setCurrentPopup(null);
        initializedRef.current = false;
      }
    }
  }, [activePopups]);

  /**
   * Close current popup and move to next in queue
   * Stable reference - uses refs to access current state
   */
  const closeCurrentAndShowNext = useCallback(() => {
    const currentQueue = queueRef.current;
    const currentPopupData = currentPopupRef.current;

    if (currentQueue.length === 0) {
      setCurrentPopup(null);
      return;
    }

    if (currentPopupData && currentQueue.length > 1) {
      // Remove current popup from queue and show next
      const newQueue = currentQueue.filter((p) => p.id !== currentPopupData.id);
      setQueue(newQueue);

      if (newQueue.length > 0) {
        setCurrentPopup(newQueue[0]);
      } else {
        setCurrentPopup(null);
      }
    } else {
      // Only one or no popups left
      setCurrentPopup(null);
      setQueue([]);
    }
  }, []);

  /**
   * Close all popups in queue
   * Stable reference - no dependencies
   */
  const closeAllPopups = useCallback(() => {
    setQueue([]);
    setCurrentPopup(null);
  }, []);

  return {
    currentPopup,
    queue,
    queueLength: queue.length,
    remainingCount: Math.max(0, queue.length - 1), // Remaining after current
    closeCurrentAndShowNext,
    closeAllPopups,
    isLoading,
    error,
  };
};
