import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Package,
  Wrench,
  Smartphone,
  Flame,
  Sparkles,
  Droplets,
  Headphones,
  Tv,
  Gamepad2,
  Watch,
  ShoppingBag,
  Folder,
  Gem,
  ShieldCheck,
  Layers,
  Zap,
  CheckCircle,
  X,
  Grid,
  CornerDownRight,
  ListPlus,
  ChevronUp,
  ChevronDown,
  Hash,
} from 'lucide-react';

const ICON_MAP = {
  Wrench,
  Smartphone,
  Flame,
  Sparkles,
  Droplets,
  Package,
  Tag,
  Headphones,
  Tv,
  Gamepad2,
  Watch,
  ShoppingBag,
  Folder,
  Gem,
  ShieldCheck,
  Layers,
  Zap,
};

const COLOR_PRESETS = [
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#ef4444', // Red
];

export default function CategoriesView({ isEmbedded = false }) {
  const {
    categories,
    products,
    addCategory,
    updateCategory,
    deleteCategory,
    moveCategory,
    addSubCategory,
    renameSubCategory,
    removeSubCategory,
    formatMoney,
    t,
    lang,
  } = useApp();

  const [modalData, setModalData] = useState({ open: false, category: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, category: null });
  
  // Dedicated Edit Subcategory Modal
  const [editSubCatModal, setEditSubCatModal] = useState({
    open: false,
    categoryId: null,
    categoryColor: '',
    categoryLabel: '',
    oldName: '',
    newName: '',
  });

  // Modal tag edit state
  const [editingModalTagIndex, setEditingModalTagIndex] = useState(null);
  const [editingModalTagValue, setEditingModalTagValue] = useState('');

  // Card inline quick-add subcategory input state: { [catId]: string }
  const [quickSubCatInputs, setQuickSubCatInputs] = useState({});

  // Modal form state
  const [formData, setFormData] = useState({
    label: '',
    icon: 'Package',
    color: '#6366f1',
    description: '',
    order: 1,
    subCategories: [],
  });

  const [newSubCatTag, setNewSubCatTag] = useState('');

  const handleOpenAdd = () => {
    const maxOrder = categories.reduce((max, c) => Math.max(max, Number(c.order) || 0), 0);
    setFormData({
      label: '',
      icon: 'Package',
      color: '#6366f1',
      description: '',
      order: maxOrder + 1,
      subCategories: [],
    });
    setNewSubCatTag('');
    setEditingModalTagIndex(null);
    setModalData({ open: true, category: null });
  };

  const handleOpenEdit = (category) => {
    const defaultIdx = categories.findIndex((c) => c.id === category.id) + 1;
    setFormData({
      label: category.label || '',
      icon: category.icon || 'Package',
      color: category.color || '#6366f1',
      description: category.description || '',
      order: category.order !== undefined && category.order !== null ? Number(category.order) : defaultIdx,
      subCategories: Array.isArray(category.subCategories) ? [...category.subCategories] : [],
    });
    setNewSubCatTag('');
    setEditingModalTagIndex(null);
    setModalData({ open: true, category });
  };

  const handleAddSubCatToModal = (e) => {
    e?.preventDefault();
    const val = newSubCatTag.trim();
    if (!val) return;
    if (!formData.subCategories.includes(val)) {
      setFormData((prev) => ({
        ...prev,
        subCategories: [...prev.subCategories, val],
      }));
    }
    setNewSubCatTag('');
  };

  const handleRemoveSubCatFromModal = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      subCategories: prev.subCategories.filter((s) => s !== tagToRemove),
    }));
  };

  const handleStartEditModalTag = (index, currentVal) => {
    setEditingModalTagIndex(index);
    setEditingModalTagValue(currentVal);
  };

  const handleSaveModalTagEdit = (index) => {
    const trimmed = editingModalTagValue.trim();
    if (!trimmed) return;
    setFormData((prev) => {
      const updated = [...prev.subCategories];
      updated[index] = trimmed;
      return { ...prev, subCategories: updated };
    });
    setEditingModalTagIndex(null);
    setEditingModalTagValue('');
  };

  const handleQuickAddSubCat = (catId, e) => {
    e.preventDefault();
    const val = (quickSubCatInputs[catId] || '').trim();
    if (!val) return;
    addSubCategory(catId, val);
    setQuickSubCatInputs((prev) => ({ ...prev, [catId]: '' }));
    toast.success(
      lang === 'ar'
        ? `تمت إضافة القسم الفرعي "${val}"`
        : lang === 'en'
        ? `Sub-category "${val}" added`
        : `Sous-catégorie "${val}" ajoutée !`
    );
  };

  const handleQuickRemoveSubCat = (catId, subCatName) => {
    removeSubCategory(catId, subCatName);
    toast.success(
      lang === 'ar'
        ? `تم حذف القسم الفرعي "${subCatName}"`
        : lang === 'en'
        ? `Sub-category "${subCatName}" removed`
        : `Sous-catégorie "${subCatName}" supprimée.`
    );
  };

  const handleConfirmRenameSubCat = (e) => {
    e?.preventDefault();
    const { categoryId, oldName, newName } = editSubCatModal;
    const trimmed = (newName || '').trim();
    if (!trimmed) return;

    if (trimmed !== oldName) {
      renameSubCategory(categoryId, oldName, trimmed);
      toast.success(
        lang === 'ar'
          ? `تم تعديل القسم الفرعي إلى "${trimmed}" وتحديث المنتجات المرتبطة`
          : lang === 'en'
          ? `Sub-category renamed to "${trimmed}" and products updated`
          : `Sous-catégorie renommée en "${trimmed}" et articles associés mis à jour !`
      );
    }
    setEditSubCatModal({ open: false, categoryId: null, categoryColor: '', categoryLabel: '', oldName: '', newName: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.label.trim()) return;

    if (modalData.category) {
      updateCategory(modalData.category.id, formData);
      toast.success(
        lang === 'ar'
          ? `تم تحديث القسم "${formData.label}" بنجاح`
          : lang === 'en'
          ? `Category "${formData.label}" updated successfully`
          : `Catégorie "${formData.label}" modifiée avec succès !`
      );
    } else {
      addCategory(formData);
      toast.success(
        lang === 'ar'
          ? `تمت إضافة القسم "${formData.label}" بنجاح`
          : lang === 'en'
          ? `Category "${formData.label}" added successfully`
          : `Catégorie "${formData.label}" ajoutée avec succès !`
      );
    }
    setModalData({ open: false, category: null });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.category) return;
    const catToDelete = deleteModal.category;
    deleteCategory(catToDelete.id);
    toast.success(
      lang === 'ar'
        ? `تم حذف القسم "${catToDelete.label}" بنجاح`
        : lang === 'en'
        ? `Category "${catToDelete.label}" deleted successfully`
        : `Catégorie "${catToDelete.label}" supprimée avec succès !`
    );
    setDeleteModal({ open: false, category: null });
  };

  const activeAttachedCount = deleteModal.category
    ? products.filter((p) => p.category === deleteModal.category.id).length
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)' }}>
            <Grid size={24} className="text-primary" />
            {t('categoriesTitle')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
            {t('categoriesSubtitle')}
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          {t('newCategoryBtn')}
        </button>
      </div>

      {/* Categories Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {categories.map((cat, idx) => {
          const IconComponent = ICON_MAP[cat.icon] || Package;
          const catProducts = products.filter((p) => p.category === cat.id);
          const totalStock = catProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
          const totalValue = catProducts.reduce(
            (sum, p) => sum + (Number(p.sellingPrice) || 0) * (Number(p.stock) || 0),
            0
          );
          const subCats = Array.isArray(cat.subCategories) ? cat.subCategories : [];
          const currentOrder = cat.order !== undefined && cat.order !== null ? cat.order : idx + 1;

          return (
            <div
              key={cat.id}
              className="ui-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: `4px solid ${cat.color || 'var(--accent-primary)'}`,
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.25rem',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Header with Icon & Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {/* Move Up/Down Quick Reorder Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        type="button"
                        className="btn-icon btn-secondary"
                        style={{ width: '22px', height: '22px', padding: 0, opacity: idx === 0 ? 0.35 : 1 }}
                        disabled={idx === 0}
                        onClick={() => moveCategory(cat.id, 'up')}
                        title={t('moveUp')}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-secondary"
                        style={{ width: '22px', height: '22px', padding: 0, opacity: idx === categories.length - 1 ? 0.35 : 1 }}
                        disabled={idx === categories.length - 1}
                        onClick={() => moveCategory(cat.id, 'down')}
                        title={t('moveDown')}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: `${cat.color || '#6366f1'}20`,
                        color: cat.color || 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{cat.label}</h3>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '0.1rem 0.35rem',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                          }}
                          title={`${t('categoryOrderLabel')}: ${currentOrder}`}
                        >
                          #{currentOrder}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: {cat.id}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      className="btn-icon btn-secondary btn-sm"
                      title={t('edit')}
                      onClick={() => handleOpenEdit(cat)}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="btn-icon btn-danger btn-sm"
                      title={t('delete')}
                      onClick={() => setDeleteModal({ open: true, category: cat })}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {cat.description && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {cat.description}
                  </p>
                )}

                {/* Subcategories Section */}
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <Layers size={14} style={{ color: cat.color || 'var(--accent-primary)' }} />
                      <span>{t('subCategoriesTitle')}</span>
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.7rem',
                          background: `${cat.color || '#6366f1'}22`,
                          color: cat.color || 'var(--accent-primary)',
                          padding: '0.15rem 0.4rem',
                        }}
                      >
                        {subCats.length}
                      </span>
                    </div>
                  </div>

                  {/* Subcategories Chip List */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', minHeight: '26px' }}>
                    {subCats.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {t('noSubCategoriesYet')}
                      </span>
                    ) : (
                      subCats.map((subName) => {
                        const itemsInSubCat = catProducts.filter(
                          (p) => (p.subCategory || '').toLowerCase() === subName.toLowerCase()
                        ).length;

                        return (
                          <span
                            key={subName}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'var(--bg-card)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <span
                              style={{ cursor: 'pointer' }}
                              title={t('editSubCategory')}
                              onClick={() =>
                                setEditSubCatModal({
                                  open: true,
                                  categoryId: cat.id,
                                  categoryColor: cat.color,
                                  categoryLabel: cat.label,
                                  oldName: subName,
                                  newName: subName,
                                })
                              }
                            >
                              {subName}
                            </span>
                            {itemsInSubCat > 0 && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  color: 'var(--text-muted)',
                                  background: 'var(--bg-input)',
                                  borderRadius: '4px',
                                  padding: '0.1rem 0.25rem',
                                }}
                              >
                                {itemsInSubCat}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setEditSubCatModal({
                                  open: true,
                                  categoryId: cat.id,
                                  categoryColor: cat.color,
                                  categoryLabel: cat.label,
                                  oldName: subName,
                                  newName: subName,
                                })
                              }
                              title={t('editSubCategory')}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                lineHeight: 1,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--accent-primary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-muted)';
                              }}
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickRemoveSubCat(cat.id, subName)}
                              title={t('delete')}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                lineHeight: 1,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--accent-danger)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-muted)';
                              }}
                            >
                              <X size={11} />
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>

                  {/* Quick Add Subcategory Form */}
                  <form
                    onSubmit={(e) => handleQuickAddSubCat(cat.id, e)}
                    style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem' }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      placeholder={t('addSubCategoryPlaceholder')}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', height: '28px' }}
                      value={quickSubCatInputs[cat.id] || ''}
                      onChange={(e) => setQuickSubCatInputs({ ...quickSubCatInputs, [cat.id]: e.target.value })}
                    />
                    <button
                      type="submit"
                      className="btn btn-outline btn-sm"
                      style={{ height: '28px', padding: '0 0.5rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                      title={t('addSubCategoryBtn')}
                      disabled={!(quickSubCatInputs[cat.id] || '').trim()}
                    >
                      <Plus size={12} />
                      <span>{t('addSubCategoryBtn')}</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Stats Footer */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>{t('productCol')}</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{catProducts.length} {t('categoryArticlesCount')}</strong> ({totalStock} {t('pieces')})
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>{t('categoryStockValuation')}</span>
                  <strong style={{ color: 'var(--accent-success)' }}>{formatMoney(totalValue)}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {modalData.open && (
        <div className="modal-overlay" onClick={() => setModalData({ open: false, category: null })}>
          <div className="modal-content" style={{ maxWidth: '520px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Tag size={20} className="text-primary" />
                {modalData.category ? t('editCategoryModalTitle') : t('newCategoryModalTitle')}
              </h3>
              <button
                className="btn-icon btn-outline"
                onClick={() => setModalData({ open: false, category: null })}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{t('categoryLabel')} *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Pièces Téléphone, Accessoires Mobile, Vape..."
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" title={t('categoryOrderHelp')}>
                      {t('categoryOrderLabel')} *
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      placeholder="1, 2, 3..."
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Subcategories Tag Management */}
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                  }}
                >
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                    <Layers size={15} className="text-primary" />
                    <span>{t('subCategoriesTitle')} ({formData.subCategories.length})</span>
                  </label>
                  
                  {/* Tag List */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', minHeight: '32px' }}>
                    {formData.subCategories.length === 0 ? (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {t('noSubCategoriesYet')}
                      </span>
                    ) : (
                      formData.subCategories.map((tag, idx) => {
                        const isEditing = editingModalTagIndex === idx;

                        if (isEditing) {
                          return (
                            <span
                              key={idx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '6px',
                                background: 'var(--bg-input)',
                                border: `1px solid ${formData.color || 'var(--accent-primary)'}`,
                              }}
                            >
                              <input
                                type="text"
                                value={editingModalTagValue}
                                autoFocus
                                onChange={(e) => setEditingModalTagValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveModalTagEdit(idx);
                                  } else if (e.key === 'Escape') {
                                    setEditingModalTagIndex(null);
                                  }
                                }}
                                style={{
                                  fontSize: '0.78rem',
                                  padding: '0.1rem 0.3rem',
                                  borderRadius: '4px',
                                  border: 'none',
                                  outline: 'none',
                                  background: 'var(--bg-card)',
                                  color: 'var(--text-primary)',
                                  width: '120px',
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveModalTagEdit(idx)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: 'var(--accent-success)',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                                title={t('save')}
                              >
                                <CheckCircle size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingModalTagIndex(null)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                                title={t('cancel')}
                              >
                                <X size={13} />
                              </button>
                            </span>
                          );
                        }

                        return (
                          <span
                            key={tag}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              background: 'var(--bg-card)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleStartEditModalTag(idx, tag)}
                              title={t('editSubCategory')}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--accent-primary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-muted)';
                              }}
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubCatFromModal(tag)}
                              title={t('delete')}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--accent-danger)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-muted)';
                              }}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>

                  {/* Add Tag Input */}
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={t('addSubCategoryPlaceholder')}
                      value={newSubCatTag}
                      onChange={(e) => setNewSubCatTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubCatToModal();
                        }
                      }}
                      style={{ fontSize: '0.82rem' }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleAddSubCatToModal}
                      disabled={!newSubCatTag.trim()}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <Plus size={14} />
                      {t('addSubCategoryBtn')}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ℹ️ {t('subCategoryHint')}
                  </span>
                </div>

                {/* Color Selector */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('categoryColor')}</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: color,
                          border: formData.color === color ? '3px solid #ffffff' : 'none',
                          cursor: 'pointer',
                          outline: formData.color === color ? `2px solid ${color}` : 'none',
                          transition: 'transform 0.15s ease',
                          transform: formData.color === color ? 'scale(1.15)' : 'scale(1)',
                        }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      style={{
                        width: '32px',
                        height: '32px',
                        padding: 0,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: 'transparent',
                      }}
                      title="Couleur personnalisée"
                    />
                  </div>
                </div>

                {/* Icon Selector */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('categoryIcon')}</label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      gap: '0.5rem',
                      maxHeight: '140px',
                      overflowY: 'auto',
                      background: 'var(--bg-input)',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {Object.keys(ICON_MAP).map((iconKey) => {
                      const IconItem = ICON_MAP[iconKey];
                      const isSelected = formData.icon === iconKey;
                      return (
                        <button
                          key={iconKey}
                          type="button"
                          className="btn-icon btn-outline"
                          style={{
                            width: '100%',
                            height: '40px',
                            background: isSelected ? formData.color : 'transparent',
                            color: isSelected ? '#ffffff' : 'inherit',
                            borderColor: isSelected ? formData.color : 'var(--border-color)',
                          }}
                          onClick={() => setFormData({ ...formData, icon: iconKey })}
                        >
                          <IconItem size={18} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('categoryDescLabel')}</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="Ex: Afficheurs, connecteurs, nappes, pièces de réparation..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalData({ open: false, category: null })}
                >
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle size={16} />
                  {modalData.category ? t('save') : t('createCategory')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styled Delete Confirmation Modal for Departments / Categories */}
      {deleteModal.open && deleteModal.category && (
        <ConfirmDeleteModal
          title={`${t('delete')} : "${deleteModal.category.label}"`}
          message={
            activeAttachedCount > 0
              ? (lang === 'ar'
                  ? `تحذير: يحتوي هذا القسم على ${activeAttachedCount} منتج مرتبط به. هل أنت متأكد من الحذف؟`
                  : lang === 'en'
                  ? `Warning: This department contains ${activeAttachedCount} attached product(s). Are you sure you want to delete it?`
                  : `Attention : Ce rayon contient actuellement ${activeAttachedCount} produit(s) associé(s). Confirmez-vous la suppression ?`)
              : (lang === 'ar'
                  ? `هل أنت متأكد من رغبتك في حذف قسم "${deleteModal.category.label}" ؟`
                  : lang === 'en'
                  ? `Are you sure you want to delete the department "${deleteModal.category.label}"?`
                  : `Êtes-vous sûr de vouloir supprimer le rayon "${deleteModal.category.label}" ?`)
          }
          itemDetails={{
            title: deleteModal.category.label,
            subtitle: deleteModal.category.description || 'Rayon de la boutique',
            value: `${activeAttachedCount} ${t('categoryArticlesCount') || 'articles'}`,
            valueColor: activeAttachedCount > 0 ? '#fbbf24' : '#94a3b8',
          }}
          warningText={
            activeAttachedCount > 0
              ? (lang === 'ar'
                  ? 'ستبقى المنتجات محفوظة في المخزون ولكن بدون تصنيف قسم.'
                  : lang === 'en'
                  ? 'Products will remain in stock without assigned category.'
                  : 'Les articles resteront en stock mais seront classés sans rayon.')
              : null
          }
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteModal({ open: false, category: null })}
          confirmButtonText={lang === 'ar' ? 'تأكيد حذف القسم' : lang === 'en' ? 'Delete Department' : 'Supprimer le Rayon'}
        />
      )}

      {/* Dedicated Edit / Rename Subcategory Modal */}
      {editSubCatModal.open && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setEditSubCatModal({
              open: false,
              categoryId: null,
              categoryColor: '',
              categoryLabel: '',
              oldName: '',
              newName: '',
            })
          }
        >
          <div
            className="modal-content"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Layers size={20} style={{ color: editSubCatModal.categoryColor || 'var(--accent-primary)' }} />
                <span>{t('editSubCategoryTitle')}</span>
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setEditSubCatModal({
                    open: false,
                    categoryId: null,
                    categoryColor: '',
                    categoryLabel: '',
                    oldName: '',
                    newName: '',
                  })
                }
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmRenameSubCat}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                      {t('categoryCol')}
                    </span>
                    <strong style={{ fontSize: '0.88rem', color: editSubCatModal.categoryColor || 'var(--accent-primary)' }}>
                      {editSubCatModal.categoryLabel}
                    </strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                      {t('productCol')}
                    </span>
                    <strong style={{ fontSize: '0.88rem' }}>
                      {
                        products.filter(
                          (p) =>
                            p.category === editSubCatModal.categoryId &&
                            (p.subCategory || '').trim().toLowerCase() === (editSubCatModal.oldName || '').trim().toLowerCase()
                        ).length
                      }{' '}
                      {t('items')}
                    </strong>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('editSubCategoryPrompt')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editSubCatModal.newName}
                    onChange={(e) => setEditSubCatModal({ ...editSubCatModal, newName: e.target.value })}
                    autoFocus
                    required
                    placeholder="Ex: Afficheurs OLED, Chargeurs 25W..."
                  />
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  ℹ️{' '}
                  {lang === 'ar'
                    ? 'سيتم تحديث اسم هذا القسم الفرعي وتغييره تلقائياً في جميع المنتجات المرتبطة به في المخزون.'
                    : lang === 'en'
                    ? 'This will update the sub-category name and automatically update all matching products in inventory.'
                    : 'La modification mettra à jour automatiquement le rayon pour tous les articles associés en stock.'}
                </p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setEditSubCatModal({
                      open: false,
                      categoryId: null,
                      categoryColor: '',
                      categoryLabel: '',
                      oldName: '',
                      newName: '',
                    })
                  }
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!editSubCatModal.newName.trim()}
                >
                  <CheckCircle size={16} />
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

