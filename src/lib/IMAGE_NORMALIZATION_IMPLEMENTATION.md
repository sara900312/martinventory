# Image Filename Normalization Implementation

## Overview
This document describes the image filename normalization system implemented for matching product images with their corresponding products in the inventory system.

## Normalization Rules
When uploading product images, filenames are normalized before matching them with product names using the following rules:

1. **Remove File Extension**: Strip the file extension (e.g., `.webp`, `.jpg`)
2. **Replace Underscores with Spaces**: Convert all underscores (`_`) to spaces
3. **Convert to Lowercase**: All characters converted to lowercase for case-insensitive matching
4. **Replace Special Characters**: Special characters (`+`, `&`, `-`, `/`, etc.) are replaced with spaces to avoid word separation issues
5. **Collapse Multiple Spaces**: Multiple consecutive spaces are collapsed into a single space
6. **Trim Whitespace**: Leading and trailing whitespace is removed

## Implementation Details

### Files Modified
- **`code/src/lib/imageValidationService.js`**: Updated the `normalizeString()` function and its exported wrappers

### Key Functions

#### `normalizeFilename(filename)`
- Takes an image filename with extension
- Returns the normalized filename without extension
- Example: `"Parachute_Advansed_Onion_Enriched_Coconut_Hair_Oil.webp"` → `"parachute advansed onion enriched coconut hair oil"`

#### `normalizeProductName(name)`
- Takes a product name
- Returns the normalized product name (without removing extension, as product names don't have extensions)
- Example: `"Parachute Advansed Onion Enriched Coconut Hair Oil"` → `"parachute advansed onion enriched coconut hair oil"`

#### `matchFilenameToProduct(filename, products)`
- Compares normalized filename against a list of products
- Returns the matched product object or `null` if no match found
- Iterates through all products to find an exact match

### Where It's Used
The normalization is integrated into the **Bulk Image Upload Tab** (`code/src/components/BulkImageUploadTab.jsx`):

1. User selects multiple image files
2. System validates images (face detection, NSFW filtering)
3. System normalizes filenames and product names
4. Filenames are matched against product names
5. Matched images are uploaded to the correct product field

## Examples

### Example 1: Simple Underscore Normalization
```
Image filename: Parachute_Advansed_Onion_Enriched_Coconut_Hair_Oil.webp
Normalized: parachute advansed onion enriched coconut hair oil

Product name: Parachute Advansed Onion Enriched Coconut Hair Oil
Normalized: parachute advansed onion enriched coconut hair oil

Result: ✅ MATCH
```

### Example 2: Special Characters Handling
```
Image filename: Product_Name+With&Special-Chars.jpg
Normalized: product name with special chars

Product name: Product Name With Special Chars
Normalized: product name with special chars

Result: ✅ MATCH
```

### Example 3: Case Insensitivity
```
Image filename: UPPERCASE_FILENAME.png
Normalized: uppercase filename

Product name: Uppercase Filename
Normalized: uppercase filename

Result: ✅ MATCH
```

### Example 4: Multiple Underscores and Spaces
```
Image filename: Name__Multiple___Underscores.jpg
Normalized: name multiple underscores

Product name: Name Multiple Underscores
Normalized: name multiple underscores

Result: ✅ MATCH
```

### Example 5: Slashes and Hyphens
```
Image filename: Hair-Oil/Premium-Edition.webp
Normalized: hair oil premium edition

Product name: Hair Oil Premium Edition
Normalized: hair oil premium edition

Result: ✅ MATCH
```

## Testing
A comprehensive test file is available at `code/src/lib/imageNormalizationTest.js` with multiple test cases covering:
- Underscore to space conversion
- Special character handling
- Case insensitivity
- Multiple space collapsing
- Different character combinations

Run tests in browser console:
```javascript
import('./imageNormalizationTest.js').then(mod => mod.runImageNormalizationTests());
```

## Upload Workflow

### Bulk Image Upload Process
1. User navigates to "رفع صور الكميات" (Bulk Image Upload) tab in Inventory Page
2. User selects multiple image files (drag & drop or click to select)
3. System processes each image:
   - Validates image content (face detection, NSFW filtering)
   - Normalizes filename
   - Matches against all product names (normalized)
   - If match found: uploads to appropriate field (main image or gallery)
   - If no match: marks as unmatched
   - If validation fails: marks as rejected
4. Displays summary with results (successful, rejected, unmatched, skipped)

## Result Categories

- **Successful**: Image validated, matched to product, and uploaded
- **Rejected**: Image failed validation (contained face or NSFW content)
- **Unmatched**: Image passed validation but no matching product found
- **Skipped**: Image matched but target image slots were full

## Integration Notes
- The normalization is **automatically applied** during bulk uploads
- No configuration needed - uses default rules specified above
- Compatible with existing image validation and upload systems
- Works with all image types supported by the system (JPG, PNG, WebP)
