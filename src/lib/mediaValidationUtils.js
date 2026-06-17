/**
 * Media Validation Utilities
 * Validate images/videos from database, storage URLs, or local files
 * Uses the local Content Moderation Engine
 */

import { validateMediaModeration } from './contentModerationEngine';

/**
 * Fetch and validate media from URL
 * Converts URL to Blob, then to File for validation
 *
 * @param {string} mediaUrl - The URL of the media to validate
 * @param {string} mode - 'strict' or 'popup' (default: 'popup')
 */
export const validateMediaFromURL = async (mediaUrl, mode = 'popup') => {
  try {
    const response = await fetch(mediaUrl);
    if (!response.ok) {
      return {
        allowed: false,
        reason: 'فشل تحميل الملف من الخادم',
        details: { error: `HTTP ${response.status}` },
      };
    }

    const blob = await response.blob();

    // Determine file extension from URL
    const urlPath = new URL(mediaUrl).pathname;
    const extension = urlPath.split('.').pop()?.toLowerCase() || 'bin';

    // Create File object
    const file = new File(
      [blob],
      `media_${Date.now()}.${extension}`,
      { type: blob.type }
    );

    return await validateMediaModeration(file, mode);
  } catch (error) {
    console.error('Error validating media from URL:', error);
    return {
      allowed: false,
      reason: `خطأ في تحليل الملف: ${error.message}`,
      details: { error: error.message },
    };
  }
};

/**
 * Validate media from Supabase Storage
 * Uses public URL to download and validate
 *
 * @param {object} supabase - Supabase client
 * @param {string} bucketName - Storage bucket name
 * @param {string} filePath - File path in bucket
 * @param {string} mode - 'strict' or 'popup' (default: 'popup')
 */
export const validateMediaFromSupabaseStorage = async (supabase, bucketName, filePath, mode = 'popup') => {
  try {
    // Get public URL
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
      return {
        allowed: false,
        reason: 'فشل الحصول على رابط الملف',
        details: { error: 'No public URL available' },
      };
    }

    // Validate using the URL
    return await validateMediaFromURL(data.publicUrl, mode);
  } catch (error) {
    console.error('Error validating media from storage:', error);
    return {
      allowed: false,
      reason: `خطأ في تحليل الملف من التخزين: ${error.message}`,
      details: { error: error.message },
    };
  }
};

/**
 * Batch validate multiple files
 * Returns array of results
 *
 * @param {File[]} files - Array of files to validate
 * @param {string} mode - 'strict' or 'popup' (default: 'popup')
 */
export const validateMultipleMedia = async (files, mode = 'popup') => {
  const results = [];

  for (const file of files) {
    try {
      const result = await validateMediaModeration(file, mode);
      results.push({
        fileName: file.name,
        ...result,
      });
    } catch (error) {
      results.push({
        fileName: file.name,
        allowed: false,
        reason: error.message,
        details: { error: error.message },
      });
    }
  }

  return results;
};

/**
 * Batch validate media from URLs
 * Returns array of results
 *
 * @param {string[]} urls - Array of media URLs
 * @param {string} mode - 'strict' or 'popup' (default: 'popup')
 */
export const validateMultipleMediaFromURLs = async (urls, mode = 'popup') => {
  const results = [];

  for (const url of urls) {
    const result = await validateMediaFromURL(url, mode);
    results.push({
      url,
      ...result,
    });
  }

  return results;
};

/**
 * Check if batch of files all pass validation
 * Useful for form submissions
 *
 * @param {File[]} files - Array of files to validate
 * @param {string} mode - 'strict' or 'popup' (default: 'popup')
 */
export const validateMediaBatch = async (files, mode = 'popup') => {
  const results = await validateMultipleMedia(files, mode);

  const allValid = results.every(r => r.allowed);
  const failedFiles = results.filter(r => !r.allowed);

  return {
    allValid,
    totalFiles: results.length,
    validFiles: results.filter(r => r.allowed).length,
    failedFiles,
    details: results,
  };
};

export default {
  validateMediaFromURL,
  validateMediaFromSupabaseStorage,
  validateMultipleMedia,
  validateMultipleMediaFromURLs,
  validateMediaBatch,
};
