# Performance Checklist

Use this checklist before deploying to production and for ongoing optimization.

---

## 🚀 Pre-Deployment Checklist

### Build Optimization
- [ ] Run `npm run build` successfully
- [ ] Check dist/ folder size is reasonable (< 300 KB JS)
- [ ] Run `npm run analyze` and review recommendations
- [ ] No console errors or warnings in build output
- [ ] All dependencies are necessary (no unused packages)

### Code Quality
- [ ] No console.log() statements in production code
- [ ] No debugger statements
- [ ] All components properly memoized where needed
- [ ] No infinite loops or memory leaks
- [ ] All async operations properly cleaned up

### Images & Assets
- [ ] All images are optimized (< 200 KB each)
- [ ] WebP format available for modern browsers
- [ ] Image dimensions are pre-defined (no layout shift)
- [ ] Lazy loading implemented for images
- [ ] No unused images in assets

### Performance Metrics
- [ ] LCP < 2.5s ✅
- [ ] FID < 100ms ✅
- [ ] CLS < 0.1 ✅
- [ ] Lighthouse score > 90 ✅
- [ ] Bundle size < 300 KB ✅

### Mobile Testing
- [ ] Test on actual mobile device (not just DevTools)
- [ ] Test on slow 4G network
- [ ] Test with slow CPU throttling
- [ ] Test with slow device (iPhone 6s, Samsung A50)
- [ ] Verify smooth scrolling and animations
- [ ] No layout shift during interaction

### Browser Compatibility
- [ ] Chrome latest ✅
- [ ] Firefox latest ✅
- [ ] Safari latest ✅
- [ ] Edge latest ✅
- [ ] Mobile browsers ✅

---

## 📊 Performance Testing Checklist

### Google Lighthouse
```bash
# In DevTools
- Press F12
- Go to "Lighthouse" tab
- Select "Performance"
- Click "Analyze page load"
- Verify scores > 90
```

**Checklist:**
- [ ] Performance: > 90
- [ ] Accessibility: > 80
- [ ] Best Practices: > 90
- [ ] SEO: > 90

### Google PageSpeed Insights
1. Visit https://pagespeed.web.dev
2. Enter: `https://beauty.neomart.space`
3. Check both Mobile and Desktop

**Checklist:**
- [ ] Mobile score > 90
- [ ] Desktop score > 95
- [ ] No "Fails" in opportunities
- [ ] All "Passed audits" are checked

### WebPageTest (Optional)
1. Visit https://www.webpagetest.org
2. Enter your URL
3. Select your region
4. Run test and analyze results

**Checklist:**
- [ ] First Byte Time < 200ms
- [ ] Start Render < 1.5s
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 2.5s

---

## 🔍 Code Review Checklist

### Component Performance
- [ ] No unnecessary re-renders (check React DevTools Profiler)
- [ ] useState and useEffect used correctly
- [ ] useCallback/useMemo used for expensive operations
- [ ] React.memo used for list items (ProductCard)
- [ ] No inline functions in render method

### Data Loading
- [ ] Data is cached appropriately
- [ ] No duplicate API calls
- [ ] Pagination implemented for large lists
- [ ] Lazy loading for non-critical content
- [ ] Loading states properly handled

### Animations
- [ ] Use `will-change` CSS property
- [ ] Animations use transform and opacity only
- [ ] Animation duration < 300ms
- [ ] No janky animations (60fps)
- [ ] Animations don't block interactions

### Images
- [ ] All images have alt text
- [ ] Image dimensions pre-defined
- [ ] Lazy loading enabled
- [ ] Responsive sizes defined
- [ ] No huge image files (> 500 KB)

---

## 🌐 Server Configuration Checklist

### Compression
- [ ] Gzip compression enabled
- [ ] Brotli compression enabled (if supported)
- [ ] CSS minified
- [ ] JavaScript minified
- [ ] HTML minified

### Caching
- [ ] Static assets have long cache (1 year)
- [ ] HTML pages not cached (Cache-Control: no-cache)
- [ ] Service Worker installed (offline support)
- [ ] Browser caching enabled
- [ ] CDN caching configured

### HTTP Headers
- [ ] HTTP/2 enabled
- [ ] HTTPS enforced
- [ ] Preload critical resources
- [ ] Prefetch non-critical resources
- [ ] X-Frame-Options set (security)

### CDN & Hosting
- [ ] CDN enabled for static assets
- [ ] Geographically distributed servers
- [ ] SSL certificate valid (HTTPS)
- [ ] HSTS enabled (security)
- [ ] DNS optimized

---

## 📱 Mobile Optimization Checklist

### Responsive Design
- [ ] Mobile-first approach
- [ ] All screen sizes supported (320px - 1920px)
- [ ] Touch targets are large enough (44x44px minimum)
- [ ] No horizontal scroll
- [ ] Text is readable (16px minimum)

### Mobile Performance
- [ ] LCP optimized for mobile
- [ ] FID optimized (main thread not blocked)
- [ ] CLS minimized (no jumping)
- [ ] Images optimized for screen size
- [ ] No render-blocking resources

### Mobile UX
- [ ] Navigation is accessible
- [ ] Forms are easy to fill
- [ ] Buttons are clickable
- [ ] Modal dialogs work correctly
- [ ] Back button works as expected

---

## 🎯 Monitoring Checklist (Post-Deployment)

### Weekly
- [ ] Check Google Search Console for errors
- [ ] Review Core Web Vitals in PageSpeed Insights
- [ ] Check for JavaScript errors (error logs)
- [ ] Monitor user feedback

### Monthly
- [ ] Run full Lighthouse audit
- [ ] Analyze WebPageTest results
- [ ] Review Google Analytics performance
- [ ] Check SEO rankings
- [ ] Review competitors' performance

### Quarterly
- [ ] Update dependencies
- [ ] Audit unused code
- [ ] Review bundle composition
- [ ] Analyze user behavior
- [ ] Optimize high-impact pages

---

## 🛠️ Tools & Commands

### Performance Analysis
```bash
# Analyze bundle
npm run analyze

# Build and generate sitemap
npm run build

# Preview production build
npm run preview
```

### Performance Monitoring
```javascript
// In browser console
// Get performance metrics
performance.timing
performance.getEntriesByType('navigation')
performance.getEntriesByType('paint')

// Check if using service worker
navigator.serviceWorker.getRegistrations()
```

### Lighthouse CLI
```bash
# Install
npm install -g lighthouse

# Run audit
lighthouse https://beauty.neomart.space --view
```

---

## 📋 Common Issues & Solutions

### Issue: High LCP
**Solutions:**
- Optimize hero image (compress, use WebP)
- Preload critical resources
- Lazy load non-critical content
- Remove render-blocking resources

### Issue: High CLS
**Solutions:**
- Reserve space for images (aspect-ratio)
- Pre-define skeleton dimensions
- Avoid dynamic font loading
- Use CSS Grid/Flexbox

### Issue: High FID
**Solutions:**
- Break up long JavaScript tasks
- Use web workers for heavy processing
- Defer non-critical JavaScript
- Optimize main thread usage

### Issue: Large Bundle
**Solutions:**
- Enable code splitting
- Lazy load routes
- Tree shake unused code
- Audit dependencies

---

## 🎓 Learning Resources

- [Web.dev Performance Guide](https://web.dev/performance/)
- [Google Lighthouse Docs](https://developers.google.com/web/tools/lighthouse)
- [React Performance](https://reactjs.org/docs/optimizing-performance.html)
- [Vite Performance Tips](https://vitejs.dev/guide/ssr.html#performance)
- [MDN Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)

---

## ✅ Sign-Off

- [ ] All checklist items reviewed
- [ ] Performance targets met
- [ ] Tests passed
- [ ] Ready for deployment
- [ ] Monitoring set up

**Date:** ___________
**Reviewed by:** ___________
**Status:** ✅ Approved for Production

---

**Last Updated:** December 20, 2024
