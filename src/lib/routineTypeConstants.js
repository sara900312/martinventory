/**
 * Routine Type Constants and Utilities
 * Database constraint: CHECK (routine_type IN ('morning', 'night', 'special'))
 *
 * Frontend Strategy: Accept 'both' in UI, map to single DB value + display mapping
 * Storage: When user selects 'both', store 'morning' in DB, use display map to show in both routines
 */

// Valid database values (as per CHECK constraint)
export const VALID_ROUTINE_TYPES = ['morning', 'night', 'special'];

// Frontend-only values (displayed in UI, not sent directly to DB)
export const FRONTEND_ROUTINE_TYPES = ['صباحي', 'ليلي', 'كليهما', 'خاص'];

// Display labels for frontend selector
export const ROUTINE_TYPE_OPTIONS = [
  { value: '', label: 'بدون تحديد (Not Selected)' },
  { value: 'صباحي', label: '🌅 صباحي (Morning)' },
  { value: 'ليلي', label: '🌙 ليلي (Night)' },
  { value: 'كليهما', label: '🌅🌙 كليهما (Both)' },
  { value: 'خاص', label: '✨ خاص (Special)' },
];

// Map Arabic user selections to database storage value
// When user selects 'كليهما', we store 'morning' but mark it for dual display
export const ARABIC_TO_DB_MAP = {
  'صباحي': 'morning',
  'ليلي': 'night',
  'كليهما': 'morning',  // Store 'morning', but use display map to show in both
  'خاص': 'special',
};

// Inverse: convert DB value back to UI selection
export const DB_TO_ARABIC_MAP = {
  'morning': 'صباحي',
  'night': 'ليلي',
  'special': 'خاص',
  '': '',
};

// Map routine types to display routines (for filtering/display purposes)
// This determines which routines a product appears in on the frontend
export const ROUTINE_DISPLAY_MAP = {
  'صباحي': ['morning'],
  'morning': ['morning'],
  'ليلي': ['night'],
  'night': ['night'],
  'كليهما': ['morning', 'night'],  // Shows in both morning and night routines
  'both': ['morning', 'night'],     // Fallback if DB stores 'both' (shouldn't happen)
  'خاص': ['special'],
  'special': ['special'],
};

// Complete routine selection mapping for database storage
// Maps user selections to both routine_type and routine_type_secondary
export const ROUTINE_SELECTION_MAP = {
  'صباحي': { routine_type: 'morning', routine_type_secondary: null },
  'ليلي': { routine_type: 'night', routine_type_secondary: null },
  'كليهما': { routine_type: 'morning', routine_type_secondary: 'night' },
  'خاص': { routine_type: 'special', routine_type_secondary: null },
};

// Inverse mapping - converts DB values back to user selection
export const DB_SELECTION_MAP = {
  'morning_null': 'صباحي',
  'night_null': 'ليلي',
  'morning_night': 'كليهما',
  'special_null': 'خاص',
};

// Legacy single-value mappings
export const ROUTINE_TYPE_MAP = {
  'صباحي': 'morning',
  'morning': 'morning',
  'ليلي': 'night',
  'night': 'night',
  'خاص': 'special',
  'special': 'special',
};

// Display labels for showing stored values
export const ROUTINE_TYPE_LABELS = {
  morning: '🌅 صباحي',
  night: '🌙 ليلي',
  special: '✨ خاص',
};

/**
 * Convert user selection (Arabic or English) to database value
 * Handles 'كليهما' by converting to 'morning' for storage
 * @param {string} input - User selection (Arabic or English)
 * @returns {string} - Valid database value
 * @throws {Error} - If input is invalid
 */
export const getValidRoutineType = (input) => {
  if (!input || input === '') {
    return '';
  }

  const trimmed = input.trim();

  // First try the Arabic->DB mapping
  if (ARABIC_TO_DB_MAP[trimmed]) {
    return ARABIC_TO_DB_MAP[trimmed];
  }

  // Then try the old mapping (English values)
  if (ROUTINE_TYPE_MAP[trimmed]) {
    return ROUTINE_TYPE_MAP[trimmed];
  }

  throw new Error(
    `Invalid routine_type: "${input}". Must be one of: ${FRONTEND_ROUTINE_TYPES.concat(VALID_ROUTINE_TYPES).join(', ')}`
  );
};

/**
 * Validate routine_type value for database submission
 * @param {string} value - Value to validate
 * @returns {boolean} - True if valid
 */
export const isValidRoutineType = (value) => {
  return value === '' || VALID_ROUTINE_TYPES.includes(value);
};

/**
 * Get display label for a routine type value
 * @param {string} value - Database value ('morning', 'night', 'special')
 * @returns {string} - Display label with emoji
 */
export const getRoutineTypeLabel = (value) => {
  return ROUTINE_TYPE_LABELS[value] || 'غير محدد';
};

/**
 * Get all display routines for a given routine type selection
 * Used to determine which routine filters a product appears in
 * @param {string} routineType - Primary routine type (DB value)
 * @param {string} routineTypeSecondary - Secondary routine type (DB value)
 * @returns {array} - Array of all display routines
 */
export const getDisplayRoutines = (routineType, routineTypeSecondary = null) => {
  const routines = [];

  if (routineType) {
    routines.push(routineType);
  }

  if (routineTypeSecondary && routineTypeSecondary !== routineType) {
    routines.push(routineTypeSecondary);
  }

  return routines;
};

/**
 * Convert user selection to routine_type and routine_type_secondary
 * @param {string} userSelection - User's choice (صباحي, ليلي, كليهما, خاص)
 * @returns {object} - { routine_type, routine_type_secondary }
 * @throws {Error} - If selection is invalid
 */
export const getRoutineSelection = (userSelection) => {
  if (!userSelection || userSelection === '') {
    return { routine_type: '', routine_type_secondary: null };
  }

  const trimmed = userSelection.trim();

  if (ROUTINE_SELECTION_MAP[trimmed]) {
    return ROUTINE_SELECTION_MAP[trimmed];
  }

  throw new Error(
    `Invalid routine selection: "${userSelection}". Must be one of: صباحي, ليلي, كليهما, خاص`
  );
};

/**
 * Validate both routine type fields
 * @param {string} routineType - Primary routine type
 * @param {string|null} routineTypeSecondary - Secondary routine type
 * @returns {boolean} - True if valid
 */
export const isValidRoutineSelection = (routineType, routineTypeSecondary = null) => {
  const validTypes = [...VALID_ROUTINE_TYPES, ''];

  if (!validTypes.includes(routineType)) {
    return false;
  }

  if (routineTypeSecondary && !validTypes.includes(routineTypeSecondary)) {
    return false;
  }

  // routine_type and routine_type_secondary must be different or secondary must be null
  if (routineType && routineTypeSecondary && routineType === routineTypeSecondary) {
    return false;
  }

  return true;
};

/**
 * Get user selection from routine type values
 * @param {string} routineType - Primary routine type
 * @param {string|null} routineTypeSecondary - Secondary routine type
 * @returns {string} - User selection (صباحي, ليلي, كليهما, خاص)
 */
export const getUserSelectionFromDB = (routineType, routineTypeSecondary = null) => {
  const key = `${routineType}_${routineTypeSecondary || 'null'}`;
  return DB_SELECTION_MAP[key] || 'غير محدد';
};

/**
 * Check if a product should be displayed for a given routine
 * Returns true if the product's routine_type OR routine_type_secondary matches the selected routine
 * This is the main function used for product filtering throughout the app
 * @param {object} product - Product object with routine_type and routine_type_secondary properties
 * @param {string} selectedRoutine - The routine to filter by ('morning', 'night', 'special')
 * @returns {boolean} - True if product should be displayed for this routine
 */
export const shouldShowProductForRoutine = (product, selectedRoutine) => {
  if (!product || !selectedRoutine) {
    return false;
  }

  // Check if product matches the selected routine in either primary or secondary column
  return product.routine_type === selectedRoutine || product.routine_type_secondary === selectedRoutine;
};

/**
 * Get all routines a product appears in
 * Used for displaying routine badges on products
 * @param {object} product - Product object with routine_type and routine_type_secondary properties
 * @returns {array} - Array of routines the product appears in
 */
export const getProductRoutines = (product) => {
  const routines = [];

  if (product?.routine_type) {
    routines.push(product.routine_type);
  }

  if (product?.routine_type_secondary && product.routine_type_secondary !== product.routine_type) {
    routines.push(product.routine_type_secondary);
  }

  return routines;
};
