# Dashboard Developer Quick Reference

## 🎯 Project Overview
This is a **Store/Inventory Management Dashboard** - NOT a customer-facing e-commerce site.

## 📁 Project Structure

```
src/
├── pages/
│   ├── LoginPage.jsx                    ← Entry point (authentication)
│   ├── InventoryPage.jsx                ← Product management
│   ├── StoreAnalyticsPage.jsx           ← Sales analytics
│   ├── CouponManagementPage.jsx         ← Discount management
│   ├── EarningsAccountsPage.jsx         ← Revenue tracking
│   ├── OrderStatusManagementPage.jsx    ← Order management
│   ├── AdminPopupPage.jsx               ← Popup/banner management
│   ├── MaintenanceManagementPage.jsx    ← System maintenance
│   └── ExcelImportTab.jsx               ← Excel import (stub)
│
├── components/
│   ├── AdminHeader.jsx                  ← Dashboard navigation (new)
│   ├── ProtectedRoute.jsx               ← Access control
│   ├── admin/                           ← Admin-specific components
│   ├── ui/                              ← Shared UI components
│   └── ... (other components)
│
├── contexts/
│   ├── AuthContext.jsx                  ← User authentication
│   ├── SupabaseContext.jsx              ← Database connection
│   ├── ThemeContext.jsx                 ← Theme management
│   └── MaintenanceContext.jsx           ← Maintenance state
│
├── lib/                                 ← Utility functions
├── hooks/                               ← Custom React hooks
├── data/                                ← Static data
├── App.jsx                              ← Main app component
├── index.css                            ← Global styles
└── main.jsx                             ← App entry point
```

## 🔐 Authentication & Authorization

### Allowed Roles
```javascript
// Only these roles can access the dashboard:
const ALLOWED_ROLES = ['admin', 'store_owner'];

// Check in any component:
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { user, userRole } = useAuth();
  
  if (userRole !== 'admin' && userRole !== 'store_owner') {
    return <div>Access Denied</div>;
  }
  
  return <div>Protected Content</div>;
};
```

### Protected Routes
```javascript
// Use ProtectedRoute wrapper:
<Route
  path="/inventory"
  element={
    <ProtectedRoute>
      <InventoryPage />
    </ProtectedRoute>
  }
/>
```

### User Data
```javascript
const { user, userRole, loading, signIn, signOut } = useAuth();

// user object contains:
// {
//   id: string
//   email: string
//   user_metadata: object
//   ...
// }
```

## 🔀 Routing Map

| Route | Component | Protected | Purpose |
|-------|-----------|-----------|---------|
| `/login` | LoginPage | ❌ | User authentication |
| `/inventory` | InventoryPage | ✅ | Manage products (CRUD) |
| `/analytics` | StoreAnalyticsPage | ✅ | View sales analytics |
| `/coupons` | CouponManagementPage | ✅ | Manage discounts |
| `/earnings` | EarningsAccountsPage | ✅ | Track revenue |
| `/order-status-management` | OrderStatusManagementPage | ✅ | Manage orders |
| `/admin/popups` | AdminPopupPage | ✅ | Manage promotions |
| `/maintenance-management` | MaintenanceManagementPage | ✅ | System maintenance |

## 📦 Key Dependencies

```json
{
  "react": "18.2.0",
  "react-router-dom": "6.16.0",
  "@supabase/supabase-js": "2.30.0",
  "@tanstack/react-query": "5.90.16",
  "tailwindcss": "3.3.3",
  "framer-motion": "10.16.4",
  "lucide-react": "0.292.0"
}
```

## 🎯 Common Tasks

### Adding a New Admin Page

1. **Create the page file:**
```javascript
// src/pages/MyNewPage.jsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const MyNewPage = () => {
  const { user, userRole } = useAuth();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold">My Page</h1>
      {/* Page content */}
    </div>
  );
};

export default MyNewPage;
```

2. **Add route in App.jsx:**
```javascript
const MyNewPage = React.lazy(() => import('@/pages/MyNewPage'));

// In Routes:
<Route
  path="/my-new-page"
  element={
    <ProtectedRoute>
      <MyNewPage />
    </ProtectedRoute>
  }
/>
```

3. **Add to AdminHeader navigation:**
```javascript
// src/components/AdminHeader.jsx
const navItems = [
  // ... existing items ...
  { path: '/my-new-page', label: 'My Page', icon: '📄' },
];
```

### Accessing Supabase
```javascript
import { useSupabase } from '@/contexts/SupabaseContext';

const MyComponent = () => {
  const { supabase } = useSupabase();
  
  // Fetch data
  const { data, error } = await supabase
    .from('products')
    .select('*');
  
  // Insert data
  const { data, error } = await supabase
    .from('products')
    .insert([{ name: 'Product' }]);
};
```

### Showing Toast Notifications
```javascript
import { toast } from '@/components/ui/use-toast';

// Success
toast({
  title: 'نجح',
  description: 'تم حفظ البيانات',
  variant: 'default', // or 'destructive'
});

// Error
toast({
  title: 'خطأ',
  description: 'فشل في حفظ البيانات',
  variant: 'destructive',
});
```

### Using React Query
```javascript
import { useQuery, useMutation } from '@tanstack/react-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['products'],
  queryFn: () => fetchProducts()
});

const mutation = useMutation({
  mutationFn: (newProduct) => createProduct(newProduct),
  onSuccess: () => {
    queryClient.invalidateQueries(['products']);
    toast({ title: 'Product created' });
  }
});
```

## 🎨 Styling

### Tailwind Classes
```javascript
// Common utilities
<div className="container mx-auto px-4 py-8"> {/* Container with padding */}
<div className="flex flex-col md:flex-row gap-6"> {/* Responsive flex */}
<button className="bg-blue-600 hover:bg-blue-700"> {/* Button styling */}
```

### Custom Components
```javascript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Button variant="outline" size="sm">Click me</Button>
```

## 🧪 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Analyze performance
npm run analyze

# Generate sitemap
npm run generate-sitemap
```

## 🐛 Debugging Tips

### Check User Role
```javascript
const { userRole } = useAuth();
console.log('Current user role:', userRole);
```

### Check ProtectedRoute Access
```javascript
// If user can't access a page, check:
1. Is user logged in? (check /login)
2. What is their role? (console.log it)
3. Is their role in ALLOWED_ROLES?
4. Is the route wrapped with <ProtectedRoute>?
```

### Supabase Connection Issues
```javascript
// Test connection:
const { supabase } = useSupabase();
const { data } = await supabase.auth.getSession();
console.log('Session:', data);
```

## 📝 Code Conventions

### File Naming
- Pages: `PascalCase.jsx` in `src/pages/`
- Components: `PascalCase.jsx` in `src/components/`
- Utils: `camelCase.js` in `src/lib/`
- Hooks: `useHookName.js` in `src/hooks/`

### Component Structure
```javascript
// 1. Imports
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

// 2. Component definition
const MyComponent = () => {
  // 3. Hooks
  const { user } = useAuth();
  const [state, setState] = React.useState(null);
  
  // 4. Effects
  React.useEffect(() => {
    // Initialize
  }, []);
  
  // 5. Handlers
  const handleClick = () => {
    // Handle
  };
  
  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// 7. Export
export default MyComponent;
```

## ⚠️ Important Notes

### ❌ DO NOT

- ❌ Add customer-facing pages
- ❌ Import deleted pages (HomePage, ProductsPage, etc.)
- ❌ Add CartProvider back to App.jsx
- ❌ Create customer-facing Header/Footer components in admin pages
- ❌ Use role 'assistant' - use 'store_owner' instead
- ❌ Redirect unauthorized users to '/' - use '/login'

### ✅ DO

- ✅ Use ProtectedRoute for all admin pages
- ✅ Check roles with useAuth hook
- ✅ Use AdminHeader for navigation
- ✅ Keep pages focused on admin tasks
- ✅ Redirect to /login on auth failure
- ✅ Use existing UI components from `/components/ui/`

## 📞 Quick Help

### How to add a new admin page?
1. Create file in `src/pages/`
2. Add route in `App.jsx` (with ProtectedRoute)
3. Add to AdminHeader navigation
4. Add role check in component

### How to protect a route?
Wrap with `<ProtectedRoute>` component in App.jsx

### How to check user permissions?
Use `useAuth()` hook and check `userRole`

### How to show notifications?
Import and use `toast()` from `@/components/ui/use-toast`

### How to fetch data from Supabase?
Use `useSupabase()` hook to get client instance

---

## 🔗 Related Documentation

- [Dashboard Conversion Summary](./DASHBOARD_CONVERSION_SUMMARY.md)
- [Deployment Guide](./DASHBOARD_DEPLOYMENT_GUIDE.md)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [React Router Documentation](https://reactrouter.com)

---

**Last Updated:** January 17, 2026
**Version:** 1.0
