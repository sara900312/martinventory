import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

const NewsUpdateForm = ({ editingItem, onSuccess, onCancel }) => {
  const { supabase } = useSupabase();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    section: 'main',
    display_order: 1,
    is_active: true,
    link: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with editing data
  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title || '',
        description: editingItem.description || '',
        image_url: editingItem.image_url || '',
        section: editingItem.section || 'main',
        display_order: editingItem.display_order || 1,
        is_active: editingItem.is_active !== undefined ? editingItem.is_active : true,
        link: editingItem.link || '',
      });
      setImagePreview(editingItem.image_url || '');
    }
  }, [editingItem]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطأ',
        description: 'يجب اختيار ملف صورة',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'خطأ',
        description: 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت',
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!imageFile) return formData.image_url;

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webp`;
      const filePath = `news/${fileName}`;

      // Convert image to WebP
      const webpBlob = await convertToWebP(imageFile);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('news')
        .upload(filePath, webpBlob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage.from('news').getPublicUrl(filePath);

      return urlData?.publicUrl || '';
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'خطأ في رفع الصورة',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const convertToWebP = async (file, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to convert to WebP'));
              }
            },
            'image/webp',
            quality
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      toast({
        title: 'خطأ',
        description: 'العنوان مطلوب',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: 'خطأ',
        description: 'الوصف مطلوب',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = formData.image_url;

      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const dataToSubmit = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        image_url: imageUrl,
        section: formData.section,
        display_order: parseInt(formData.display_order, 10),
        is_active: formData.is_active,
        link: formData.link.trim() || null,
      };

      if (editingItem) {
        // Update existing news item
        const { error } = await supabase
          .from('news_updates')
          .update(dataToSubmit)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({ title: 'تم تحديث الخبر بنجاح' });
      } else {
        // Insert new news item
        const { error } = await supabase
          .from('news_updates')
          .insert([dataToSubmit]);

        if (error) throw error;
        toast({ title: 'تم إضافة الخبر بنجاح' });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving news item:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">العنوان *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="أدخل عنوان الخبر"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">الوصف *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="أدخل وصف الخبر"
          rows="4"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">الصورة</label>
        <div className="space-y-4">
          {imagePreview && (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="معاينة"
                className="h-32 w-32 object-cover rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview('');
                  setImageFile(null);
                  if (!editingItem) {
                    setFormData((prev) => ({ ...prev, image_url: '' }));
                  }
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition bg-gray-50 hover:bg-blue-50">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {imagePreview ? 'اختر صورة أخرى' : 'اختر صورة من الجهاز'}
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">القسم *</label>
        <select
          name="section"
          value={formData.section}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="main">الرئيسي</option>
          <option value="beauty">جمال</option>
          <option value="pc">أجهزة كمبيوتر</option>
        </select>
      </div>

      {/* Display Order */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ترتيب العرض *</label>
        <input
          type="number"
          name="display_order"
          value={formData.display_order}
          onChange={handleInputChange}
          placeholder="1"
          min="1"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <p className="text-xs text-gray-500 mt-1">يتم عرض الأخبار بترتيب تصاعدي</p>
      </div>

      {/* Link (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">رابط اختياري</label>
        <input
          type="url"
          name="link"
          value={formData.link}
          onChange={handleInputChange}
          placeholder="https://example.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Is Active */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="is_active"
          id="is_active"
          checked={formData.is_active}
          onChange={handleInputChange}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
          تفعيل هذا الخبر
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
        >
          {isSubmitting || isUploading ? 'جاري الحفظ...' : editingItem ? 'حفظ التعديلات' : 'إضافة الخبر'}
        </button>
      </div>
    </form>
  );
};

export default NewsUpdateForm;
