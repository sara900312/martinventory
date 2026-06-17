import React from 'react';
import { Cloud, Flame, Leaf, Flower } from 'lucide-react';

const ProductSeasonsSettings = ({
  formData,
  onFormDataChange,
  isLoading = false,
  category = ''
}) => {
  // Only show for perfume category
  const shouldShowSeasons = () => {
    if (!category) return false;
    return category.toLowerCase() === 'perfumes';
  };

  // Season options with icons and translations
  const seasonOptions = [
    { value: 'summer', label: '🌿 صيفي', icon: Cloud },
    { value: 'winter', label: '🔥 شتوي', icon: Flame },
    { value: 'autumn', label: '🍂 خريفي', icon: Leaf },
    { value: 'spring', label: '🌸 ربيعي', icon: Flower },
  ];

  // Handle season selection
  const toggleSeason = (seasonValue) => {
    const currentSeasons = formData.seasons || [];
    const updatedSeasons = currentSeasons.includes(seasonValue)
      ? currentSeasons.filter(s => s !== seasonValue)
      : [...currentSeasons, seasonValue];

    onFormDataChange({
      seasons: updatedSeasons
    });
  };

  if (!shouldShowSeasons()) {
    return null;
  }

  return (
    <div className="inventory-section-border p-6 rounded-lg bg-gradient-to-br from-amber-50/30 to-orange-50/30">
      <h3 className="inventory-section-title mb-6 flex items-center gap-2">
        🌸 المواسم المناسبة للعطر
      </h3>

      <p className="text-sm text-gray-600 mb-4">
        اختر المواسم التي يناسبها هذا العطر (يمكن اختيار أكثر من موسم)
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {seasonOptions.map(season => (
          <button
            key={season.value}
            type="button"
            onClick={() => toggleSeason(season.value)}
            disabled={isLoading}
            className={`p-4 rounded-lg border-2 transition-all duration-200 font-medium text-sm
              ${
                (formData.seasons || []).includes(season.value)
                  ? 'border-amber-500 bg-amber-100 text-amber-900 shadow-md'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-amber-300'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
            `}
          >
            {season.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        بدون اختيار = المنتج يظهر في كل المواسم
      </p>
    </div>
  );
};

export default ProductSeasonsSettings;
