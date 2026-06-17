#!/usr/bin/env node

/**
 * Sitemap Generator Script
 * Generates sitemap.xml with all published products from Supabase
 * Run with: node tools/generate-sitemap.js
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SITE_URL = 'https://beauty.neomart.space'
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml')

// Categories from data/products.js
const CATEGORIES = [
  { id: 'hair_care', name: 'العناية بالشعر' },
  { id: 'skincare', name: 'العناية بالبشرة' },
  { id: 'makeup', name: 'مكياج' },
  { id: 'perfumes', name: 'عطور' },
  { id: 'serums', name: 'سيرومات' },
  { id: 'masks', name: 'ماسكات' },
  { id: 'oils', name: 'زيوت' },
  { id: 'creams', name: 'كريمات' },
]

const escapeXml = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const generateSitemap = async () => {
  try {
    // Get Supabase credentials from environment
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ykyzviqwscrjjkucorlp.supabase.co'
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreXp2aXF3c2NyamprdWNvcmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NzA1NjcsImV4cCI6MjA3OTI0NjU2N30.sXpyumNFfZ_bqqZt28LOQQjDM040y7R-9-jIXy_KIps'

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required')
      console.error('Please set these in your .env file')
      process.exit(1)
    }

    console.log('🔄 Initializing Supabase client...')
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('📥 Fetching published products from Supabase...')
    const { data: products, error } = await supabase
      .from('products')
      .select('id, slug, category, published, updated_at')
      .eq('published', true)

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`)
    }

    console.log(`✅ Found ${products?.length || 0} published products`)

    const now = new Date()
    const lastmod = now.toISOString().split('T')[0]

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n'
    xml += '        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">\n'

    // Homepage
    xml += '  <!-- Homepage - Highest Priority -->\n'
    xml += '  <url>\n'
    xml += `    <loc>${escapeXml(SITE_URL)}/</loc>\n`
    xml += `    <lastmod>${lastmod}</lastmod>\n`
    xml += '    <changefreq>daily</changefreq>\n'
    xml += '    <priority>1.0</priority>\n'
    xml += '  </url>\n\n'

    // All Products Page
    xml += '  <!-- All Products Page -->\n'
    xml += '  <url>\n'
    xml += `    <loc>${escapeXml(SITE_URL)}/products</loc>\n`
    xml += `    <lastmod>${lastmod}</lastmod>\n`
    xml += '    <changefreq>daily</changefreq>\n'
    xml += '    <priority>0.9</priority>\n'
    xml += '  </url>\n\n'

    // Categories
    xml += '  <!-- Product Categories -->\n'
    CATEGORIES.forEach((category) => {
      xml += '  <url>\n'
      xml += `    <loc>${escapeXml(SITE_URL)}/products/${category.id}</loc>\n`
      xml += `    <lastmod>${lastmod}</lastmod>\n`
      xml += '    <changefreq>weekly</changefreq>\n'
      xml += '    <priority>0.8</priority>\n'
      xml += '  </url>\n'
    })

    xml += '\n  <!-- Individual Products -->\n'
    // Products
    if (products && products.length > 0) {
      products.forEach((product) => {
        const productSlug = product.slug || product.id
        const productUrl = `${SITE_URL}/products/${product.category}/${productSlug}`
        const productLastmod = product.updated_at
          ? product.updated_at.split('T')[0]
          : lastmod

        xml += '  <url>\n'
        xml += `    <loc>${escapeXml(productUrl)}</loc>\n`
        xml += `    <lastmod>${productLastmod}</lastmod>\n`
        xml += '    <changefreq>weekly</changefreq>\n'
        xml += '    <priority>0.6</priority>\n'
        xml += '  </url>\n'
      })
    }

    xml += '</urlset>'

    // Write to file
    console.log(`📝 Writing sitemap to ${OUTPUT_PATH}...`)
    fs.writeFileSync(OUTPUT_PATH, xml, 'utf-8')

    console.log(`\n✨ Sitemap generated successfully!`)
    console.log(`📊 Total URLs: ${products?.length ? products.length + CATEGORIES.length + 2 : CATEGORIES.length + 2}`)
    console.log(`📍 Location: ${OUTPUT_PATH}`)
    console.log(`🌐 Public URL: ${SITE_URL}/sitemap.xml`)
  } catch (error) {
    console.error('❌ Error generating sitemap:', error.message)
    process.exit(1)
  }
}

// Run the script
console.log('🚀 Starting sitemap generation...\n')
generateSitemap()
