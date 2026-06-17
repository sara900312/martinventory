/**
 * Test utility for filename/product normalization
 * Run this to verify normalization works correctly
 * 
 * Examples:
 * "master hair color 9*0" → "master hair color 9 0"
 * "master hair color 9/1" → "master hair color 9 1"
 * "LILAFIX HAIR COLOUR 1/0" → "lilafix hair colour 1 0"
 */

const normalizeString = (str, removeExtension = false) => {
  if (!str) return '';

  let normalized = str;

  // Remove file extension if requested
  if (removeExtension) {
    normalized = normalized.replace(/\.[^/.]+$/, '');
  }

  // Convert to lowercase
  normalized = normalized.toLowerCase();

  // Replace * / \ with spaces
  normalized = normalized.replace(/[\*\/\\]/g, ' ');

  // Remove forbidden characters: : ? " < > |
  normalized = normalized.replace(/[:?"<>|]/g, '');

  // Collapse multiple spaces into single space
  normalized = normalized.replace(/\s+/g, ' ');

  // Trim leading and trailing whitespace
  normalized = normalized.trim();

  return normalized;
};

const normalizeFilename = (filename) => {
  return normalizeString(filename, true);
};

const normalizeProductName = (name) => {
  return normalizeString(name, false);
};

// Test cases
const testCases = [
  {
    filename: "master hair color 9 0.jpg",
    productName: "master hair color 9*0",
    expected: "master hair color 9 0"
  },
  {
    filename: "master hair color 9 1.jpg",
    productName: "master hair color 9/1",
    expected: "master hair color 9 1"
  },
  {
    filename: "LILAFIX HAIR COLOUR 1 0.jpg",
    productName: "LILAFIX HAIR COLOUR 1/0",
    expected: "lilafix hair colour 1 0"
  },
  {
    filename: "test-product.webp",
    productName: "test-product",
    expected: "test product"
  },
  {
    filename: "special*chars/in\\path.png",
    productName: "special*chars/in\\path",
    expected: "special chars in path"
  },
  {
    filename: "forbidden:chars?test\".jpg",
    productName: 'forbidden:chars?test"',
    expected: "forbiddencharstest"
  }
];

console.log('=== Normalization Test Results ===\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const normalizedFilename = normalizeFilename(test.filename);
  const normalizedProductName = normalizeProductName(test.productName);
  const matches = normalizedFilename === normalizedProductName;
  const isCorrect = normalizedFilename === test.expected;

  console.log(`Test ${index + 1}:`);
  console.log(`  Filename: "${test.filename}" → "${normalizedFilename}"`);
  console.log(`  Product:  "${test.productName}" → "${normalizedProductName}"`);
  console.log(`  Expected: "${test.expected}"`);
  console.log(`  Match: ${matches ? '✓ YES' : '✗ NO'}`);
  console.log(`  Correct: ${isCorrect ? '✓ YES' : '✗ NO'}`);

  if (isCorrect && matches) {
    passed++;
  } else {
    failed++;
  }

  console.log();
});

console.log(`\n=== Summary ===`);
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);
