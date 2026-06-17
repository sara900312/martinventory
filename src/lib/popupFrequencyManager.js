/**
 * Popup Frequency Manager
 * Manages display frequency rules for popups using localStorage
 * Supports three modes: always, once, and interval (every X visits)
 */

const STORAGE_PREFIX = 'popup_frequency_';

/**
 * Get the storage key for a popup
 * @param {string} popupId - Popup ID
 * @returns {string} Storage key
 */
function getStorageKey(popupId) {
  return `${STORAGE_PREFIX}${popupId}`;
}

/**
 * Initialize popup frequency tracking
 * @param {string} popupId - Popup ID
 * @param {string} type - Frequency type: 'always', 'once', 'interval'
 * @param {number} interval - Visit interval for 'interval' type (e.g., 5 for every 5 visits)
 */
export function initializePopupFrequency(popupId, type, interval = 1) {
  const key = getStorageKey(popupId);
  const existing = localStorage.getItem(key);

  if (!existing) {
    const data = {
      popupId,
      type,
      interval: interval || 1,
      firstShownAt: null,
      visitCount: 0,
      lastShownAt: null,
      lastShownAtVisitCount: 0, // Visit count when last shown
      views: [], // Array of timestamps when shown
    };
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  }

  return JSON.parse(existing);
}

/**
 * Check if a popup should be shown based on frequency rules
 * @param {string} popupId - Popup ID
 * @param {string} type - Frequency type: 'always', 'once', 'interval'
 * @param {number} interval - Visit interval for 'interval' type
 * @returns {boolean} Whether the popup should be shown
 */
export function shouldShowPopup(popupId, type = 'always', interval = 1) {
  const key = getStorageKey(popupId);
  let data = localStorage.getItem(key);

  // Initialize if not exists
  if (!data) {
    initializePopupFrequency(popupId, type, interval);
    // For 'always' mode, always show
    if (type === 'always') {
      return true;
    }
    // For 'once' and 'interval', show on first visit
    return true;
  }

  data = JSON.parse(data);

  // Ensure data structure is correct
  if (!data.views) {
    data.views = [];
  }
  if (!data.lastShownAtVisitCount) {
    data.lastShownAtVisitCount = 0;
  }

  switch (type) {
    case 'always':
      // Always show the popup
      return true;

    case 'once':
      // Show only once - if firstShownAt exists, don't show
      return !data.firstShownAt;

    case 'interval':
      // Show every X visits
      // If never shown, show it
      if (data.lastShownAt === null) {
        return true;
      }

      // Calculate visits since last shown
      // currentVisitCount - visitCountWhenLastShown >= interval
      const visitsSinceLastShow = data.visitCount - data.lastShownAtVisitCount;

      // Show if we've reached the interval threshold
      return visitsSinceLastShow >= (interval || 1);

    default:
      return true;
  }
}

/**
 * Record that a popup was shown
 * @param {string} popupId - Popup ID
 * @param {string} type - Frequency type: 'always', 'once', 'interval'
 */
export function recordPopupShown(popupId, type = 'always') {
  const key = getStorageKey(popupId);
  let data = localStorage.getItem(key);

  if (!data) {
    data = initializePopupFrequency(popupId, type);
  } else {
    data = JSON.parse(data);
  }

  const now = new Date().toISOString();

  // Always update lastShownAt
  data.lastShownAt = now;

  // For interval mode, store the current visitCount when shown
  if (type === 'interval') {
    data.lastShownAtVisitCount = data.visitCount;
  }

  // For 'once', set firstShownAt on first show
  if (type === 'once' && !data.firstShownAt) {
    data.firstShownAt = now;
  }

  // Track views
  if (!data.views) {
    data.views = [];
  }
  data.views.push(now);

  // Update type if changed
  data.type = type;

  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Increment visit counter for 'interval' mode
 * @param {string} popupId - Popup ID
 */
export function incrementPopupVisitCount(popupId) {
  const key = getStorageKey(popupId);
  let data = localStorage.getItem(key);

  if (!data) {
    data = { popupId, type: 'interval', interval: 1, firstShownAt: null, visitCount: 1, lastShownAt: null, views: [] };
  } else {
    data = JSON.parse(data);
  }

  data.visitCount += 1;
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Reset popup frequency tracking
 * @param {string} popupId - Popup ID
 */
export function resetPopupFrequency(popupId) {
  const key = getStorageKey(popupId);
  localStorage.removeItem(key);
}

/**
 * Reset all popup frequency tracking
 */
export function resetAllPopupFrequencies() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Get frequency data for a popup (for debugging/analytics)
 * @param {string} popupId - Popup ID
 * @returns {object|null} Frequency data or null
 */
export function getPopupFrequencyData(popupId) {
  const key = getStorageKey(popupId);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Get all popup frequency data (for debugging)
 * @returns {object} All frequency data
 */
export function getAllPopupFrequencyData() {
  const data = {};
  const keys = Object.keys(localStorage);
  
  keys.forEach(key => {
    if (key.startsWith(STORAGE_PREFIX)) {
      const popupId = key.replace(STORAGE_PREFIX, '');
      data[popupId] = JSON.parse(localStorage.getItem(key));
    }
  });

  return data;
}
