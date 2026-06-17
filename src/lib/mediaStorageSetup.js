/**
 * Media Storage Configuration
 *
 * IMPORTANT: The storage bucket must be created in Supabase Dashboard first.
 * Bucket creation is server-only in Supabase and cannot be done from the client.
 *
 * To create a bucket:
 * 1. Go to Supabase Dashboard
 * 2. Navigate to Storage
 * 3. Create a new bucket named "popup-media" (or use an existing bucket)
 * 4. Configure the bucket as public for direct URL access
 */

import { supabase } from '@/lib/supabaseClient';

// Use existing bucket - change to your bucket name if different
export const POPUP_MEDIA_BUCKET = 'popup-media';

/**
 * Check if storage bucket is accessible
 * This is a simple connectivity check, not bucket creation
 */
export const checkBucketAccess = async () => {
  try {
    // Try to list files in the bucket root
    const { error } = await supabase.storage
      .from(POPUP_MEDIA_BUCKET)
      .list('');

    if (error) {
      console.warn(
        `Storage bucket "${POPUP_MEDIA_BUCKET}" is not accessible.`,
        'Please ensure the bucket exists in your Supabase project.',
        'Error:',
        error.message
      );
      return false;
    }

    console.log(`✓ Storage bucket "${POPUP_MEDIA_BUCKET}" is accessible`);
    return true;
  } catch (error) {
    console.warn('Error checking bucket access:', error.message);
    return false;
  }
};
