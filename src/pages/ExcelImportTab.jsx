import React from 'react';
import { AlertCircle } from 'lucide-react';

const ExcelImportTab = ({ onProductsAdded }) => {
  return (
    <div className="p-8 text-center bg-gray-50 rounded-lg">
      <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">استيراد ملفات Excel</h3>
      <p className="text-gray-600">
        هذه الميزة سيتم إضافتها قريباً. يمكنك إضافة المنتجات يدوياً من خلال الواجهة الأساسية.
      </p>
    </div>
  );
};

export default ExcelImportTab;
