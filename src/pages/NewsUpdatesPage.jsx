import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Edit, Trash2, LogOut, Plus, Search, ChevronDown, Settings } from 'lucide-react';
import NewsUpdateForm from '@/components/NewsUpdateForm';

const NewsUpdatesPage = () => {
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const { userRole, signOut, loading: authLoading } = useAuth();

  const [newsItems, setNewsItems] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const canModify = userRole === 'admin';

  // Fetch news items
  const fetchNewsItems = useCallback(async () => {
    setLoadingNews(true);
    try {
      const { data, error } = await supabase
        .from('news_updates')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      setNewsItems(data || []);
    } catch (error) {
      console.error('Error fetching news items:', error);
      toast({
        title: 'خطأ في تحميل الأخبار',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingNews(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!canModify) {
      toast({
        title: 'رفض الوصول',
        description: 'ليس لديك صلاحية للوصول إلى هذه الصفحة.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }
    fetchNewsItems();
  }, [fetchNewsItems, canModify, navigate, authLoading]);

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;

    try {
      const { error } = await supabase.from('news_updates').delete().eq('id', id);
      if (error) throw error;

      toast({ title: 'تم حذف الخبر بنجاح' });
      await fetchNewsItems();
    } catch (error) {
      console.error('Error deleting news item:', error);
      toast({
        title: 'خطأ في الحذف',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleFormSuccess = async () => {
    handleFormClose();
    await fetchNewsItems();
  };

  const handleLogout = async () => {
    await signOut();
    toast({ title: 'تم تسجيل الخروج بنجاح' });
    navigate('/');
  };

  // Filter news items
  const filteredNews = newsItems.filter((item) => {
    const search = (searchQuery || '').toLowerCase();
    const matchesSearch =
      item.title?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search);
    const matchesSection = !filterSection || item.section === filterSection;
    const matchesActive =
      filterActive === '' ||
      (filterActive === 'active' && item.is_active) ||
      (filterActive === 'inactive' && !item.is_active);

    return matchesSearch && matchesSection && matchesActive;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <h1 className="text-4xl font-bold text-gray-900">مدير الأخبار والتحديثات</h1>
          <div className="flex gap-3 items-center">
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة خبر جديد
            </Button>
            <Button onClick={handleLogout} variant="destructive" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">البحث</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن خبر..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع الأقسام</option>
                <option value="main">الرئيسي</option>
                <option value="beauty">جمال</option>
                <option value="pc">أجهزة كمبيوتر</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع الحالات</option>
                <option value="active">مفعل</option>
                <option value="inactive">معطل</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">إجراء</label>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setFilterSection('');
                  setFilterActive('');
                }}
                variant="outline"
                className="w-full"
              >
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </div>

        {/* News Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loadingNews ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500">جاري تحميل الأخبار...</p>
            </div>
          ) : filteredNews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الرقم</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">العنوان</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الصورة</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">القسم</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الترتيب</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">التاريخ</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNews.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.title}</td>
                      <td className="px-6 py-4 text-sm">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="h-12 w-12 object-cover rounded"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {item.section === 'main'
                            ? 'الرئيسي'
                            : item.section === 'beauty'
                            ? 'جمال'
                            : 'أجهزة كمبيوتر'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.display_order}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.is_active ? 'مفعل ✓' : 'معطل ✗'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(item.created_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-blue-100 rounded text-blue-600 transition"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-red-100 rounded text-red-600 transition"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">لا توجد أخبار حاليًا</p>
            </div>
          )}
        </div>

        {/* Stats */}
        {newsItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">إجمالي الأخبار</p>
              <p className="text-3xl font-bold text-gray-900">{newsItems.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">مفعل</p>
              <p className="text-3xl font-bold text-green-600">
                {newsItems.filter((n) => n.is_active).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">معطل</p>
              <p className="text-3xl font-bold text-gray-600">
                {newsItems.filter((n) => !n.is_active).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">مع صور</p>
              <p className="text-3xl font-bold text-blue-600">
                {newsItems.filter((n) => n.image_url).length}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'تعديل الخبر' : 'إضافة خبر جديد'}</DialogTitle>
          </DialogHeader>
          <NewsUpdateForm
            editingItem={editingItem}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsUpdatesPage;
