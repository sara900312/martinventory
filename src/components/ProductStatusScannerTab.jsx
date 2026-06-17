import React, { useState, useRef, useCallback } from 'react';
import { Upload, Search, Check, X, CheckSquare, Square, AlertCircle, Zap, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useSupabase } from '@/contexts/SupabaseContext';
import { categoriesData } from '@/data/products';

const ProductStatusScannerTab = () => {
  const { supabase } = useSupabase();
  const fileInputRef = useRef(null);

  const [scanResults, setScanResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedPublished, setSelectedPublished] = useState(new Set());
  const [selectedUnpublished, setSelectedUnpublished] = useState(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [scanMode, setScanMode] = useState('publish');
  const [validationResults, setValidationResults] = useState(null);
  const [selectedIncomplete, setSelectedIncomplete] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('');

  const parseFile = async (file) => {
    try {
      if (file.name.endsWith('.txt') || file.name.endsWith('.note') || file.type === 'text/plain') {
        const text = await file.text();
        return text
          .split(/[\n,]+/)
          .map(line => line.trim())
          .filter(line => line.length > 0);
      } else {
        throw new Error('Unsupported file format. Please use .txt or .note file');
      }
    } catch (error) {
      throw new Error(`Error parsing file: ${error.message}`);
    }
  };

  const getValidationIssues = (product) => {
    const issues = [];
    
    if (!product.description || product.description.trim() === '') {
      issues.push('وصف');
    }
    if (!product.main_image_url || product.main_image_url.trim() === '') {
      issues.push('صورة');
    }
    if (!product.category || product.category.trim() === '') {
      issues.push('فئة');
    }
    if (!product.subcategory_id || product.subcategory_id === null) {
      issues.push('نوع');
    }
    if (!product.price || product.price <= 0) {
      issues.push('سعر');
    }
    
    return issues;
  };

  const handleQuickValidationScan = useCallback(async () => {
    setIsScanning(true);
    setValidationResults(null);
    setSelectedIncomplete(new Set());

    try {
      const { data: allProducts, error } = await supabase
        .from('products')
        .select('id, name, published, description, main_image_url, category, subcategory_id, price, stock, barcode, main_store_name, image_1, image_2, image_3');

      if (error) throw error;

      // Filter by category if selected
      const filteredProducts = selectedCategory
        ? allProducts.filter(p => p.category === selectedCategory)
        : allProducts;

      const incompleteProducts = [];
      const completeProducts = [];

      filteredProducts.forEach(product => {
        const issues = getValidationIssues(product);
        if (issues.length > 0) {
          incompleteProducts.push({
            ...product,
            issues,
            issueCount: issues.length
          });
        } else {
          completeProducts.push(product);
        }
      });

      const sortedIncomplete = incompleteProducts.sort((a, b) => b.issueCount - a.issueCount);

      setValidationResults({
        incomplete: sortedIncomplete,
        complete: completeProducts,
        totalScanned: filteredProducts.length,
        scanDate: new Date(),
        category: selectedCategory || 'جميع الفئات',
        allProductsCount: allProducts.length,
      });

      const categoryName = selectedCategory ? categoriesData.find(c => c.id === selectedCategory)?.name : 'جميع الفئات';
      toast({
        title: 'تم المسح بنجاح',
        description: `تم فحص ${filteredProducts.length} منتج من ${categoryName} | ناقص: ${incompleteProducts.length} | مكتمل: ${completeProducts.length}`,
      });
    } catch (error) {
      console.error('Validation scan error:', error);
      toast({
        title: 'خطأ في المسح',
        description: error.message || 'حدث خطأ أثناء المسح',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  }, [supabase, selectedCategory]);

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanResults(null);
    setSelectedPublished(new Set());
    setSelectedUnpublished(new Set());

    try {
      const productNames = await parseFile(file);

      if (productNames.length === 0) {
        toast({
          title: 'خطأ',
          description: 'لم يتم العثور على أسماء منتجات في الملف',
          variant: 'destructive',
        });
        setIsScanning(false);
        return;
      }

      const { data: allProducts, error } = await supabase
        .from('products')
        .select('id, name, published');

      if (error) throw error;

      const published = [];
      const unpublished = [];
      const notFound = [];

      productNames.forEach(inputName => {
        const found = allProducts.find(p => p.name === inputName);
        if (found) {
          if (found.published) {
            published.push(found);
          } else {
            unpublished.push(found);
          }
        } else {
          notFound.push(inputName);
        }
      });

      setScanResults({
        published,
        unpublished,
        notFound,
        totalScanned: productNames.length,
        scanDate: new Date(),
      });

      toast({
        title: 'تم المسح بنجاح',
        description: `تم فحص ${productNames.length} منتج | منشور: ${published.length} | غير منشور: ${unpublished.length} | غير موجود: ${notFound.length}`,
      });
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: 'خطأ في المسح',
        description: error.message || 'حدث خطأ أثناء المسح',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [supabase]);

  const handleBatchPublish = async () => {
    if (selectedUnpublished.size === 0) {
      toast({
        title: 'تحذير',
        description: 'اختر منتجات لنشرها',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const productIds = Array.from(selectedUnpublished);
      const { error } = await supabase
        .from('products')
        .update({ published: true })
        .in('id', productIds);

      if (error) throw error;

      setScanResults(prev => ({
        ...prev,
        published: [
          ...prev.published,
          ...prev.unpublished.filter(p => productIds.includes(p.id))
        ],
        unpublished: prev.unpublished.filter(p => !productIds.includes(p.id))
      }));

      setSelectedUnpublished(new Set());

      toast({
        title: 'تم النشر بنجاح',
        description: `تم نشر ${productIds.length} منتج`,
      });
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: 'خطأ في النشر',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBatchUnpublish = async () => {
    if (selectedPublished.size === 0) {
      toast({
        title: 'تحذير',
        description: 'اختر منتجات لإلغاء نشرها',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const productIds = Array.from(selectedPublished);
      const { error } = await supabase
        .from('products')
        .update({ published: false })
        .in('id', productIds);

      if (error) throw error;

      setScanResults(prev => ({
        ...prev,
        unpublished: [
          ...prev.unpublished,
          ...prev.published.filter(p => productIds.includes(p.id))
        ],
        published: prev.published.filter(p => !productIds.includes(p.id))
      }));

      setSelectedPublished(new Set());

      toast({
        title: 'تم إلغاء النشر بنجاح',
        description: `تم إلغاء نشر ${productIds.length} منتج`,
      });
    } catch (error) {
      console.error('Unpublish error:', error);
      toast({
        title: 'خطأ في إلغاء النشر',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };



  const togglePublishedSelection = (productId) => {
    const newSelected = new Set(selectedPublished);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedPublished(newSelected);
  };

  const toggleUnpublishedSelection = (productId) => {
    const newSelected = new Set(selectedUnpublished);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedUnpublished(newSelected);
  };

  const toggleIncompleteSelection = (productId) => {
    const newSelected = new Set(selectedIncomplete);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedIncomplete(newSelected);
  };

  const toggleAllPublished = () => {
    if (selectedPublished.size === scanResults.published.length) {
      setSelectedPublished(new Set());
    } else {
      setSelectedPublished(new Set(scanResults.published.map(p => p.id)));
    }
  };

  const toggleAllUnpublished = () => {
    if (selectedUnpublished.size === scanResults.unpublished.length) {
      setSelectedUnpublished(new Set());
    } else {
      setSelectedUnpublished(new Set(scanResults.unpublished.map(p => p.id)));
    }
  };

  const toggleAllIncomplete = () => {
    if (selectedIncomplete.size === validationResults.incomplete.length) {
      setSelectedIncomplete(new Set());
    } else {
      setSelectedIncomplete(new Set(validationResults.incomplete.map(p => p.id)));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const event = { target: { files: [file] } };
      handleFileSelect(event);
    }
  };

  const handleDownloadProductNames = (productList) => {
    if (productList.length === 0) {
      toast({
        title: 'تحذير',
        description: 'لا توجد منتجات محددة للتحميل',
        variant: 'destructive',
      });
      return;
    }

    const names = productList.map(p => p.name).join('\n');
    const element = document.createElement('a');
    const file = new Blob([names], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `منتجات_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: 'تم التحميل بنجاح',
      description: `تم تحميل ${productList.length} اسم منتج`,
    });
  };

  const handleDownloadAsCSV = (productList, includeIssues = false) => {
    if (productList.length === 0) {
      toast({
        title: 'تحذير',
        description: 'لا توجد منتجات محددة للتحميل',
        variant: 'destructive',
      });
      return;
    }

    let csvContent = 'اسم المنتج,ID,الحالة,الفئة,السعر,الكمية,الباركود,المتجر';
    if (includeIssues) {
      csvContent += ',الحقول الناقصة';
    }
    csvContent += '\n';

    productList.forEach(product => {
      const status = product.published ? 'منشور' : 'غير منشور';
      const category = product.category || 'بدون فئة';
      const price = product.price || '0';
      const stock = product.stock || '0';
      const barcode = product.barcode || '';
      const mainStoreName = product.main_store_name || '';

      let row = `"${product.name}","${product.id}","${status}","${category}","${price}","${stock}","${barcode}","${mainStoreName}"`;
      if (includeIssues && product.issues) {
        row += `,"${product.issues.join(', ')}"`;
      }
      csvContent += row + '\n';
    });

    const element = document.createElement('a');
    const file = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    const categoryName = selectedCategory
      ? categoriesData.find(c => c.id === selectedCategory)?.name?.replace(/\s+/g, '_')
      : 'جميع';
    element.download = `تحليل_${categoryName}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: 'تم التحميل بنجاح',
      description: `تم تحميل ${productList.length} منتج بصيغة CSV`,
    });
  };

  const handleDownloadAsJSON = (productList, includeIssues = false) => {
    if (productList.length === 0) {
      toast({
        title: 'تحذير',
        description: 'لا توجد منتجات محددة للتحميل',
        variant: 'destructive',
      });
      return;
    }

    const dataToExport = productList.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category || 'بدون فئة',
      status: product.published ? 'منشور' : 'غير منشور',
      price: product.price || 0,
      stock: product.stock || 0,
      barcode: product.barcode || '',
      mainStoreName: product.main_store_name || '',
      hasImage: !!product.main_image_url,
      hasDescription: !!product.description,
      ...(includeIssues && product.issues && { missingFields: product.issues })
    }));

    const jsonData = {
      exportDate: new Date().toISOString(),
      category: selectedCategory ? categoriesData.find(c => c.id === selectedCategory)?.name : 'جميع الفئات',
      totalProducts: productList.length,
      products: dataToExport
    };

    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    const categoryName = selectedCategory
      ? categoriesData.find(c => c.id === selectedCategory)?.name?.replace(/\s+/g, '_')
      : 'جميع';
    element.download = `تحليل_${categoryName}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: 'تم التحميل بنجاح',
      description: `تم تحميل ${productList.length} منتج بصيغة JSON`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => {
            setScanMode('publish');
            setScanResults(null);
            setValidationResults(null);
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
            scanMode === 'publish'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Upload className="w-4 h-4" />
          مسح الحالة (برفع ملف)
        </button>
        <button
          onClick={() => {
            setScanMode('validation');
            setScanResults(null);
            setValidationResults(null);
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
            scanMode === 'validation'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Zap className="w-4 h-4" />
          فحص الاكتمال (بضغط زر)
        </button>
      </div>

      {/* Publish/Unpublish Mode */}
      {scanMode === 'publish' && !scanResults && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-8">
          <div className="flex items-start gap-4">
            <Search className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">ماسح حالة المنتجات</h2>
              <p className="text-gray-700 mb-6">
                قم برفع ملف نصي يحتوي على أسماء المنتجات (اسم واحد في كل سطر أو مفصول بفواصل). سيقوم النظام بالمقارنة مع قاعدة البيانات وإظهار حالة كل منتج.
              </p>

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-white hover:bg-blue-50 transition cursor-pointer mb-4"
              >
                <Upload className="w-12 h-12 text-blue-500 mx-auto mb-3 opacity-60" />
                <p className="text-lg font-semibold text-gray-900 mb-1">
                  اسحب وأفلت الملف هنا أو انقر لتحديد
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  الصيغ المدعومة: نصي (.txt، .note)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.note,text/plain"
                  onChange={handleFileSelect}
                  disabled={isScanning}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6"
                >
                  {isScanning ? 'جاري المسح...' : 'اختر الملف'}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-semibold">✓ منشور</p>
                  <p className="text-2xl font-bold text-green-600">0</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 font-semibold">⚠ غير منشور</p>
                  <p className="text-2xl font-bold text-yellow-600">0</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 font-semibold">✗ غير موجود</p>
                  <p className="text-2xl font-bold text-red-600">0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish/Unpublish Results */}
      {scanMode === 'publish' && scanResults && (
        <>
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div>
              <h3 className="font-semibold text-blue-900">آخر مسح: {scanResults.scanDate.toLocaleString('ar-SA')}</h3>
              <p className="text-sm text-blue-700">تم فحص {scanResults.totalScanned} منتج</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setScanResults(null)}
                variant="outline"
                className="px-6"
              >
                مسح جديد
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 font-semibold">✓ منشور</p>
              <p className="text-2xl font-bold text-green-600">{scanResults.published.length}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-semibold">⚠ غير منشور</p>
              <p className="text-2xl font-bold text-yellow-600">{scanResults.unpublished.length}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-semibold">✗ غير موجود</p>
              <p className="text-2xl font-bold text-red-600">{scanResults.notFound.length}</p>
            </div>
          </div>

          {scanResults.published.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-green-50 border-b border-green-200 p-4 flex items-center justify-between">
                <h3 className="font-semibold text-green-900">المنتجات المنشورة ({scanResults.published.length})</h3>
                <button
                  onClick={toggleAllPublished}
                  className="flex items-center gap-2 text-sm text-green-700 hover:text-green-900"
                >
                  {selectedPublished.size === scanResults.published.length ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  {selectedPublished.size > 0 ? `تم تحديد ${selectedPublished.size}` : 'تحديد الكل'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-right p-3 w-10">
                        <input
                          type="checkbox"
                          checked={selectedPublished.size === scanResults.published.length}
                          onChange={toggleAllPublished}
                          className="cursor-pointer"
                        />
                      </th>
                      <th className="text-right p-3">ID</th>
                      <th className="text-right p-3">اسم المنتج</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResults.published.map((product, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedPublished.has(product.id)}
                            onChange={() => togglePublishedSelection(product.id)}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-sm text-gray-600">{product.id}</td>
                        <td className="p-3 font-medium">{product.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedPublished.size > 0 && (
                <div className="bg-green-50 p-4 flex justify-end">
                  <Button
                    onClick={handleBatchUnpublish}
                    disabled={isUpdating}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isUpdating ? 'جاري المعالجة...' : `إلغاء نشر ${selectedPublished.size} منتج`}
                  </Button>
                </div>
              )}
            </div>
          )}

          {scanResults.unpublished.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-yellow-50 border-b border-yellow-200 p-4 flex items-center justify-between">
                <h3 className="font-semibold text-yellow-900">المنتجات غير المنشورة ({scanResults.unpublished.length})</h3>
                <button
                  onClick={toggleAllUnpublished}
                  className="flex items-center gap-2 text-sm text-yellow-700 hover:text-yellow-900"
                >
                  {selectedUnpublished.size === scanResults.unpublished.length ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  {selectedUnpublished.size > 0 ? `تم تحديد ${selectedUnpublished.size}` : 'تحديد الكل'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-right p-3 w-10">
                        <input
                          type="checkbox"
                          checked={selectedUnpublished.size === scanResults.unpublished.length}
                          onChange={toggleAllUnpublished}
                          className="cursor-pointer"
                        />
                      </th>
                      <th className="text-right p-3">ID</th>
                      <th className="text-right p-3">اسم المنتج</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResults.unpublished.map((product, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedUnpublished.has(product.id)}
                            onChange={() => toggleUnpublishedSelection(product.id)}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-sm text-gray-600">{product.id}</td>
                        <td className="p-3 font-medium">{product.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedUnpublished.size > 0 && (
                <div className="bg-yellow-50 p-4 flex justify-end">
                  <Button
                    onClick={handleBatchPublish}
                    disabled={isUpdating}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {isUpdating ? 'جاري المعالجة...' : `نشر ${selectedUnpublished.size} منتج`}
                  </Button>
                </div>
              )}
            </div>
          )}

          {scanResults.notFound.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-red-50 border-b border-red-200 p-4">
                <h3 className="font-semibold text-red-900">المنتجات غير الموجودة ({scanResults.notFound.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-right p-3">اسم المنتج</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResults.notFound.map((name, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 font-medium">{name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Validation Mode - No Results */}
      {scanMode === 'validation' && !validationResults && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-purple-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">فحص اكتمال المنتجات</h2>
              <p className="text-gray-700 mb-6">
                قم بفحص جميع المنتجات المنشورة وغير المنشورة للتحقق من اكتمال البيانات المطلوبة:
                الوصف والصورة والفئة والنوع والسعر الأساسي.
              </p>

              <div className="bg-white border border-purple-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">اختر الفئة (اختياري):</h3>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                >
                  <option value="">جميع الفئات</option>
                  {categoriesData.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-sm text-gray-600 mb-4">
                  اختر فئة معينة لتحليل منتجاتها فقط، أو اترك الخيار على "جميع الفئات" لفحص جميع المنتجات
                </p>
              </div>

              <div className="bg-white border border-purple-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">الحقول المفحوصة:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>الوصف (description)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>الصورة الرئيسية (main_image_url)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>الفئة (category)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>النوع/الفئة الفرعية (subcategory_id)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>السعر الأساسي (price)</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleQuickValidationScan}
                disabled={isScanning}
                className="bg-purple-500 hover:bg-purple-600 text-white px-8 w-full"
              >
                {isScanning ? 'جاري الفحص...' : 'ابدأ فحص المنتجات'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Mode - Results */}
      {scanMode === 'validation' && validationResults && (
        <>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-4 gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900">آخر فحص: {validationResults.scanDate.toLocaleString('ar-SA')}</h3>
              <p className="text-sm text-purple-700">
                الفئة: <span className="font-semibold">{validationResults.category}</span>
              </p>
              <p className="text-sm text-purple-700">
                تم فحص {validationResults.totalScanned} منتج {validationResults.allProductsCount && validationResults.totalScanned !== validationResults.allProductsCount ? `من إجمالي ${validationResults.allProductsCount} منتج` : ''}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => {
                  setValidationResults(null);
                  setSelectedCategory('');
                }}
                variant="outline"
                className="px-6"
              >
                فحص جديد
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 font-semibold">✓ مكتمل</p>
              <p className="text-2xl font-bold text-green-600">{validationResults.complete.length}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-semibold">✗ ناقص</p>
              <p className="text-2xl font-bold text-red-600">{validationResults.incomplete.length}</p>
            </div>
          </div>

          {validationResults.incomplete.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-red-50 border-b border-red-200 p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <h3 className="font-semibold text-red-900">المنتجات الناقصة ({validationResults.incomplete.length})</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={toggleAllIncomplete}
                    className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900"
                  >
                    {selectedIncomplete.size === validationResults.incomplete.length ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    {selectedIncomplete.size > 0 ? `تم تحديد ${selectedIncomplete.size}` : 'تحديد الكل'}
                  </button>
                  {selectedIncomplete.size > 0 && (
                    <>
                      <Button
                        onClick={() => {
                          const selectedProducts = validationResults.incomplete.filter(p => selectedIncomplete.has(p.id));
                          handleDownloadProductNames(selectedProducts);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        نصي ({selectedIncomplete.size})
                      </Button>
                      <Button
                        onClick={() => {
                          const selectedProducts = validationResults.incomplete.filter(p => selectedIncomplete.has(p.id));
                          handleDownloadAsCSV(selectedProducts, true);
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        CSV ({selectedIncomplete.size})
                      </Button>
                      <Button
                        onClick={() => {
                          const selectedProducts = validationResults.incomplete.filter(p => selectedIncomplete.has(p.id));
                          handleDownloadAsJSON(selectedProducts, true);
                        }}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        JSON ({selectedIncomplete.size})
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <th className="text-right p-3 w-10">
                        <input
                          type="checkbox"
                          checked={selectedIncomplete.size === validationResults.incomplete.length}
                          onChange={toggleAllIncomplete}
                          className="cursor-pointer"
                        />
                      </th>
                      <th className="text-right p-3">ID</th>
                      <th className="text-right p-3">اسم المنتج</th>
                      <th className="text-right p-3">الحالة</th>
                      <th className="text-right p-3">الحقول الناقصة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResults.incomplete.map((product, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIncomplete.has(product.id)}
                            onChange={() => toggleIncompleteSelection(product.id)}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-sm text-gray-600">{product.id}</td>
                        <td className="p-3 font-medium">{product.name}</td>
                        <td className="p-3 text-sm">
                          <span className={`px-2 py-1 rounded-full ${product.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {product.published ? '✓ منشور' : '⊗ غير منشور'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {product.issues.map((issue, i) => (
                              <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                {issue}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {validationResults.complete.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-green-50 border-b border-green-200 p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <h3 className="font-semibold text-green-900">المنتجات المكتملة ({validationResults.complete.length})</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={() => handleDownloadProductNames(validationResults.complete)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    نصي ({validationResults.complete.length})
                  </Button>
                  <Button
                    onClick={() => handleDownloadAsCSV(validationResults.complete)}
                    className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    CSV ({validationResults.complete.length})
                  </Button>
                  <Button
                    onClick={() => handleDownloadAsJSON(validationResults.complete)}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    JSON ({validationResults.complete.length})
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[40vh]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <th className="text-right p-3">ID</th>
                      <th className="text-right p-3">اسم المنتج</th>
                      <th className="text-right p-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResults.complete.map((product, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 text-sm text-gray-600">{product.id}</td>
                        <td className="p-3 font-medium">{product.name}</td>
                        <td className="p-3 text-sm">
                          <span className={`px-2 py-1 rounded-full ${product.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {product.published ? '✓ منشور' : '⊗ غير منشور'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductStatusScannerTab;
