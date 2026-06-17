/**
 * Bilingual Search Testing Suite
 * Use this to verify the bilingual search functionality
 */

import {
  normalizeSearchQuery,
  expandSearchQuery,
  generateSearchAliases,
  bilingualSearchFilter,
} from '@/lib/bilingualSearchUtils';

/**
 * Test data - sample products for testing
 */
const sampleTestProducts = [
  {
    id: 1,
    name: 'شامبو الزيتون',
    name_en: 'Olive Shampoo',
    brand: 'لوريال',
    category: 'hair_care',
    description: 'شامبو طبيعي للعناية بالشعر',
    description_en: 'Natural shampoo for hair care',
    barcode: '123456789',
  },
  {
    id: 2,
    name: 'بلسم الشعر الفاخر',
    name_en: 'Luxury Hair Conditioner',
    brand: 'Loreal',
    category: 'hair_care',
    description: 'بلسم مرطب للشعر الجاف',
    description_en: 'Moisturizing conditioner for dry hair',
    barcode: '987654321',
  },
  {
    id: 3,
    name: 'سيروم الوجه المتقدم',
    name_en: 'Advanced Face Serum',
    brand: 'ديفاج',
    category: 'skincare',
    description: 'سيروم مضاد للشيخوخة',
    description_en: 'Anti-aging facial serum',
    barcode: '111222333',
  },
  {
    id: 4,
    name: 'ماسك الشوكولاتة',
    name_en: 'Chocolate Mask',
    brand: 'Divage',
    category: 'skincare',
    description: 'ماسك تنظيف عميق',
    description_en: 'Deep cleansing facial mask',
    barcode: '444555666',
  },
  {
    id: 5,
    name: 'واقي الشمس SPF50',
    name_en: 'Sunscreen SPF50',
    brand: 'نيفيا',
    category: 'skincare',
    description: 'حماية من الأشعة فوق البنفسجية',
    description_en: 'UV protection sunscreen',
    barcode: '777888999',
  },
  {
    id: 6,
    name: 'كريم الوجه المرطب',
    name_en: 'Moisturizing Face Cream',
    brand: 'Nivea',
    category: 'skincare',
    description: 'كريم مرطب يومي',
    description_en: 'Daily moisturizing cream',
    barcode: '000111222',
  },
];

/**
 * Test 1: Normalize search queries
 */
export const testNormalization = () => {
  console.log('===== TEST 1: NORMALIZATION =====');
  const testCases = [
    'شامبو',
    'شامبـو',
    'SHAMPOO',
    'Shampoo',
    '  SHAMPOO  ',
    'سيروم البشرة',
  ];

  testCases.forEach(testCase => {
    const result = normalizeSearchQuery(testCase);
    console.log(`Input: "${testCase}" -> Normalized: "${result}"`);
  });
};

/**
 * Test 2: Expand search queries
 */
export const testSearchExpansion = () => {
  console.log('\n===== TEST 2: SEARCH EXPANSION =====');
  const testQueries = [
    'شامبو',
    'بلسم',
    'سيروم',
    'ماسك',
    'واقي الشمس',
    'لوريال',
    'ديفاج',
    'shampoo',
    'conditioner',
  ];

  testQueries.forEach(query => {
    const expanded = expandSearchQuery(query);
    console.log(`Query: "${query}"`);
    console.log(`Expanded to: ${expanded.join(', ')}\n`);
  });
};

/**
 * Test 3: Generate search aliases
 */
export const testSearchAliases = () => {
  console.log('\n===== TEST 3: SEARCH ALIASES =====');
  const testProducts = sampleTestProducts.slice(0, 3);

  testProducts.forEach(product => {
    const aliases = generateSearchAliases(product);
    console.log(`Product: ${product.name} (${product.name_en})`);
    console.log(`Aliases: ${aliases.join(', ')}\n`);
  });
};

/**
 * Test 4: Bilingual search filter
 */
export const testBilingualSearch = () => {
  console.log('\n===== TEST 4: BILINGUAL SEARCH FILTER =====');
  const testQueries = [
    { query: 'شامبو', expectedCount: 1 },
    { query: 'shampoo', expectedCount: 1 },
    { query: 'بلسم', expectedCount: 1 },
    { query: 'conditioner', expectedCount: 1 },
    { query: 'سيروم', expectedCount: 1 },
    { query: 'serum', expectedCount: 1 },
    { query: 'ماسك', expectedCount: 1 },
    { query: 'mask', expectedCount: 1 },
    { query: 'لوريال', expectedCount: 2 },
    { query: 'Loreal', expectedCount: 2 },
    { query: 'ديفاج', expectedCount: 1 },
    { query: 'Divage', expectedCount: 1 },
    { query: 'واقي الشمس', expectedCount: 1 },
    { query: 'sunscreen', expectedCount: 1 },
    { query: 'skincare', expectedCount: 4 },
    { query: 'عناية بالبشرة', expectedCount: 4 },
  ];

  testQueries.forEach(({ query, expectedCount }) => {
    const results = bilingualSearchFilter(sampleTestProducts, query);
    const passed = results.length === expectedCount ? '✓' : '✗';
    console.log(
      `${passed} Query: "${query}" | Results: ${results.length} | Expected: ${expectedCount}`
    );
    if (results.length > 0) {
      console.log(`   Found: ${results.map(r => r.name_en).join(', ')}`);
    }
  });
};

/**
 * Test 5: Fallback search (no empty results)
 */
export const testFallbackSearch = () => {
  console.log('\n===== TEST 5: FALLBACK SEARCH (No Empty Results) =====');
  const fallbackQueries = [
    'غير موجود',
    'nonexistent',
    'random_term',
  ];

  fallbackQueries.forEach(query => {
    const results = bilingualSearchFilter(sampleTestProducts, query);
    console.log(
      `Query: "${query}" | Results: ${results.length} | Has fallback: ${results.length > 0 ? '✓' : '✗'}`
    );
    if (results.length > 0) {
      console.log(`   Returned: ${results.slice(0, 3).map(r => r.name_en).join(', ')}`);
    }
  });
};

/**
 * Test 6: Arabic diacritics handling
 */
export const testDiacriticsHandling = () => {
  console.log('\n===== TEST 6: DIACRITICS HANDLING =====');
  const diacriticQueries = [
    'شَامْبُو',  // with diacritics
    'شامبو',      // without diacritics
    'بِلْسَم',    // with diacritics
    'بلسم',       // without diacritics
  ];

  diacriticQueries.forEach(query => {
    const results = bilingualSearchFilter(sampleTestProducts, query);
    console.log(`Query: "${query}" | Results: ${results.length}`);
  });
};

/**
 * Run all tests
 */
export const runAllTests = () => {
  console.log('🧪 BILINGUAL SEARCH TEST SUITE\n');
  testNormalization();
  testSearchExpansion();
  testSearchAliases();
  testBilingualSearch();
  testFallbackSearch();
  testDiacriticsHandling();
  console.log('\n✅ Tests completed!');
};

/**
 * Exported sample products for real testing
 */
export { sampleTestProducts };
