import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle, Plus, Trash2, Edit2, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SECTIONS = [
  { id: 'deliveries', name: 'التوصيلات' },
  { id: 'products', name: 'المنتجات العامة' },
  { id: 'categories', name: 'الفئات' },
  { id: 'popular_products', name: 'المنتجات الشائعة' },
];

const MaintenanceManagementPage = () => {
  const { supabase } = useSupabase();
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    section_name: '',
    reason: '',
    start_time: '',
    end_time: '',
    is_active: true,
  });

  // Check authorization
  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'store_owner') {
      toast({
        title: 'غير مصرح',
        description: 'لا توجد صلاحيات لهذه الصفحة',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [userRole, navigate]);

  // Fetch maintenance records
  const fetchMaintenances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaintenances(data || []);
    } catch (error) {
      console.error('Error fetching maintenances:', error);
      toast({
        title: 'خطأ',
        description: 'فشل جلب بيانات الصيانة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenances();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.section_name || !formData.start_time || !formData.end_time) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from('maintenance')
          .update({
            section_name: formData.section_name,
            reason: formData.reason,
            start_time: formData.start_time,
            end_time: formData.end_time,
            is_active: formData.is_active,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast({
          title: 'تم التحديث بنجاح',
          description: 'تم تحديث بيانات الصيانة',
        });
      } else {
        // Create
        const { error } = await supabase.from('maintenance').insert([
          {
            section_name: formData.section_name,
            reason: formData.reason,
            start_time: formData.start_time,
            end_time: formData.end_time,
            is_active: formData.is_active,
          },
        ]);

        if (error) throw error;
        toast({
          title: 'تمت الإضافة بنجاح',
          description: 'تم إضافة فترة صيانة جديدة',
        });
      }

      setFormData({
        section_name: '',
        reason: '',
        start_time: '',
        end_time: '',
        is_active: true,
      });
      setEditingId(null);
      setShowForm(false);
      fetchMaintenances();
    } catch (error) {
      console.error('Error saving maintenance:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حفظ بيانات الصيانة',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذه الفترة الصيانة؟')) return;

    try {
      const { error } = await supabase
        .from('maintenance')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: 'تم الحذف بنجاح',
      });
      fetchMaintenances();
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حذف فترة الصيانة',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (maintenance) => {
    setEditingId(maintenance.id);
    setFormData({
      section_name: maintenance.section_name,
      reason: maintenance.reason || '',
      start_time: maintenance.start_time?.split('.')[0] || '',
      end_time: maintenance.end_time?.split('.')[0] || '',
      is_active: maintenance.is_active,
    });
    setShowForm(true);
  };

  const getSectionName = (id) => {
    return SECTIONS.find((s) => s.id === id)?.name || id;
  };

  const isMaintenanceActive = (maintenance) => {
    const now = new Date();
    const start = new Date(maintenance.start_time);
    const end = new Date(maintenance.end_time);
    return maintenance.is_active && now >= start && now <= end;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              إدارة الصيانة
            </h1>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              فترة صيانة جديدة
            </Button>
          </div>

          {/* Form */}
          <AnimatePresence>
            {showForm && (
              <motion.form
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow-lg p-6 mb-8"
              >
                <h2 className="text-xl font-bold mb-4">
                  {editingId ? 'تعديل الصيانة' : 'فترة صيانة جديدة'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      القسم
                    </label>
                    <select
                      value={formData.section_name}
                      onChange={(e) =>
                        setFormData({ ...formData, section_name: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    >
                      <option value="">اختر القسم</option>
                      {SECTIONS.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      السبب (اختياري)
                    </label>
                    <input
                      type="text"
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      placeholder="مثال: تحديث قاعدة البيانات"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      وقت البدء
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      وقت الانتهاء
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm font-semibold">
                    تفعيل الصيانة
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    {editingId ? 'تحديث' : 'إضافة'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({
                        section_name: '',
                        reason: '',
                        start_time: '',
                        end_time: '',
                        is_active: true,
                      });
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Maintenance List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">جاري تحميل البيانات...</p>
            </div>
          ) : maintenances.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">لا توجد فترات صيانة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {maintenances.map((maintenance) => {
                const active = isMaintenanceActive(maintenance);
                return (
                  <motion.div
                    key={maintenance.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`
                      bg-white rounded-lg shadow-lg p-6 border-l-4
                      ${
                        active
                          ? 'border-l-orange-500 bg-orange-50'
                          : 'border-l-gray-300'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold">
                            {getSectionName(maintenance.section_name)}
                          </h3>
                          {active && (
                            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                              جارية الآن
                            </span>
                          )}
                        </div>
                        {maintenance.reason && (
                          <p className="text-gray-600 mb-2">
                            السبب: {maintenance.reason}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          من:{' '}
                          {new Date(maintenance.start_time).toLocaleString(
                            'ar-IQ'
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          إلى:{' '}
                          {new Date(maintenance.end_time).toLocaleString(
                            'ar-IQ'
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(maintenance)}
                          className="p-2 hover:bg-blue-100 rounded text-blue-600 transition"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(maintenance.id)}
                          className="p-2 hover:bg-red-100 rounded text-red-600 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MaintenanceManagementPage;
