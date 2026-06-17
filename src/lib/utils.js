import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

// Basic frontend sanitizers (React already escapes rendering; this protects payloads and URLs)
export function sanitizeText(value, maxLen = 2000) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().slice(0, maxLen);
  // Remove control chars and HTML brackets to reduce injection vectors before sending to backend
  return trimmed.replace(/[\u0000-\u001F\u007F<>]/g, '');
}

export function sanitizeUrl(url) {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  try {
    const u = new URL(trimmed, window.location.origin);
    const allowed = ['http:', 'https:'];
    // إذا كانت القيمة المُدخلة فارغة سابقاً أو غير صالح�� فلن نُرجِع دومًا رابط الموقع
    return allowed.includes(u.protocol) ? u.toString() : '';
  } catch {
    return '';
  }
}

export function safeNumber(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(n)) return min;
  const clamped = Math.max(min, Math.min(max, n));
  return clamped;
}

export function generateProductSlug(name) {
  if (!name || typeof name !== 'string') return 'product';

  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product';
}

export async function generateUniqueProductSlug(name, supabase, excludeId = null) {
  if (!supabase) {
    console.warn('Supabase client not provided for slug generation');
    return generateProductSlug(name);
  }

  const baseSlug = generateProductSlug(name);

  try {
    // Check if base slug exists
    let query = supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('slug', baseSlug);

    // If editing, exclude current product from check
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error checking slug uniqueness:', error);
      return baseSlug;
    }

    // If slug doesn't exist, use it
    if (count === 0) {
      return baseSlug;
    }

    // Otherwise, append incrementing number until unique
    for (let i = 1; i <= 1000; i++) {
      const candidateSlug = `${baseSlug}-${i}`;
      const { count: candidateCount, error: candidateError } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('slug', candidateSlug)
        .neq('id', excludeId || '');

      if (candidateError) {
        console.error('Error checking candidate slug:', candidateError);
        return candidateSlug;
      }

      if (candidateCount === 0) {
        return candidateSlug;
      }
    }

    // Fallback: use base slug with timestamp
    return `${baseSlug}-${Date.now()}`;
  } catch (error) {
    console.error('Error generating unique slug:', error);
    return `${baseSlug}-${Date.now()}`;
  }
}

/**
 * Normalize text for flexible search matching
 * Replaces symbols with spaces to allow matching names with or without special characters
 * Examples:
 * - "6/77" → "6 77"
 * - "6-77" → "6 77"
 * - "6*77" → "6 77"
 * - "LILAFIX Hair Colour 6/77" → "lilafix hair colour 6 77"
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text (lowercase with spaces collapsed)
 */
export function normalizeSearchText(text) {
  if (typeof text !== 'string') return '';

  return text
    .toLowerCase()
    .trim()
    .replace(/[\/*\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if normalized product name matches normalized search query
 * @param {string} productName - Product name to check
 * @param {string} searchQuery - Search query from user input
 * @returns {boolean} True if normalized names match
 */
export function matchesNormalizedSearch(productName, searchQuery) {
  if (!productName || !searchQuery) return false;

  const normalizedName = normalizeSearchText(productName);
  const normalizedQuery = normalizeSearchText(searchQuery);

  return normalizedName.includes(normalizedQuery);
}

export async function generateBarcode(supabase) {
  const generateRandomString = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  let barcode;
  let isUnique = false;
  while (!isUnique) {
    barcode = generateRandomString(8);
    const { data, error } = await supabase
      .from('products')
      .select('barcode')
      .eq('barcode', barcode)
      .maybeSingle();

    if (error) {
      console.error('Error checking barcode uniqueness:', error);
      throw error;
    }

    if (!data) {
      isUnique = true;
    }
  }
  return barcode;
}
