import { categoriesData } from '@/data/products';

/**
 * Get category name in Arabic given a category ID
 * @param {string} categoryId - The category ID (e.g., 'hair_care')
 * @returns {string} - Arabic category name or category ID if not found
 */
export const getCategoryNameAr = (categoryId) => {
  if (!categoryId) return '';
  const category = categoriesData.find(cat => cat.id === categoryId);
  return category ? category.name : categoryId;
};

/**
 * Get category name in English given a category ID
 * @param {string} categoryId - The category ID (e.g., 'hair_care')
 * @returns {string} - English category name or category ID if not found
 */
export const getCategoryNameEn = (categoryId) => {
  if (!categoryId) return '';
  const category = categoriesData.find(cat => cat.id === categoryId);
  return category ? category.nameEn : categoryId;
};

/**
 * Get full category object by ID
 * @param {string} categoryId - The category ID
 * @returns {object|null} - Category object or null if not found
 */
export const getCategoryById = (categoryId) => {
  if (!categoryId) return null;
  return categoriesData.find(cat => cat.id === categoryId) || null;
};

/**
 * Get category keywords for a category ID
 * @param {string} categoryId - The category ID
 * @returns {array} - Array of keywords for the category
 */
export const getCategoryKeywords = (categoryId) => {
  if (!categoryId) return [];
  const category = categoriesData.find(cat => cat.id === categoryId);
  return category ? category.keywords || [] : [];
};

/**
 * Get all category IDs
 * @returns {array} - Array of all category IDs
 */
export const getAllCategoryIds = () => {
  return categoriesData.map(cat => cat.id);
};

/**
 * Check if a category ID exists
 * @param {string} categoryId - The category ID
 * @returns {boolean} - True if category exists
 */
export const isCategoryValid = (categoryId) => {
  return categoriesData.some(cat => cat.id === categoryId);
};

/**
 * Find category by Arabic name
 * @param {string} nameAr - Arabic category name
 * @returns {object|null} - Category object or null if not found
 */
export const getCategoryByNameAr = (nameAr) => {
  if (!nameAr) return null;
  return categoriesData.find(cat => cat.name === nameAr) || null;
};

/**
 * Find category by English name
 * @param {string} nameEn - English category name
 * @returns {object|null} - Category object or null if not found
 */
export const getCategoryByNameEn = (nameEn) => {
  if (!nameEn) return null;
  return categoriesData.find(cat => cat.nameEn === nameEn) || null;
};

/**
 * Find category by keyword
 * @param {string} keyword - The keyword to search for
 * @returns {object|null} - Category object or null if not found
 */
export const getCategoryByKeyword = (keyword) => {
  if (!keyword) return null;
  return categoriesData.find(cat =>
    cat.keywords && cat.keywords.some(k => k.toLowerCase() === keyword.toLowerCase())
  ) || null;
};

/**
 * Get categories excluding 'all'
 * @returns {array} - Array of category objects (excluding 'all')
 */
export const getCategoriesExcludingAll = () => {
  return categoriesData.filter(cat => cat.id !== 'all');
};
