/**
 * Test file to verify image filename normalization
 * Run this in browser console to test: import('./imageNormalizationTest.js')
 */

import { normalizeFilename, normalizeProductName } from './imageValidationService.js';

const testCases = [
  {
    imageFilename: 'Parachute_Advansed_Onion_Enriched_Coconut_Hair_Oil.webp',
    productName: 'Parachute Advansed Onion Enriched Coconut Hair Oil',
    expectedMatch: true,
    description: 'Underscores in filename should match spaces in product name'
  },
  {
    imageFilename: 'Product_Name+With&Special-Chars.jpg',
    productName: 'Product Name With Special Chars',
    expectedMatch: true,
    description: 'Special characters (+, &, -) should be normalized away'
  },
  {
    imageFilename: 'UPPERCASE_FILENAME.png',
    productName: 'lowercase filename',
    expectedMatch: true,
    description: 'Case sensitivity should be ignored'
  },
  {
    imageFilename: 'Hair-Oil/Premium-Edition.webp',
    productName: 'Hair Oil Premium Edition',
    expectedMatch: true,
    description: 'Forward slashes and hyphens should be handled'
  },
  {
    imageFilename: 'Product_A.jpg',
    productName: 'Product B',
    expectedMatch: false,
    description: 'Different product names should not match'
  },
  {
    imageFilename: 'Name__Multiple___Underscores.jpg',
    productName: 'Name Multiple Underscores',
    expectedMatch: true,
    description: 'Multiple underscores should collapse to single spaces'
  },
  {
    imageFilename: 'Product (Special) Version.webp',
    productName: 'Product Special Version',
    expectedMatch: true,
    description: 'Parentheses should be handled'
  },
  {
    imageFilename: 'Product#Name&Symbol@Test.jpg',
    productName: 'Product Name Symbol Test',
    expectedMatch: true,
    description: 'Various special symbols should be removed'
  },
  {
    imageFilename: 'Hair_Oil_Premium.jpg',
    productName: 'Hair & Oil + Premium',
    expectedMatch: true,
    description: 'Mixed underscores and special characters'
  },
];

export const runImageNormalizationTests = () => {
  console.log('=== Image Filename Normalization Tests ===\n');
  
  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    const normalizedFilename = normalizeFilename(testCase.imageFilename);
    const normalizedProductName = normalizeProductName(testCase.productName);
    const matches = normalizedFilename === normalizedProductName;
    const testPassed = matches === testCase.expectedMatch;

    if (testPassed) {
      passed++;
      console.log(`✅ Test ${index + 1}: PASSED`);
    } else {
      failed++;
      console.log(`❌ Test ${index + 1}: FAILED`);
    }

    console.log(`   Description: ${testCase.description}`);
    console.log(`   Image: "${testCase.imageFilename}"`);
    console.log(`   → Normalized: "${normalizedFilename}"`);
    console.log(`   Product: "${testCase.productName}"`);
    console.log(`   → Normalized: "${normalizedProductName}"`);
    console.log(`   Expected Match: ${testCase.expectedMatch}, Got: ${matches}`);
    console.log();
  });

  console.log(`=== Summary ===`);
  console.log(`Passed: ${passed}/${testCases.length}`);
  console.log(`Failed: ${failed}/${testCases.length}`);
  
  return { passed, failed, total: testCases.length };
};

// Auto-run tests when module loads in dev mode
if (import.meta.env.DEV) {
  runImageNormalizationTests();
}
