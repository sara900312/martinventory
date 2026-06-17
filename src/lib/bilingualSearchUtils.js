import {
  arabicKeywordDictionary,
  brandTransliterationMap,
  categoryKeywordMap,
  englishToArabicMap
} from '@/lib/bilingualSearchDictionary';
import { categoriesData } from '@/data/products';

/**
 * Remove Arabic diacritics (tashkeel)
 * Handles fatha, damma, kasra, sukun, etc.
 */
const removeDiacritics = (text) => {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u0652]/g, '') // Remove Arabic diacritics
    .replace(/\u0643/g, '\u0643') // Normalize kaf variants
    .replace(/\u064A/g, '\u064A'); // Normalize ya variants
};

/**
 * Normalize search query
 * - Remove diacritics
 * - Convert to lowercase
 * - Trim whitespace
 * - Replace multiple spaces with single space
 */
export const normalizeSearchQuery = (query) => {
  if (!query || typeof query !== 'string') return '';

  let normalized = removeDiacritics(query);
  normalized = normalized.trim().toLowerCase();
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
};

/**
 * Expand search query using dictionaries
 * Returns an array of all possible search terms
 */
export const expandSearchQuery = (query) => {
  const normalized = normalizeSearchQuery(query);

  if (!normalized) return [];

  const expandedTerms = new Set([normalized]);

  // Check if query matches any Arabic keyword
  const arabicMatches = Object.entries(arabicKeywordDictionary).filter(([arabicTerm]) => {
    const normalizedArabic = normalizeSearchQuery(arabicTerm);
    return normalizedArabic === normalized || normalized.includes(normalizedArabic);
  });

  arabicMatches.forEach(([_, englishTerms]) => {
    englishTerms.forEach(term => {
      expandedTerms.add(normalizeSearchQuery(term));
    });
  });

  // Check if query matches brand transliterations
  const brandMatches = Object.entries(brandTransliterationMap).filter(([arabicBrand]) => {
    const normalizedBrand = normalizeSearchQuery(arabicBrand);
    return normalizedBrand === normalized || normalized.includes(normalizedBrand);
  });

  brandMatches.forEach(([_, englishBrand]) => {
    expandedTerms.add(normalizeSearchQuery(englishBrand));
  });

  // Check reverse mapping (English to Arabic)
  const reverseMatches = Object.entries(englishToArabicMap).filter(([englishTerm]) => {
    const normalizedEnglish = normalizeSearchQuery(englishTerm);
    return normalizedEnglish === normalized || normalized.includes(normalizedEnglish);
  });

  reverseMatches.forEach(([_, arabicTerms]) => {
    arabicTerms.forEach(term => {
      expandedTerms.add(normalizeSearchQuery(term));
    });
  });

  // Check if query matches category keywords
  categoriesData.forEach(category => {
    if (category.keywords) {
      category.keywords.forEach(keyword => {
        const normalizedKeyword = normalizeSearchQuery(keyword);
        if (normalizedKeyword === normalized || normalized.includes(normalizedKeyword) || normalizedKeyword.includes(normalized)) {
          // Add category ID and all related keywords
          expandedTerms.add(category.id);
          expandedTerms.add(normalizeSearchQuery(category.name));
          expandedTerms.add(normalizeSearchQuery(category.nameEn));
          category.keywords.forEach(k => {
            expandedTerms.add(normalizeSearchQuery(k));
          });
        }
      });
    }
  });

  return Array.from(expandedTerms);
};

/**
 * Generate search aliases for a product
 * Returns array of searchable terms
 */
export const generateSearchAliases = (product) => {
  if (!product) return [];

  const aliases = new Set();

  // Add product names (Arabic and English)
  if (product.name) {
    aliases.add(normalizeSearchQuery(product.name));
  }
  if (product.name_en) {
    aliases.add(normalizeSearchQuery(product.name_en));
  }

  // Add brand
  if (product.brand) {
    aliases.add(normalizeSearchQuery(product.brand));
    
    // Try to transliterate Arabic brand to English
    const normalizedBrand = normalizeSearchQuery(product.brand);
    const englishBrand = Object.entries(brandTransliterationMap).find(([arabicBrand]) => {
      return normalizeSearchQuery(arabicBrand) === normalizedBrand;
    });
    if (englishBrand) {
      aliases.add(normalizeSearchQuery(englishBrand[1]));
    }
  }

  // Add category and related keywords
  if (product.category) {
    aliases.add(product.category);
    
    // Add keywords associated with this category
    const categoryKeywords = categoryKeywordMap[product.category] || [];
    categoryKeywords.forEach(keyword => {
      aliases.add(normalizeSearchQuery(keyword));
    });
  }

  // Add description terms
  if (product.description) {
    const descWords = product.description
      .toLowerCase()
      .split(/\s+/)
      .slice(0, 10); // Limit to first 10 words
    descWords.forEach(word => {
      const cleaned = normalizeSearchQuery(word);
      if (cleaned.length > 2) {
        aliases.add(cleaned);
      }
    });
  }

  if (product.description_en) {
    const descWords = product.description_en
      .toLowerCase()
      .split(/\s+/)
      .slice(0, 10);
    descWords.forEach(word => {
      const cleaned = normalizeSearchQuery(word);
      if (cleaned.length > 2) {
        aliases.add(cleaned);
      }
    });
  }

  // Add barcode if available
  if (product.barcode) {
    aliases.add(normalizeSearchQuery(product.barcode));
  }

  return Array.from(aliases);
};

/**
 * Smart search matching
 * Matches a query against product search aliases with fuzzy matching support
 */
export const matchesSearch = (searchAliases, expandedQueryTerms) => {
  if (!searchAliases || !expandedQueryTerms || expandedQueryTerms.length === 0) {
    return false;
  }

  // If any expanded term matches any alias, return true
  return expandedQueryTerms.some(queryTerm => {
    return searchAliases.some(alias => {
      // Exact match or partial match
      return alias === queryTerm || alias.includes(queryTerm) || queryTerm.includes(alias);
    });
  });
};

/**
 * Calculate search relevance score
 * Returns a score from 0 to 1, higher is more relevant
 */
export const calculateSearchRelevance = (product, expandedQueryTerms, searchAliases) => {
  if (!searchAliases || expandedQueryTerms.length === 0) return 0;

  let score = 0;
  const maxScore = expandedQueryTerms.length * 10;

  expandedQueryTerms.forEach(queryTerm => {
    searchAliases.forEach(alias => {
      // Exact match is highest priority
      if (alias === queryTerm) {
        score += 10;
      }
      // Partial match from the beginning is next
      else if (alias.startsWith(queryTerm)) {
        score += 8;
      }
      // Partial match anywhere is lower
      else if (alias.includes(queryTerm)) {
        score += 5;
      }
    });
  });

  // Boost score if matching product name
  const productName = normalizeSearchQuery(product?.name || '');
  const productNameEn = normalizeSearchQuery(product?.name_en || '');
  expandedQueryTerms.forEach(queryTerm => {
    if (productName.includes(queryTerm) || queryTerm.includes(productName)) {
      score += 3;
    }
    if (productNameEn.includes(queryTerm) || queryTerm.includes(productNameEn)) {
      score += 3;
    }
  });

  return Math.min(score / maxScore, 1);
};

/**
 * Search filter for products
 * Returns filtered and sorted products based on bilingual search
 * Handles category keywords, product names, brands, and descriptions
 */
export const bilingualSearchFilter = (products, searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) {
    return products;
  }

  const expandedQueryTerms = expandSearchQuery(searchQuery);

  // Check if search is specifically for a category
  const matchingCategory = categoriesData.find(category => {
    return expandedQueryTerms.includes(category.id) ||
           (category.keywords && category.keywords.some(keyword =>
             expandedQueryTerms.includes(normalizeSearchQuery(keyword))
           ));
  });

  // If search is for a specific category, return all products in that category
  if (matchingCategory && matchingCategory.id !== 'all') {
    const categoryProducts = products.filter(product => product.category === matchingCategory.id);
    if (categoryProducts.length > 0) {
      return categoryProducts;
    }
  }

  // Filter products that match the search (by name, brand, description)
  const matchedProducts = products.filter(product => {
    const searchAliases = generateSearchAliases(product);
    return matchesSearch(searchAliases, expandedQueryTerms);
  });

  // If no exact matches, return fallback results
  if (matchedProducts.length === 0) {
    return getFallbackSearchResults(products, searchQuery);
  }

  // Sort by relevance
  matchedProducts.sort((a, b) => {
    const aliasesA = generateSearchAliases(a);
    const aliasesB = generateSearchAliases(b);
    const scoreA = calculateSearchRelevance(a, expandedQueryTerms, aliasesA);
    const scoreB = calculateSearchRelevance(b, expandedQueryTerms, aliasesB);
    return scoreB - scoreA;
  });

  return matchedProducts;
};

/**
 * Get fallback search results when no exact matches found
 * Returns results based on category or partial brand matches
 */
const getFallbackSearchResults = (products, searchQuery) => {
  const normalized = normalizeSearchQuery(searchQuery);

  // Try to find products by category match
  const categoryMatches = products.filter(product => {
    const category = normalizeSearchQuery(product.category || '');
    return category.includes(normalized) || normalized.includes(category);
  });

  if (categoryMatches.length > 0) {
    return categoryMatches;
  }

  // Try to find products by brand match
  const brandMatches = products.filter(product => {
    const brand = normalizeSearchQuery(product.brand || '');
    return brand.includes(normalized) || normalized.includes(brand);
  });

  if (brandMatches.length > 0) {
    return brandMatches;
  }

  // Last resort: return all products (never empty result)
  return products;
};

/**
 * Pre-process products to add search_aliases field
 * This enriches product data for faster searching
 */
export const enrichProductsWithSearchAliases = (products) => {
  return products.map(product => ({
    ...product,
    search_aliases: generateSearchAliases(product)
  }));
};
