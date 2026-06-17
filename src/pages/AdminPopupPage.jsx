import { useState, useMemo } from 'react';
import { Plus, LayoutGrid, Eye, Users, BarChart3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PopupForm } from '@/components/admin/PopupForm';
import { PopupCard } from '@/components/admin/PopupCard';
import { PopupFormPreview } from '@/components/popup/PopupFormPreview';
import { PopupPreview } from '@/components/admin/PopupPreview';
import { StatsCard } from '@/components/admin/StatsCard';
import { BucketAccessDiagnostic } from '@/components/BucketAccessDiagnostic';
import {
  usePopupsWithStats,
  useCreatePopup,
  useUpdatePopup,
  useDeletePopup,
} from '@/hooks/usePopupHero';

const AdminPopupPage = () => {
  const { data: popups, isLoading, error } = usePopupsWithStats();
  const createPopup = useCreatePopup();
  const updatePopup = useUpdatePopup();
  const deletePopup = useDeletePopup();

  // Log any errors with detailed debugging
  if (error) {
    console.error('❌ Error loading popups:', error);
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    console.error('   Details:', error.details);
    if (error.message?.includes('RLS') || error.message?.includes('permission')) {
      console.error('   FIX: Run POPUP_VIEWS_RLS_FIX.sql in Supabase SQL Editor');
      console.error('   URL: Check POPUP_VIEWS_RLS_FIX.sql file');
    }
  }

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formDataForPreview, setFormDataForPreview] = useState({});
  const [previewPopup, setPreviewPopup] = useState(null);

  const stats = useMemo(() => {
    if (!popups) return { total: 0, active: 0 };
    return {
      total: popups.length,
      active: popups.filter((p) => p.is_active).length,
    };
  }, [popups]);

  const handleCreate = (data) => {
    createPopup.mutate(data, {
      onSuccess: () => {
        setIsFormOpen(false);
      },
    });
  };

  const handleUpdate = (data) => {
    if (!editingPopup) return;
    updatePopup.mutate(
      { id: editingPopup.id, ...data },
      {
        onSuccess: () => {
          setEditingPopup(null);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deletePopup.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
      },
    });
  };

  const handleToggleActive = (popup) => {
    updatePopup.mutate({ id: popup.id, is_active: !popup.is_active });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/60">
              <LayoutGrid className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl">إدارة الإعلانات</h1>
              <p className="text-sm text-muted-foreground">نظام إدارة الإعلانات المنبثقة</p>
            </div>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2 gradient-primary">
            <Plus className="h-4 w-4" />
            إنشاء إعلان
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <BucketAccessDiagnostic />

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatsCard
            title="إجمالي الإعلانات"
            value={stats.total}
            icon={LayoutGrid}
          />
          <StatsCard
            title="نشط الآن"
            value={stats.active}
            icon={BarChart3}
          />
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-4">جميع الإعلانات</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : popups && popups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popups.map((popup) => (
                <PopupCard
                  key={popup.id}
                  popup={popup}
                  onEdit={setEditingPopup}
                  onDelete={setDeleteId}
                  onToggleActive={handleToggleActive}
                  onPreview={setPreviewPopup}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-xl border border-dashed">
              <div className="p-4 rounded-full bg-muted inline-block mb-4">
                <LayoutGrid className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">لا توجد إعلانات حتى الآن</h3>
              <p className="text-muted-foreground mb-4">
                أنشئ إعلانك الأول للبدء
              </p>
              <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                إنشاء إعلان
              </Button>
            </div>
          )}
        </section>
      </main>

      {(isFormOpen || editingPopup) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-background z-10">
              <h2 className="font-display text-xl">
                {editingPopup ? 'تعديل الإعلان' : 'إنشاء إعلان جديد'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingPopup(null);
                  setFormDataForPreview({});
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-hidden flex gap-4 p-4">
              {/* Form Section */}
              <div className="flex-1 overflow-y-auto pr-4">
                <PopupForm
                  popup={editingPopup}
                  onSubmit={editingPopup ? handleUpdate : handleCreate}
                  onCancel={() => {
                    setIsFormOpen(false);
                    setEditingPopup(null);
                    setFormDataForPreview({});
                  }}
                  isLoading={createPopup.isPending || updatePopup.isPending}
                  onFormDataChange={setFormDataForPreview}
                />
              </div>

              {/* Preview Section */}
              <div className="w-80 hidden lg:flex flex-col border-r border-input pl-4">
                <PopupFormPreview formData={formDataForPreview} />
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <div className="p-6 space-y-4">
              <h2 className="font-display font-semibold text-lg">حذف الإعلان</h2>
              <p className="text-sm text-muted-foreground">
                هل أنت متأكد من رغبتك في حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteId(null)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deletePopup.isPending}
                  className="flex-1"
                >
                  حذف
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {previewPopup && (
        <PopupPreview
          popup={previewPopup}
          onClose={() => setPreviewPopup(null)}
        />
      )}
    </div>
  );
};

export default AdminPopupPage;
