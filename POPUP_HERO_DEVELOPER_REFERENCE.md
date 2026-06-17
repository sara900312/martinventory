# Popup Hero - Developer Reference

## Architecture Overview

The Popup Hero system uses a layered architecture:

```
┌─────────────────────────────────────────────┐
│         Public Views (PopupHero.jsx)        │
│    Displays popups to visitors with UI      │
└──────────────┬──────────────────────────────┘
               │
┌──────────────v──────────────────────────────┐
│    Admin Dashboard (AdminPopupPage.jsx)     │
│  Manage popups with full CRUD operations    │
└──────────────┬──────────────────────────────┘
               │
┌──────────────v──────────────────────────────┐
│  Components (Form, Card, Preview, etc.)    │
│        Reusable UI building blocks          │
└──────────────┬──────────────────────────────┘
               │
┌──────────────v──────────────────────────────┐
│      Hooks (usePopupHero.js)                │
│  API calls, mutations, and state management │
└──────────────┬──────────────────────────────┘
               │
┌──────────────v──────────────────────────────┐
│    Utilities & Services                    │
│  - videoUtils.js (video parsing)           │
│  - popupHeroSessionId.js (session tracking)│
│  - supabaseClient.js (database access)     │
└─────────────────────────────────────────────┘
```

## Core Files & Components

### 1. PopupHero.jsx - Public Display Component

**Location**: `src/components/popup/PopupHero.jsx`

**Responsibilities**:
- Fetch active popup from Supabase
- Check if already viewed this session
- Display popup with animations
- Track view in database
- Handle close actions

**Key Functions**:
```javascript
export const PopupHero = ({ preview = false, previewData = null })
```

**Props**:
- `preview` (bool) - Preview mode (ignores session tracking)
- `previewData` (object) - Popup data for preview

**Usage**:
```jsx
// In HomePage
<PopupHero />

// In PopupPreview
<PopupHero preview previewData={popup} />
```

### 2. usePopupHero.js - Custom Hooks

**Location**: `src/hooks/usePopupHero.js`

**Available Hooks**:

#### useAllPopups()
```javascript
const { data, error, isLoading } = useAllPopups();
// Returns all popups without stats
```

#### usePopupsWithStats()
```javascript
const { data, error, isLoading } = usePopupsWithStats();
// Returns popups with views_count and unique_sessions
```

#### useActivePopup()
```javascript
const { data, error, isLoading } = useActivePopup();
// Returns active popup (null if none available)
```

#### useCreatePopup()
```javascript
const mutation = useCreatePopup();
mutation.mutate(popupData, {
  onSuccess: () => { /* handle success */ },
  onError: (error) => { /* handle error */ }
});
```

#### useUpdatePopup()
```javascript
const mutation = useUpdatePopup();
mutation.mutate(
  { id: popupId, ...updates },
  { onSuccess: () => { /* ... */ } }
);
```

#### useDeletePopup()
```javascript
const mutation = useDeletePopup();
mutation.mutate(popupId, {
  onSuccess: () => { /* handle success */ }
});
```

#### useRecordView()
```javascript
const mutation = useRecordView();
mutation.mutate(
  { popupId, sessionId },
  { onSuccess: () => { /* ... */ } }
);
```

### 3. Admin Components

#### AdminPopupPage.jsx
**Location**: `src/pages/AdminPopupPage.jsx`

Main admin dashboard orchestrating:
- Stats display
- Popup list grid
- Form modal management
- Delete confirmation
- Preview modal

#### PopupForm.jsx
**Location**: `src/components/admin/PopupForm.jsx`

Form component features:
- Field validation
- Date/time input
- URL input validation
- Active toggle switch
- Error messaging

```javascript
<PopupForm
  popup={popupData}
  onSubmit={handleFormSubmit}
  onCancel={handleCancel}
  isLoading={false}
/>
```

#### PopupCard.jsx
**Location**: `src/components/admin/PopupCard.jsx`

Card component displays:
- Thumbnail image/gradient
- Status badge
- View/session counts
- Date range
- Action buttons

#### PopupPreview.jsx
**Location**: `src/components/admin/PopupPreview.jsx`

Preview features:
- Desktop/mobile device mode toggle
- Full-screen mock browser
- Live popup rendering

#### StatsCard.jsx
**Location**: `src/components/admin/StatsCard.jsx`

Stats display component:
- Title and value
- Icon
- Optional trend indicator

### 4. Utility Functions

#### videoUtils.js
**Location**: `src/lib/videoUtils.js`

Functions:
```javascript
parseVideoUrl(url) 
  // Returns: { type, embedUrl, thumbnailUrl? }
  // Types: 'youtube', 'vimeo', 'pixabay', 'direct', 'unknown'

getYouTubeId(url)
  // Extracts YouTube video ID

getVimeoId(url)
  // Extracts Vimeo video ID

isDirectVideo(url)
  // Checks if URL is direct video file

isVideoUrl(url)
  // Boolean check if URL is valid video

isPixabayVideo(url)
  // Boolean check if URL is Pixabay
```

#### popupHeroSessionId.js
**Location**: `src/lib/popupHeroSessionId.js`

Functions:
```javascript
getSessionId()
  // Returns unique session UUID from sessionStorage

hasViewedPopup(popupId)
  // Returns boolean if popup viewed in session

markPopupAsViewed(popupId)
  // Records popup as viewed in session
```

## Data Models

### Popup Interface
```javascript
{
  id: string                          // UUID
  title: string                       // Required, max 100 chars
  description: string | null
  image_url: string | null
  video_url: string | null
  link_url: string | null
  layout_type: 'rectangle' | 'square' | 'fullscreen'
  position: 'center' | 'bottom' | 'top'
  is_active: boolean
  start_date: string                  // ISO 8601 datetime
  end_date: string | null
  created_at: string
  created_by: string | null
}
```

### PopupWithViews Interface
```javascript
// Extends Popup with:
{
  views_count: number                 // Total views
  unique_sessions: number             // Unique visitors
}
```

### PopupView Interface
```javascript
{
  id: string                          // UUID
  popup_id: string
  session_id: string
  user_id: string | null
  viewed_at: string                   // ISO 8601 datetime
}
```

## Database Queries

### Get Active Popup
```sql
SELECT * FROM popup_hero
WHERE is_active = true
  AND start_date <= now()
  AND (end_date IS NULL OR end_date >= now())
ORDER BY created_at DESC
LIMIT 1;
```

### Get Popup Stats
```sql
SELECT 
  p.*,
  COUNT(v.id) as views_count,
  COUNT(DISTINCT v.session_id) as unique_sessions
FROM popup_hero p
LEFT JOIN popup_hero_views v ON p.id = v.popup_id
GROUP BY p.id
ORDER BY p.created_at DESC;
```

### Check if Viewed
```sql
SELECT EXISTS(
  SELECT 1 FROM popup_hero_views
  WHERE popup_id = $1 AND session_id = $2
) as already_viewed;
```

## Styling & Tailwind Integration

All components use Tailwind CSS classes from the main app's configuration.

### Key CSS Classes Used
```
Typography: font-display, font-bold, text-lg, etc.
Colors: text-primary, bg-card, text-muted-foreground, etc.
Layout: grid, flex, space-y-*, gap-*, etc.
Effects: shadow-*, rounded-*, border-*, etc.
Animations: animate-*, data-[state]:*, etc.
Responsive: md:, lg:, sm:, etc.
```

### Gradient Classes
```css
gradient-primary   /* Primary gradient */
gradient-hero      /* Hero section gradient */
```

## Error Handling

All mutations handle errors with toast notifications:

```javascript
onError: (error) => {
  toast({
    title: 'Error',
    description: error.message,
    variant: 'destructive'
  });
}
```

Common errors:
- Network errors
- Validation errors
- Permission errors (RLS)
- Duplicate constraint violations

## Performance Optimizations

### React Query Caching
```javascript
// Queries are automatically cached and re-used
// Mutations invalidate related queries
queryClient.invalidateQueries({ queryKey: ['popups'] });
```

### Lazy Loading
```javascript
// AdminPopupPage is lazy loaded in App.jsx
const AdminPopupPage = React.lazy(() => import('@/pages/AdminPopupPage'));
```

### Component Memoization
Components use React.forwardRef for proper ref forwarding.

## Testing Considerations

### Unit Test Example
```javascript
describe('PopupHero', () => {
  it('should record view on mount', () => {
    // Mock useActivePopup to return popup
    // Mock useRecordView to track mutation
    // Render component
    // Verify mutation called with correct ID
  });
});
```

### Integration Test Example
```javascript
describe('Admin Workflow', () => {
  it('should create, edit, and delete popup', async () => {
    // Render AdminPopupPage
    // Click create
    // Fill form
    // Submit
    // Verify popup appears
    // Edit popup
    // Verify changes
    // Delete popup
    // Verify removal
  });
});
```

## Extending the System

### Adding New Layout Type
1. Update Popup interface to include new layout type
2. Add CSS classes to PopupHero.jsx layoutClasses object
3. Update PopupForm.jsx select options
4. Update database enum if needed

### Adding Custom Fields
1. Add field to Popup interface
2. Add form input in PopupForm.jsx
3. Add display in PopupCard.jsx (if needed)
4. Update Supabase table schema

### Custom Video Source
1. Add parsing function to videoUtils.js
2. Test parseVideoUrl() handles new URL format
3. Update VideoPlayer component if needed

### Analytics Enhancement
1. Extend popup_hero_views schema with additional fields
2. Create new hook for analytics queries
3. Add analytics component to admin dashboard

## Common Tasks

### Creating New Admin Page Component
```javascript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const MyPage = () => {
  const [state, setState] = useState(null);
  
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b">
        {/* Header content */}
      </header>
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Main content */}
      </main>
    </div>
  );
};

export default MyPage;
```

### Adding Form Field
```javascript
<div className="space-y-2">
  <Label htmlFor="fieldName">Field Label</Label>
  <Input
    id="fieldName"
    name="fieldName"
    value={formData.fieldName}
    onChange={handleChange}
    placeholder="Placeholder text"
    className="h-11"
  />
  {errors.fieldName && (
    <p className="text-sm text-destructive">{errors.fieldName}</p>
  )}
</div>
```

### Adding Query Hook
```javascript
export const useMyQuery = () => {
  return useQuery({
    queryKey: ['unique-key'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });
};
```

## Browser Compatibility

Tested and supported:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Uses modern JavaScript:
- ES6+ features
- crypto.randomUUID() for session IDs
- Async/await
- Optional chaining

## Deployment Checklist

- [ ] Supabase tables created and configured
- [ ] RLS policies set for admin access
- [ ] Storage bucket created if using media uploads
- [ ] Environment variables configured
- [ ] Admin user accounts created
- [ ] Test popups created and verified
- [ ] Mobile responsiveness tested
- [ ] Error handling tested
- [ ] Performance monitoring enabled
- [ ] Backups configured

## Troubleshooting Guide

### Popup not showing to public
1. Verify popup `is_active` = true
2. Check current datetime vs start_date/end_date
3. Clear sessionStorage in browser
4. Check console for errors

### Admin dashboard errors
1. Verify user has admin/assistant role
2. Check Supabase connection
3. Verify RLS policies allow access
4. Check network tab for failed requests

### Form validation failing
1. Check field constraints (max lengths, formats)
2. Verify date formats are ISO 8601
3. Validate URLs are properly formatted
4. Check browser console for validation errors

### Style issues
1. Verify Tailwind CSS is properly configured
2. Check color CSS variables are defined
3. Clear Next.js cache if applicable
4. Rebuild styles if using build process

## Future Enhancements

Potential improvements:
- [ ] Media file upload (using Supabase Storage)
- [ ] Advanced analytics dashboard
- [ ] A/B testing for popups
- [ ] User segmentation/targeting
- [ ] Popup templates
- [ ] Bulk operations
- [ ] Popup version history
- [ ] Advanced scheduling (recurring, custom rules)
- [ ] Integration with email/SMS notifications
- [ ] Multi-language support

---

**Last Updated**: January 2026
**Version**: 1.0
**Status**: Fully Functional
