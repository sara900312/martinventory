# Edge Function Deployment & Troubleshooting Guide

## ✅ Current Frontend Configuration

Your `.env` file shows:
```
SUPABASE_URL=https://ykyzviqwscrjjkucorlp.supabase.co
```

**Project Ref:** `ykyzviqwscrjjkucorlp`

---

## 🎯 What You Need to Do

### **Step 1: Verify Project Consistency**

Make sure you're deploying the edge function to the **SAME** Supabase project:

```bash
# Check your current project ref
# It should match: ykyzviqwscrjjkucorlp
supabase projects list
```

**Common Issue:** Function deployed to one project, frontend pointing to another.

### **Step 2: Deploy the Edge Function**

The new `update_order_status` function is ready in:
```
supabase/functions/update_order_status/index.ts
```

Deploy it:
```bash
supabase functions deploy update_order_status
```

### **Step 3: Test the Endpoint Manually (Critical!)**

**Using cURL:**
```bash
curl -X POST https://ykyzviqwscrjjkucorlp.functions.supabase.co/functions/v1/update_order_status \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "550e8400-e29b-41d4-a716-446655440000",
    "new_status": "accepted"
  }'
```

**Expected Responses:**

✅ **Success (200):**
```json
{
  "success": true,
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "order_status": "accepted",
    "updated_at": "2024-01-16T10:30:00Z"
  }
}
```

❌ **Not Found (404):**
```
Function doesn't exist → Deploy it first
```

❌ **Invalid Request (400):**
```json
{
  "success": false,
  "error": "Missing required fields: order_id and new_status"
}
```

---

## 🔧 Frontend Improvements Made

### Issue 1: Fragile JSON Parsing
**Before (❌ CRASHES):**
```javascript
const data = await res.json();  // Crashes if not JSON
```

**After (✅ SAFE):**
```javascript
const text = await res.text();  // Always works
let data;
try {
  data = text ? JSON.parse(text) : null;
} catch (parseError) {
  throw new Error(`Invalid response: ${response.status}`);
}
```

### Issue 2: Incorrect URL Paths
**Before (❌ FAILS):**
```javascript
fetch('/functions/v1/update_order_status')  // Relative URL - won't work
```

**After (✅ CORRECT):**
```javascript
const SUPABASE_URL = 'https://ykyzviqwscrjjkucorlp.supabase.co';
fetch(`${SUPABASE_URL}/functions/v1/update_order_status`)  // Absolute URL
```

### Files Updated:
1. ✅ `src/lib/updateOrderStatusService.js` - Fixed URL + robust error handling
2. ✅ `src/lib/orderService.js` - Robust error handling
3. ✅ `src/lib/telegramNotificationService.js` - Robust error handling

---

## 🧪 Testing Checklist

- [ ] **Verify Project Ref**
  ```bash
  grep "ykyzviqwscrjjkucorlp" .env
  ```

- [ ] **Deploy Function**
  ```bash
  supabase functions deploy update_order_status
  ```

- [ ] **Manual cURL Test**
  ```bash
  # Replace with real order ID from your database
  curl -X POST https://ykyzviqwscrjjkucorlp.functions.supabase.co/functions/v1/update_order_status \
    -H "Content-Type: application/json" \
    -d '{"order_id": "YOUR_REAL_UUID", "new_status": "accepted"}'
  ```

- [ ] **Browser Console Test**
  Open browser DevTools (F12), go to Console, and run:
  ```javascript
  const result = await fetch('/functions/v1/update_order_status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: 'YOUR_REAL_UUID',
      new_status: 'accepted'
    })
  });
  const data = await result.json();
  console.log(data);
  ```

- [ ] **Test Order Status Update in UI**
  1. Go to Order Status Management page
  2. Try updating an order status
  3. Check console for errors (should be clear now)

---

## 🚨 Troubleshooting

### Problem: 404 Error

```
GET https://ykyzviqwscrjjkucorlp.functions.supabase.co/functions/v1/update_order_status 404
```

**Solution:**
1. Run `supabase functions deploy update_order_status`
2. Wait 30 seconds for deployment
3. Try again

### Problem: 401 Unauthorized

```json
{ "error": "Unauthorized" }
```

**Causes:**
- Missing or invalid Supabase service role key
- Database permissions issue

**Solution:**
- Check environment variables in deployment settings
- Ensure service role key is correct

### Problem: JSON Parse Error in Console

```
Failed to parse JSON response from server
```

**Why?**
- Server returned 404 HTML page instead of JSON
- Server crashed before sending response

**Now Handled:**
- Frontend catches error gracefully
- Shows meaningful error message
- Doesn't crash the app

---

## 📋 Endpoint Specification

### Request

```
POST /functions/v1/update_order_status
Content-Type: application/json

{
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "new_status": "accepted"  // One of: pending, reviewing, accepted, preparing, shipped, delivered, cancelled
}
```

### Response Format (Always JSON)

**Success (200):**
```json
{
  "success": true,
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "order_code": "ORDER-123456",
    "order_status": "accepted",
    "updated_at": "2024-01-16T10:30:00Z"
  }
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

---

## ✨ Key Improvements

| Issue | Before | After |
|-------|--------|-------|
| JSON parse crash | ❌ App crashes | ✅ Graceful error handling |
| 404 response | ❌ Blank screen | ✅ Clear error message |
| Missing error details | ❌ Generic error | ✅ Specific, helpful error |
| Empty responses | ❌ JSON.parse fails | ✅ Handled with res.text() |

---

## 📝 Notes

- All error paths now return structured JSON
- Frontend safely handles non-JSON responses
- Comprehensive logging for debugging
- Same improvements applied to all edge function calls
