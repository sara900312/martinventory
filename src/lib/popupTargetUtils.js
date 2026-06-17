/**
 * Generate URL from popup target type and ID
 * @param {string} targetType - Type of target (page, category, product)
 * @param {string} targetId - ID of the target
 * @returns {string|null} - Generated URL or null if invalid
 */
export const generateTargetUrl = (targetType, targetId) => {
  if (!targetType || !targetId) {
    return null;
  }

  switch (targetType) {
    case 'page':
      return generatePageUrl(targetId);
    case 'category':
      return generateCategoryUrl(targetId);
    case 'product':
      return generateProductUrl(targetId);
    default:
      return null;
  }
};

/**
 * Generate page URL based on page ID
 */
const generatePageUrl = (pageId) => {
  const pageMap = {
    home: '/',
    products: '/products',
    about: '/about',
    contact: '/contact',
  };

  return pageMap[pageId] || null;
};

/**
 * Generate category URL
 */
const generateCategoryUrl = (categoryId) => {
  // The URL for category filtered products
  return `/products?category=${encodeURIComponent(categoryId)}`;
};

/**
 * Generate product URL
 * @param {string} productId - Product ID (could be ID or slug)
 * @returns {string} - Product page URL
 */
const generateProductUrl = (productId) => {
  // If it's a UUID format, use as product ID
  // Otherwise, assume it's a slug
  return `/product/${encodeURIComponent(productId)}`;
};

/**
 * Get display information for a target
 * Used for showing preview/confirmation of selected target
 */
export const getTargetDisplayInfo = async (targetType, targetId, supabase) => {
  if (!targetType || !targetId) {
    return null;
  }

  switch (targetType) {
    case 'page':
      return getPageInfo(targetId);
    case 'category':
      return getCategoryInfo(targetId);
    case 'product':
      return getProductInfo(targetId, supabase);
    default:
      return null;
  }
};

const getPageInfo = (pageId) => {
  const pageMap = {
    home: { name: 'الصفحة الرئيسية', url: '/' },
    products: { name: 'جميع المنتجات', url: '/products' },
    about: { name: 'من نحن', url: '/about' },
    contact: { name: 'تواصل معنا', url: '/contact' },
  };

  return pageMap[pageId] || null;
};

const getCategoryInfo = (categoryId) => {
  const categoryMap = {
    hair_care: { name: 'العناية بالشعر', url: `/products?category=${categoryId}` },
    skincare: { name: 'العناية بالبشرة', url: `/products?category=${categoryId}` },
    makeup: { name: 'مكياج', url: `/products?category=${categoryId}` },
    perfumes: { name: 'عطور', url: `/products?category=${categoryId}` },
    serums: { name: 'سيرومات', url: `/products?category=${categoryId}` },
    masks: { name: 'ماسكات', url: `/products?category=${categoryId}` },
    oils: { name: 'زيوت', url: `/products?category=${categoryId}` },
  };

  return categoryMap[categoryId] || null;
};

const getProductInfo = async (productId, supabase) => {
  if (!supabase) {
    return {
      name: productId,
      url: `/product/${productId}`,
    };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, slug')
      .or(`id.eq.${productId},slug.eq.${productId}`)
      .single();

    if (error || !data) {
      return {
        name: productId,
        url: `/product/${productId}`,
      };
    }

    return {
      name: data.name,
      url: `/product/${data.slug || data.id}`,
    };
  } catch (err) {
    console.error('Error fetching product info:', err);
    return {
      name: productId,
      url: `/product/${productId}`,
    };
  }
};
