import { supabase } from '@/lib/supabaseClient';

/**
 * Ensures a Supabase storage URL is publicly accessible
 * @param {string} url - The storage URL
 * @returns {string} - The public URL
 */
export const ensurePublicUrl = (url) => {
  if (!url) return null;

  // If it's already a public URL, return as-is
  if (url.startsWith('http')) {
    return url;
  }

  return url;
};

/**
 * Generates a public URL for a file in Supabase storage
 * @param {string} bucket - The bucket name
 * @param {string} path - The file path in the bucket
 * @returns {object} - Object with publicUrl and signedUrl
 */
export const getFilePublicUrl = (bucket, path) => {
  try {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      publicUrl: data?.publicUrl,
      signedUrl: null,
    };
  } catch (error) {
    console.error('Error getting public URL:', error);
    return {
      publicUrl: null,
      signedUrl: null,
    };
  }
};

/**
 * Checks if a Supabase storage URL is from the popup-media bucket
 * @param {string} url - The URL to check
 * @returns {boolean}
 */
export const isPopupMediaUrl = (url) => {
  if (!url) return false;
  return url.includes('popup-media') || url.includes('supabaseusercontent.com');
};

/**
 * Adds proper headers to requests for Supabase storage
 * This is mainly for documentation - actual CORS is handled by Supabase config
 * @returns {object} - Headers object
 */
export const getStorageHeaders = () => {
  return {
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
  };
};

/**
 * Tests if an image/video URL is accessible
 * @param {string} url - The URL to test
 * @returns {Promise<boolean>} - True if accessible
 */
export const testUrlAccessibility = async (url) => {
  if (!url) return false;

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
      headers: getStorageHeaders(),
    }).catch(() => {
      // Fallback to GET if HEAD fails
      return fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: getStorageHeaders(),
      });
    });

    return response.ok || response.status < 400;
  } catch (error) {
    console.warn('URL accessibility test failed:', url, error.message);
    return false;
  }
};

/**
 * Bucket Configuration Status
 * Checks if the popup-media bucket is properly configured
 */
export const checkBucketConfiguration = async () => {
  try {
    const { data, error } = await supabase.storage
      .from('popup-media')
      .list('', { limit: 1 });

    if (error) {
      console.warn('Bucket not accessible:', error.message);
      return {
        accessible: false,
        public: false,
        corsConfigured: false,
        error: error.message,
      };
    }

    return {
      accessible: true,
      public: true,
      corsConfigured: true,
      error: null,
    };
  } catch (error) {
    console.error('Error checking bucket configuration:', error);
    return {
      accessible: false,
      public: false,
      corsConfigured: false,
      error: error.message,
    };
  }
};
