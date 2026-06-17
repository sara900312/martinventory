/**
 * Image Client-Side Validation
 * Uses the advanced Content Moderation Engine
 */

import { validateImageModeration } from './contentModerationEngine';

/**
 * Main validation function for images
 * Returns:
 * - 'ACCEPT' if image is valid
 * - 'REJECT' if image violates moderation rules
 *
 * @param {File} file - The image file to validate
 * @param {string} mode - 'strict' or 'popup' (default: 'popup')
 */
export const validateImageClientSide = async (file, mode = 'popup') => {
  try {
    const result = await validateImageModeration(file, mode);
    return result.allowed ? 'ACCEPT' : 'REJECT';
  } catch (error) {
    console.error('Image validation error:', error);
    return 'REJECT';
  }
};

/**
 * Get detailed validation result with confidence scores
 * Used by MediaManager for detailed error messages
 *
 * @param {File} file - The image file to validate
 * @param {string} mode - 'strict' or 'popup' (default: 'popup')
 */
export const validateImageWithDetails = async (file, mode = 'popup') => {
  try {
    return await validateImageModeration(file, mode);
  } catch (error) {
    console.error('Image validation error:', error);
    return {
      allowed: false,
      reason: `خطأ في التحليل: ${error.message}`,
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
