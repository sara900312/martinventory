export const categoriesData = [
  {
    id: 'all',
    name: 'جميع المنتجات',
    nameEn: 'All Products',
    keywords: ['جميع', 'all', 'products', 'منتجات']
  },
  {
    id: 'hair_care',
    name: 'العناية بالشعر',
    nameEn: 'Hair Care',
    keywords: ['شعر', 'العناية بالشعر', 'شامبو', 'بلسم', 'hair care', 'hair', 'shampoo', 'conditioner', 'hair treatment']
  },
  {
    id: 'skincare',
    name: 'العناية بالبشرة',
    nameEn: 'Skincare',
    keywords: ['بشرة', 'عناية بالبشرة', 'وجه', 'skincare', 'face', 'facial', 'skin care']
  },
  {
    id: 'makeup',
    name: 'مكياج',
    nameEn: 'Makeup',
    keywords: ['مكياج', 'ماكياج', 'makeup', 'cosmetics', 'beauty', 'أساس', 'أحمر الشفاه']
  },
  {
    id: 'perfumes',
    name: 'عطور',
    nameEn: 'Perfumes',
    keywords: ['عطر', 'عطور', 'رائحة', 'perfume', 'fragrance', 'cologne']
  },
  {
    id: 'serums',
    name: 'سيرومات',
    nameEn: 'Serums',
    keywords: ['سيروم', 'سيرومات', 'serum', 'serums']
  },
  {
    id: 'masks',
    name: 'ماسكات',
    nameEn: 'Masks',
    keywords: ['ماسك', 'ماسكات', 'mask', 'masks', 'face mask']
  },
  {
    id: 'oils',
    name: 'زيوت',
    nameEn: 'Oils',
    keywords: ['زيت', 'زيوت', 'oil', 'oils']
  },
  {
    id: 'bath_essentials',
    name: 'مستلزمات حمّام',
    nameEn: 'Bath Essentials',
    keywords: ['حمام', 'استحمام', 'bath', 'bathing', 'shower']
  },
  {
    id: 'beauty_tools',
    name: 'أدوات تجميل',
    nameEn: 'Beauty Tools',
    keywords: ['أدوات', 'فرشاة', 'مشط', 'tools', 'brush', 'comb']
  },
  {
    id: 'nail_care',
    name: 'العناية بالأظافر',
    nameEn: 'Nail Care',
    keywords: ['أظافر', 'نايل', 'طلاء', 'nail', 'nails', 'polish']
  },
  {
    id: 'body_care',
    name: 'العناية بالجسم',
    nameEn: 'Body Care',
    keywords: ['جسم', 'العناية بالجسم', 'body', 'body care']
  }
];

export const formatPrice = (price) => {
  if (price === null || price === undefined) return '';
  const formatted = new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0
  }).format(price);

  // Replace regular spaces with non-breaking spaces, fix currency format
  return formatted
    .replace(/\s/g, '\u00A0')  // Replace spaces with non-breaking spaces
    .replace(/\.+/g, '')       // Remove all dots first
    .replace(/\u200F/g, '')    // Remove Right-to-Left marks if any
    .replace(/دع/g, 'د.ع');    // Add dot between د and ع
};

export const getDiscountedPrice = (price, discountPercent) => {
  if (price === null || price === undefined || discountPercent === null || discountPercent === undefined) return price;
  return price - (price * discountPercent / 100);
};
