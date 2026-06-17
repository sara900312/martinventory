/**
 * Sitemap Generator for Beauty Neomart
 * Generates XML sitemap for Google and search engines
 * Includes static pages and dynamic product/category pages
 */

import { categoriesData } from '@/data/products';

const SITE_URL = 'https://beauty.neomart.space';

/**
 * Generate sitemap XML from products and categories
 * @param {Array} products - Array of product objects from Supabase
 * @param {Array} categories - Array of category objects (optional)
 * @returns {string} - XML sitemap content
 */
export const generateSitemapXML = (products = [], categories = categoriesData || []) => {
  const urls = [];
  const now = new Date();
  const lastmod = now.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Priority levels
  const PRIORITY = {
    HOME: '1.0',
    CATEGORY: '0.8',
    PRODUCT: '0.6',
    ABOUT: '0.5',
  };

  // Add homepage with highest priority
  urls.push({
    loc: SITE_URL,
    lastmod,
    priority: PRIORITY.HOME,
    changefreq: 'daily',
  });

  // Add all category pages
  if (categories && categories.length > 0) {
    categories
      .filter(cat => cat.id !== 'all') // Skip 'all' category
      .forEach(category => {
        urls.push({
          loc: `${SITE_URL}/products/${category.id}`,
          lastmod,
          priority: PRIORITY.CATEGORY,
          changefreq: 'weekly',
        });
      });
  }

  // Add all published products
  if (products && products.length > 0) {
    products
      .filter(product => product.published === true) // Only published products
      .forEach(product => {
        // Generate product URL using slug or ID
        const productSlug = product.slug || product.id;
        urls.push({
          loc: `${SITE_URL}/products/${product.category}/${productSlug}`,
          lastmod: product.updated_at || lastmod,
          priority: PRIORITY.PRODUCT,
          changefreq: 'weekly',
        });
      });
  }

  // Generate XML string
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXmlString(url.loc)}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  return xml;
};

/**
 * Escape special XML characters
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
const escapeXmlString = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Get priority for a URL
 * @param {string} url - URL to evaluate
 * @returns {string} - Priority value 0.0-1.0
 */
export const getUrlPriority = (url) => {
  if (url === SITE_URL || url === `${SITE_URL}/`) return '1.0';
  if (url.includes('/products') && !url.includes('/products/')) return '0.8';
  if (url.includes('/products/')) return '0.6';
  return '0.5';
};

/**
 * Get change frequency for a URL
 * @param {string} url - URL to evaluate
 * @returns {string} - Change frequency (always, hourly, daily, weekly, monthly, yearly, never)
 */
export const getChangeFrequency = (url) => {
  if (url === SITE_URL || url === `${SITE_URL}/`) return 'daily';
  if (url.includes('/products') && !url.match(/\/products\/\w+\//)) return 'weekly';
  return 'weekly';
};

export default generateSitemapXML;
