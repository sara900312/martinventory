/**
 * Video Client-Side Validation
 * Uses the advanced Content Moderation Engine
 */

import { validateVideoModeration } from './contentModerationEngine';

/**
 * Main validation function for videos
 * Returns:
 * - 'ACCEPT' if video is valid
 * - 'REJECT' if video violates moderation rules
 *
 * @param {File} file - The video file to validate
 * @param {string} mode - 'strict' or 'popup' (default: 'popup')
 */
export const validateVideoClientSide = async (file, mode = 'popup') => {
  try {
    const result = await validateVideoModeration(file, mode);
    return result.allowed ? 'ACCEPT' : 'REJECT';
  } catch (error) {
    console.error('Video validation error:', error);
    return 'REJECT';
  }
};

/**
 * Get detailed validation result with frame analysis
 * Used by MediaManager for detailed error messages
 *
 * @param {File} file - The video file to validate
 * @param {string} mode - 'strict' or 'popup' (default: 'popup')
 */
export const validateVideoWithDetails = async (file, mode = 'popup') => {
  try {
    return await validateVideoModeration(file, mode);
  } catch (error) {
    console.error('Video validation error:', error);
    return {
      allowed: false,
      reason: `خطأ في تحليل الفيديو: ${error.message}`,
      details: { error: error.message },
    };
  }
};

/**
 * Clean up TensorFlow resources
 */
export const cleanupValidation = () => {
  // Cleanup is handled by contentModerationEngine
};
