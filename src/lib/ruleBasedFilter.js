/**
 * Rule-Based Filter Engine - Hybrid Approach
 * Implements hybrid filtering logic:
 * 1. STRICT: subcategory matching (category type must match)
 * 2. STRICT: parent_category matching (if specified)
 * 3. FLEXIBLE: ILIKE matching on name/description (for benefits/issues)
 * 
 * Works with existing database schema - no custom columns needed
 */

/**
 * Filter products based on parsed intent
 * Hybrid logic: strict for categories, flexible for benefits/issues
 *
 * @param {array} products - Array of product objects with subcategory data
 * @param {object} intent - Parsed intent from intentParser
 * @param {object} subcategories - Array of subcategory objects (for slug/parent lookup)
 * @param {object} options - Configuration options
 * @param {boolean} options.requireMinResults - Whether to enforce minimum result count (default: false)
 * @param {number} options.minResultCount - Minimum number of results (default: 3)
 * @returns {object} { results, matchInfo }
 */
export const filterProductsByIntent = (products, intent, subcategories = [], options = {}) => {
  const { requireMinResults = false, minResultCount = 3 } = options;

  if (!products || products.length === 0) {
    return {
      results: [],
      matchInfo: {
        totalProducts: 0,
        appliedFilters: 0,
        matchingProducts: 0,
        filtersCriteria: [],
      },
    };
  }

  // Build filter criteria from intent
  const criteria = buildFilterCriteria(intent, subcategories);

  // If no criteria, return empty results
  if (!criteria.hasCriteria) {
    return {
      results: [],
      matchInfo: {
        totalProducts: products.length,
        appliedFilters: 0,
        matchingProducts: 0,
        filtersCriteria: [],
      },
    };
  }

  // Apply strict category filters
  let filtered = products.filter(product =>
    matchesStrictCriteria(product, criteria, subcategories)
  );

  // If no results from strict filtering, return empty
  if (filtered.length === 0) {
    return {
      results: [],
      matchInfo: {
        totalProducts: products.length,
        appliedFilters: criteria.appliedFiltersCount,
        matchingProducts: 0,
        filtersCriteria: criteria.appliedCriteria,
      },
    };
  }

  // Apply flexible benefit/issue filtering (ILIKE style)
  if (criteria.benefitIssueKeywords.length > 0) {
    filtered = filtered.filter(product =>
      matchesFlexibleCriteria(product, criteria)
    );
  }

  // Sort by relevance
  const ranked = filtered
    .map(product => ({
      product,
      relevanceScore: calculateRelevanceScore(product, criteria, subcategories),
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .map(item => item.product);

  return {
    results: ranked,
    matchInfo: {
      totalProducts: products.length,
      appliedFilters: criteria.appliedFiltersCount,
      matchingProducts: ranked.length,
      filtersCriteria: criteria.appliedCriteria,
      minResultsEnforced: requireMinResults && ranked.length < minResultCount,
    },
  };
};

/**
 * Build filter criteria from parsed intent
 * Maps intent fields to actual database criteria
 * @param {object} intent - Parsed intent
 * @param {array} subcategories - Subcategory lookup data
 * @returns {object} Filter criteria
 */
const buildFilterCriteria = (intent, subcategories = []) => {
  const criteria = {
    subcategorySlugs: [],
    parentCategories: [],
    benefitIssueKeywords: [],
    appliedCriteria: [],
    appliedFiltersCount: 0,
    hasCriteria: false,
  };

  // Map subcategory slugs from intent
  if (intent.subcategorySlugs && intent.subcategorySlugs.length > 0) {
    criteria.subcategorySlugs = intent.subcategorySlugs;
    criteria.appliedCriteria.push('subcategory');
    criteria.appliedFiltersCount++;
    criteria.hasCriteria = true;
  }

  // Map parent categories from intent
  if (intent.parentCategories && intent.parentCategories.length > 0) {
    criteria.parentCategories = intent.parentCategories;
    criteria.appliedCriteria.push('parentCategory');
    criteria.appliedFiltersCount++;
    criteria.hasCriteria = true;
  }

  // Map benefit/issue keywords for ILIKE matching
  if (
    (intent.benefitKeywords && intent.benefitKeywords.length > 0) ||
    (intent.issueKeywords && intent.issueKeywords.length > 0)
  ) {
    criteria.benefitIssueKeywords = [
      ...(intent.benefitKeywords || []),
      ...(intent.issueKeywords || []),
    ];
    criteria.appliedCriteria.push('benefitsIssues');
    criteria.appliedFiltersCount++;
    criteria.hasCriteria = true;
  }

  return criteria;
};

/**
 * Check if product matches STRICT criteria (categories)
 * At least one subcategory slug OR parent category must match
 * @param {object} product - Product to check
 * @param {object} criteria - Filter criteria
 * @param {array} subcategories - Subcategory data
 * @returns {boolean}
 */
const matchesStrictCriteria = (product, criteria, subcategories = []) => {
  // If no strict criteria, accept all products
  if (criteria.subcategorySlugs.length === 0 && criteria.parentCategories.length === 0) {
    return true;
  }

  // Find product's subcategory
  const productSubcategory = subcategories.find(
    sub => sub.id === product.subcategory_id
  );

  let matchesSubcategory = true;
  let matchesParentCategory = true;

  // Check subcategory slug match
  if (criteria.subcategorySlugs.length > 0) {
    if (productSubcategory && productSubcategory.slug) {
      matchesSubcategory = criteria.subcategorySlugs.some(slug =>
        normalizeSlug(productSubcategory.slug) === normalizeSlug(slug)
      );
    } else {
      matchesSubcategory = false;
    }
  }

  // Check parent category match
  if (criteria.parentCategories.length > 0) {
    if (productSubcategory && productSubcategory.parent_category) {
      matchesParentCategory = criteria.parentCategories.some(parentCat =>
        normalizeSlug(productSubcategory.parent_category) === normalizeSlug(parentCat)
      );
    } else {
      matchesParentCategory = false;
    }
  }

  // If both criteria are set, both must match
  // If only one is set, only that one needs to match
  if (criteria.subcategorySlugs.length > 0 && criteria.parentCategories.length > 0) {
    return matchesSubcategory && matchesParentCategory;
  } else if (criteria.subcategorySlugs.length > 0) {
    return matchesSubcategory;
  } else if (criteria.parentCategories.length > 0) {
    return matchesParentCategory;
  }

  return true;
};

/**
 * Check if product matches FLEXIBLE criteria (benefits/issues)
 * Uses ILIKE-style matching on product name and description
 * At least one keyword should match
 * @param {object} product - Product to check
 * @param {object} criteria - Filter criteria
 * @returns {boolean}
 */
const matchesFlexibleCriteria = (product, criteria) => {
  if (criteria.benefitIssueKeywords.length === 0) {
    return true;
  }

  const productName = (product.name || '').toLowerCase();
  const productDescription = (product.description || '').toLowerCase();
  const combinedText = `${productName} ${productDescription}`;

  // At least one keyword should match in name or description
  return criteria.benefitIssueKeywords.some(keyword => {
    const normalizedKeyword = normalizeKeyword(keyword);
    return combinedText.includes(normalizedKeyword);
  });
};

/**
 * Normalize slug for comparison
 * @param {string} slug - Slug to normalize
 * @returns {string}
 */
const normalizeSlug = (slug) => {
  if (!slug) return '';
  return slug.toLowerCase().trim().replace(/\s+/g, '-');
};

/**
 * Normalize keyword for ILIKE matching
 * @param {string} keyword - Keyword to normalize
 * @returns {string}
 */
const normalizeKeyword = (keyword) => {
  if (!keyword) return '';
  return keyword
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u0652]/g, ''); // Remove Arabic diacritics
};

/**
 * Calculate relevance score for sorting results
 * Higher score = better match
 * @param {object} product - Product to score
 * @param {object} criteria - Filter criteria
 * @param {array} subcategories - Subcategory data
 * @returns {number}
 */
const calculateRelevanceScore = (product, criteria, subcategories = []) => {
  let score = 0;

  // Subcategory match (high priority)
  if (criteria.subcategorySlugs.length > 0 && matchesStrictCriteria(product, criteria, subcategories)) {
    score += 100;
  }

  // Exact name match (bonus)
  if (criteria.benefitIssueKeywords.length > 0) {
    const productNameLower = (product.name || '').toLowerCase();
    criteria.benefitIssueKeywords.forEach(keyword => {
      const normalizedKeyword = normalizeKeyword(keyword);
      if (productNameLower.includes(normalizedKeyword)) {
        score += 50; // Higher score for name match
      } else if ((product.description || '').toLowerCase().includes(normalizedKeyword)) {
        score += 20; // Lower score for description match
      }
    });
  }

  // Parent category match (medium priority)
  if (criteria.parentCategories.length > 0) {
    const productSubcategory = subcategories.find(sub => sub.id === product.subcategory_id);
    if (
      productSubcategory &&
      criteria.parentCategories.includes(productSubcategory.parent_category)
    ) {
      score += 30;
    }
  }

  return score;
};

/**
 * Get filter summary for display
 * @param {object} matchInfo - Match info object from filterProductsByIntent
 * @returns {string}
 */
export const getFilterSummary = (matchInfo) => {
  const { appliedFilters, matchingProducts, totalProducts } = matchInfo;

  if (appliedFilters === 0) {
    return 'لم يتم تطبيق أي فلاتر';
  }

  if (matchingProducts === 0) {
    return 'نعتذر، لم نجد منتجات تطابق معاييرك. يرجى تعديل البحث.';
  }

  return `وجدنا ${matchingProducts} منتج يطابق معاييرك`;
};

/**
 * Check if results should be displayed based on minimum count
 * @param {number} matchingCount - Number of matching products
 * @param {boolean} enforceMinimum - Whether to enforce minimum count
 * @param {number} minimumCount - Minimum required count (default: 3)
 * @returns {boolean}
 */
export const shouldDisplayResults = (matchingCount, enforceMinimum = false, minimumCount = 3) => {
  if (!enforceMinimum) {
    // If not enforcing minimum, show any results
    return matchingCount > 0;
  }
  // If enforcing minimum, show only if >= minimumCount
  return matchingCount >= minimumCount;
};

/**
 * Get no-results message
 * @returns {string}
 */
export const getNoResultsMessage = () => {
  return 'لم نجد منتجات تطابق معاييرك. حاول تعديل البحث أو اختيار خيارات أقل تحديداً.';
};
