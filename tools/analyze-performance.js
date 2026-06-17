#!/usr/bin/env node

/**
 * Performance Analysis Script
 * Analyzes bundle size, performance metrics, and provides recommendations
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import gzipSize from 'brotli-size'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.join(__dirname, '../dist')

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes, k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const analyzeBundle = async () => {
  console.log('\n🔍 Performance Analysis Report\n')
  console.log('=' .repeat(60))

  // Check if dist exists
  if (!fs.existsSync(distPath)) {
    console.error('❌ Error: dist folder not found!')
    console.log('   Run: npm run build')
    process.exit(1)
  }

  // Analyze file structure
  const files = getFilesRecursive(distPath)
  const jsFiles = files.filter(f => f.endsWith('.js'))
  const cssFiles = files.filter(f => f.endsWith('.css'))
  const assetFiles = files.filter(f => 
    !f.endsWith('.js') && !f.endsWith('.css') && !f.endsWith('.html')
  )

  // Calculate sizes
  const jsSize = jsFiles.reduce((sum, f) => sum + fs.statSync(f).size, 0)
  const cssSize = cssFiles.reduce((sum, f) => sum + fs.statSync(f).size, 0)
  const assetSize = assetFiles.reduce((sum, f) => sum + fs.statSync(f).size, 0)
  const totalSize = jsSize + cssSize + assetSize

  console.log('\n📦 Bundle Breakdown\n')
  console.log(`JavaScript Files: ${jsFiles.length}`)
  console.log(`  Size: ${formatBytes(jsSize)} (${(jsSize/totalSize*100).toFixed(1)}%)`)
  console.log(`  Largest files:`)
  jsFiles
    .sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)
    .slice(0, 5)
    .forEach(f => {
      const size = fs.statSync(f).size
      const name = path.basename(f)
      console.log(`    - ${name}: ${formatBytes(size)}`)
    })

  console.log(`\nCSS Files: ${cssFiles.length}`)
  console.log(`  Size: ${formatBytes(cssSize)} (${(cssSize/totalSize*100).toFixed(1)}%)`)

  console.log(`\nAsset Files: ${assetFiles.length}`)
  console.log(`  Size: ${formatBytes(assetSize)} (${(assetSize/totalSize*100).toFixed(1)}%)`)

  console.log(`\n📊 Total Bundle Size: ${formatBytes(totalSize)}`)

  // Performance recommendations
  console.log('\n💡 Optimization Recommendations\n')

  const recommendations = []

  if (jsSize > 300 * 1024) {
    recommendations.push({
      priority: '🔴 High',
      issue: 'JavaScript bundle is too large (> 300 KB)',
      solution: 'Enable code splitting, lazy load routes, remove unused dependencies'
    })
  } else if (jsSize > 200 * 1024) {
    recommendations.push({
      priority: '🟡 Medium',
      issue: 'JavaScript bundle is large (> 200 KB)',
      solution: 'Review bundle composition, optimize dependencies'
    })
  }

  if (assetSize > 500 * 1024) {
    recommendations.push({
      priority: '🔴 High',
      issue: 'Assets are too large (> 500 KB)',
      solution: 'Optimize images, use WebP format, compress videos'
    })
  }

  if (jsFiles.some(f => fs.statSync(f).size > 150 * 1024)) {
    recommendations.push({
      priority: '🟡 Medium',
      issue: 'Some JS chunks are very large (> 150 KB)',
      solution: 'Further code splitting or lazy loading needed'
    })
  }

  if (recommendations.length === 0) {
    console.log('✅ Bundle looks good! No major issues detected.')
  } else {
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.priority} - ${rec.issue}`)
      console.log(`   → ${rec.solution}\n`)
    })
  }

  // Performance tips
  console.log('\n🚀 Performance Tips\n')
  const tips = [
    'Enable gzip/brotli compression on your server',
    'Set up caching headers for static assets',
    'Use a CDN for faster content delivery',
    'Enable HTTP/2 for better connection handling',
    'Set up service worker for offline support',
    'Use image CDN for responsive images',
    'Enable preload/prefetch for critical resources'
  ]

  tips.forEach((tip, i) => {
    console.log(`${i + 1}. ${tip}`)
  })

  // Core Web Vitals targets
  console.log('\n🎯 Core Web Vitals Targets\n')
  console.log('Metric                  Target      Status')
  console.log('-'.repeat(60))
  console.log('LCP (Largest Paint)     < 2.5s      ✅ (recommended)')
  console.log('FID (First Input Delay) < 100ms     ✅ (recommended)')
  console.log('CLS (Layout Shift)      < 0.1       ✅ (recommended)')
  console.log('Bundle Size             < 300 KB    ' + (jsSize < 300 * 1024 ? '✅' : '❌'))

  console.log('\n' + '=' .repeat(60))
  console.log('\n📚 For more details, see: PERFORMANCE_GUIDE.md\n')
}

/**
 * Get all files recursively
 */
const getFilesRecursive = (dir) => {
  const files = []

  const walk = (currentPath) => {
    const items = fs.readdirSync(currentPath)

    items.forEach(item => {
      const fullPath = path.join(currentPath, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        // Skip certain directories
        if (!item.startsWith('.')) {
          walk(fullPath)
        }
      } else {
        files.push(fullPath)
      }
    })
  }

  walk(dir)
  return files
}

// Run analysis
analyzeBundle().catch(err => {
  console.error('Error analyzing bundle:', err.message)
  process.exit(1)
})
