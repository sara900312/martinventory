import { useState, useCallback } from 'react';
import { validateMediaModeration } from '@/lib/contentModerationEngine';
import {
  validateMediaFromURL,
  validateMediaFromSupabaseStorage,
  validateMediaBatch,
} from '@/lib/mediaValidationUtils';

/**
 * React hook for content moderation
 * Provides easy-to-use functions for validating media files
 *
 * @param {string} mode - 'strict' or 'popup' (default: 'popup')
 */
export const useContentModeration = (mode = 'popup') => {
  const [isValidating, setIsValidating] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Validate a single file
   *
   * @param {File} file - The file to validate
   */
  const validateFile = useCallback(async (file) => {
    setIsValidating(true);
    setError(null);

    try {
      const result = await validateMediaModeration(file, mode);
      setLastResult(result);
      return result;
    } catch (err) {
      const errorMsg = err.message || 'خطأ في التحليل';
      setError(errorMsg);
      return {
        allowed: false,
        reason: errorMsg,
        details: { error: errorMsg },
      };
    } finally {
      setIsValidating(false);
    }
  }, [mode]);

  /**
   * Validate media from URL
   *
   * @param {string} url - The URL to validate
   */
  const validateURL = useCallback(async (url) => {
    setIsValidating(true);
    setError(null);

    try {
      const result = await validateMediaFromURL(url, mode);
      setLastResult(result);
      return result;
    } catch (err) {
      const errorMsg = err.message || 'خطأ في التحليل';
      setError(errorMsg);
      return {
        allowed: false,
        reason: errorMsg,
        details: { error: errorMsg },
      };
    } finally {
      setIsValidating(false);
    }
  }, [mode]);

  /**
   * Validate media from Supabase Storage
   */
  const validateStorage = useCallback(
    async (supabase, bucketName, filePath) => {
      setIsValidating(true);
      setError(null);

      try {
        const result = await validateMediaFromSupabaseStorage(
          supabase,
          bucketName,
          filePath,
          mode
        );
        setLastResult(result);
        return result;
      } catch (err) {
        const errorMsg = err.message || 'خطأ في التحليل';
        setError(errorMsg);
        return {
          allowed: false,
          reason: errorMsg,
          details: { error: errorMsg },
        };
      } finally {
        setIsValidating(false);
      }
    },
    [mode]
  );

  /**
   * Validate multiple files
   *
   * @param {File[]} files - Array of files to validate
   */
  const validateBatch = useCallback(async (files) => {
    setIsValidating(true);
    setError(null);

    try {
      const result = await validateMediaBatch(files, mode);
      setLastResult(result);
      return result;
    } catch (err) {
      const errorMsg = err.message || 'خطأ في التحليل';
      setError(errorMsg);
      return {
        allValid: false,
        totalFiles: files.length,
        validFiles: 0,
        failedFiles: files.map((f) => ({
          fileName: f.name,
          allowed: false,
          reason: errorMsg,
        })),
      };
    } finally {
      setIsValidating(false);
    }
  }, [mode]);

  /**
   * Clear results
   */
  const reset = useCallback(() => {
    setLastResult(null);
    setError(null);
  }, []);

  return {
    validateFile,
    validateURL,
    validateStorage,
    validateBatch,
    isValidating,
    lastResult,
    error,
    reset,
  };
};

export default useContentModeration;
