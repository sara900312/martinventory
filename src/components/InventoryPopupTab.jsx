import { useState, useMemo } from 'react';
import { Plus, Eye, Edit2, Trash2, BarChart3, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PopupForm } from '@/components/admin/PopupForm';
import { PopupCard } from '@/components/admin/PopupCard';
import { PopupPreview } from '@/components/admin/PopupPreview';
import {
  useAllPopups,
  useCreatePopup,
  useUpdatePopup,
  useDeletePopup,
} from '@/hooks/usePopupHero';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const InventoryPopupTab = () => {
  const { data: popups = [], isLoading } = useAllPopups();
  const createPopup = useCreatePopup();
  const updatePopup = useUpdatePopup();
  const deletePopup = useDeletePopup();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
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

  const handlePreview = (popup) => {
    // Close and reopen to force re-render
    setPreviewPopup(null);
    setTimeout(() => {
      setPreviewPopup(popup);
    }, 50);
  };

  if (isFormOpen) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">
            {editingPopup ? 'تعديل الإعلان' : 'إنشاء إعلان جديد'}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsFormOpen(false);
              setEditingPopup(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <PopupForm
          popup={editingPopup}
          onSubmit={editingPopup ? handleUpdate : handleCreate}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingPopup(null);
          }}
          isLoading={createPopup.isPending || updatePopup.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold mb-2">إدارة الإعلانات المنبثقة</h2>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-600">{stats.total}</span>
              <span className="text-gray-600">إجمالي الإعلانات</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-600">{stats.active}</span>
              <span className="text-gray-600">نشط الآن</span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => {
            setIsFormOpen(true);
            setEditingPopup(null);
          }}
          className="inventory-button-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          إضافة إعلان جديد
        </Button>
      </div>

      {/* Popups List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : popups && popups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popups.map((popup) => (
            <PopupCard
              key={popup.id}
              popup={popup}
              onEdit={(p) => {
                setEditingPopup(p);
                setIsFormOpen(true);
              }}
              onDelete={setDeleteId}
              onToggleActive={handleToggleActive}
              onPreview={handlePreview}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="font-semibold text-lg mb-2">لا توجد إعلانات منبثقة</h3>
            <p className="text-gray-600 mb-6 text-center">
              ابدأ بإنشاء إعلانك الأول لجذب انتباه العملاء
            </p>
            <Button
              onClick={() => {
                setIsFormOpen(true);
                setEditingPopup(null);
              }}
              className="inventory-button-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              إضافة الإعلان الأول
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الإعلان</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Modal */}
      {previewPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPreviewPopup(null)}
              className="absolute top-4 right-4 bg-white rounded-full z-10 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
            <PopupPreview popup={previewPopup} />
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPopupTab;
