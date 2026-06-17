# Dashboard Deployment & Domain Configuration Guide

## 🎯 Overview
This guide explains how to deploy the store dashboard to a domain like `martinventory.neomart.space` and configure automatic redirects for the main site.

---

## 📍 Domain Architecture

```
neomart.space                    → Main Marketing Site (Shopify/External)
│
├─ martinventory.neomart.space   → Store Dashboard (This App)
├─ dashboard.neomart.space       → Store Dashboard (Alias - Optional)
└─ admin.neomart.space          → Store Dashboard (Alias - Optional)
```

---

## 🚀 Deployment Steps

### Step 1: Build the Dashboard
```bash
npm run build
```
This creates an optimized production build in the `dist/` folder.

### Step 2: Deploy to Hosting Platform

#### Option A: Netlify Deployment
```bash
# Using Netlify CLI
netlify deploy --prod --dir=dist

# Or connect GitHub repo in Netlify dashboard
```

**Netlify Configuration (`netlify.toml`):**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Option B: Vercel Deployment
```bash
# Using Vercel CLI
vercel --prod

# Or connect GitHub repo in Vercel dashboard
```

#### Option C: Docker/Self-Hosted
```bash
# Build Docker image
docker build -t neomart-dashboard .

# Run container
docker run -p 3000:3000 neomart-dashboard
```

#### Option D: Supabase Hosting
Use Supabase's built-in hosting or connect to Netlify/Vercel through Supabase dashboard.

---

## 🔗 Domain Configuration

### Step 1: Configure DNS Records

Add these DNS records to your domain provider (e.g., GoDaddy, Namecheap):

#### For Netlify:
```
CNAME record:
martinventory.neomart.space  → your-netlify-site.netlify.app
dashboard.neomart.space      → your-netlify-site.netlify.app (optional alias)
```

#### For Vercel:
```
CNAME record:
martinventory.neomart.space  → cname.vercel-dns.com
dashboard.neomart.space      → cname.vercel-dns.com (optional alias)
```

#### For Custom Domain:
```
A record (for IP):
martinventory.neomart.space  → YOUR.IP.ADDRESS
```

### Step 2: SSL/TLS Certificate
Most hosting platforms provide free SSL automatically. If not, use Let's Encrypt.

### Step 3: Redirect Main Site to Dashboard (If Needed)

If you want `neomart.space` visitors without a specific subdomain to be redirected to the dashboard, configure at your hosting provider level.

---

## 🔄 Main Site to Dashboard Redirect

### Option 1: Supabase Edge Function
Create an edge function to handle redirects:

```typescript
// supabase/functions/redirect-handler/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve((req) => {
  const url = new URL(req.url)
  const host = url.hostname

  // If main domain, redirect to dashboard
  if (host === 'neomart.space') {
    return new Response(null, {
      status: 301,
      headers: {
        'Location': 'https://martinventory.neomart.space'
      }
    })
  }

  // All other subdomains serve the dashboard app
  return new Response('OK', { status: 200 })
})
```

Deploy with:
```bash
supabase functions deploy redirect-handler
```

### Option 2: Middleware at Web Server Level (Nginx)
```nginx
server {
    listen 80;
    server_name neomart.space;
    
    return 301 https://martinventory.neomart.space$request_uri;
}

server {
    listen 80;
    server_name martinventory.neomart.space;
    
    location / {
        proxy_pass http://your-dashboard-app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Option 3: Cloudflare URL Redirect
1. Go to Cloudflare dashboard
2. Add Page Rule:
   ```
   Domain: neomart.space/*
   Setting: Forwarding URL
   Destination: https://martinventory.neomart.space
   Status Code: 301 (Permanent Redirect)
   ```

---

## ⚙️ Environment Variables for Production

Create `.env` file with:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Or set in your hosting platform:
- **Netlify**: Site Settings → Build & Deploy → Environment
- **Vercel**: Settings → Environment Variables
- **Docker**: Use `docker run -e` flags

---

## 🔐 Security Checklist

Before going live:

- [ ] SSL/TLS certificate is valid
- [ ] Domain is properly configured in DNS
- [ ] Supabase auth is working (test login)
- [ ] Only `admin` and `store_owner` roles can access
- [ ] Environment variables are set correctly
- [ ] No sensitive keys in code/git
- [ ] Rate limiting is enabled (if available)
- [ ] CORS is properly configured
- [ ] Backup database is enabled
- [ ] Monitoring/error logging is set up

---

## 🧪 Testing Production Deployment

### Test 1: Domain Access
```bash
curl -I https://martinventory.neomart.space
# Should return 200 OK

curl -I https://neomart.space
# Should return 301 redirect to martinventory.neomart.space
```

### Test 2: Login Flow
1. Visit `https://martinventory.neomart.space`
2. Should redirect to `/login`
3. Login with admin/store_owner credentials
4. Should access dashboard

### Test 3: Access Control
```bash
# Test with invalid user
curl -H "Authorization: Bearer INVALID_TOKEN" \
  https://martinventory.neomart.space/inventory
# Should return 401 or redirect to login
```

### Test 4: Cross-Domain
- Visit `https://neomart.space` → Should redirect to dashboard
- Visit `https://martinventory.neomart.space` → Should show dashboard
- Visit `https://dashboard.neomart.space` → Should show dashboard (if alias configured)

---

## 📊 Monitoring & Logging

### Netlify
- Analytics: Site analytics & analytics settings
- Logs: Deploy logs, function logs
- Monitoring: Uptime monitoring via integrations

### Vercel
- Analytics: Real experience scoring
- Logs: Deployment logs, edge function logs
- Monitoring: Speed insights

### Supabase
- Database logs: SQL logs in Supabase dashboard
- Auth logs: Auth events in Supabase dashboard
- Edge function logs: Function logs in Supabase dashboard

---

## 🔄 Continuous Deployment

### GitHub + Netlify
```bash
# Automated deployment on push to main
# Configure in Netlify dashboard under "Continuous Deployment"
```

### GitHub + Vercel
```bash
# Automatically deploys on push to main
# Preview deployments for pull requests
```

### GitHub + Docker Registry
```bash
# Build and push to container registry
# Deploy from registry
```

---

## 📞 Troubleshooting

### Issue: Login page shows but can't authenticate
**Solution:**
- Check Supabase URL and anon key in env vars
- Verify user_profiles table has correct role values
- Check browser console for errors

### Issue: 404 on `/inventory` after login
**Solution:**
- Verify ProtectedRoute is working
- Check that route exists in App.jsx
- Clear browser cache and reload

### Issue: Domain not resolving
**Solution:**
- Wait 24-48 hours for DNS propagation
- Check DNS records in domain provider
- Verify CNAME/A records match hosting provider requirements

### Issue: SSL certificate warnings
**Solution:**
- Use your hosting provider's automatic SSL
- Or generate cert with Let's Encrypt
- Wait for cert to propagate (usually instant)

---

## 📈 Performance Optimization

1. **Enable Gzip compression** (most hosts do automatically)
2. **Enable HTTP/2** (supported by modern hosting)
3. **Use CDN** (Netlify/Vercel/Cloudflare built-in)
4. **Minify assets** (build process handles this)
5. **Cache static files** (configure in server headers)

---

## 🚀 Production Checklist

- [ ] Build completes without errors: `npm run build`
- [ ] All environment variables are set
- [ ] Domain DNS records are configured
- [ ] SSL certificate is valid
- [ ] Login page loads
- [ ] Can login with admin credentials
- [ ] Can navigate to /inventory
- [ ] Can access all protected routes
- [ ] Logout works
- [ ] Images load correctly from Supabase
- [ ] No console errors
- [ ] Monitoring is set up
- [ ] Backups are enabled
- [ ] Support contact info is available

---

## 🎉 Deployment Complete!

Once all checks pass, your dashboard is live at `martinventory.neomart.space` and ready for store management!

For questions or issues, contact support or check the main documentation.
