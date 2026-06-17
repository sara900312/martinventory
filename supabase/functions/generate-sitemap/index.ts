import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.30.0"

const SITE_URL = 'https://beauty.neomart.space'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=utf-8',
}

// Categories data - manually defined or could be fetched
const categoriesData = [
  { id: 'hair_care', name: 'العناية بالشعر' },
  { id: 'skincare', name: 'العناية بالبشرة' },
  { id: 'makeup', name: 'مكياج' },
  { id: 'perfumes', name: 'عطور' },
  { id: 'serums', name: 'سيرومات' },
  { id: 'masks', name: 'ماسكات' },
  { id: 'oils', name: 'زيوت' },
  { id: 'creams', name: 'كريمات' },
]

const generateSitemapXML = (products: any[]) => {
  const now = new Date()
  const lastmod = now.toISOString().split('T')[0]

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

  // Add homepage
  xml += '  <url>\n'
  xml += `    <loc>${escapeXml(SITE_URL)}</loc>\n`
  xml += `    <lastmod>${lastmod}</lastmod>\n`
  xml += '    <changefreq>daily</changefreq>\n'
  xml += '    <priority>1.0</priority>\n'
  xml += '  </url>\n'

  // Add category pages
  categoriesData
    .filter((cat: any) => cat.id !== 'all')
    .forEach((category: any) => {
      xml += '  <url>\n'
      xml += `    <loc>${escapeXml(`${SITE_URL}/products/${category.id}`)}</loc>\n`
      xml += `    <lastmod>${lastmod}</lastmod>\n`
      xml += '    <changefreq>weekly</changefreq>\n'
      xml += '    <priority>0.8</priority>\n'
      xml += '  </url>\n'
    })

  // Add product pages
  products
    .filter((product: any) => product.published === true)
    .forEach((product: any) => {
      const productSlug = product.slug || product.id
      const productUrl = `${SITE_URL}/products/${product.category}/${productSlug}`
      xml += '  <url>\n'
      xml += `    <loc>${escapeXml(productUrl)}</loc>\n`
      xml += `    <lastmod>${product.updated_at ? product.updated_at.split('T')[0] : lastmod}</lastmod>\n`
      xml += '    <changefreq>weekly</changefreq>\n'
      xml += '    <priority>0.6</priority>\n'
      xml += '  </url>\n'
    })

  xml += '</urlset>'
  return xml
}

const escapeXml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all published products
    const { data: products, error } = await supabase
      .from('products')
      .select('id, slug, category, published, updated_at')
      .eq('published', true)

    if (error) {
      console.error('Error fetching products:', error)
      return new Response(
        'Error fetching products',
        { status: 500, headers: corsHeaders }
      )
    }

    // Generate sitemap XML
    const sitemap = generateSitemapXML(products || [])

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    })
  } catch (error) {
    console.error('Error in sitemap generation:', error)
    return new Response(
      'Error generating sitemap',
      { status: 500, headers: corsHeaders }
    )
  }
})
