/**
 * Bilingual Search Dictionary
 * Maps Arabic cosmetic terms to English equivalents
 * Used for intelligent search expansion
 */

export const arabicKeywordDictionary = {
  // Hair Care
  'شامبو': ['shampoo', 'hair wash'],
  'بلسم': ['conditioner', 'hair conditioner'],
  'زيت الشعر': ['hair oil', 'oil'],
  'سيروم الشعر': ['hair serum'],
  'ماسك الشعر': ['hair mask', 'mask'],
  'علاج الشعر': ['hair treatment', 'treatment'],
  'مصفف الشعر': ['hair styling'],
  'واقي الحرارة': ['heat protectant'],
  'كريم الشعر': ['hair cream'],
  'جل الشعر': ['hair gel', 'gel'],

  // Skincare
  'عناية بالبشرة': ['skincare'],
  'كريم البشرة': ['face cream', 'cream'],
  'مرطب': ['moisturizer'],
  'مرطب للوجه': ['facial moisturizer'],
  'سيروم': ['serum'],
  'سيروم البشرة': ['face serum'],
  'ماسك': ['mask', 'face mask'],
  'ماسك الوجه': ['facial mask'],
  'تونر': ['toner'],
  'تونك': ['tonic'],
  'غسول': ['cleanser', 'facial cleanser'],
  'غسول الوجه': ['face wash', 'face cleanser'],
  'مقشر': ['scrub', 'exfoliator'],
  'مقشر للوجه': ['facial scrub'],
  'ديب كلينز': ['deep cleanse', 'deep cleanser'],
  'ناعم الملمس': ['smooth'],
  'مشرق': ['brightening'],
  'معطر': ['perfumed'],
  'معطر الجسم': ['body perfume'],
  'واقي الشمس': ['sunscreen', 'sun protection'],
  'صن سكرين': ['sunscreen'],
  'واقي': ['protectant'],
  'ضد التجاعيد': ['anti-wrinkle'],
  'مضاد الشيخوخة': ['anti-aging'],
  'أساس': ['foundation'],
  'كونسيلر': ['concealer'],
  'بودرة': ['powder'],
  'آي شادو': ['eye shadow'],
  'ظل العين': ['eye shadow'],
  'حمرة الخدود': ['blush', 'blusher'],
  'ملمع': ['highlighter', 'shiner'],
  'روج الشفاه': ['lipstick'],
  'أحمر الشفاه': ['lipstick', 'lip color'],
  'ملمع الشفاه': ['lip gloss'],
  'قلم الشفاه': ['lip liner'],
  'قلم الحواجب': ['eyebrow pencil'],
  'ماسكارا': ['mascara'],
  'أيلاينر': ['eyeliner'],
  'كحل': ['kohl', 'eyeliner'],

  // Body Care
  'عناية بالجسم': ['body care'],
  'جسم': ['body'],
  'سيروم الجسم': ['body serum'],
  'مرطب الجسم': ['body moisturizer'],
  'غسول الجسم': ['body wash'],
  'لوشن': ['lotion'],
  'لوشن الجسم': ['body lotion'],
  'كريم الجسم': ['body cream'],
  'زبدة الجسم': ['body butter'],
  'زيت الجسم': ['body oil'],
  'ملح الاستحمام': ['bath salt'],
  'حمام': ['bath'],
  'استحمام': ['bathing'],

  // Oils
  'زيت': ['oil'],
  'زيت الزيتون': ['olive oil'],
  'زيت جوز الهند': ['coconut oil'],
  'زيت اللوز': ['almond oil'],
  'زيت عطري': ['essential oil'],
  'زيت طبيعي': ['natural oil'],

  // Perfumes
  'عطر': ['perfume', 'fragrance'],
  'ماء الزهر': ['rose water', 'flower water'],
  'ماء الورد': ['rose water'],
  'رائحة': ['scent', 'fragrance'],
  'كولونيا': ['cologne'],
  'عطر خفيف': ['light fragrance'],

  // Tools
  'أدوات': ['tools'],
  'فرشاة': ['brush'],
  'فرشاة المكياج': ['makeup brush'],
  'مشط': ['comb'],
  'مصفف شعر': ['hair dryer', 'dryer'],
  'مكواة شعر': ['hair straightener'],
  'مجعد الشعر': ['hair curler'],

  // Nail Care
  'أظافر': ['nails', 'nail'],
  'طلاء الأظافر': ['nail polish'],
  'مزيل طلاء': ['nail remover'],
  'ملف الأظافر': ['nail file'],
  'قاعدة الأظافر': ['nail base'],

  // General Terms
  'مستحضرات': ['cosmetics', 'products'],
  'مستحضرات تجميل': ['cosmetics', 'beauty products'],
  'منتج': ['product'],
  'منتجات': ['products'],
  'عناية': ['care'],
  'تجميل': ['beauty', 'cosmetics'],
  'طبيعي': ['natural'],
  'عضوي': ['organic'],
  'خالي': ['free'],
  'آمن': ['safe'],
  'فعال': ['effective'],
  'سريع المفعول': ['fast-acting'],
};

/**
 * Brand Transliteration Mappings
 * Maps Arabic brand spellings to English brand names
 * DO NOT translate, only transliterate
 */
export const brandTransliterationMap = {
  'لوريال': 'Loreal',
  'لوريآل': 'Loreal',
  'ديفاج': 'Divage',
  'ديفاغ': 'Divage',
  'نيفيا': 'Nivea',
  'نيفيه': 'Nivea',
  'ميبيلين': 'Maybelline',
  'ماي بيللين': 'Maybelline',
  'كلينيك': 'Clinique',
  'كلينك': 'Clinique',
  'شنيل': 'Chanel',
  'شانيل': 'Chanel',
  'ديور': 'Dior',
  'ديوور': 'Dior',
  'غيرلان': 'Guerlain',
  'غيرلين': 'Guerlain',
  'لانكوم': 'Lancome',
  'لانكوم': 'Lancome',
  'إستيه لاودر': 'Estee Lauder',
  'إستي لودر': 'Estee Lauder',
  'كود': 'Caudalie',
  'كوديل': 'Caudalie',
  'يوسيرين': 'Eucerin',
  'يوسيرن': 'Eucerin',
  'لا روش بوساي': 'La Roche Posay',
  'لاروشبوساي': 'La Roche Posay',
  'سيتافيل': 'Cetaphil',
  'سيتافل': 'Cetaphil',
  'أفين': 'Avene',
  'افين': 'Avene',
  'كيليز': 'Keels',
  'كيلز': 'Keels',
  'آفين': 'Avene',
  'نار': 'NAR',
  'أوليه': 'Olay',
  'أولاي': 'Olay',
  'بودي شوب': 'Body Shop',
  'بديشوب': 'Body Shop',
  'بوبي براون': 'Bobbi Brown',
  'بوبي': 'Bobbi',
  'ماك': 'MAC',
  'ميك': 'MAC',
};

/**
 * Category Keywords Dictionary
 * Maps Arabic category terms to English categories
 */
export const categoryKeywordMap = {
  // Hair Care
  'شعر': ['hair_care', 'hair'],
  'شعر الرأس': ['hair_care'],
  'العناية بالشعر': ['hair_care'],
  'شامبو': ['hair_care'],
  'بلسم': ['hair_care'],

  // Skincare
  'بشرة': ['skincare', 'face'],
  'وجه': ['skincare', 'face'],
  'العناية بالبشرة': ['skincare'],
  'كريم': ['skincare'],
  'سيروم': ['skincare', 'serums'],
  'ماسك': ['skincare', 'masks'],

  // Makeup
  'مكياج': ['makeup'],
  'ماكياج': ['makeup'],
  'ميك اب': ['makeup'],
  'حمرة الخدود': ['makeup'],
  'أحمر الشفاه': ['makeup'],

  // Body Care
  'جسم': ['body_care', 'body'],
  'العناية بالجسم': ['body_care'],

  // Oils
  'زيت': ['oils'],
  'زيوت': ['oils'],

  // Perfumes
  'عطر': ['perfumes', 'fragrance'],
  'عطور': ['perfumes'],
  'رائحة': ['perfumes'],

  // Nail Care
  'أظافر': ['nail_care', 'nails'],

  // Bath
  'حمام': ['bath_essentials'],
  'استحمام': ['bath_essentials'],
};

/**
 * Reverse mapping: English terms to Arabic equivalents
 * Useful for suggesting Arabic versions when user searches in English
 */
export const englishToArabicMap = {
  'shampoo': ['شامبو'],
  'conditioner': ['بلسم'],
  'serum': ['سيروم'],
  'mask': ['ماسك'],
  'cream': ['كريم'],
  'moisturizer': ['مرطب'],
  'sunscreen': ['واقي الشمس'],
  'skincare': ['عناية بالبشرة'],
  'hair care': ['عناية بالشعر'],
  'makeup': ['مكياج'],
  'foundation': ['أساس'],
  'lipstick': ['أحمر الشفاه'],
  'mascara': ['ماسكارا'],
  'perfume': ['عطر'],
  'body care': ['عناية بالجسم'],
  'oil': ['زيت'],
};
