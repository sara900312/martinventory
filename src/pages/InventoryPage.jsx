import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { categoriesData } from '@/data/products';
import { generateBarcode, sanitizeText, sanitizeUrl, safeNumber, generateUniqueProductSlug, matchesNormalizedSearch } from '@/lib/utils';
import { VALID_ROUTINE_TYPES, ARABIC_TO_DB_MAP, ROUTINE_SELECTION_MAP, getRoutineSelection, isValidRoutineSelection } from '@/lib/routineTypeConstants';
import { Edit, Trash2, LogOut, Sparkles, Upload, TestTube, TrendingUp, Database, Search, Gift, DollarSign, Zap, CheckCircle2, Settings, ChevronDown, Wrench } from 'lucide-react';
import { testGeminiEdgeFunction } from '@/lib/testEdgeFunction';
import { fetchSubcategoriesByCategory } from '@/lib/subcategoryService';
import { moveSessionFilesToPopup } from '@/components/popup/MediaManager';
import ProductMediaManager from '@/components/ProductMediaManager';
import ProductAnalyzerTab from './ProductAnalyzerTab';
import BulkImageUploadTab from '@/components/BulkImageUploadTab';
import ProductStatusScannerTab from '@/components/ProductStatusScannerTab';
import InventoryPopupTab from '@/components/InventoryPopupTab';
import ProductSkinRoutineSettings from '@/components/ProductSkinRoutineSettings';
import ProductSkinRoutineDisplay from '@/components/ProductSkinRoutineDisplay';
import ProductSeasonsSettings from '@/components/ProductSeasonsSettings';
import useMaintenanceStatus from '@/hooks/useMaintenanceStatus';
import MaintenanceAlert from '@/components/MaintenanceAlert';

const InventoryPage = () => {
    const navigate = useNavigate();
    const { supabase } = useSupabase();
    const { userRole, signOut, loading: authLoading } = useAuth();

    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef(null);

    const getInitialFormData = () => ({
        name: '',
        description: '',
        price: '',
        discounted_price: '',
        stock: '',
        category: '',
        subcategory_id: '',
        published: false,
        main_image_url: '',
        image_1: '',
        image_2: '',
        image_3: '',
        main_store_name: '',
        skin_problems: [],
        routine_type: '',
        routine_type_secondary: null,
        short_description: '',
        short_description_en: '',
        seasons: [],
    });

    const [formData, setFormData] = useState(getInitialFormData());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [subcategories, setSubcategories] = useState([]);
    const [loadingSubcategories, setLoadingSubcategories] = useState(false);
    const [storeOptions, setStoreOptions] = useState([]);
    const [loadingStores, setLoadingStores] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterPublished, setFilterPublished] = useState('');
    const [newProductMedia, setNewProductMedia] = useState([]);
    const [productSessionId] = useState(() => `product_session_${Date.now()}`);

    const fetchStores = useCallback(async () => {
        setLoadingStores(true);
        try {
            const { data, error } = await supabase.from('stores').select('name').order('name', { ascending: true });
            if (error) throw error;
            const names = data.map(store => store.name).filter(Boolean);
            setStoreOptions(names);
        } catch (error) {
            const isNetworkError = error?.message?.includes('Failed to fetch') ||
                                   error?.message?.includes('NetworkError');

            if (isNetworkError) {
                console.debug('Network error - unable to fetch stores');
            } else {
                console.error('Error fetching stores:', error);
                toast({ title: "خطأ في تحميل المتاجر", description: error.message, variant: "destructive" });
            }
        } finally {
            setLoadingStores(false);
        }
    }, [supabase]);

    const canPublish = userRole === 'admin';
    const canUseFeature = userRole === 'admin' || userRole === 'store_owner';

    // Filter products based on search, category, and published status
    const getFilteredProducts = useMemo(() => {
        return (published) => {
            const search = (searchQuery ?? '').toLowerCase();
            return products.filter(p => {
                // Apply published status filter
                if (published !== undefined && p.published !== published) return false;

                // Apply category filter
                if (filterCategory && p.category !== filterCategory) return false;

                // Apply search filter
                const searchMatches = [p?.name, p?.barcode, p?.category, p?.slug]
                    .map(v => (v ?? '').toString().toLowerCase())
                    .some(v => v.includes(search));

                return searchMatches;
            });
        };
    }, [products, searchQuery, filterCategory]);

    const fetchProducts = useCallback(async () => {
        setLoadingProducts(true);
        try {
            const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setProducts(data);
        } catch (error) {
            const isNetworkError = error?.message?.includes('Failed to fetch') ||
                                   error?.message?.includes('NetworkError');

            if (isNetworkError) {
                console.debug('Network error - unable to fetch products');
            } else {
                console.error('Error fetching products:', error);
                toast({ title: "Error fetching products", description: error.message, variant: "destructive" });
            }
        } finally {
            setLoadingProducts(false);
        }
    }, [supabase]);

    useEffect(() => {
        if (authLoading) return;
        if (!canUseFeature) {
            toast({ title: "Access denied", description: "You don't have permission to view this page.", variant: "destructive" });
            navigate('/');
            return;
        }
        fetchProducts();
        fetchStores();
    }, [fetchProducts, fetchStores, canUseFeature, navigate, authLoading]);

    // Close settings dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                setShowSettings(false);
            }
        };

        if (showSettings) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showSettings]);

    useEffect(() => {
        const loadSubcategories = async () => {
            setSubcategories([]);

            if (formData.category && formData.category !== '') {
                setLoadingSubcategories(true);
                try {
                    const data = await fetchSubcategoriesByCategory(supabase, formData.category);
                    setSubcategories(data);
                } catch (error) {
                    console.error('Error loading subcategories:', error);
                    toast({ title: "خطأ في تحميل الأنواع", description: error.message, variant: "destructive" });
                } finally {
                    setLoadingSubcategories(false);
                }
            } else {
                // فقط امسح الفئة الفرعية إذا تم مسح الفئة الرئيسية
                setFormData(prev => ({ ...prev, subcategory_id: '' }));
            }
        };

        loadSubcategories();
    }, [formData.category, supabase]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleFormDataChange = (updates) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleGenerateWithAI = async () => {
        if (!aiPrompt) {
            toast({ title: "Please enter a product description.", variant: "destructive" });
            return;
        }
        setIsGenerating(true);
        try {
            const { data: aiResponse, error: edgeError } = await supabase.functions.invoke('ai-add-product', {
                body: {
                    action: 'generateCompleteProduct',
                    description: aiPrompt
                }
            });

            if (edgeError) {
                throw new Error(edgeError.message || 'خطأ في خدمة الذكاء الاصطناعي');
            }

            if (!aiResponse.success) {
                throw new Error(aiResponse.error || 'فشل في توليد المنتج');
            }

            const aiData = aiResponse.data;

            if (!aiData || !aiData.name || !aiData.price || !aiData.stock) {
                throw new Error("البيانات المولدة غير مكتملة");
            }

            const barcode = await generateBarcode(supabase);

            const nameClean = sanitizeText(aiData.name, 160);
            const stockValueAI = Math.floor(safeNumber(aiData.stock || 1, { min: 0 }));
            const uniqueSlug = await generateUniqueProductSlug(nameClean, supabase);
            const newProduct = {
                name: nameClean,
                description: sanitizeText(aiData.description || `منتج عالي الجودة - ${nameClean}`, 5000),
                price: safeNumber(aiData.price, { min: 0 }),
                discounted_price: safeNumber(aiData.discounted_price || 0, { min: 0 }),
                stock: stockValueAI,
                barcode: barcode,
                category: sanitizeText(aiData.category || 'uncategorized', 64),
                subcategory_id: null,
                published: false,
                slug: uniqueSlug,
                main_image_url: '',
                image_1: '',
                image_2: '',
                image_3: '',
                is_featured: stockValueAI >= 1 && stockValueAI <= 5,
                specifications: sanitizeText(aiData.specifications || '', 5000)
            };

            const { error: insertError } = await supabase.from('products').insert([newProduct]);
            if (insertError) throw insertError;

            toast({
                title: "✅ تم إضافة المنتج بنجاح",
                description: `تم إنشاء المنتج "${aiData.name}" بواسطة الذكاء الاصطناعي`
            });
            setAiPrompt('');
            await fetchProducts();
        } catch (error) {
            console.error('AI Product Generation Error:', error?.message || error);
            toast({
                title: "خطأ في توليد المنتج",
                description: error.message || 'حدث خطأ غير متوقع',
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name || '',
            description: product.description || '',
            price: product.price || '',
            discounted_price: product.discounted_price || '',
            stock: product.stock || '',
            category: product.category || '',
            subcategory_id: product.subcategory_id || '',
            published: product.published || false,
            main_image_url: product.main_image_url || '',
            image_1: product.image_1 || '',
            image_2: product.image_2 || '',
            image_3: product.image_3 || '',
            main_store_name: product.main_store_name || '',
            skin_problems: product.skin_problems || [],
            routine_type: product.routine_type || '',
            routine_type_secondary: product.routine_type_secondary || null,
            short_description: product.short_description || '',
            short_description_en: product.short_description_en || '',
            seasons: product.seasons || [],
        });
    };

    const handleDelete = async (productId) => {
        if (!window.confirm('هل أنت متأكد أنك تريد حذف هذا المنتج؟')) return;
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) {
            toast({ title: "خطأ في الحذف", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "تم حذف المنتج بنجاح" });
            await fetchProducts();
        }
    };

    const handleCancelEdit = () => {
        setEditingProduct(null);
        setFormData(getInitialFormData());
        setNewProductMedia([]);
    };

    const handleSubmitManual = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const barcode = editingProduct ? editingProduct.barcode : await generateBarcode(supabase);

            const nameClean = sanitizeText(formData.name, 160);
            const stockValue = Math.floor(safeNumber(formData.stock, { min: 0 }));
            const uniqueSlug = await generateUniqueProductSlug(nameClean, supabase, editingProduct?.id);

            // Convert routine selection from Arabic UI to database values
            // User selects: صباحي, ليلي, كليهما, خاص
            // Maps to: routine_type and routine_type_secondary
            // Note: Perfumes and other non-routine categories get null values

            const routineTypeSupportedCategories = ['skincare', 'hair_care'];
            const shouldProcessRoutineType = routineTypeSupportedCategories.includes((formData.category || '').toLowerCase());

            let routineType = '';
            let routineTypeSecondary = null;

            if (shouldProcessRoutineType && formData.routine_type) {
                const userSelection = formData.routine_type.trim();
                try {
                    const routineData = getRoutineSelection(userSelection);
                    routineType = routineData.routine_type;
                    routineTypeSecondary = routineData.routine_type_secondary;
                } catch (error) {
                    throw new Error(`Invalid routine selection: "${userSelection}". Must be one of: صباحي, ليلي, كليهما, خاص`);
                }
            }

            // Strict validation only for categories that support routine type
            if (shouldProcessRoutineType && !isValidRoutineSelection(routineType, routineTypeSecondary)) {
                throw new Error(`Invalid routine_type values for database: routine_type="${routineType}", routine_type_secondary="${routineTypeSecondary}"`);
            }

            // For perfumes and non-routine categories, set routine fields to null
            if (!shouldProcessRoutineType) {
                routineType = null;
                routineTypeSecondary = null;
            }

            // Validate and filter seasons - only allow valid values
            const validSeasons = ['summer', 'winter', 'autumn', 'spring'];
            const seasons = (formData.seasons || []).filter(s => validSeasons.includes(s));

            const baseData = {
                name: nameClean,
                description: sanitizeText(formData.description, 5000),
                price: safeNumber(formData.price, { min: 0 }),
                discounted_price: safeNumber(formData.discounted_price || 0, { min: 0 }),
                stock: stockValue,
                category: sanitizeText(formData.category || 'uncategorized', 64),
                subcategory_id: formData.subcategory_id || null,
                published: canPublish ? !!formData.published : false,
                barcode,
                slug: uniqueSlug,
                main_store_name: sanitizeText(formData.main_store_name, 160),
                is_featured: stockValue >= 1 && stockValue <= 5,
                skin_problems: formData.skin_problems || [],
                routine_type: routineType,
                routine_type_secondary: routineTypeSecondary,
                short_description: sanitizeText(formData.short_description, 200),
                short_description_en: sanitizeText(formData.short_description_en, 200),
                seasons: seasons,
            };

            const sanitizedData = {
                ...baseData,
                main_image_url: sanitizeUrl(formData.main_image_url),
                image_1: sanitizeUrl(formData.image_1),
                image_2: sanitizeUrl(formData.image_2),
                image_3: sanitizeUrl(formData.image_3),
            };

            let productId;
            let error;

            if (editingProduct) {
                delete sanitizedData.barcode;
                ({ error } = await supabase.from('products').update(sanitizedData).eq('id', editingProduct.id));
                productId = editingProduct.id;
            } else {
                const { data, error: insertError } = await supabase.from('products').insert([sanitizedData]).select('id');
                error = insertError;
                if (data && data.length > 0) {
                    productId = data[0].id;
                }
            }

            if (error) throw error;

            // Handle image uploads for new products using MediaManager
            if (!editingProduct && productId && newProductMedia.length > 0) {
                try {
                    // Move media from session folder to product folder
                    const movedMedia = await moveSessionFilesToPopup(productSessionId, productId, newProductMedia, 'product');

                    // Extract URLs from moved media
                    const imageUpdateData = {};

                    movedMedia.forEach((media, index) => {
                        if (index === 0) {
                            imageUpdateData.main_image_url = media.url;
                        } else if (index < 4) {
                            imageUpdateData[`image_${index}`] = media.url;
                        }
                    });

                    if (Object.keys(imageUpdateData).length > 0) {
                        const { error: updateError } = await supabase.from('products').update(imageUpdateData).eq('id', productId);
                        if (updateError) throw updateError;
                    }
                } catch (uploadError) {
                    console.error('Error updating product images:', uploadError);
                    toast({ title: "تحذير", description: "تم إضافة المنتج لكن حدث خطأ في ربط الصور", variant: "destructive" });
                }
            }

            toast({ title: editingProduct ? "تم تحديث المنتج بنجاح!" : "تمت إضافة المنتج بنجاح!" });
            handleCancelEdit();
            await fetchProducts();
        } catch (error) {
            toast({ title: "خطأ في العملية", description: error.message, variant: "destructive"});
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleLogout = async () => {
        await signOut();
        toast({ title: "تم تسجيل الخروج بنجاح" });
        navigate('/');
    };

    const handleTestEdgeFunction = async () => {
        try {
            toast({ title: "جاري اختبار Edge Function..." });
            const result = await testGeminiEdgeFunction();

            if (result.success) {
                toast({
                    title: "✅ Edge Function يعمل بنجاح",
                    description: "تم اختبار الاتصال بنجاح"
                });
                console.log('نتيجة الاختبار:', result.data);
            } else {
                toast({
                    title: "❌ فشل في اختبار Edge Function",
                    description: result.error,
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "خطأ في الاختبار",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleImageUrlChange = (imageKey, url) => {
        const fieldMap = {
            main: 'main_image_url',
            image_1: 'image_1',
            image_2: 'image_2',
            image_3: 'image_3',
        };

        const fieldName = fieldMap[imageKey];
        setFormData(prev => ({
            ...prev,
            [fieldName]: url || '',
        }));
    };

    return (
        <div className="inventory-main-container">
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    <h1 className="inventory-page-header text-4xl">لوحة تحكم المخزن</h1>
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Store Settings Dropdown */}
                        <div className="relative" ref={settingsRef}>
                            <Button
                                onClick={() => setShowSettings(!showSettings)}
                                className="inventory-button-secondary flex items-center gap-2"
                            >
                                <Settings className="w-4 h-4" />
                                إعدادات المخزن
                                <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
                            </Button>

                            {/* Dropdown Menu */}
                            {showSettings && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <button
                                        onClick={() => {
                                            navigate('/coupons');
                                            setShowSettings(false);
                                        }}
                                        className="w-full text-right px-4 py-3 hover:bg-gray-100 flex items-center gap-2 text-gray-700 border-b border-gray-100 transition"
                                    >
                                        <Gift className="w-4 h-4" />
                                        إدارة الخصومات
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('/earnings');
                                            setShowSettings(false);
                                        }}
                                        className="w-full text-right px-4 py-3 hover:bg-gray-100 flex items-center gap-2 text-gray-700 border-b border-gray-100 transition"
                                    >
                                        <DollarSign className="w-4 h-4" />
                                        حسابات الأرباح
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('/analytics');
                                            setShowSettings(false);
                                        }}
                                        className="w-full text-right px-4 py-3 hover:bg-gray-100 flex items-center gap-2 text-gray-700 border-b border-gray-100 transition"
                                    >
                                        <TrendingUp className="w-4 h-4" />
                                        التحليلات
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('/order-status-management');
                                            setShowSettings(false);
                                        }}
                                        className="w-full text-right px-4 py-3 hover:bg-gray-100 flex items-center gap-2 text-gray-700 border-b border-gray-100 transition"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        إدارة حالات الطلبات
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleTestEdgeFunction();
                                            setShowSettings(false);
                                        }}
                                        className="w-full text-right px-4 py-3 hover:bg-gray-100 flex items-center gap-2 text-gray-700 border-b border-gray-100 transition"
                                    >
                                        <TestTube className="w-4 h-4" />
                                        اختبار AI
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('/maintenance-management');
                                            setShowSettings(false);
                                        }}
                                        className="w-full text-right px-4 py-3 hover:bg-gray-100 flex items-center gap-2 text-gray-700 border-b border-gray-100 transition"
                                    >
                                        <Wrench className="w-4 h-4" />
                                        إدارة الصيانة
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('/news-updates');
                                            setShowSettings(false);
                                        }}
                                        className="w-full text-right px-4 py-3 hover:bg-gray-100 flex items-center gap-2 text-gray-700 transition"
                                    >
                                        <span className="text-lg">📰</span>
                                        مدير الأخبار والتحديثات
                                    </button>
                                </div>
                            )}
                        </div>

                        <Button onClick={handleLogout} variant="destructive" className="inventory-button-primary"><LogOut className="w-4 h-4 mr-2" />تسجيل الخروج</Button>
                    </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                    <div className="md:col-span-1 flex flex-col gap-6">
                        {canUseFeature && (
                            <div className="inventory-side-section">
                                <h2 className="inventory-section-title flex items-center gap-2 mb-5"><Sparkles className="w-5 h-5" />إضافة سريعة بالذكاء الاصطناعي</h2>
                                <div className="flex flex-col gap-4">
                                    <div className="inventory-form-group">
                                        <label htmlFor="ai-prompt" className="inventory-form-label">اسم المنتج أو وصف مختصر</label>
                                        <textarea id="ai-prompt" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="مثال: سماعات بلوتوث مع خاصية عزل الضوضاء" className="inventory-textarea" rows="3"/>
                                    </div>
                                    <button onClick={handleGenerateWithAI} disabled={isGenerating} className="inventory-button-primary w-full">{isGenerating ? 'جاري الإنشاء...' : 'إنشاء وحفظ المنتج'}</button>
                                </div>
                            </div>
                        )}

                        <div className="inventory-side-section">
                            <h2 className="inventory-section-title mb-5">{editingProduct ? 'تعديل المنتج' : 'إضافة منتج يدوي'}</h2>
                            <form onSubmit={handleSubmitManual} className="flex flex-col gap-4">
                                <div className="inventory-form-group">
                                    <label className="inventory-form-label">اسم المنتج</label>
                                    <input name="name" value={formData.name} onChange={handleInputChange} placeholder="اسم المنتج" className="inventory-input" required />
                                </div>
                                <div className="inventory-form-group">
                                    <label className="inventory-form-label">اسم المتجر الرئيسي</label>
                                    <select name="main_store_name" value={formData.main_store_name} onChange={handleInputChange} className="inventory-select" disabled={loadingStores}>
                                        <option value="">اختر اسم المتجر الرئيسي</option>
                                        {loadingStores ? (
                                            <option disabled>جاري تحميل المتاجر...</option>
                                        ) : (
                                            storeOptions.map((name) => (
                                                <option key={name} value={name}>{name}</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div className="inventory-form-group">
                                    <label className="inventory-form-label">الوصف</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="الوصف" className="inventory-textarea" rows="3"/>
                                </div>
                                <div className="inventory-form-group">
                                    <label className="inventory-form-label">السعر الأصلي</label>
                                    <input name="price" type="number" value={formData.price} onChange={handleInputChange} placeholder="السعر الأصلي" className="inventory-input" required />
                                </div>
                                <div className="inventory-form-group">
                                    <label className="inventory-form-label">مقدار الخصم (اختياري)</label>
                                    <input name="discounted_price" type="number" value={formData.discounted_price} onChange={handleInputChange} placeholder="مقدار الخصم" className="inventory-input" />
                                </div>
                                <div className="inventory-form-group">
                                    <label className="inventory-form-label">الكمية</label>
                                    <input name="stock" type="number" value={formData.stock} onChange={handleInputChange} placeholder="الكمية" className="inventory-input" required />
                                </div>
                                <div className="inventory-form-group">
                                    <label className="inventory-form-label">الفئة</label>
                                    <select name="category" value={formData.category} onChange={handleInputChange} className="inventory-select">
                                        <option value="">اختر الفئة</option>
                                        {categoriesData.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                {formData.category && formData.category !== '' && (
                                    <div className="inventory-form-group">
                                        <label className="inventory-form-label">اختيار النوع</label>
                                        <select name="subcategory_id" value={formData.subcategory_id} onChange={handleInputChange} className="inventory-select" disabled={loadingSubcategories}>
                                            <option value="">اختر النوع</option>
                                            {loadingSubcategories ? (
                                                <option disabled>جاري تحميل الأنواع...</option>
                                            ) : (
                                                subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name_ar || sub.name}</option>)
                                            )}
                                        </select>
                                    </div>
                                )}

                                <div className="inventory-form-group">
                                    <label className="inventory-form-label mb-4">نظام رفع الصور</label>
                                    <ProductMediaManager
                                        value={editingProduct?.id ? (
                                            [
                                                formData.main_image_url && { id: 'main', name: 'الصورة الرئيسية', url: formData.main_image_url, type: 'image' },
                                                formData.image_1 && { id: 'image_1', name: 'صورة فرعية 1', url: formData.image_1, type: 'image' },
                                                formData.image_2 && { id: 'image_2', name: 'صورة فرعية 2', url: formData.image_2, type: 'image' },
                                                formData.image_3 && { id: 'image_3', name: 'صورة فرعية 3', url: formData.image_3, type: 'image' }
                                            ].filter(Boolean)
                                        ) : newProductMedia}
                                        onChange={(media) => {
                                            if (editingProduct?.id) {
                                                // Update form data for editing
                                                media.forEach((item, index) => {
                                                    if (index === 0) {
                                                        handleFormDataChange({ main_image_url: item.url });
                                                    } else {
                                                        handleFormDataChange({ [`image_${index}`]: item.url });
                                                    }
                                                });
                                            } else {
                                                // Store new media for creating
                                                setNewProductMedia(media);
                                            }
                                        }}
                                        productId={editingProduct ? editingProduct.id : null}
                                    />
                                </div>

                                <ProductSkinRoutineSettings
                                    formData={formData}
                                    onFormDataChange={handleFormDataChange}
                                    isLoading={isSubmitting}
                                    category={formData.category}
                                />

                                <ProductSeasonsSettings
                                    formData={formData}
                                    onFormDataChange={handleFormDataChange}
                                    isLoading={isSubmitting}
                                    category={formData.category}
                                />

                                {canPublish && (
                                    <div className="flex items-center gap-3 py-2">
                                        <input type="checkbox" id="published" name="published" checked={formData.published} onChange={handleInputChange} className="inventory-checkbox" />
                                        <label htmlFor="published" className="inventory-form-label mb-0">نشر المنتج؟</label>
                                    </div>
                                )}
                                <div className="flex gap-3 pt-4">
                                    {editingProduct && <button type="button" onClick={handleCancelEdit} className="inventory-button-secondary flex-1">إلغاء</button>}
                                    <button type="submit" disabled={isSubmitting} className="inventory-button-primary flex-1">{isSubmitting ? 'جاري الحفظ...' : (editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج')}</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="md:col-span-2 inventory-main-section">
                        <div className="mb-6">
                            <h2 className="inventory-section-title mb-4">قائمة المنتجات</h2>
                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="ابحث عن منتج بالاسم أو الباركود..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="inventory-input w-full px-4 pl-10"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="inventory-form-label mb-2 block text-sm">فرز حسب الفئة</label>
                                        <select
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value)}
                                            className="inventory-select w-full"
                                        >
                                            <option value="">جميع الفئات</option>
                                            {categoriesData.filter(c => c.id !== 'all').map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="inventory-form-label mb-2 block text-sm">حالة النشر</label>
                                        <select
                                            value={filterPublished}
                                            onChange={(e) => setFilterPublished(e.target.value)}
                                            className="inventory-select w-full"
                                        >
                                            <option value="">جميع الحالات</option>
                                            <option value="published">المنتجات المنشورة</option>
                                            <option value="unpublished">المنتجات غير المنشورة</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="inventory-form-label mb-2 block text-sm opacity-0">إجراء</label>
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                setFilterCategory('');
                                                setFilterPublished('');
                                            }}
                                            className="inventory-button-secondary w-full"
                                        >
                                            مسح الفلاتر
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {loadingProducts ? (
                            <p className="text-center text-gray-500 py-8">جاري تحميل المنتجات...</p>
                        ) : products.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Unpublished Products Section (First/Left) */}
                                {(() => { const unpublished = getFilteredProducts(filterPublished === 'published' ? true : filterPublished === 'unpublished' ? false : undefined).filter(p => !p.published); return unpublished.length > 0 && (filterPublished === '' || filterPublished === 'unpublished'); })() && (
                                    <div className="space-y-3">
                                        <h3 className="text-base font-semibold text-amber-600 flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg sticky top-0 z-10">
                                            <span className="text-lg">⊗</span>
                                            المنتجات غير المنشورة ({(() => { return getFilteredProducts(false).length; })()})
                                        </h3>
                                        <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-3">
                                            {(() => {
                                                const unpublishedAndFiltered = getFilteredProducts(false);
                                                const withoutSubcategory = unpublishedAndFiltered.filter(p => p.category && p.category !== '' && !p.subcategory_id);
                                                const withSubcategory = unpublishedAndFiltered.filter(p => !(p.category && p.category !== '' && !p.subcategory_id));
                                                const sortedProducts = [...withoutSubcategory, ...withSubcategory];

                                                return sortedProducts.map(p => {
                                                    const canModify = userRole === 'admin' || !p.published;
                                                    return (
                                                        <div key={p.id} className="inventory-product-item">
                                                            <div className="inventory-product-info flex-1">
                                                                <p className="inventory-product-name">{p.name}</p>
                                                                <p className="inventory-product-meta">الكمية: <span style={{ fontWeight: '600' }}>{p.stock}</span> | الباركود: <span style={{ fontWeight: '600' }}>{p.barcode}</span></p>
                                                                <span className={`inventory-product-status ${p.published ? 'inventory-product-status-published' : 'inventory-product-status-draft'}`}>
                                                                    {p.published ? '✓ منشور' : '⊗ غير منشور'}
                                                                </span>
                                                                <ProductSkinRoutineDisplay product={p} />
                                                            </div>
                                                            <div className="inventory-action-buttons">
                                                                <button onClick={() => handleEdit(p)} disabled={!canModify} className="inventory-action-button" title="تعديل">
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleDelete(p.id)} disabled={!canModify} className="inventory-action-button delete" title="حذف">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* Published Products Section (Second/Right) */}
                                {(() => { const published = getFilteredProducts(true); return published.length > 0 && (filterPublished === '' || filterPublished === 'published'); })() && (
                                    <div className="space-y-3">
                                        {(() => {
                                            const publishedProducts = getFilteredProducts(true);
                                            const productsWithoutCategory = publishedProducts.filter(p => !p.category || p.category.trim() === '').length;
                                            const productsWithoutMainStoreName = publishedProducts.filter(p => !p.main_store_name || p.main_store_name.trim() === '').length;
                                            const productsWithoutSubcategory = publishedProducts.filter(p => p.category && p.category !== '' && !p.subcategory_id).length;
                                            const productsWithoutDescription = publishedProducts.filter(p => !p.description || p.description.trim() === '').length;
                                            const productsWithoutImage = publishedProducts.filter(p => !p.main_image_url || p.main_image_url.trim() === '').length;
                                            return (
                                                <h3 className="text-base font-semibold text-green-600 flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg sticky top-0 z-10">
                                                    <span className="text-lg">✓</span>
                                                    المنتجات المنشورة ({publishedProducts.length})
                                                    {(productsWithoutCategory > 0 || productsWithoutMainStoreName > 0 || productsWithoutDescription > 0 || productsWithoutSubcategory > 0 || productsWithoutImage > 0) && (
                                                        <div className="ml-auto flex gap-1 flex-wrap">
                                                            {productsWithoutCategory > 0 && (
                                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                                    ⚠ {productsWithoutCategory} بدون فئة
                                                                </span>
                                                            )}
                                                            {productsWithoutMainStoreName > 0 && (
                                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                                    ⚠ {productsWithoutMainStoreName} بدون متجر
                                                                </span>
                                                            )}
                                                            {productsWithoutDescription > 0 && (
                                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                                    ⚠ {productsWithoutDescription} بدون وصف
                                                                </span>
                                                            )}
                                                            {productsWithoutSubcategory > 0 && (
                                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                                    ⚠ {productsWithoutSubcategory} بدون نوع
                                                                </span>
                                                            )}
                                                            {productsWithoutImage > 0 && (
                                                                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                                    ⚠ {productsWithoutImage} بدون صورة
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </h3>
                                            );
                                        })()}
                                        <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-3">
                                            {(() => {
                                                const publishedAndFiltered = getFilteredProducts(true);

                                                // المنتجات التي بها تنبيهات حمراء (بدون فرع أو بدون فئة)
                                                const withoutCriticalFields = publishedAndFiltered.filter(p => {
                                                  const hasNoMainStoreName = !p.main_store_name || p.main_store_name.trim() === '';
                                                  const hasNoCategory = !p.category || p.category.trim() === '';
                                                  return hasNoMainStoreName || hasNoCategory;
                                                });

                                                // بقية المنتجات
                                                const withCriticalFields = publishedAndFiltered.filter(p => {
                                                  const hasNoMainStoreName = !p.main_store_name || p.main_store_name.trim() === '';
                                                  const hasNoCategory = !p.category || p.category.trim() === '';
                                                  return !(hasNoMainStoreName || hasNoCategory);
                                                });

                                                const sortedProducts = [...withoutCriticalFields, ...withCriticalFields].sort((a, b) => {
                                                    const aHasNoSubcategory = a.category && a.category !== '' && !a.subcategory_id;
                                                    const bHasNoSubcategory = b.category && b.category !== '' && !b.subcategory_id;
                                                    if (aHasNoSubcategory === bHasNoSubcategory) return 0;
                                                    return aHasNoSubcategory ? -1 : 1;
                                                });

                                                return sortedProducts.map(p => {
                                                    const canModify = userRole === 'admin' || !p.published;
                                                    const hasNoSubcategory = p.category && p.category !== '' && !p.subcategory_id;
                                                    const hasNoDescription = !p.description || p.description.trim() === '';
                                                    const hasNoImage = !p.main_image_url || p.main_image_url.trim() === '';
                                                    const hasNoMainStoreName = !p.main_store_name || p.main_store_name.trim() === '';
                                                    const hasNoCategory = !p.category || p.category.trim() === '';
                                                    return (
                                                        <div key={p.id} className="inventory-product-item">
                                                            <div className="inventory-product-info flex-1">
                                                                <p className="inventory-product-name">{p.name}</p>
                                                                <p className="inventory-product-meta">الكمية: <span style={{ fontWeight: '600' }}>{p.stock}</span> | الباركود: <span style={{ fontWeight: '600' }}>{p.barcode}</span></p>
                                                                <div className="flex gap-2 items-center flex-wrap">
                                                                    <span className={`inventory-product-status ${p.published ? 'inventory-product-status-published' : 'inventory-product-status-draft'}`}>
                                                                        {p.published ? '✓ منشور' : '⊗ غير منشور'}
                                                                    </span>
                                                                    {hasNoCategory && (
                                                                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                                            ⚠ بدون فئة
                                                                        </span>
                                                                    )}
                                                                    {hasNoMainStoreName && (
                                                                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                                            ⚠ بدون متجر
                                                                        </span>
                                                                    )}
                                                                    {hasNoDescription && (
                                                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                                            ⚠ بدون وصف
                                                                        </span>
                                                                    )}
                                                                    {hasNoSubcategory && (
                                                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                                            ⚠ بدون نوع
                                                                        </span>
                                                                    )}
                                                                    {hasNoImage && (
                                                                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                                            ⚠ بدون صورة
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <ProductSkinRoutineDisplay product={p} />
                                                            </div>
                                                            <div className="inventory-action-buttons">
                                                                <button onClick={() => handleEdit(p)} disabled={!canModify} className="inventory-action-button" title="تعديل">
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleDelete(p.id)} disabled={!canModify} className="inventory-action-button delete" title="حذف">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* If only one category has products */}
                                {(() => {
                                  const unpublishedMatches = getFilteredProducts(false);
                                  const publishedMatches = getFilteredProducts(true);
                                  return unpublishedMatches.length === 0 && publishedMatches.length > 0 && (filterPublished === '' || filterPublished === 'published') ? <div /> : null;
                                })()}
                                {(() => {
                                  const unpublishedMatches = getFilteredProducts(false);
                                  const publishedMatches = getFilteredProducts(true);
                                  return publishedMatches.length === 0 && unpublishedMatches.length > 0 && (filterPublished === '' || filterPublished === 'unpublished') ? <div /> : null;
                                })()}

                                {/* No results message */}
                                {(() => {
                                  if (!searchQuery && !filterCategory && !filterPublished) return null;
                                  const hasResults = getFilteredProducts(true).length > 0 || getFilteredProducts(false).length > 0;
                                  return !hasResults ? (
                                    <div className="col-span-2 text-center py-8">
                                        <p className="text-gray-500">
                                            لم يتم العثور على منتجات تطابق المعايير المحددة
                                            {searchQuery && ` "${searchQuery}"`}
                                            {filterCategory && ` في الفئة المختارة`}
                                            {filterPublished && ` مع حالة النشر المختارة`}
                                        </p>
                                    </div>
                                  ) : null;
                                })()}
                            </div>
                        ) : (
                            <p className="inventory-empty-state">لا توجد منتجات. ابدأ بإضافة منتج جديد!</p>
                        )}
                    </div>
                </div>

                <Tabs defaultValue="excel-import" className="w-full mt-8">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="excel-import" className="flex items-center gap-2 justify-center">
                      <Database className="w-4 h-4" />
                      استيراد ملفات نصية AI
                    </TabsTrigger>
                    <TabsTrigger value="bulk-images" className="flex items-center gap-2 justify-center">
                      <Upload className="w-4 h-4" />
                      رفع صور الكميات
                    </TabsTrigger>
                    <TabsTrigger value="status-scanner" className="flex items-center gap-2 justify-center">
                      <Search className="w-4 h-4" />
                      ماسح الحالة
                    </TabsTrigger>
                    <TabsTrigger value="popups" className="flex items-center gap-2 justify-center">
                      <Zap className="w-4 h-4" />
                      الإعلانات المنبثقة
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="excel-import" className="mt-6">
                    <div className="inventory-main-section">
                      <ProductAnalyzerTab onProductsAdded={fetchProducts} />
                    </div>
                  </TabsContent>

                  <TabsContent value="bulk-images" className="mt-6">
                    <div className="inventory-main-section">
                      <BulkImageUploadTab onProductsUpdated={fetchProducts} />
                    </div>
                  </TabsContent>

                  <TabsContent value="status-scanner" className="mt-6">
                    <div className="inventory-main-section">
                      <ProductStatusScannerTab />
                    </div>
                  </TabsContent>

                  <TabsContent value="popups" className="mt-6">
                    <div className="inventory-main-section">
                      <InventoryPopupTab />
                    </div>
                  </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default InventoryPage;
