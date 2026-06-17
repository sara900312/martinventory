import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { toast } from '@/components/ui/use-toast';
import { Gift, Edit2, Trash2, Copy, Eye, EyeOff, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './CouponManagement.css';

const CouponManagement = () => {
  const { supabase } = useSupabase();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    description: '',
    valid_from: '',
    valid_until: '',
    usage_limit: '',
    is_active: true,
  });

  const [formErrors, setFormErrors] = useState({});

  // Fetch all coupons
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      toast({
        title: 'خطأ في تحميل القسائم',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Initial load
  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.code.trim()) {
      errors.code = 'رمز القسيمة مطلوب';
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
        is_active: formData.is_active,
      };

      if (editingCoupon) {
        // Update existing coupon
        const { error } = await supabase
          .from('coupons')
          .update(submitData)
          .eq('id', editingCoupon.id);

        if (error) throw error;
        toast({ title: 'تم تحديث القسيمة بنجاح' });
      } else {
        // Create new coupon
        const { error } = await supabase
          .from('coupons')
          .insert([submitData]);

        if (error) throw error;
        toast({ title: 'تمت إضافة القسيمة بنجاح' });
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
      is_active: true,
    });
    setFormErrors({});
    setEditingCoupon(null);
    setShowForm(false);
  };

  // Edit coupon
  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      description: coupon.description || '',
      valid_from: new Date(coupon.valid_from).toISOString().slice(0, 16),
      valid_until: new Date(coupon.valid_until).toISOString().slice(0, 16),
      usage_limit: coupon.usage_limit || '',
      is_active: coupon.is_active,
    });
    setShowForm(true);
  };

  // Delete coupon
  const handleDelete = async (couponId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه القسيمة؟')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;
      toast({ title: 'تم حذف القسيمة بنجاح' });
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
      toast({
        title: coupon.is_active ? 'تم تعطيل القسيمة' : 'تم تفعيل القسيمة',
      });
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

  // Filter coupons
  const filteredCoupons = coupons.filter((coupon) =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="coupon-management-wrapper">
      {/* Header */}
      <div className="coupon-management-header">
        <h2 className="coupon-management-title">
          <Gift className="w-5 h-5" />
          إدارة القسائم
        </h2>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="coupon-add-button"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'إلغاء' : 'إضافة قسيمة'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="coupon-form-container">
          <form onSubmit={handleSubmit} className="coupon-form">
            <div className="coupon-form-row">
              <div className="coupon-form-group">
                <label className="coupon-form-label">رمز القسيمة *</label>
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

            <div className="coupon-form-actions">
              <button type="submit" disabled={loading} className="coupon-button-save">
                {loading ? 'جاري...' : editingCoupon ? 'تحديث القسيمة' : 'إضافة القسيمة'}
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
          placeholder="ابحث عن قسيمة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="coupon-search-input"
        />

        {loading && !showForm ? (
          <div className="coupon-loading">جاري التحميل...</div>
        ) : filteredCoupons.length === 0 ? (
          <div className="coupon-empty">
            <Gift className="w-12 h-12" />
            <p>لا توجد قسائم حالياً</p>
          </div>
        ) : (
          <div className="coupon-list">
            {filteredCoupons.map((coupon) => {
              const isExpired = new Date(coupon.valid_until) < new Date();
              const isNotStarted = new Date(coupon.valid_from) > new Date();

              return (
                <div
                  key={coupon.id}
                  className={`coupon-item ${!coupon.is_active ? 'disabled' : ''} ${isExpired ? 'expired' : ''} ${isNotStarted ? 'not-started' : ''}`}
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
                      {isExpired && <span className="status-badge expired">منتهية</span>}
                      {isNotStarted && <span className="status-badge not-started">لم تبدأ بعد</span>}
                      {!coupon.is_active && <span className="status-badge disabled">معطلة</span>}
                      {!isExpired && !isNotStarted && coupon.is_active && (
                        <span className="status-badge active">نشطة</span>
                      )}
                    </div>
                  </div>

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
                        <span className="detail-value">{coupon.usage_limit} مرات</span>
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
  );
};

export default CouponManagement;
