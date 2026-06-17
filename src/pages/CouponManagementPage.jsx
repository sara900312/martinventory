import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { Gift, Edit2, Trash2, Copy, Eye, EyeOff, Plus, X, Search, ArrowLeft } from 'lucide-react';
import { getCouponStatus } from '@/lib/couponService';
import '../components/CouponManagement.css';

const CouponManagementPage = () => {
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const { userRole, loading: authLoading } = useAuth();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activatedCouponTimers, setActivatedCouponTimers] = useState({});
  
  // Product search and selection
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    description: '',
    valid_from: '',
    valid_until: '',
    usage_limit: '',
    maximum_quantity: '',
    is_active: true,
  });

  const [formErrors, setFormErrors] = useState({});

  // Check authorization
  useEffect(() => {
    if (authLoading) return;
    const canUseFeature = userRole === 'admin' || userRole === 'store_owner';
    if (!canUseFeature) {
      toast({
        title: 'وصول مرفوض',
        description: 'ليس لديك صلاحية لعرض هذه الصفحة.',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [authLoading, userRole, navigate]);

  // Fetch all coupons with product count and usage data
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          coupons_products(count),
          coupon_usage(quantity_used)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map the data to include product count, usage count, and total quantity used
      const couponsWithCounts = (data || []).map(coupon => {
        const usageRecords = coupon.coupon_usage || [];
        const totalQuantityUsed = usageRecords.reduce((sum, record) => sum + (record.quantity_used || 1), 0);

        return {
          ...coupon,
          product_count: coupon.coupons_products?.length || 0,
          usage_count: usageRecords.length,
          quantity_used: totalQuantityUsed,
        };
      });

      // Auto-deactivate coupons that have reached their quantity limit
      const couponsToDeactivate = couponsWithCounts.filter(
        coupon => coupon.maximum_quantity &&
                  coupon.quantity_used >= coupon.maximum_quantity &&
                  coupon.is_active
      );

      if (couponsToDeactivate.length > 0) {
        for (const coupon of couponsToDeactivate) {
          await supabase
            .from('coupons')
            .update({ is_active: false })
            .eq('id', coupon.id);
        }

        // Re-fetch after deactivation
        const { data: updatedData } = await supabase
          .from('coupons')
          .select(`
            *,
            coupons_products(count),
            coupon_usage(quantity_used)
          `)
          .order('created_at', { ascending: false });

        const updatedCoupons = (updatedData || []).map(coupon => {
          const usageRecords = coupon.coupon_usage || [];
          const totalQuantityUsed = usageRecords.reduce((sum, record) => sum + (record.quantity_used || 1), 0);

          return {
            ...coupon,
            product_count: coupon.coupons_products?.length || 0,
            usage_count: usageRecords.length,
            quantity_used: totalQuantityUsed,
          };
        });

        setCoupons(updatedCoupons);
      } else {
        setCoupons(couponsWithCounts);
      }
    } catch (error) {
      toast({
        title: 'خطأ في تحميل الخصومات',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Fetch all products for selection
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        title: 'خطأ في تحميل المنتجات',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingProducts(false);
    }
  }, [supabase]);

  // Initial load
  useEffect(() => {
    if (authLoading) return;
    fetchCoupons();
    fetchProducts();
  }, [fetchCoupons, fetchProducts, authLoading]);

  // Handle countdown timers for activated coupons
  useEffect(() => {
    const timers = Object.entries(activatedCouponTimers);
    if (timers.length === 0) return;

    const intervals = timers.map(([couponId, timeRemaining]) => {
      if (timeRemaining <= 0) {
        // Timer expired, auto-deactivate
        const expiredCoupon = coupons.find(c => c.id === couponId);
        if (expiredCoupon && expiredCoupon.is_active) {
          setActivatedCouponTimers(prev => {
            const updated = { ...prev };
            delete updated[couponId];
            return updated;
          });
          // Auto-deactivate after 5 minutes
          supabase
            .from('coupons')
            .update({ is_active: false })
            .eq('id', couponId)
            .then(() => {
              toast({
                title: 'انتهت صلاحية الخصم',
                description: 'تم تعطيل الخصم تلقائياً بعد 5 دقائق من التفعيل',
                variant: 'destructive',
              });
              fetchCoupons();
            });
        }
        return null;
      }

      return setInterval(() => {
        setActivatedCouponTimers(prev => ({
          ...prev,
          [couponId]: Math.max(0, prev[couponId] - 1),
        }));
      }, 1000);
    });

    return () => {
      intervals.forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [activatedCouponTimers, coupons, supabase]);

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.code.trim()) {
      errors.code = 'رمز الخصم مطلوب';
    } else if (!/^[A-Z0-9]{7}$/.test(formData.code.toUpperCase())) {
      errors.code = 'يجب أن يكون 7 أحرف/أرقام';
    }

    if (!formData.discount_value) {
      errors.discount_value = 'قيمة الخصم مطلوبة';
    } else if (formData.discount_type === 'percentage' && (formData.discount_value < 0 || formData.discount_value > 100)) {
      errors.discount_value = 'يجب أن تكون النسبة بين 0 و 100';
    } else if (formData.discount_type === 'fixed' && formData.discount_value <= 0) {
      errors.discount_value = 'يجب أن تكون القيمة أكبر من 0';
    }

    if (!formData.valid_until) {
      errors.valid_until = 'تاريخ الانتهاء مطلوب';
    }

    if (formData.maximum_quantity && parseInt(formData.maximum_quantity) < 1) {
      errors.maximum_quantity = 'يجب أن تكون الكمية القصوى 1 على الأقل';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'خطأ في النموذج',
        description: 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        description: formData.description,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString(),
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        maximum_quantity: formData.maximum_quantity ? parseInt(formData.maximum_quantity) : null,
        is_active: formData.is_active,
      };

      let couponId;

      if (editingCoupon) {
        // Update existing coupon
        const { error } = await supabase
          .from('coupons')
          .update(submitData)
          .eq('id', editingCoupon.id);

        if (error) throw error;
        couponId = editingCoupon.id;

        // Delete existing product links
        const { error: deleteError } = await supabase
          .from('coupons_products')
          .delete()
          .eq('coupon_id', couponId);

        if (deleteError) throw deleteError;

        toast({ title: 'تم تحديث الخصم بنجاح' });
      } else {
        // Create new coupon
        const { data: newCoupon, error: insertError } = await supabase
          .from('coupons')
          .insert([submitData])
          .select('id');

        if (insertError) throw insertError;
        if (!newCoupon || newCoupon.length === 0) {
          throw new Error('فشل في إنشاء القسيمة');
        }

        couponId = newCoupon[0].id;
        toast({ title: 'تمت إضافة الخصم بنجاح' });
      }

      // Link products to coupon via coupons_products table
      if (selectedProducts.length > 0) {
        const couponProductsData = selectedProducts.map(productId => ({
          coupon_id: couponId,
          product_id: productId,
        }));

        const { error: linkError } = await supabase
          .from('coupons_products')
          .insert(couponProductsData);

        if (linkError) throw linkError;
      }

      resetForm();
      await fetchCoupons();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      description: '',
      valid_from: '',
      valid_until: '',
      usage_limit: '',
      maximum_quantity: '',
      is_active: true,
    });
    setFormErrors({});
    setEditingCoupon(null);
    setShowForm(false);
    setSelectedProducts([]);
    setProductSearchTerm('');
  };

  // Edit coupon
  const handleEdit = async (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      description: coupon.description || '',
      valid_from: new Date(coupon.valid_from).toISOString().slice(0, 16),
      valid_until: new Date(coupon.valid_until).toISOString().slice(0, 16),
      usage_limit: coupon.usage_limit || '',
      maximum_quantity: coupon.maximum_quantity || '',
      is_active: coupon.is_active,
    });

    // Fetch linked products from coupons_products
    try {
      const { data, error } = await supabase
        .from('coupons_products')
        .select('product_id')
        .eq('coupon_id', coupon.id);

      if (error) throw error;
      const productIds = data.map(row => row.product_id);
      setSelectedProducts(productIds);
    } catch (error) {
      console.error('خطأ في جلب المنتجات:', error);
      setSelectedProducts([]);
    }

    setShowForm(true);
  };

  // Delete coupon
  const handleDelete = async (couponId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الخصم؟')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;
      toast({ title: 'تم حذف الخصم بنجاح' });
      await fetchCoupons();
    } catch (error) {
      toast({
        title: 'خطأ في الحذف',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Toggle coupon status
  const handleToggleStatus = async (coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) throw error;

      if (!coupon.is_active) {
        // Coupon is being activated - start 5-minute timer
        setActivatedCouponTimers(prev => ({
          ...prev,
          [coupon.id]: 300, // 5 minutes = 300 seconds
        }));
        toast({
          title: 'تم تفعيل الخصم ✓',
          description: 'رمز الخصم سينتهي في 5 دقائق',
        });
      } else {
        // Coupon is being deactivated - clear timer
        setActivatedCouponTimers(prev => {
          const updated = { ...prev };
          delete updated[coupon.id];
          return updated;
        });
        toast({
          title: 'تم تعطيل الخصم',
        });
      }
      await fetchCoupons();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Copy coupon code
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'تم نسخ الرمز' });
  };

  // Handle product selection
  const handleToggleProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Handle select all products matching search
  const handleSelectAllProducts = () => {
    const filteredIds = filteredProducts.map(p => p.id);
    setSelectedProducts(prev => {
      const newIds = new Set([...prev, ...filteredIds]);
      return Array.from(newIds);
    });
  };

  // Handle clear all products
  const handleClearAllProducts = () => {
    setSelectedProducts([]);
  };

  // Filter coupons
  const filteredCoupons = coupons.filter((coupon) =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter products based on search term
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(productSearchTerm.toLowerCase()))
  );

  if (authLoading) {
    return (
      <div className="inventory-main-container">
        <main className="flex-grow container mx-auto px-4 py-8">
          <p className="text-center text-gray-500">جاري التحميل...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="inventory-main-container">
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <h1 className="inventory-page-header text-4xl">إدارة الخصومات</h1>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/inventory')} variant="outline" className="inventory-button-secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              العودة للمخزن
            </Button>
          </div>
        </div>

        <div className="coupon-management-wrapper">
          {/* Header */}
          <div className="coupon-management-header">
            <h2 className="coupon-management-title">
              <Gift className="w-5 h-5" />
              إدارة الخصومات
            </h2>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="coupon-add-button"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'إلغاء' : 'إضافة خصم'}
            </Button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="coupon-form-container">
              <form onSubmit={handleSubmit} className="coupon-form">
                <div className="coupon-form-row">
                  <div className="coupon-form-group">
                    <label className="coupon-form-label">رمز الخصم *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="SAVE20K"
                      maxLength="7"
                      className={`coupon-input ${formErrors.code ? 'error' : ''}`}
                      disabled={!!editingCoupon}
                    />
                    {formErrors.code && <span className="coupon-error">{formErrors.code}</span>}
                  </div>

                  <div className="coupon-form-group">
                    <label className="coupon-form-label">نوع الخصم *</label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                      className="coupon-select"
                    >
                      <option value="percentage">نسبة مئوية (%)</option>
                      <option value="fixed">مبلغ ثابت (د.ع)</option>
                    </select>
                  </div>
                </div>

                <div className="coupon-form-row">
                  <div className="coupon-form-group">
                    <label className="coupon-form-label">قيمة الخصم *</label>
                    <input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      placeholder={formData.discount_type === 'percentage' ? '20' : '5000'}
                      className={`coupon-input ${formErrors.discount_value ? 'error' : ''}`}
                      step={formData.discount_type === 'percentage' ? '0.01' : '1'}
                      min="0"
                    />
                    {formErrors.discount_value && <span className="coupon-error">{formErrors.discount_value}</span>}
                  </div>
                </div>

                <div className="coupon-form-group full">
                  <label className="coupon-form-label">الوصف</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="مثال: خصم 20% على جميع المنتجات"
                    className="coupon-input"
                  />
                </div>

                <div className="coupon-form-row">
                  <div className="coupon-form-group">
                    <label className="coupon-form-label">تاريخ البدء *</label>
                    <input
                      type="datetime-local"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="coupon-input"
                    />
                  </div>

                  <div className="coupon-form-group">
                    <label className="coupon-form-label">تاريخ الانتهاء *</label>
                    <input
                      type="datetime-local"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className={`coupon-input ${formErrors.valid_until ? 'error' : ''}`}
                    />
                    {formErrors.valid_until && <span className="coupon-error">{formErrors.valid_until}</span>}
                  </div>
                </div>

                <div className="coupon-form-row">
                  <div className="coupon-form-group">
                    <label className="coupon-form-label">حد الاستخدام</label>
                    <input
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                      placeholder="اتركها فارغة للاستخدام غير محدود"
                      className="coupon-input"
                      min="1"
                    />
                  </div>

                  <div className="coupon-form-group">
                    <label className="coupon-form-label">الحد الأقصى للكمية</label>
                    <input
                      type="number"
                      value={formData.maximum_quantity}
                      onChange={(e) => setFormData({ ...formData, maximum_quantity: e.target.value })}
                      placeholder="إجمالي الوحدات المسموح بها"
                      className={`coupon-input ${formErrors.maximum_quantity ? 'error' : ''}`}
                      min="1"
                    />
                    {formErrors.maximum_quantity && (
                      <span className="form-error">{formErrors.maximum_quantity}</span>
                    )}
                  </div>
                </div>

                <div className="coupon-form-row">
                  <div className="coupon-form-group">
                    <label className="coupon-form-label">الحالة</label>
                    <div className="coupon-checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="coupon-checkbox"
                      />
                      <span className="coupon-checkbox-label">
                        {formData.is_active ? 'مفعلة' : 'معطلة'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product Selection Section */}
                <div className="coupon-form-group full">
                  <label className="coupon-form-label">المنتجات المطبقة عليها الخصم</label>
                  <div style={{ border: '2px solid #ffe4f0', borderRadius: '8px', padding: '1rem', backgroundColor: '#fafafa' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <input
                        type="text"
                        placeholder="ابحث عن منتج..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="coupon-input"
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={handleSelectAllProducts}
                          disabled={filteredProducts.length === 0}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#ff69b4',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                          }}
                        >
                          اختيار الكل
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllProducts}
                          disabled={selectedProducts.length === 0}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#e0e0e0',
                            color: '#333',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                          }}
                        >
                          مسح الكل
                        </button>
                      </div>
                    </div>

                    <div style={{
                      maxHeight: '300px',
                      overflowY: 'auto',
                      borderTop: '1px solid #ffe4f0',
                      paddingTop: '1rem',
                    }}>
                      {loadingProducts ? (
                        <p style={{ color: '#999', textAlign: 'center', padding: '1rem' }}>جاري تحميل المنتجات...</p>
                      ) : filteredProducts.length === 0 ? (
                        <p style={{ color: '#999', textAlign: 'center', padding: '1rem' }}>لا توجد منتجات</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                          {filteredProducts.map(product => (
                            <label key={product.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.75rem',
                              backgroundColor: 'white',
                              borderRadius: '6px',
                              border: '2px solid',
                              borderColor: selectedProducts.includes(product.id) ? '#ff69b4' : '#e0e0e0',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                            }}>
                              <input
                                type="checkbox"
                                checked={selectedProducts.includes(product.id)}
                                onChange={() => handleToggleProduct(product.id)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              <div>
                                <div style={{ fontWeight: '500', color: '#333', fontSize: '0.9rem' }}>{product.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#999' }}>{product.category || 'بدون فئة'}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#666' }}>
                      تم اختيار {selectedProducts.length} منتج
                    </div>
                  </div>
                </div>

                <div className="coupon-form-actions">
                  <button type="submit" disabled={loading} className="coupon-button-save">
                    {loading ? 'جاري...' : editingCoupon ? 'تحديث الخصم' : 'إضافة الخصم'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="coupon-button-cancel"
                    disabled={loading}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search and List */}
          <div className="coupon-list-section">
            <input
              type="text"
              placeholder="ابحث عن خصم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="coupon-search-input"
            />

            {loading && !showForm ? (
              <div className="coupon-loading">جاري التحميل...</div>
            ) : filteredCoupons.length === 0 ? (
              <div className="coupon-empty">
                <Gift className="w-12 h-12" />
                <p>لا توجد خصومات حالياً</p>
              </div>
            ) : (
              <div className="coupon-list">
                {filteredCoupons.map((coupon) => {
                  const applicableProductsCount = coupon.product_count || 0;
                  const usageCount = coupon.usage_count || 0;

                  // Determine coupon status based on date, usage, and product availability
                  const couponStatusInfo = getCouponStatus(coupon, usageCount, applicableProductsCount);

                  return (
                    <div
                      key={coupon.id}
                      className={`coupon-item ${!coupon.is_active ? 'disabled' : ''} ${couponStatusInfo.cssClass}`}
                    >
                      <div className="coupon-item-header">
                        <div className="coupon-item-code-section">
                          <span className="coupon-code">{coupon.code}</span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="coupon-copy-button"
                            title="نسخ الرمز"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="coupon-item-status">
                          {!coupon.is_active && <span className="status-badge disabled">معطلة</span>}
                          {coupon.is_active && activatedCouponTimers[coupon.id] !== undefined ? (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span className={`status-badge ${couponStatusInfo.cssClass}`}>{couponStatusInfo.label}</span>
                              <div className="coupon-timer-badge">
                                <span className="coupon-timer-icon">⏱️</span>
                                <span className="coupon-timer-label">ينتهي في:</span>
                                <span className="coupon-timer-text">
                                  {Math.floor(activatedCouponTimers[coupon.id] / 60)}:{String(activatedCouponTimers[coupon.id] % 60).padStart(2, '0')}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className={`status-badge ${couponStatusInfo.cssClass}`}>{couponStatusInfo.label}</span>
                          )}
                        </div>
                      </div>

                      {coupon.is_active && activatedCouponTimers[coupon.id] !== undefined && (
                        <div className="coupon-activation-notice">
                          <span className="notice-icon">⏰</span>
                          <span className="notice-text">
                            تم تفعيل رمز الخصم - سينتهي في{' '}
                            <strong>
                              {Math.floor(activatedCouponTimers[coupon.id] / 60)} دقائق و{activatedCouponTimers[coupon.id] % 60} ثانية
                            </strong>
                          </span>
                        </div>
                      )}

                      <div className="coupon-item-details">
                        <div className="coupon-detail">
                          <span className="detail-label">نوع الخصم:</span>
                          <span className="detail-value">
                            {coupon.discount_type === 'percentage'
                              ? `${coupon.discount_value}%`
                              : `${coupon.discount_value.toLocaleString('ar-EG')} د.ع`}
                          </span>
                        </div>

                        <div className="coupon-detail">
                          <span className="detail-label">الوصف:</span>
                          <span className="detail-value">{coupon.description || '-'}</span>
                        </div>

                        <div className="coupon-detail">
                          <span className="detail-label">الفترة الزمنية:</span>
                          <span className="detail-value">
                            {new Date(coupon.valid_from).toLocaleDateString('ar-EG')} إلى{' '}
                            {new Date(coupon.valid_until).toLocaleDateString('ar-EG')}
                          </span>
                        </div>

                        {coupon.usage_limit && (
                          <div className="coupon-detail">
                            <span className="detail-label">حد الاستخدام:</span>
                            <span className="detail-value">{usageCount}/{coupon.usage_limit} مرات</span>
                          </div>
                        )}

                        {!coupon.usage_limit && usageCount > 0 && (
                          <div className="coupon-detail">
                            <span className="detail-label">عدد الاستخدامات:</span>
                            <span className="detail-value">{usageCount} مرات</span>
                          </div>
                        )}

                        {coupon.maximum_quantity && (
                          <div className="coupon-detail">
                            <span className="detail-label">الحد الأقصى للكمية:</span>
                            <span className="detail-value">
                              {coupon.maximum_quantity - (coupon.quantity_used || 0)}/{coupon.maximum_quantity} وحدة متبقية
                            </span>
                          </div>
                        )}

                        {applicableProductsCount > 0 && (
                          <div className="coupon-detail">
                            <span className="detail-label">المنتجات المطبقة:</span>
                            <span className="detail-value">{applicableProductsCount} منتج</span>
                          </div>
                        )}
                      </div>

                      <div className="coupon-item-actions">
                        <button
                          onClick={() => handleToggleStatus(coupon)}
                          className="coupon-action-button toggle"
                          title={coupon.is_active ? 'تعطيل' : 'تفعيل'}
                        >
                          {coupon.is_active ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="coupon-action-button edit"
                          title="تعديل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="coupon-action-button delete"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CouponManagementPage;
