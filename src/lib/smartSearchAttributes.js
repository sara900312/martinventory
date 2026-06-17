/**
 * Smart Search Attributes - Database Schema Aware
 * Maps search keywords directly to existing database fields:
 * - subcategory slugs (exact/strict matching)
 * - parent categories (for filtering)
 * - benefits/issues keywords (for ILIKE matching on name/description)
 * 
 * No custom attribute columns required - uses only existing fields:
 * - products.name
 * - products.description  
 * - products.subcategory_id
 * - subcategories.slug
 * - subcategories.parent_category
 */

// ============================================================================
// SUBCATEGORY TYPE MAPPINGS (Product types → subcategory slugs)
// Maps user-facing keywords to actual database subcategory slugs
// ============================================================================

export const SUBCATEGORY_TYPE_KEYWORDS = {
  // Hair Care Product Types
  shampoo: {
    ar: 'شامبو',
    en: 'Shampoo',
    keywords: ['شامبو', 'شامو', 'شامبو الشعر', 'شامبو الرأس', 'shampoo', 'hair wash'],
    // Map to likely subcategory slugs (will vary per database)
    subcategorySlugs: ['shampoo', 'shampoos', 'hair-shampoo'],
  },
  conditioner: {
    ar: 'بلسم',
    en: 'Conditioner',
    keywords: ['بلسم', 'بلسام', 'بلسم الشعر', 'conditioner', 'hair conditioner'],
    subcategorySlugs: ['conditioner', 'conditioners', 'hair-conditioner'],
  },
  mask: {
    ar: 'ماسك',
    en: 'Mask',
    keywords: ['ماسك', 'ماسكة', 'ماسك الشعر', 'حمام كريم', 'mask', 'hair mask', 'treatment'],
    subcategorySlugs: ['mask', 'masks', 'hair-mask', 'treatment-mask'],
  },
  serum: {
    ar: 'سيروم',
    en: 'Serum',
    keywords: ['سيروم', 'سيروم الشعر', 'سيرم', 'serum', 'hair serum'],
    subcategorySlugs: ['serum', 'serums', 'hair-serum'],
  },
  oil: {
    ar: 'زيت',
    en: 'Oil',
    keywords: ['زيت', 'زيوت', 'زيت الشعر', 'oil', 'hair oil'],
    subcategorySlugs: ['oil', 'oils', 'hair-oil'],
  },
  cream: {
    ar: 'كريم',
    en: 'Cream',
    keywords: ['كريم', 'كريم الشعر', 'cream', 'hair cream'],
    subcategorySlugs: ['cream', 'creams', 'hair-cream'],
  },
  spray: {
    ar: 'بخاخ',
    en: 'Spray',
    keywords: ['بخاخ', 'بخاخ الشعر', 'spray', 'hair spray'],
    subcategorySlugs: ['spray', 'sprays', 'hair-spray'],
  },
  // Skincare Product Types
  cleanser: {
    ar: 'منظف',
    en: 'Cleanser',
    keywords: ['منظف', 'تنظيف', 'غسول', 'cleanser', 'facial wash'],
    subcategorySlugs: ['cleanser', 'cleansers', 'face-cleanser'],
  },
  moisturizer: {
    ar: 'مرطب',
    en: 'Moisturizer',
    keywords: ['مرطب', 'كريم مرطب', 'moisturizer', 'moisturizing'],
    subcategorySlugs: ['moisturizer', 'moisturizers', 'face-moisturizer'],
  },
  toner: {
    ar: 'تونر',
    en: 'Toner',
    keywords: ['تونر', 'مطهر', 'toner', 'astringent'],
    subcategorySlugs: ['toner', 'toners', 'face-toner'],
  },
  exfoliant: {
    ar: 'مقشر',
    en: 'Exfoliant',
    keywords: ['مقشر', 'تقشير', 'exfoliant', 'scrub'],
    subcategorySlugs: ['exfoliant', 'exfoliants', 'scrub'],
  },
};

// ============================================================================
// PARENT CATEGORY KEYWORDS (Hair type, Skin type → parent_category)
// Maps user input to parent category filters
// ============================================================================

export const PARENT_CATEGORY_KEYWORDS = {
  hairCare: {
    ar: 'شعر',
    en: 'Hair',
    keywords: ['شعر', 'شعر الرأس', 'العناية بالشعر', 'hair care', 'hair'],
    parentCategory: 'hair_care',
  },
  skincare: {
    ar: 'بشرة',
    en: 'Skincare',
    keywords: ['بشرة', 'عناية بالبشرة', 'وجه', 'skincare', 'face', 'facial'],
    parentCategory: 'skincare',
  },
  bodyCare: {
    ar: 'جسم',
    en: 'Body',
    keywords: ['جسم', 'عناية بالجسم', 'body', 'body care'],
    parentCategory: 'body_care',
  },
};

// ============================================================================
// BENEFIT & ISSUE KEYWORDS (for ILIKE name/description matching)
// These keywords will be searched in product name and description
// using ILIKE SQL pattern matching
// ============================================================================

export const BENEFIT_ISSUE_KEYWORDS = {
  // Benefits (positive effects)
  benefits: [
    {
      id: 'hydration',
      ar: 'ترطيب',
      en: 'Hydration',
      keywords: ['ترطيب', 'رطوبة', 'مرطب', 'ترطيب', 'hydrating', 'moisture', 'moisturizing'],
    },
    {
      id: 'shine',
      ar: 'لمعان',
      en: 'Shine',
      keywords: ['لمعان', 'لماع', 'براق', 'shine', 'glossy', 'shiny', 'brilliant'],
    },
    {
      id: 'strength',
      ar: 'تقوية',
      en: 'Strengthening',
      keywords: ['تقوية', 'تقوي', 'قوة', 'strengthen', 'strong', 'strengthens'],
    },
    {
      id: 'repair',
      ar: 'إصلاح',
      en: 'Repair',
      keywords: ['إصلاح', 'إصلح', 'إعادة بناء', 'repair', 'restore', 'rebuild', 'restoration'],
    },
    {
      id: 'smoothness',
      ar: 'نعومة',
      en: 'Smoothness',
      keywords: ['نعومة', 'ناعم', 'ملس', 'smooth', 'smoothing', 'smooths'],
    },
    {
      id: 'volumeBoost',
      ar: 'زيادة الحجم',
      en: 'Volume Boost',
      keywords: ['حجم', 'زيادة حجم', 'كثافة', 'volume', 'thick', 'fullness', 'volumizing'],
    },
    {
      id: 'brightening',
      ar: 'تفتيح',
      en: 'Brightening',
      keywords: ['تفتيح', 'إشراقة', 'brightening', 'radiance', 'bright'],
    },
    {
      id: 'antiAging',
      ar: 'مضاد شيخوخة',
      en: 'Anti-Aging',
      keywords: ['مضاد شيخوخة', 'تقليل تجاعيد', 'anti-aging', 'anti aging'],
    },
  ],

  // Issues (problems to solve)
  issues: [
    {
      id: 'dryness',
      ar: 'جفاف',
      en: 'Dryness',
      keywords: ['جاف', 'جفاف', 'جفاف الشعر', 'dry', 'dryness'],
    },
    {
      id: 'dandruff',
      ar: 'قشرة',
      en: 'Dandruff',
      keywords: ['قشرة', 'قشرة الشعر', 'dandruff'],
    },
    {
      id: 'hairLoss',
      ar: 'تساقط',
      en: 'Hair Loss',
      keywords: ['تساقط', 'تساقط الشعر', 'سقوط شعر', 'hair loss', 'falling'],
    },
    {
      id: 'frizziness',
      ar: 'تجعد',
      en: 'Frizziness',
      keywords: ['تجعد', 'تجعد الشعر', 'جعودة', 'frizz', 'frizziness', 'frizzy'],
    },
    {
      id: 'damage',
      ar: 'تلف',
      en: 'Damage',
      keywords: ['تلف', 'تلف الشعر', 'شعر تالف', 'damage', 'damaged'],
    },
    {
      id: 'greasiness',
      ar: 'دهنية',
      en: 'Greasiness',
      keywords: ['دهني', 'دهن', 'دهون', 'شعر دهني', 'oily', 'grease'],
    },
    {
      id: 'weakness',
      ar: 'ضعف',
      en: 'Weakness',
      keywords: ['ضعيف', 'ضعف', 'ضعف الشعر', 'weak', 'weakness'],
    },
    {
      id: 'acne',
      ar: 'حب الشباب',
      en: 'Acne',
      keywords: ['حب شباب', 'بثور', 'آثار', 'acne', 'pimples', 'breakouts'],
    },
    {
      id: 'sensitivity',
      ar: 'حساسية',
      en: 'Sensitivity',
      keywords: ['حساس', 'حساسية', 'sensitive', 'irritation'],
    },
  ],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize keyword for comparison
 * @param {string} keyword - Keyword to normalize
 * @returns {string} Normalized keyword
 */
export const normalizeKeyword = (keyword) => {
  if (!keyword) return '';
  return keyword
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[\u064B-\u0652]/g, ''); // Remove Arabic diacritics
};

/**
 * Find subcategory type by keyword
 * @param {string} keyword - Keyword to search
 * @returns {object|null} Matching subcategory type or null
 */
export const findSubcategoryTypeByKeyword = (keyword) => {
  const normalized = normalizeKeyword(keyword);
  
  for (const [key, typeData] of Object.entries(SUBCATEGORY_TYPE_KEYWORDS)) {
    if (typeData.keywords.some(kw => normalizeKeyword(kw) === normalized)) {
      return { id: key, ...typeData };
    }
  }
  
  return null;
};

/**
 * Find parent category by keyword
 * @param {string} keyword - Keyword to search
 * @returns {object|null} Matching parent category or null
 */
export const findParentCategoryByKeyword = (keyword) => {
  const normalized = normalizeKeyword(keyword);
  
  for (const [key, categoryData] of Object.entries(PARENT_CATEGORY_KEYWORDS)) {
    if (categoryData.keywords.some(kw => normalizeKeyword(kw) === normalized)) {
      return { id: key, ...categoryData };
    }
  }
  
  return null;
};

/**
 * Find benefit/issue by keyword
 * @param {string} keyword - Keyword to search
 * @returns {object|null} Matching benefit/issue or null
 */
export const findBenefitIssueByKeyword = (keyword) => {
  const normalized = normalizeKeyword(keyword);
  
  // Search benefits
  for (const benefit of BENEFIT_ISSUE_KEYWORDS.benefits) {
    if (benefit.keywords.some(kw => normalizeKeyword(kw) === normalized)) {
      return { ...benefit, type: 'benefit' };
    }
  }
  
  // Search issues
  for (const issue of BENEFIT_ISSUE_KEYWORDS.issues) {
    if (issue.keywords.some(kw => normalizeKeyword(kw) === normalized)) {
      return { ...issue, type: 'issue' };
    }
  }
  
  return null;
};

/**
 * Get all benefit keywords for partial matching
 * @returns {string[]} Array of all benefit keywords
 */
export const getAllBenefitKeywords = () => {
  return BENEFIT_ISSUE_KEYWORDS.benefits.flatMap(b => b.keywords);
};

/**
 * Get all issue keywords for partial matching
 * @returns {string[]} Array of all issue keywords
 */
export const getAllIssueKeywords = () => {
  return BENEFIT_ISSUE_KEYWORDS.issues.flatMap(i => i.keywords);
};

/**
 * Get all subcategory type keywords for suggestions
 * @returns {string[]} Array of all subcategory type keywords
 */
export const getAllSubcategoryTypeKeywords = () => {
  return Object.values(SUBCATEGORY_TYPE_KEYWORDS).flatMap(t => 
    t.keywords.map(kw => ({ text: kw, type: 'subcategoryType' }))
  );
};

/**
 * Get all parent category keywords for suggestions
 * @returns {string[]} Array of all parent category keywords
 */
export const getAllParentCategoryKeywords = () => {
  return Object.values(PARENT_CATEGORY_KEYWORDS).flatMap(c =>
    c.keywords.map(kw => ({ text: kw, type: 'parentCategory' }))
  );
};
