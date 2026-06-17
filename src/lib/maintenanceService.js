/**
 * Maintenance Service
 * Handles all API calls related to maintenance status
 */

export const getMaintenanceStatus = async (supabase, sectionName) => {
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .eq('section_name', sectionName)
      .eq('is_active', true)
      .limit(1);

    if (error) {
      throw error;
    }

    // If maintenance record exists, check if we're still in the maintenance window
    if (data && data.length > 0) {
      const maintenanceRecord = data[0];
      const now = new Date();
      const startTime = new Date(maintenanceRecord.start_time);
      const endTime = new Date(maintenanceRecord.end_time);

      // Check if current time is within maintenance window
      if (now >= startTime && now <= endTime) {
        return {
          isUnderMaintenance: true,
          reason: maintenanceRecord.reason,
          startTime: maintenanceRecord.start_time,
          endTime: maintenanceRecord.end_time,
          timeRemaining: endTime - now,
        };
      }
    }

    return {
      isUnderMaintenance: false,
      reason: null,
      startTime: null,
      endTime: null,
      timeRemaining: null,
    };
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    return {
      isUnderMaintenance: false,
      reason: null,
      startTime: null,
      endTime: null,
      timeRemaining: null,
    };
  }
};

export const getAllMaintenanceStatus = async (supabase, sectionNames = []) => {
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .in('section_name', sectionNames)
      .eq('is_active', true);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) return {};

    const now = new Date();
    const result = {};

    data.forEach((record) => {
      const startTime = new Date(record.start_time);
      const endTime = new Date(record.end_time);

      if (now >= startTime && now <= endTime) {
        result[record.section_name] = {
          isUnderMaintenance: true,
          reason: record.reason,
          startTime: record.start_time,
          endTime: record.end_time,
          timeRemaining: endTime - now,
        };
      }
    });

    return result;
  } catch (error) {
    console.error('Error fetching all maintenance status:', error);
    return {};
  }
};

export const formatTimeRemaining = (milliseconds) => {
  if (!milliseconds || milliseconds <= 0) return 'انتهت الصيانة';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} س ${minutes} د`;
  }
  if (minutes > 0) {
    return `${minutes} د ${seconds} ث`;
  }
  return `${seconds} ثانية`;
};
