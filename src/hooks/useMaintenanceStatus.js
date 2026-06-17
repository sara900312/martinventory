import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { getMaintenanceStatus, formatTimeRemaining } from '@/lib/maintenanceService';

export const useMaintenanceStatus = (sectionName) => {
  const { supabase } = useSupabase();
  const [maintenanceData, setMaintenanceData] = useState({
    isUnderMaintenance: false,
    reason: null,
    startTime: null,
    endTime: null,
    timeRemaining: null,
    formattedTime: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch maintenance status
  const fetchMaintenanceStatus = useCallback(async () => {
    if (!sectionName) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const status = await getMaintenanceStatus(supabase, sectionName);

      setMaintenanceData({
        ...status,
        formattedTime: status.timeRemaining
          ? formatTimeRemaining(status.timeRemaining)
          : '',
      });
    } catch (err) {
      console.error('Error in useMaintenanceStatus:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, sectionName]);

  // Initial fetch
  useEffect(() => {
    fetchMaintenanceStatus();
  }, [fetchMaintenanceStatus]);

  // Update countdown timer only when formatted time actually changes
  useEffect(() => {
    if (!maintenanceData.isUnderMaintenance || !maintenanceData.endTime) {
      return;
    }

    let isCleanedUp = false;

    const interval = setInterval(() => {
      if (isCleanedUp) return;

      const now = new Date();
      const endTime = new Date(maintenanceData.endTime);
      const timeRemaining = endTime - now;

      if (timeRemaining <= 0) {
        // Maintenance has ended
        setMaintenanceData((prev) => ({
          ...prev,
          isUnderMaintenance: false,
          timeRemaining: null,
          formattedTime: '',
        }));
        clearInterval(interval);
      } else {
        // Only update state if formatted time actually changed
        const newFormattedTime = formatTimeRemaining(timeRemaining);
        setMaintenanceData((prev) => {
          // Only update if the formatted time is different
          if (prev.formattedTime === newFormattedTime) {
            return prev;
          }
          return {
            ...prev,
            timeRemaining,
            formattedTime: newFormattedTime,
          };
        });
      }
    }, 500); // Check every 500ms for more responsive updates, but only re-render when time changes

    return () => {
      isCleanedUp = true;
      clearInterval(interval);
    };
  }, [maintenanceData.isUnderMaintenance, maintenanceData.endTime]);

  return {
    ...maintenanceData,
    isLoading,
    error,
    refetch: fetchMaintenanceStatus,
  };
};

export default useMaintenanceStatus;
