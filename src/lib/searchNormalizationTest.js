/**
 * Test utility for search normalization
 * Verifies that flexible search matching works correctly
 * 
 * Examples of valid matches:
 * - Search: "6 77" → Matches → "6/77"
 * - Search: "6-77" → Matches → "6/77"
 * - Search: "6/77" → Matches → "6 77"
 * - Search: "677" → Matches → "6/77" (no symbols)
 */

function normalizeSearchText(text) {
  if (typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[\/*\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesNormalizedSearch(productName, searchQuery) {
  if (!productName || !searchQuery) return false;
  
  const normalizedName = normalizeSearchText(productName);
  const normalizedQuery = normalizeSearchText(searchQuery);
  
  return normalizedName.includes(normalizedQuery);
}

// Test cases
const testCases = [
  {
    productName: "LILAFIX Hair Colour 6/77",
    searchQuery: "6 77",
    shouldMatch: true,
    description: "Search with spaces should match product with slashes"
  },
  {
    productName: "LILAFIX Hair Colour 6/77",
    searchQuery: "6-77",
    shouldMatch: true,
    description: "Search with dashes should match product with slashes"
  },
  {
    productName: "LILAFIX Hair Colour 6 77",
    searchQuery: "6/77",
    shouldMatch: true,
    description: "Search with slashes should match product with spaces"
  },
  {
    productName: "LILAFIX Hair Colour 6/77",
    searchQuery: "677",
    shouldMatch: true,
    description: "Search without symbols should match product with symbols"
  },
  {
    productName: "LILAFIX Hair Colour 6/77",
    searchQuery: "lilafix hair colour 6 77",
    shouldMatch: true,
    description: "Full product name normalized should match"
  },
  {
    productName: "master hair color 9*0",
    searchQuery: "master hair color 9 0",
    shouldMatch: true,
    description: "Search with spaces should match product with asterisk"
  },
  {
    productName: "master hair color 9/1",
    searchQuery: "master hair color 9-1",
    shouldMatch: true,
    description: "Search with dashes should match product with slashes"
  },
  {
    productName: "LILAFIX Hair Colour 6/77",
    searchQuery: "6/78",
    shouldMatch: false,
    description: "Different numbers should not match"
  },
  {
    productName: "Product A",
    searchQuery: "Product B",
    shouldMatch: false,
    description: "Different products should not match"
  },
  {
    productName: "LILAFIX Hair Colour 6/77",
    searchQuery: "hair colour",
    shouldMatch: true,
    description: "Partial match should work"
  }
];

console.log('=== Search Normalization Test Results ===\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = matchesNormalizedSearch(test.productName, test.searchQuery);
  const isCorrect = result === test.shouldMatch;
  
  const normalizedName = normalizeSearchText(test.productName);
  const normalizedQuery = normalizeSearchText(test.searchQuery);
  
  console.log(`Test ${index + 1}: ${test.description}`);
  console.log(`  Product: "${test.productName}"`);
  console.log(`  Search:  "${test.searchQuery}"`);
  console.log(`  Normalized Product: "${normalizedName}"`);
  console.log(`  Normalized Query:   "${normalizedQuery}"`);
  console.log(`  Expected Match: ${test.shouldMatch}`);
  console.log(`  Actual Match:   ${result}`);
  console.log(`  Result: ${isCorrect ? '✓ PASS' : '✗ FAIL'}`);
  console.log();
  
  if (isCorrect) {
    passed++;
  } else {
    failed++;
  }
});

console.log(`\n=== Summary ===`);
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
