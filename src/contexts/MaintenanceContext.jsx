import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabase } from './SupabaseContext';
import { getAllMaintenanceStatus, formatTimeRemaining } from '@/lib/maintenanceService';

const MaintenanceContext = createContext();

export const useMaintenanceContext = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenanceContext must be used within MaintenanceProvider');
  }
  return context;
};

export const MaintenanceProvider = ({ children, sections = [] }) => {
  const { supabase } = useSupabase();
  const [maintenanceStatuses, setMaintenanceStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all maintenance statuses
  const fetchAllStatuses = useCallback(async () => {
    if (!sections || sections.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      const statuses = await getAllMaintenanceStatus(supabase, sections);
      setMaintenanceStatuses(statuses);
    } catch (error) {
      console.error('Error fetching maintenance statuses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, sections]);

  // Initial fetch
  useEffect(() => {
    fetchAllStatuses();
  }, [fetchAllStatuses]);

  // Update countdown timers only when formatted time changes
  useEffect(() => {
    let lastUpdateTime = {};

    const interval = setInterval(() => {
      setMaintenanceStatuses((prev) => {
        const updated = { ...prev };
        let hasChanged = false;

        Object.keys(updated).forEach((sectionName) => {
          const status = updated[sectionName];
          if (!status.endTime) return;

          const now = new Date();
          const endTime = new Date(status.endTime);
          const timeRemaining = endTime - now;

          if (timeRemaining <= 0) {
            delete updated[sectionName];
            delete lastUpdateTime[sectionName];
            hasChanged = true;
          } else {
            const newFormattedTime = formatTimeRemaining(timeRemaining);
            // Only update if formatted time actually changed
            if (newFormattedTime !== status.formattedTime) {
              updated[sectionName] = {
                ...status,
                timeRemaining,
                formattedTime: newFormattedTime,
              };
              lastUpdateTime[sectionName] = newFormattedTime;
              hasChanged = true;
            }
          }
        });

        return hasChanged ? updated : prev;
      });
    }, 500); // Check every 500ms, but only update when time changes

    return () => clearInterval(interval);
  }, []);

  const getMaintenanceStatus = (sectionName) => {
    return maintenanceStatuses[sectionName] || null;
  };

  const isUnderMaintenance = (sectionName) => {
    return !!maintenanceStatuses[sectionName]?.isUnderMaintenance;
  };

  return (
    <MaintenanceContext.Provider
      value={{
        maintenanceStatuses,
        isLoading,
        getMaintenanceStatus,
        isUnderMaintenance,
        refetch: fetchAllStatuses,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};

export default MaintenanceContext;
