# ✅ Realtime Setup Verification Checklist

## 🔧 Prerequisites Verification

### Step 1: Verify Realtime is Enabled in Supabase

**Location:** Supabase Dashboard → Your Project → Database → Tables → orders

```
☐ Open https://app.supabase.com
☐ Select your project
☐ Go to Database section
☐ Click on "orders" table
☐ Look at the top right - you should see a "Realtime" toggle button
☐ Make sure it's ON (blue/enabled)
```

**What you should see:**
```
Table: orders
[Realtime] ← This button should be BLUE/ENABLED
```

If not, click the button to enable it.

---

### Step 2: Verify Supabase Connection in Your App

**File:** `.env`

```
SUPABASE_URL=https://ykyzviqwscrjjkucorlp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ Both must be present and correct

---

## 🧪 Testing Realtime

### Test 1: Check Console Logs

1. Open your app in browser
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Navigate to "Track Order" page
5. Enter valid order code and phone number
6. **Look for logs like:**

```
🔄 Setting up realtime subscription for order: 123e4567-e89b-12d3-a456-426614174000
✅ Successfully subscribed to order: 123e4567-e89b-12d3-a456-426614174000
```

✅ **If you see these logs:** Realtime is working!
❌ **If you DON'T see these logs:** Check the console for errors

---

### Test 2: Manual Database Update

1. Keep the order tracking page open
2. Go to Supabase Dashboard
3. Find the orders table
4. Find the order the customer is viewing
5. Change the `order_status` column (e.g., from `pending` to `reviewing`)
6. Click save/update

**Expected Results:**
- ✅ Order status updates immediately in the browser
- ✅ Toast notification appears: "تحديث الطلب"
- ✅ Console logs show: `✅ Order update received via realtime`

**If it doesn't work:**
- Check that Realtime is enabled (Step 1)
- Check browser console for errors
- Try refreshing the page

---

### Test 3: Check WebSocket Connection

1. Open browser DevTools
2. Go to **Network** tab
3. Filter by **WS** (WebSocket)
4. You should see a WebSocket connection to Supabase like:

```
wss://ykyzviqwscrjjkucorlp.supabase.co/realtime/v1/...
```

✅ **If you see this connection:** WebSocket is working
❌ **If you don't see it:** Check firewall/network settings

---

### Test 4: Check Your Orders Page (MyOrdersPage)

If user is authenticated:

1. Go to "My Orders" page
2. Log in if needed
3. Open DevTools console
4. You should see:

```
🔄 Setting up realtime subscription for user orders: [user-id]
✅ Successfully subscribed to user orders: [user-id]
```

5. Have admin update any of this user's orders
6. Order should update automatically in the list

---

## 🚨 Troubleshooting

### Problem: Logs show "Channel error"

```
❌ Channel error for order: 123e4567...
```

**Causes:**
- Realtime not enabled on orders table
- Wrong project ref
- Network connectivity issue

**Solutions:**
1. Go to Supabase Dashboard
2. Enable Realtime on orders table
3. Check that SUPABASE_URL in .env is correct
4. Restart the app

---

### Problem: Logs show "Subscription timed out"

```
⏱️ Subscription timed out for order: 123e4567...
```

**Causes:**
- Network timeout
- Supabase server issue
- Long period of inactivity

**Solutions:**
1. Refresh the page
2. Check your internet connection
3. Try again in a few minutes

---

### Problem: WebSocket not connecting

**Check in browser DevTools:**

```
Network tab → WS filter
```

If you don't see the WebSocket connection:

**Possible causes:**
1. Firewall blocking WebSocket
2. Proxy configuration issue
3. Browser extension blocking it
4. Network is VPN that blocks WebSocket

**Solutions:**
1. Disable VPN if using one
2. Check firewall settings
3. Try in incognito mode (no extensions)
4. Try from different network

---

### Problem: Manual database update doesn't show in browser

**Checklist:**
- [ ] Realtime enabled on orders table? (Go to Supabase Dashboard)
- [ ] Customer is viewing the correct order? (Check order ID)
- [ ] WebSocket connected? (Check Network tab in DevTools)
- [ ] Updated the correct field? (`order_status` field must change)
- [ ] Gave it 2-3 seconds after update? (Network latency)

**If still not working:**
1. Refresh the page
2. Try again
3. Check browser console for errors

---

## ✅ Full Verification Checklist

```
SETUP:
☐ Realtime enabled on orders table in Supabase
☐ SUPABASE_URL in .env is correct
☐ SUPABASE_ANON_KEY in .env is correct
☐ App is deployed or running locally

FUNCTIONAL TESTS:
☐ Can search for order (Track Order page)
☐ Console logs show subscription messages
☐ Manual database update triggers browser update
☐ Toast notification appears on status change
☐ My Orders page updates automatically for logged-in user
☐ WebSocket connection visible in Network tab

EDGE CASES:
☐ Multiple status changes update correctly
☐ Subscription cleans up when leaving page
☐ Works on mobile browsers
☐ Works with multiple customers viewing same order
☐ Works with same customer viewing multiple orders
```

---

## 📞 Quick Reference

### Realtime Enabled?
**Supabase Dashboard → Database → orders table → [Realtime button should be blue]**

### Check Logs
**F12 → Console → Look for 🔄 and ✅ messages**

### Test Manual Update
**Supabase Dashboard → orders table → Change order_status → Save**

### WebSocket Connected?
**F12 → Network → Filter: WS → Should see connection to Supabase**

---

## 🎉 Success Indicator

You'll know everything is working when:

1. ✅ Customer views order on Tracking page
2. ✅ Admin changes order status in database
3. ✅ Status updates **instantly** in customer's browser
4. ✅ **Without** page refresh
5. ✅ **Without** re-entering data
6. ✅ Toast notification appears

**Congratulations! Realtime is working! 🚀**
