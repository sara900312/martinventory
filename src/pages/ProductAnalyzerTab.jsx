import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useSupabase } from '@/contexts/SupabaseContext';
import { Upload, Loader, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { generateBarcode, sanitizeText } from '@/lib/utils';

const ProductAnalyzerTab = ({ onProductsAdded }) => {
  const { supabase } = useSupabase();
  const [selectedFile, setSelectedFile] = useState(null);
  const [productList, setProductList] = useState([]);
  const [analyzedProducts, setAnalyzedProducts] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [editingDescriptions, setEditingDescriptions] = useState({});

  // Handle TXT file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'text/plain') {
      toast({
        title: 'خطأ في نوع الملف',
        description: 'يرجى اختيار ملف نصي (TXT) فقط',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        toast({
          title: 'ملف فارغ',
          description: 'الملف لا يحتوي على أي منتجات',
          variant: 'destructive'
        });
        setSelectedFile(null);
        return;
      }

      setProductList(lines);
      setAnalyzedProducts([]);
      setEditingDescriptions({});
      toast({
        title: 'تم قراءة الملف بنجاح',
        description: `تم العثور على ${lines.length} منتج`
      });
    };

    reader.readAsText(file);
  };

  // Analyze products using Edge Function
  const handleAnalyzeProducts = async () => {
    if (productList.length === 0) {
      toast({
        title: 'قائمة فارغة',
        description: 'يرجى اختيار ملف يحتوي على أسماء المنتجات',
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch(
        'https://ykyzviqwscrjjkucorlp.supabase.co/functions/v1/analyze-products',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            products: productList
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'فشل في تحليل المنتجات');
      }

      if (!Array.isArray(result.data)) {
        throw new Error('صيغة الاستجابة غير صحيحة');
      }

      setAnalyzedProducts(result.data);
      setEditingDescriptions({});
      toast({
        title: '✅ تم التحليل بنجاح',
        description: `تم تحليل ${result.data.length} منتج`
      });
    } catch (error) {
      console.error('Error analyzing products:', error);
      toast({
        title: 'خطأ في التحليل',
        description: error.message || 'حدث خطأ أثناء تحليل المنتجات',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle editing descriptions
  const handleEditDescription = (index, newDescription) => {
    setEditingDescriptions(prev => ({
      ...prev,
      [index]: newDescription
    }));
  };

  // Insert analyzed products to database
  const handleInsertProducts = async () => {
    if (analyzedProducts.length === 0) {
      toast({
        title: 'لا توجد منتجات',
        description: 'يرجى تحليل المنتجات أولاً',
        variant: 'destructive'
      });
      return;
    }

    setIsInserting(true);
    try {
      const productsToInsert = [];

      for (const product of analyzedProducts) {
        const barcode = await generateBarcode(supabase);
        const name = sanitizeText(product.name, 160);
        const shortDescription = editingDescriptions[analyzedProducts.indexOf(product)] || 
          product.short_description || '';

        productsToInsert.push({
          name: name,
          short_description: sanitizeText(shortDescription, 200),
          description: '',
          price: 0,
          discounted_price: 0,
          stock: 0,
          category: 'uncategorized',
          published: false,
          barcode: barcode,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          main_image_url: '',
          image_1: '',
          image_2: '',
          image_3: ''
        });
      }

      const { error } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (error) throw error;

      toast({
        title: '✅ تم الإدراج بنجاح',
        description: `تم إضافة ${productsToInsert.length} منتج إلى قاعدة البيانات`
      });

      // Reset
      setProductList([]);
      setAnalyzedProducts([]);
      setSelectedFile(null);
      setEditingDescriptions({});
      
      // Call the callback to refresh products list
      if (onProductsAdded) {
        onProductsAdded();
      }
    } catch (error) {
      console.error('Error inserting products:', error);
      toast({
        title: 'خطأ في الإدراج',
        description: error.message || 'حدث خطأ أثناء إدراج المنتجات',
        variant: 'destructive'
      });
    } finally {
      setIsInserting(false);
    }
  };

  // Clear all data
  const handleClear = () => {
    setProductList([]);
    setAnalyzedProducts([]);
    setSelectedFile(null);
    setEditingDescriptions({});
  };

  return (
    <div className="space-y-6">
      {/* Step 1: File Upload */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          الخطوة 1: تحميل ملف TXT
        </h3>
        <div className="flex flex-col gap-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
            <input
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-gray-600">
                {selectedFile ? selectedFile.name : 'اضغط هنا أو اسحب ملف TXT'}
              </span>
              <span className="text-sm text-gray-500">
                كل سطر = اسم منتج واحد
              </span>
            </label>
          </div>
          {productList.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                ✓ تم قراءة <strong>{productList.length}</strong> منتج
              </p>
              <div className="mt-2 max-h-32 overflow-y-auto">
                <ul className="text-xs text-blue-800 space-y-1">
                  {productList.slice(0, 5).map((name, idx) => (
                    <li key={idx}>• {name}</li>
                  ))}
                  {productList.length > 5 && (
                    <li className="text-blue-600 font-semibold">
                      ... و {productList.length - 5} آخرين
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Analyze Products */}
      {productList.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Loader className="w-5 h-5 text-purple-600" />
            الخطوة 2: تحليل المنتجات
          </h3>
          <Button
            onClick={handleAnalyzeProducts}
            disabled={isAnalyzing}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isAnalyzing ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                جاري التحليل...
              </>
            ) : (
              <>
                <Loader className="w-4 h-4 mr-2" />
                تحليل المنتجات
              </>
            )}
          </Button>
        </div>
      )}

      {/* Step 3: Preview & Edit */}
      {analyzedProducts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            الخطوة 3: مراجعة والتعديل
          </h3>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-900">
                ✓ تم تحليل <strong>{analyzedProducts.length}</strong> منتج بنجاح
              </p>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <th className="text-right p-3 font-semibold text-gray-700">#</th>
                    <th className="text-right p-3 font-semibold text-gray-700">اسم المنتج</th>
                    <th className="text-right p-3 font-semibold text-gray-700">الوصف القصير (قابل للتعديل)</th>
                  </tr>
                </thead>
                <tbody>
                  {analyzedProducts.map((product, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="p-3 text-gray-600">{index + 1}</td>
                      <td className="p-3 font-medium text-gray-900">{product.name}</td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={
                            editingDescriptions[index] !== undefined
                              ? editingDescriptions[index]
                              : product.short_description || ''
                          }
                          onChange={(e) =>
                            handleEditDescription(index, e.target.value)
                          }
                          placeholder="أضف وصفاً قصيراً..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          maxLength="200"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {(
                            editingDescriptions[index] || product.short_description || ''
                          ).length}/200
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Insert to Database */}
      {analyzedProducts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">الخطوة 4: إدراج في قاعدة البيانات</h3>
          <p className="text-sm text-gray-600 mb-4">
            تحذير: سيتم إضافة المنتجات بقيم افتراضية (السعر والكمية والفئة = 0/uncategorized).
            يمكنك تعديلها لاحقاً من قائمة المنتجات.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleInsertProducts}
              disabled={isInserting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isInserting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  جاري الإدراج...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  إدراج المنتجات
                </>
              )}
            </Button>
            <Button
              onClick={handleClear}
              disabled={isInserting}
              variant="outline"
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              إلغاء
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {productList.length === 0 && analyzedProducts.length === 0 && (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">لم يتم تحميل أي ملفات</h3>
          <p className="text-gray-600">
            ابدأ بتحميل ملف TXT يحتوي على أسماء المنتجات (كل سطر = منتج واحد)
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductAnalyzerTab;
