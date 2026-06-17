# Popup Queue System Implementation

## Overview
This system implements a **stacked advertisement queue** where multiple popups can be configured as active, but only one displays at a time. When a popup is closed, the next popup in the queue automatically appears.

## How It Works

### 1. Queue Initialization
- The `usePopupQueue` hook fetches ALL active popups from the database
- Popups are ordered by `created_at` (newest first)
- The first popup in the queue is set as `currentPopup`

### 2. Display Logic
- **PopupHero component** displays only the `currentPopup`
- Display frequency rules are respected (always, interval, etc.)
- Preview mode shows a single popup without queue management

### 3. Sequential Display
When user closes a popup:
1. Current popup is hidden with animation
2. `closeCurrentAndShowNext()` is called
3. Current popup is removed from queue
4. Next popup in queue becomes `currentPopup`
5. Next popup automatically displays (if it passes frequency checks)
6. This repeats until all popups are shown

## Files Modified

### 1. `src/hooks/usePopupHero.js`
- Added `useActivePopupQueue()` hook
- Fetches ALL active popups (removed `.limit(1)`)
- Returns array of popups instead of single popup

### 2. `src/hooks/usePopupQueue.js` (NEW)
- Manages the popup queue state
- Handles transitions between popups
- Exports: `usePopupQueue()` hook

Key functions:
- `currentPopup`: The popup currently being displayed
- `queueLength`: Total number of popups in queue
- `remainingCount`: Number of popups after current
- `closeCurrentAndShowNext()`: Closes current and shows next
- `closeAllPopups()`: Clear entire queue

### 3. `src/components/popup/PopupHero.jsx`
- Replaced single popup state with queue-based approach
- Removed direct database fetch (now uses `usePopupQueue`)
- Updated `handleClose()` to call `closeCurrentAndShowNext()`
- Console logs show queue status

## Usage Example

Scenario: 3 active popups in database

1. **User visits site** → First popup displays
2. **User closes popup** → Animation plays, first popup removed from queue
3. **Second popup appears** → From remaining queue
4. **User closes second popup** → Animation plays
5. **Third popup appears** → Last in queue
6. **User closes third popup** → Queue empty, no popups show

## Frequency Rules

The queue respects popup frequency settings:
- `always`: Shows every page load
- `interval`: Shows based on interval settings
- Custom frequency logic in `popupFrequencyManager.js`

**Important**: Each popup in the queue is evaluated independently against its frequency rules. A popup may be in the queue but not display if its frequency interval hasn't elapsed.

## Admin Controls

### Creating Stacked Popups

1. Go to **Admin Panel** → **إدارة الإعلانات** (Manage Ads)
2. Create first popup:
   - Click **إنشاء إعلان** (Create Ad)
   - Set `is_active = true`
   - Set `start_date` to past date
   - Set `end_date` to future date (or leave null)
   - Configure display settings

3. Create second popup:
   - Click **إنشاء إعلان** (Create Ad)
   - Same settings as first
   - Will automatically queue after first popup closes

4. Create additional popups:
   - Repeat process
   - They will display in order of creation

### Managing Active Popups

- **Toggle Active**: Click eye icon to activate/deactivate
- **Edit**: Click edit icon to modify
- **Delete**: Click delete icon to remove
- **Preview**: Click preview icon to see how it looks

## Console Debugging

The system logs helpful debugging info:

```
Popup "Summer Sale" - shouldShow: true, frequency: always
📊 Queue: 3 popups total
Popup "Summer Sale" shown recorded
```

Queue status shows:
- Current popup being displayed
- Total popups in queue
- When popups are opened/closed

## Database Schema Requirements

The `popup_hero` table must include:
- `id`: Unique identifier
- `is_active`: Boolean to enable/disable
- `start_date`: When popup becomes active
- `end_date`: When popup expires (nullable)
- `created_at`: For ordering
- Other popup settings (title, image, video, etc.)

## Testing Checklist

- [ ] Create 2 popups, both set to `is_active = true`
- [ ] Visit homepage
- [ ] First popup should display
- [ ] Close first popup
- [ ] Second popup should automatically appear
- [ ] Close second popup
- [ ] No popups should show
- [ ] Refresh page
- [ ] First popup shows again (if frequency allows)
- [ ] Test with 3+ popups
- [ ] Test different animation types
- [ ] Test preview mode
- [ ] Test frequency intervals

## Performance Notes

- Queue refetches every 5 seconds (configurable)
- Only ONE popup DOM element rendered at a time
- Smooth transitions with Framer Motion
- No memory leaks from cumulative popups

## Migration from Old System

If migrating from single popup to queue:
1. Old code: `useActivePopup()` returns single popup or null
2. New code: `usePopupQueue()` returns queue object
3. `PopupHero` now uses queue instead of single state
4. No database changes needed
5. Backward compatible with existing popups
