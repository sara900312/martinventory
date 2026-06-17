/**
 * Intent Parser - Database Schema Aware
 * Parses user search queries and extracts structured intent mapped to:
 * - subcategory slugs (for exact/strict matching)
 * - parent categories (for category filtering)
 * - benefit/issue keywords (for flexible ILIKE matching)
 * 
 * No custom attributes needed - uses only database fields
 */

import {
  normalizeKeyword,
  findSubcategoryTypeByKeyword,
  findParentCategoryByKeyword,
  findBenefitIssueByKeyword,
  SUBCATEGORY_TYPE_KEYWORDS,
  PARENT_CATEGORY_KEYWORDS,
  BENEFIT_ISSUE_KEYWORDS,
} from './smartSearchAttributes';

/**
 * Parse search query and extract structured intent
 * Maps to existing database schema fields only
 * 
 * @param {string} query - User's search query
 * @returns {object} Parsed intent with subcategory slugs, parent categories, and benefit/issue keywords
 */
export const parseIntent = (query) => {
  if (!query || !query.trim()) {
    return {
      originalQuery: '',
      normalized: '',
      subcategorySlugs: [],
      parentCategories: [],
      benefitKeywords: [],
      issueKeywords: [],
      confidence: 0,
      rawTokens: [],
    };
  }

  const normalized = normalizeQuery(query);
  const tokens = tokenizeQuery(normalized);

  const subcategorySlugs = [];
  const parentCategories = [];
  const benefitKeywords = [];
  const issueKeywords = [];
  const matchedTokens = new Set();

  // Process each token
  tokens.forEach((token, index) => {
    // Skip if already matched
    if (matchedTokens.has(token)) return;

    // Try to find subcategory type match
    const subcategoryType = findSubcategoryTypeByKeyword(token);
    if (subcategoryType) {
      subcategorySlugs.push(...subcategoryType.subcategorySlugs);
      matchedTokens.add(token);
      return;
    }

    // Try to find parent category match
    const parentCategory = findParentCategoryByKeyword(token);
    if (parentCategory) {
      parentCategories.push(parentCategory.parentCategory);
      matchedTokens.add(token);
      return;
    }

    // Try to find benefit/issue match
    const benefitIssue = findBenefitIssueByKeyword(token);
    if (benefitIssue) {
      if (benefitIssue.type === 'benefit') {
        benefitKeywords.push(token);
      } else {
        issueKeywords.push(token);
      }
      matchedTokens.add(token);
      return;
    }

    // If not exact match, treat as generic benefit/issue keyword for ILIKE matching
    // This allows partial keyword matching for benefits/issues
    benefitKeywords.push(token);
  });

  // Calculate confidence score
  const matchedCount = matchedTokens.size;
  const confidence = matchedCount > 0 ? Math.min((matchedCount / tokens.length) * 100, 100) : 0;

  return {
    originalQuery: query,
    normalized,
    subcategorySlugs: [...new Set(subcategorySlugs)], // Remove duplicates
    parentCategories: [...new Set(parentCategories)],
    benefitKeywords: [...new Set(benefitKeywords)],
    issueKeywords: [...new Set(issueKeywords)],
    confidence: Math.round(confidence),
    rawTokens: tokens,
    matchedTokens: Array.from(matchedTokens),
  };
};

/**
 * Normalize search query
 * - Remove extra whitespace
 * - Convert to lowercase
 * - Handle Arabic diacritics
 * @param {string} query - Raw query string
 * @returns {string} Normalized query
 */
const normalizeQuery = (query) => {
  if (!query || typeof query !== 'string') return '';

  return query
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, '') // Remove Arabic diacritics
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
};

/**
 * Tokenize query into individual words/phrases
 * Handles Arabic and English
 * @param {string} query - Normalized query
 * @returns {array} Array of tokens
 */
const tokenizeQuery = (query) => {
  if (!query) return [];

  // Split by spaces, commas, and other delimiters
  const tokens = query
    .split(/[\s،،\-_]+/)
    .filter(token => token.length > 0);

  return tokens;
};

/**
 * Generate search suggestions based on partial query
 * Used for showing suggestions while typing
 * @param {string} partialQuery - Partial query from user
 * @returns {array} Array of suggestion objects
 */
export const generateSuggestions = (partialQuery) => {
  if (!partialQuery || partialQuery.length < 2) {
    return [];
  }

  const normalized = normalizeKeyword(partialQuery);
  const suggestions = new Set();

  // Search subcategory types
  Object.values(SUBCATEGORY_TYPE_KEYWORDS).forEach(typeData => {
    typeData.keywords.forEach(keyword => {
      const normalizedKeyword = normalizeKeyword(keyword);
      if (normalizedKeyword.includes(normalized) || normalized.includes(normalizedKeyword.substring(0, 3))) {
        suggestions.add({
          text: typeData.ar,
          type: 'subcategoryType',
          icon: getTypeIcon(typeData),
        });
      }
    });
  });

  // Search parent categories
  Object.values(PARENT_CATEGORY_KEYWORDS).forEach(categoryData => {
    categoryData.keywords.forEach(keyword => {
      const normalizedKeyword = normalizeKeyword(keyword);
      if (normalizedKeyword.includes(normalized) || normalized.includes(normalizedKeyword.substring(0, 3))) {
        suggestions.add({
          text: categoryData.ar,
          type: 'parentCategory',
          icon: getCategoryIcon(categoryData),
        });
      }
    });
  });

  // Search benefits
  BENEFIT_ISSUE_KEYWORDS.benefits.forEach(benefit => {
    benefit.keywords.forEach(keyword => {
      const normalizedKeyword = normalizeKeyword(keyword);
      if (normalizedKeyword.includes(normalized) || normalized.includes(normalizedKeyword.substring(0, 3))) {
        suggestions.add({
          text: benefit.ar,
          type: 'benefit',
          icon: '✨',
        });
      }
    });
  });

  // Search issues
  BENEFIT_ISSUE_KEYWORDS.issues.forEach(issue => {
    issue.keywords.forEach(keyword => {
      const normalizedKeyword = normalizeKeyword(keyword);
      if (normalizedKeyword.includes(normalized) || normalized.includes(normalizedKeyword.substring(0, 3))) {
        suggestions.add({
          text: issue.ar,
          type: 'issue',
          icon: '⚠️',
        });
      }
    });
  });

  return Array.from(suggestions).slice(0, 8); // Limit to 8 suggestions
};

/**
 * Get icon for product type
 * @param {object} typeData - Product type data
 * @returns {string} Icon/emoji
 */
const getTypeIcon = (typeData) => {
  const iconMap = {
    shampoo: '🧴',
    conditioner: '🧴',
    mask: '🎭',
    serum: '💧',
    oil: '🫗',
    cream: '🧈',
    spray: '💨',
    cleanser: '🧼',
    moisturizer: '🧴',
    toner: '💧',
    exfoliant: '✨',
  };

  // Use the first matching icon
  for (const [key, icon] of Object.entries(iconMap)) {
    if (typeData.keywords.some(kw => normalizeKeyword(kw).includes(key))) {
      return icon;
    }
  }

  return '•';
};

/**
 * Get icon for category
 * @param {object} categoryData - Category data
 * @returns {string} Icon/emoji
 */
const getCategoryIcon = (categoryData) => {
  const iconMap = {
    hairCare: '💇',
    skincare: '🧴',
    bodyCare: '💆',
  };

  for (const [key, icon] of Object.entries(iconMap)) {
    if (categoryData.ar === PARENT_CATEGORY_KEYWORDS[key]?.ar) {
      return icon;
    }
  }

  return '•';
};

/**
 * Format intent for display
 * Creates a readable description of the parsed intent
 * @param {object} intent - Parsed intent object
 * @param {string} lang - Language (ar or en)
 * @returns {string} Formatted description
 */
export const formatIntentForDisplay = (intent, lang = 'ar') => {
  const parts = [];

  if (intent.subcategorySlugs && intent.subcategorySlugs.length > 0) {
    parts.push(
      lang === 'ar'
        ? `${intent.subcategorySlugs.join(' أو ')}`
        : `${intent.subcategorySlugs.join(' or ')}`
    );
  }

  if (intent.parentCategories && intent.parentCategories.length > 0) {
    const categoryLabels = intent.parentCategories.map(cat => {
      const categoryMap = {
        'hair_care': { ar: 'شعر', en: 'Hair' },
        'skincare': { ar: 'بشرة', en: 'Skincare' },
        'body_care': { ar: 'جسم', en: 'Body' },
      };
      return categoryMap[cat]?.[lang] || cat;
    });

    if (lang === 'ar') {
      parts.push(`للـ ${categoryLabels.join(' أو ')}`);
    } else {
      parts.push(`for ${categoryLabels.join(' or ')}`);
    }
  }

  if (intent.benefitKeywords && intent.benefitKeywords.length > 0) {
    if (lang === 'ar') {
      parts.push(`بفوائد ${intent.benefitKeywords.join(' و ')}`);
    } else {
      parts.push(`with benefits ${intent.benefitKeywords.join(' and ')}`);
    }
  }

  if (intent.issueKeywords && intent.issueKeywords.length > 0) {
    if (lang === 'ar') {
      parts.push(`لحل ${intent.issueKeywords.join(' أو ')}`);
    } else {
      parts.push(`for ${intent.issueKeywords.join(' or ')}`);
    }
  }

  return parts.join(' ');
};

/**
 * Check if intent has meaningful criteria
 * @param {object} intent - Parsed intent
 * @returns {boolean}
 */
export const isIntentMeaningful = (intent) => {
  const hasCriteria =
    (intent.subcategorySlugs && intent.subcategorySlugs.length > 0) ||
    (intent.parentCategories && intent.parentCategories.length > 0) ||
    (intent.benefitKeywords && intent.benefitKeywords.length > 0) ||
    (intent.issueKeywords && intent.issueKeywords.length > 0);

  return hasCriteria;
};
