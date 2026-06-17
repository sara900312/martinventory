# 🏪 Inventory Integration with Recommendations Tool

## Overview
The recommendations tool is now fully integrated with the inventory management system. This ensures products are only recommended if they're in stock, and customers can only add available items to their cart.

---

## 📦 What's Connected

### 1. **Hooks Updated**
- **`useRecommendedProducts.js`** - Now fetches `stock` and `reserved_stock` fields
- **`useProductStock.js`** - NEW: Dedicated hook for checking individual/batch product stock

### 2. **Components Enhanced**
- **`ProductRecommendations.jsx`** - Shows stock status with color-coded badges
  - Green: In stock (5+ items)
  - Yellow: Low stock (< 5 items)
  - Red: Out of stock
  
### 3. **Stock Status Display**
Each product card now shows:
- ✅ Available stock count
- 🏷️ Color-coded availability badge
- 🛒 Disabled "Add to Cart" button when out of stock

---

## 🔄 Stock Calculation

Available Stock = `stock` - `reserved_stock`

```javascript
const available = Math.max(0, stock - reserved_stock);
```

### Status Logic
```
available > 0    → "متوفر" (Available) [Green]
available < 5    → "متوفر: X فقط" (Only X available) [Yellow]
available = 0    → "غير متوفر" (Out of Stock) [Red]
```

---

## 🔌 How It Works

### Step 1: User Selects Problem & Routine
1. User selects a skin problem
2. User selects a routine type
3. `useRecommendedProducts` fetches products with:
   - `stock` field
   - `reserved_stock` field

### Step 2: Products Display
1. Products grid calculates available stock
2. Color-coded badges show availability
3. "Add to Cart" button is enabled/disabled based on stock

### Step 3: Adding to Cart
When user clicks "Add to Cart":
1. `checkProductStock()` validates current stock
2. If available → Add to cart with success toast
3. If unavailable → Show error with specific reason
4. System automatically reserves stock during checkout

---

## 📋 API Endpoints Used

### Products Table Columns
```
- id
- name
- stock (total quantity)
- reserved_stock (reserved during checkout)
- price
- discounted_price
- main_image_url
- short_description
- routine_type
- skin_problems (array)
```

### Stock Status Query
```javascript
const availableStock = stock - reserved_stock;
const isAvailable = availableStock > 0;
```

---

## 🎯 Key Features

### ✅ Stock Validation
- Real-time stock checking before add-to-cart
- Prevents overselling
- Shows remaining quantity

### ✅ Visual Indicators
- Color-coded badges (Green/Yellow/Red)
- Stock count display
- Disabled buttons for out-of-stock

### ✅ User Feedback
- Toast notifications on success/failure
- Clear error messages
- Stock status updates

### ✅ Performance
- 2-minute cache on stock queries
- Batch loading support for multiple products
- Efficient Supabase queries

---

## 🚀 Usage Examples

### Display Product with Stock Status
```jsx
<ProductRecommendations
  products={products}
  skinProblem={selectedProblem}
  routineType={selectedRoutine}
/>
```

### Check Individual Product Stock
```javascript
const { data: stockInfo } = useProductStock(productId);
if (stockInfo.inStock) {
  // Product available
}
```

### Check Multiple Products Stock
```javascript
const { data: stockMap } = useProductsStock(productIds);
productIds.forEach(id => {
  const { available, inStock } = stockMap[id];
});
```

---

## 🛡️ Error Handling

### Common Scenarios
1. **Product Out of Stock**
   - Toast: "غير متوفر - الكمية المتاحة: 0 فقط"
   - Button: Disabled with "غير متاح"

2. **Low Stock**
   - Badge: Yellow "متوفر: 3 فقط"
   - Button: Enabled (limited quantity warning)

3. **Database Error**
   - Toast: "خطأ في النظام: [error message]"
   - Button: Disabled (safe fallback)

---

## 📊 Testing Checklist

- [x] Products show correct stock status
- [x] Color coding matches stock levels
- [x] Add to cart validates stock before adding
- [x] Toast notifications appear correctly
- [x] Buttons disable when out of stock
- [x] Reserved stock is updated on checkout
- [x] No SQL errors (column validation)

---

## 🔧 Future Enhancements

1. **Stock Notifications**
   - Notify users when items come back in stock
   - Pre-order system for out-of-stock items

2. **Inventory Analytics**
   - Top products by demand
   - Stock depletion rate

3. **Smart Recommendations**
   - Prioritize high-stock products
   - Suggest alternatives for low-stock items

---

## 📞 Support

For issues or questions about inventory integration:
1. Check `src/lib/inventoryManager.js` for stock logic
2. Review `src/hooks/useRecommendedProducts.js` for data fetching
3. Check console for error messages with "stock" keyword
