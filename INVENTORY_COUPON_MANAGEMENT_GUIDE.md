# Inventory Coupon Management System

## Overview
The coupon management system is now fully integrated into your inventory dashboard, allowing you to create, edit, and manage discount coupons directly from the inventory panel.

## Location
The coupon management panel appears in the **left sidebar** of the inventory page, below the product creation forms.

## Features

### ✅ Create New Coupons
1. Click **"إضافة قسيمة"** (Add Coupon) button
2. Fill in the form fields:
   - **رمز القسيمة** (Coupon Code) - 7 alphanumeric characters (e.g., SAVE20K)
   - **نوع الخصم** (Discount Type) - Choose:
     - نسبة مئوية (%) - Percentage discount
     - مبلغ ثابت (د.ع) - Fixed amount discount
   - **قيمة الخصم** (Discount Value) - The actual discount amount or percentage
   - **الوصف** (Description) - Optional description
   - **تاريخ البدء** (Start Date) - When the coupon becomes valid
   - **تاريخ الانتهاء** (End Date) - When the coupon expires
   - **حد الاستخدام** (Usage Limit) - Max times it can be used (leave empty for unlimited)
   - **الحالة** (Status) - Toggle to enable/disable

3. Click **"إضافة القسيمة"** (Add Coupon) to save

### 📋 View All Coupons
- Coupons are listed below the creation form
- Each coupon card shows:
  - **Coupon Code** - The 7-character code
  - **Status Badge** - Active, Disabled, Expired, or Not Started Yet
  - **Discount Details** - Type and amount
  - **Description** - What the coupon is for
  - **Date Range** - Valid from to until dates
  - **Usage Limit** - Maximum times it can be used

### ✏️ Edit Coupons
1. Find the coupon you want to edit in the list
2. Click the **Edit button** (pencil icon)
3. The form will populate with the coupon's current details
4. **Note:** You cannot change the coupon code once created
5. Modify any other fields as needed
6. Click **"تحديث القسيمة"** (Update Coupon) to save changes

### 🗑️ Delete Coupons
1. Find the coupon in the list
2. Click the **Delete button** (trash icon)
3. Confirm the deletion when prompted
4. The coupon will be immediately removed

### 🔄 Enable/Disable Coupons
1. Find the coupon in the list
2. Click the **Toggle button** (eye icon)
3. The coupon will be enabled or disabled without deletion
4. Disabled coupons will not work on the product page

### 🔍 Search Coupons
- Use the **search box** above the coupon list
- Search by:
  - Coupon code (e.g., "SAVE20K")
  - Description (e.g., "summer discount")

### 📋 Copy Coupon Code
1. Find the coupon in the list
2. Click the **Copy button** (next to the coupon code)
3. The code is copied to your clipboard
4. Share it with customers or use it for marketing

## Status Indicators

Each coupon displays a status badge showing its current state:

| Badge | Meaning | Action |
|-------|---------|--------|
| **نشطة** (Active) | Coupon is valid and can be used | Ready to use |
| **معطلة** (Disabled) | Coupon is disabled by admin | Users can't use it |
| **منتهية** (Expired) | Coupon date has passed | Re-enable or extend dates |
| **لم تبدأ بعد** (Not Started) | Coupon start date is in future | Becomes active on start date |

## Coupon Types

### Percentage Discount
- **Type:** نسبة مئوية (%)
- **Example:** 20% discount
- **Usage:** Enter 20 for 20% off the product price
- **Range:** 0-100

### Fixed Amount Discount
- **Type:** مبلغ ثابت (د.ع)
- **Example:** 5,000 د.ع discount
- **Usage:** Enter the exact amount to subtract
- **Best for:** Flat discounts regardless of product price

## Practical Examples

### Example 1: Summer Sale (20% off all products)
```
رمز القسيمة: SUMMER20
نوع الخصم: نسبة مئوية (%)
قيمة الخصم: 20
الوصف: خصم 20% على جميع المنتجات لفترة صيف محدودة
تاريخ البدء: 2025-06-01
تاريخ الانتهاء: 2025-08-31
حد الاستخدام: 500
```

### Example 2: New Customer Welcome
```
رمز القسيمة: WELCOME5
نوع الخصم: مبلغ ثابت (د.ع)
قيمة الخصم: 5000
الوصف: 5,000 د.ع خصم لعملاء جدد
تاريخ البدء: 2025-01-01
تاريخ الانتهاء: 2025-12-31
حد الاستخدام: 1000
```

### Example 3: Bulk Purchase Discount
```
رمز القسيمة: BULK10PC
نوع الخصم: نسبة مئوية (%)
قيمة الخصم: 10
الوصف: 10% خصم عند شراء منتجات
تاريخ البدء: 2025-01-01
تاريخ الانتهاء: 2025-12-31
حد الاستخدام: 300
```

## Validation Rules

The system automatically validates all inputs:

### Coupon Code
- ✅ Must be exactly 7 characters
- ✅ Can only contain letters (A-Z) and numbers (0-9)
- ✅ Cannot have duplicates
- ✅ Case-insensitive (SAVE20K = save20k)

### Discount Value
- ✅ **For percentage:** Must be between 0 and 100
- ✅ **For fixed:** Must be greater than 0

### Dates
- ✅ End date must be after start date
- ✅ Must be valid date/time format

### Quantity
- ✅ Must be at least 1

## What Happens After Creating a Coupon

1. **Immediate:** The coupon appears in the inventory list
2. **Within seconds:** Customers can use it on product pages
3. **Usage tracking:** Each time someone uses it, the system tracks it
4. **Expiration:** On the end date, it automatically becomes invalid

## Viewing Usage Statistics

To see how many times a coupon has been used, run this SQL in Supabase:

```sql
SELECT 
  c.code,
  c.discount_value,
  COUNT(cu.id) as used_count,
  c.usage_limit,
  (c.usage_limit - COUNT(cu.id)) as remaining_uses
FROM coupons c
LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
GROUP BY c.id, c.code, c.discount_value, c.usage_limit
ORDER BY used_count DESC;
```

## Tips for Success

### 1. **Clear Coupon Codes**
- Make them easy to remember: SAVE20K, WELCOME5, SUMMER30
- Avoid similar-looking characters: Use 0 (zero), not O (letter O)

### 2. **Strategic Descriptions**
- Mention the discount amount: "20% off all products"
- Mention any limitations: "Valid until December 31"
- Be clear about what products are included

### 3. **Expiration Planning**
- Set realistic end dates
- Don't let coupons expire too quickly
- Plan seasonal coupons in advance

### 4. **Usage Limits**
- Set limits to prevent abuse
- Higher limits for long-term promotions
- Lower limits for flash sales

### 5. **Testing**
- Always test a new coupon on the product page first
- Try both valid and edge cases
- Ensure the discount calculates correctly

## Common Issues

### "يجب أن يكون 7 أحرف/أرقام" (Must be 7 characters)
**Solution:** Coupon codes must be exactly 7 characters. Check the length.

### "تم تعطيل القسيمة" or "معطلة" (Coupon disabled)
**Solution:** The coupon is disabled. Click the toggle (eye icon) to enable it.

### "منتهية" (Expired)
**Solution:** The coupon's end date has passed. Edit it to extend the end date.

### "لم تبدأ بعد" (Not started)
**Solution:** The coupon's start date is in the future. Wait until the start date or change it.

## Files Added

- `code/src/components/CouponManagement.jsx` - Main component
- `code/src/components/CouponManagement.css` - Styling

## Files Modified

- `code/src/pages/InventoryPage.jsx` - Added CouponManagement component

## Database Requirements

The following tables must exist (created in setup):
- `coupons` - Stores coupon details
- `coupon_usage` - Tracks usage history
- `coupons_products` - Links products to coupons (for future feature)

## Next Steps

1. ✅ Set up database (already done)
2. ✅ Coupon management in inventory (just added)
3. **Optional:** Link coupons to specific products
4. **Optional:** Add coupon analytics dashboard
5. **Optional:** Enable referral code generation

## Support

For technical issues or questions:
1. Check the validation messages
2. Review the examples above
3. Check the database SQL if needed
4. Contact technical support with error details
