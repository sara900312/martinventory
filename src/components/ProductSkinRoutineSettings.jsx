import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { ROUTINE_TYPE_OPTIONS } from '@/lib/routineTypeConstants';

const ProductSkinRoutineSettings = ({
  formData,
  onFormDataChange,
  isLoading = false,
  category = '' // Category from product form
}) => {
  const { supabase } = useSupabase();
  const [skinProblems, setSkinProblems] = useState([]);
  const [loadingSkinProblems, setLoadingSkinProblems] = useState(false);

  // Categories that support routine type (Skincare and Haircare)
  const routineTypeSupportedCategories = ['skincare', 'hair_care'];

  // Use options from constants
  const routineTypes = ROUTINE_TYPE_OPTIONS;

  // Check if current category supports routine type
  const shouldShowRoutineType = () => {
    if (!category) return false;
    return routineTypeSupportedCategories.includes(category.toLowerCase());
  };

  // Map category to tool_title for filtering
  const getCategoryToolTitle = (cat) => {
    const mapping = {
      'hair': 'العناية بالشعر',
      'hair_care': 'العناية بالشعر',
      'skincare': 'العناية بالبشرة',
      'skin_care': 'العناية بالبشرة',
    };
    return mapping[cat?.toLowerCase()] || null;
  };

  // Fetch skin problems from database - filtered by category
  useEffect(() => {
    const fetchSkinProblems = async () => {
      if (!supabase || !category) return;

      setLoadingSkinProblems(true);
      try {
        const toolTitle = getCategoryToolTitle(category);

        if (!toolTitle) {
          setSkinProblems([]);
          return;
        }

        const { data, error } = await supabase
          .from('skin_problems')
          .select('id,name_ar,name_en,emoji,description,card_image_url,morning_image_url,evening_image_url,special_care_image_url,tool_title')
          .eq('tool_title', toolTitle)
          .order('name_ar', { ascending: true });

        if (error) {
          console.error('Error fetching skin problems:', error);
        } else {
          setSkinProblems(data || []);
        }
      } catch (error) {
        console.error('Error in fetchSkinProblems:', error);
      } finally {
        setLoadingSkinProblems(false);
      }
    };

    fetchSkinProblems();
  }, [supabase, category]);

  // Handle skin problem selection - store by ID for compatibility with recommendations
  const toggleSkinProblem = (problemId) => {
    const currentProblems = formData.skin_problems || [];
    const updatedProblems = currentProblems.includes(problemId)
      ? currentProblems.filter(id => id !== problemId)
      : [...currentProblems, problemId];

    onFormDataChange({
      skin_problems: updatedProblems
    });
  };

  // Handle routine type change - accept Arabic selections, store as-is for processing later
  const handleRoutineTypeChange = (e) => {
    const value = e.target.value;
    // Store the Arabic selection (or empty) - it will be converted to DB value on submit
    onFormDataChange({
      routine_type: value
    });
  };

  // Handle short description changes
  const handleShortDescriptionChange = (e) => {
    const { name, value } = e.target;
    onFormDataChange({
      [name]: value
    });
  };

  return (
    <div className="inventory-section-border p-6 rounded-lg bg-gradient-to-br from-pink-50/30 to-rose-50/30">
      <h3 className="inventory-section-title mb-6 flex items-center gap-2">
        🧴 Skin & Routine Settings
      </h3>

      {/* Skin Problems Multi-Select - Only for Skincare and Haircare */}
      {shouldShowRoutineType() && (
        <div className="inventory-form-group mb-6">
          <label className="inventory-form-label mb-3">مشاكل البشرة (Skin Problems)</label>
          {loadingSkinProblems ? (
            <p className="text-gray-600 text-sm">جاري تحميل مشاكل البشرة...</p>
          ) : skinProblems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-white border border-gray-200 rounded-lg">
              {skinProblems.map(problem => (
                <label key={problem.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-pink-50 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={(formData.skin_problems || []).includes(problem.id)}
                    onChange={() => toggleSkinProblem(problem.id)}
                    className="inventory-checkbox w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{problem.name_ar} ({problem.name_en})</span>
                  {problem.emoji && <span className="text-lg">{problem.emoji}</span>}
                </label>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">لا توجد مشاكل بشرة متاحة</p>
          )}
        </div>
      )}

      {/* Routine Type Selection - Only for Skincare and Haircare */}
      {shouldShowRoutineType() && (
        <div className="inventory-form-group mb-6">
          <label className="inventory-form-label mb-3">نوع الروتين (Routine Type)</label>
          <select
            value={formData.routine_type || ''}
            onChange={handleRoutineTypeChange}
            disabled={isLoading}
            className="inventory-select w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {routineTypes.map(routine => (
              <option key={routine.value} value={routine.value}>
                {routine.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">اختر نوع الروتين المناسب للمنتج</p>
        </div>
      )}

      {/* Short Descriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="inventory-form-group">
          <label className="inventory-form-label">وصف قصير (عربي)</label>
          <textarea
            name="short_description"
            value={formData.short_description || ''}
            onChange={handleShortDescriptionChange}
            placeholder="وصف قصير للمنتج باللغة العربية (مثال: يعالج حب الشباب بفعالية)"
            className="inventory-textarea"
            rows="3"
            maxLength="200"
          />
          <p className="text-xs text-gray-500 mt-1">
            {(formData.short_description || '').length} / 200 حرف
          </p>
        </div>

        <div className="inventory-form-group">
          <label className="inventory-form-label">Short Description (English)</label>
          <textarea
            name="short_description_en"
            value={formData.short_description_en || ''}
            onChange={handleShortDescriptionChange}
            placeholder="Short description in English (e.g., Effectively treats acne)"
            className="inventory-textarea"
            rows="3"
            maxLength="200"
          />
          <p className="text-xs text-gray-500 mt-1">
            {(formData.short_description_en || '').length} / 200 characters
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductSkinRoutineSettings;
