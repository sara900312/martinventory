import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Package, Home, Grid3x3, FileText, Sparkles } from 'lucide-react';
import { useSupabase } from '@/contexts/SupabaseContext';

export const PopupTargetSelector = ({ value, onChange }) => {
  const { supabase } = useSupabase();
  const [targetType, setTargetType] = useState(value?.type || 'page');
  const [selectedTarget, setSelectedTarget] = useState(value?.target || null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // الصفحات والأزرار المتاحة
  const availablePages = [
    { id: 'home', name: 'الصفحة الرئيسية', icon: Home, path: '/' },
    { id: 'products', name: 'جميع المنتجات', icon: Grid3x3, path: '/products' },
    { id: 'recommendations', name: 'أداة التوصيات', icon: Sparkles, path: '/recommendations' },
    { id: 'about', name: 'من نحن', icon: FileText, path: '/about' },
    { id: 'contact', name: 'تواصل معنا', icon: FileText, path: '/contact' },
  ];

  const categoriesData = [
    { id: 'hair_care', name: 'العناية بالشعر' },
    { id: 'skincare', name: 'العناية بالبشرة' },
    { id: 'makeup', name: 'مكياج' },
    { id: 'perfumes', name: 'عطور' },
    { id: 'serums', name: 'سيرومات' },
    { id: 'masks', name: 'ماسكات' },
    { id: 'oils', name: 'زيوت' },
  ];

  useEffect(() => {
    setCategories(categoriesData);
  }, []);

  useEffect(() => {
    if (targetType === 'product' && supabase) {
      fetchProducts();
    }
  }, [targetType, supabase]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, main_image_url')
        .limit(100);

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      const isNetworkError = err?.message?.includes('Failed to fetch') ||
                             err?.message?.includes('NetworkError');

      if (isNetworkError) {
        console.debug('Network error - unable to fetch products for popup target selector');
      } else {
        console.error('Error fetching products:', err);
      }
      // Products will remain empty, selector will still work for pages and categories
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTarget = (target) => {
    // For products, use slug instead of ID for proper routing
    let actualTarget = target;
    if (targetType === 'product') {
      const selectedProduct = products.find(p => p.id === target);
      if (selectedProduct && selectedProduct.slug) {
        actualTarget = selectedProduct.slug;
      }
    }

    setSelectedTarget(target);
    onChange({
      type: targetType,
      target: actualTarget,
    });
  };

  const getFilteredOptions = () => {
    const searchLower = searchTerm.toLowerCase();

    switch (targetType) {
      case 'page':
        return availablePages.filter((page) =>
          page.name.toLowerCase().includes(searchLower)
        );
      case 'category':
        return categories.filter((cat) =>
          cat.name.toLowerCase().includes(searchLower)
        );
      case 'product':
        return products.filter((prod) =>
          prod.name.toLowerCase().includes(searchLower)
        );
      default:
        return [];
    }
  };


  const filteredOptions = getFilteredOptions();

  const getDisplayName = () => {
    if (!selectedTarget) return 'لم يتم الاختيار';

    switch (targetType) {
      case 'page':
        return availablePages.find((p) => p.id === selectedTarget)?.name || selectedTarget;
      case 'category':
        return categories.find((c) => c.id === selectedTarget)?.name || selectedTarget;
      case 'product':
        return products.find((p) => p.id === selectedTarget)?.name || selectedTarget;
      default:
        return selectedTarget;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            اختر الهدف
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* نوع الهدف */}
          <div className="space-y-2">
            <Label>نوع الهدف</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { value: 'page', label: 'صفحة' },
                { value: 'category', label: 'تصنيف' },
                { value: 'product', label: 'منتج' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setTargetType(option.value);
                    setSelectedTarget(null);
                    setSearchTerm('');
                  }}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                    targetType === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* اختيار الهدف */}
          <div className="space-y-2">
              <Label>الاختيار</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ابحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-input rounded-md text-sm"
                />
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="inline-block w-8 h-8 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                </div>
              ) : filteredOptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {filteredOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectTarget(option.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                        selectedTarget === option.id
                          ? 'border-primary bg-primary/5'
                          : 'border-input hover:border-primary/50'
                      }`}
                    >
                      {option.icon && (
                        <option.icon className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                      {option.main_image_url && (
                        <img
                          src={option.main_image_url}
                          alt={option.name}
                          className="h-10 w-10 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <span className="text-sm font-medium">{option.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد خيارات متاحة
                </div>
              )}
            </div>

          {/* الاختيار الحالي */}
          {selectedTarget && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">الهدف المختار:</p>
              <p className="font-medium text-primary">{getDisplayName()}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
