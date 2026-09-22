import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, Package, Calculator, AlertCircle, Image as ImageIcon, Upload, Link } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductModal({ product, onClose }) {
  const { addProduct, updateProduct, categories, formatMoney, t, lang } = useApp();

  const isEditing = Boolean(product);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'mobile_access',
    subCategory: '',
    purchasePrice: '',
    sellingPrice: '',
    stock: '',
    minStockAlert: '3',
    unit: 'pièce',
    barcode: '',
    image: '',
    notes: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || 'mobile_access',
        subCategory: product.subCategory || '',
        purchasePrice: product.purchasePrice ?? '',
        sellingPrice: product.sellingPrice ?? '',
        stock: product.stock ?? '',
        minStockAlert: product.minStockAlert ?? '3',
        unit: product.unit || 'pièce',
        barcode: product.barcode || '',
        image: product.image || '',
        notes: product.notes || '',
      });
    }
  }, [product]);

  const pPrice = Number(formData.purchasePrice) || 0;
  const sPrice = Number(formData.sellingPrice) || 0;
  const margin = sPrice - pPrice;
  const marginPercent = pPrice > 0 ? ((margin / pPrice) * 100).toFixed(1) : '100';

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(
        lang === 'ar'
          ? 'حجم الصورة كبير جداً (أقصى حد 2 ميغابايت).'
          : lang === 'en'
          ? 'Image is too large (max 2MB).'
          : "L'image est trop volumineuse (max 2 Mo)."
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, image: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (isEditing) {
      updateProduct(product.id, formData);
      toast.success(
        lang === 'ar'
          ? 'تم تعديل بيانات المنتج بنجاح'
          : lang === 'en'
          ? 'Product updated successfully'
          : 'Produit modifié avec succès !'
      );
    } else {
      addProduct(formData);
      toast.success(
        lang === 'ar'
          ? 'تمت إضافة المنتج بنجاح إلى المخزون'
          : lang === 'en'
          ? 'Product added to inventory successfully'
          : 'Produit ajouté avec succès au stock !'
      );
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Package size={20} className="text-primary" />
            {isEditing ? (t('editProductModalTitle') || t('editProduct')) : (t('newProductModalTitle') || t('newProduct'))}
          </h3>
          <button className="btn-icon btn-outline" onClick={onClose} aria-label={t('close')}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Visual Image Upload / URL Field */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              {/* Image Preview Box */}
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '10px',
                  border: '1px dashed var(--border-color)',
                  background: 'var(--bg-input)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt={formData.name || 'Product'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <ImageIcon size={28} style={{ margin: '0 auto 0.2rem auto', opacity: 0.6 }} />
                    <span style={{ fontSize: '0.65rem', display: 'block' }}>
                      {t('noImageYet')}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload & Link input */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  {t('productImageLabel')}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="url"
                    className="form-input"
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }}
                    placeholder={t('pasteImageUrl')}
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleImageFileUpload}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    {t('uploadLocalFile')}
                  </button>
                  {formData.image && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--accent-danger)' }}
                      onClick={() => setFormData({ ...formData, image: '' })}
                      title={t('delete')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {t('imageFormatsHint')}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('productNameLabel')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('productNamePlaceholder')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('mainCategoryLabel')}</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories
                    .filter((c) => c.id !== 'all')
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('subCategoryLabel')}</label>
                <input
                  type="text"
                  className="form-input"
                  list="subcategory-options"
                  placeholder={t('selectOrTypeSubCategory') || t('subCategoryPlaceholder')}
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                />
                <datalist id="subcategory-options">
                  {(categories.find((c) => c.id === formData.category)?.subCategories || []).map((sub) => (
                    <option key={sub} value={sub} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Subcategory Suggestion Chips if available */}
            {(() => {
              const currentCat = categories.find((c) => c.id === formData.category);
              const subCats = Array.isArray(currentCat?.subCategories) ? currentCat.subCategories : [];
              if (subCats.length === 0) return null;

              return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '0.2rem' }}>
                    {t('subCategoriesTitle')} :
                  </span>
                  {subCats.map((sub) => {
                    const isSelected = formData.subCategory === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        className="badge"
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--accent-primary-light)' : 'var(--bg-secondary)',
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          transition: 'all 0.15s ease',
                        }}
                        onClick={() => setFormData({ ...formData, subCategory: isSelected ? '' : sub })}
                      >
                        {isSelected ? '✓ ' : ''}{sub}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* Financials & Margins */}
            <div
              style={{
                background: 'var(--accent-primary-light)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1rem',
                margin: '1rem 0',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('supplierPriceLabel')}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('clientPriceLabel')}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Profit preview */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px dashed var(--border-color)',
                  fontSize: '0.85rem',
                }}
              >
                <span>
                  {t('unitProfitLabel')}{' '}
                  <strong style={{ color: margin >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                    {formatMoney(margin)}
                  </strong>
                </span>
                <span>
                  {t('marginPercentLabel')}{' '}
                  <strong style={{ color: margin >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                    +{marginPercent}%
                  </strong>
                </span>
              </div>
            </div>

            {/* Stock Quantities */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('stockQtyLabel')}</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">{t('minStockAlertLabel')}</label>
                  {Number(formData.minStockAlert) === 0 && (
                    <span className="badge badge-gray" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                      {lang === 'ar' ? '🔕 التنبيه معطل' : '🔕 Alertes désactivées'}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="3"
                  value={formData.minStockAlert}
                  onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                  {lang === 'ar'
                    ? 'أدخل 0 لتعطيل تنبيهات نفاذ المخزون لهذا المنتج'
                    : 'Entrez 0 pour ne jamais déclencher d’alerte pour ce produit'}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">{t('unitSelectLabel')}</label>
                <select
                  className="form-select"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="pièce">{t('unitPiece')}</option>
                  <option value="flacon">{t('unitBottle')}</option>
                  <option value="ml">{t('unitMl')}</option>
                  <option value="kit">{t('unitKit')}</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('barcodeLabel')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('barcodePlaceholder')}
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('specsNotesLabel')}</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder={t('specsNotesPlaceholder')}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? (t('saveChanges') || t('editProduct')) : (t('newProduct') || t('save'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
