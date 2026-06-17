import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getAttributesForCategory,
  getProductTypesForCategory,
  getBenefitsForCategory,
  getIssuesForCategory,
} from '@/lib/smartSearchAttributes';
import './AdminAttributesEditor.css';

/**
 * Admin Attributes Editor Component
 * Used in product edit forms to manage smart search attributes
 *
 * @param {object} props
 * @param {string} props.categoryId - Product category (hair_care, skincare)
 * @param {object} props.currentAttributes - Current product attributes
 * @param {function} props.onAttributesChange - Callback when attributes change
 */
const AdminAttributesEditor = ({
  categoryId = 'hair_care',
  currentAttributes = {},
  onAttributesChange = () => {},
}) => {
  const [expandedSections, setExpandedSections] = useState({
    productType: true,
    issues: false,
    benefits: false,
    hairTypes: false,
    skinTypes: false,
  });

  const attributes = getAttributesForCategory(categoryId);

  if (!attributes) {
    return (
      <div className="admin-attributes-error">
        <p>لا توجد خصائص متاحة لهذه الفئة</p>
      </div>
    );
  }

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle selection change
  const handleAttributeToggle = (attributeType, attributeId) => {
    const currentList = currentAttributes[attributeType] || [];
    let newList;

    if (currentList.includes(attributeId)) {
      newList = currentList.filter(id => id !== attributeId);
    } else {
      newList = [...currentList, attributeId];
    }

    onAttributesChange({
      ...currentAttributes,
      [attributeType]: newList,
    });
  };

  // Clear all for a section
  const handleClearSection = (attributeType) => {
    onAttributesChange({
      ...currentAttributes,
      [attributeType]: [],
    });
  };

  return (
    <div className="admin-attributes-editor">
      <div className="attributes-editor-header">
        <h3 className="attributes-editor-title">خصائص البحث الذكي</h3>
        <p className="attributes-editor-description">
          اختر الخصائص التي يطابقها هذا المنتج لتحسين نتائج البحث الذكي
        </p>
      </div>

      {/* Product Type Section */}
      {attributes.productTypes && (
        <AttributeSection
          title="نوع المنتج"
          subtitle="اختر نوع المنتج"
          isExpanded={expandedSections.productType}
          onToggle={() => toggleSection('productType')}
          onClear={() => handleClearSection('product_type')}
          selectedCount={(currentAttributes.product_type || []).length}
        >
          <AttributeCheckboxList
            attributes={attributes.productTypes}
            selected={currentAttributes.product_type || []}
            onChange={(id) => handleAttributeToggle('product_type', id)}
          />
        </AttributeSection>
      )}

      {/* Issues Solved Section */}
      {attributes.issuesSolved && (
        <AttributeSection
          title="المشاكل المحلولة"
          subtitle="ما هي المشاكل التي يحل هذا المنتج؟"
          isExpanded={expandedSections.issues}
          onToggle={() => toggleSection('issues')}
          onClear={() => handleClearSection('issues_solved')}
          selectedCount={(currentAttributes.issues_solved || []).length}
        >
          <AttributeCheckboxList
            attributes={attributes.issuesSolved}
            selected={currentAttributes.issues_solved || []}
            onChange={(id) => handleAttributeToggle('issues_solved', id)}
          />
        </AttributeSection>
      )}

      {/* Benefits Section */}
      {attributes.benefits && (
        <AttributeSection
          title="الفوائد"
          subtitle="ما هي الفوائد التي يقدمها هذا المنتج؟"
          isExpanded={expandedSections.benefits}
          onToggle={() => toggleSection('benefits')}
          onClear={() => handleClearSection('benefits')}
          selectedCount={(currentAttributes.benefits || []).length}
        >
          <AttributeCheckboxList
            attributes={attributes.benefits}
            selected={currentAttributes.benefits || []}
            onChange={(id) => handleAttributeToggle('benefits', id)}
          />
        </AttributeSection>
      )}

      {/* Hair Types Section (for hair care products) */}
      {categoryId === 'hair_care' && attributes.hairTypes && (
        <AttributeSection
          title="أنواع الشعر"
          subtitle="ما هي أنواع الشعر المناسبة لهذا المنتج؟"
          isExpanded={expandedSections.hairTypes}
          onToggle={() => toggleSection('hairTypes')}
          onClear={() => handleClearSection('suitable_hair_types')}
          selectedCount={(currentAttributes.suitable_hair_types || []).length}
        >
          <AttributeCheckboxList
            attributes={attributes.hairTypes}
            selected={currentAttributes.suitable_hair_types || []}
            onChange={(id) => handleAttributeToggle('suitable_hair_types', id)}
          />
        </AttributeSection>
      )}

      {/* Skin Types Section (for skincare products) */}
      {categoryId === 'skincare' && attributes.skinTypes && (
        <AttributeSection
          title="أنواع البشرة"
          subtitle="ما هي أنواع البشرة المناسبة لهذا المنتج؟"
          isExpanded={expandedSections.skinTypes}
          onToggle={() => toggleSection('skinTypes')}
          onClear={() => handleClearSection('suitable_skin_types')}
          selectedCount={(currentAttributes.suitable_skin_types || []).length}
        >
          <AttributeCheckboxList
            attributes={attributes.skinTypes}
            selected={currentAttributes.suitable_skin_types || []}
            onChange={(id) => handleAttributeToggle('suitable_skin_types', id)}
          />
        </AttributeSection>
      )}

      {/* Info Box */}
      <div className="attributes-info-box">
        <p>
          <strong>ملاحظة:</strong> المنتج سيظهر في نتائج البحث الذكي فقط إذا طابقت <strong>جميع</strong> المعايير المحددة.
        </p>
      </div>
    </div>
  );
};

/**
 * Collapsible Attribute Section
 */
const AttributeSection = ({
  title,
  subtitle,
  isExpanded,
  onToggle,
  onClear,
  selectedCount,
  children,
}) => (
  <div className="attribute-section">
    <div className="section-header">
      <div className="section-header-left">
        <button
          onClick={onToggle}
          className="section-toggle-btn"
        >
          <ChevronDown
            size={20}
            className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}
          />
        </button>
        <div>
          <h4 className="section-title">{title}</h4>
          <p className="section-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="section-header-right">
        {selectedCount > 0 && (
          <span className="selected-badge">{selectedCount}</span>
        )}
        {selectedCount > 0 && (
          <button
            onClick={onClear}
            className="clear-section-btn"
            title="مسح الكل"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>

    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="section-content"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

/**
 * Checkbox List for Attributes
 */
const AttributeCheckboxList = ({
  attributes,
  selected,
  onChange,
}) => (
  <div className="checkbox-list">
    {attributes.map(attribute => (
      <label key={attribute.id} className="checkbox-item">
        <input
          type="checkbox"
          checked={selected.includes(attribute.id)}
          onChange={() => onChange(attribute.id)}
          className="checkbox-input"
        />
        <span className="checkbox-label">
          <span className="label-name">{attribute.ar}</span>
          <span className="label-en">({attribute.en})</span>
        </span>
      </label>
    ))}
  </div>
);

export default AdminAttributesEditor;
