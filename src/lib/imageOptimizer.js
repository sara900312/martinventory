/**
 * Image Optimizer Utility
 * Provides optimized image URLs with proper sizing and formats
 */

/**
 * Generate optimized image URL with proper sizing
 * @param {string} imageUrl - Original image URL
 * @param {number} width - Desired width in pixels
 * @param {number} quality - JPEG quality (0-100, default 80)
 * @returns {string} - Optimized image URL
 */
export const getOptimizedImageUrl = (imageUrl, width = 400, quality = 80) => {
  if (!imageUrl) return '';

  // If it's already an optimized URL, return as-is
  if (imageUrl.includes('imgix') || imageUrl.includes('cdn') || imageUrl.includes('cloudinary')) {
    return imageUrl;
  }

  // For local/data URLs, return as-is
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // For remote URLs, add query parameters for optimization
  // This can be enhanced based on your CDN choice
  try {
    const url = new URL(imageUrl);
    
    // Add width and quality parameters
    url.searchParams.set('w', width);
    url.searchParams.set('q', quality);
    
    return url.toString();
  } catch (e) {
    // If URL parsing fails, return original
    return imageUrl;
  }
};

/**
 * Generate responsive image srcset for lazy loading
 * @param {string} imageUrl - Original image URL
 * @param {array} sizes - Array of widths to generate [400, 600, 800]
 * @returns {string} - HTML srcset string
 */
export const getResponsiveImageSrcset = (imageUrl, sizes = [400, 600, 800]) => {
  if (!imageUrl) return '';

  return sizes
    .map(size => `${getOptimizedImageUrl(imageUrl, size)} ${size}w`)
    .join(', ');
};

/**
 * Get appropriate image size based on device
 * @returns {number} - Width in pixels
 */
export const getResponsiveImageWidth = () => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
  
  if (width < 640) return 400;  // Mobile
  if (width < 1024) return 600; // Tablet
  return 800;                    // Desktop
};

/**
 * Preload image to improve perceived performance
 * @param {string} imageUrl - Image URL to preload
 */
export const preloadImage = (imageUrl) => {
  if (typeof document === 'undefined') return;

  const img = new Image();
  img.src = getOptimizedImageUrl(imageUrl, getResponsiveImageWidth());
};

/**
 * Preload multiple images
 * @param {array} imageUrls - Array of image URLs
 */
export const preloadImages = (imageUrls) => {
  imageUrls.forEach(url => preloadImage(url));
};

/**
 * Get WebP image URL with fallback
 * @param {string} imageUrl - Original image URL
 * @param {boolean} supportsWebP - Whether browser supports WebP
 * @returns {string} - Optimized image URL (WebP or JPEG)
 */
export const getWebPImage = (imageUrl, supportsWebP = true) => {
  if (!imageUrl || !supportsWebP) {
    return getOptimizedImageUrl(imageUrl);
  }

  // Try to convert to WebP format
  try {
    const url = new URL(imageUrl);
    const format = url.searchParams.get('f') || 'webp';
    url.searchParams.set('f', format);
    return url.toString();
  } catch (e) {
    return getOptimizedImageUrl(imageUrl);
  }
};

/**
 * Check if browser supports WebP
 * @returns {Promise<boolean>} - True if WebP is supported
 */
export const supportsWebP = async () => {
  if (typeof window === 'undefined') return false;

  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAAAwAQCdASoBAAEAAAAcJZQCdAAA/gAAP7+AAAA=';
  });
};

export default {
  getOptimizedImageUrl,
  getResponsiveImageSrcset,
  getResponsiveImageWidth,
  preloadImage,
  preloadImages,
  getWebPImage,
  supportsWebP,
};
