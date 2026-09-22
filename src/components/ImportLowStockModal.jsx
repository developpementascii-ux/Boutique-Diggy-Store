import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import {
  X,
  Sparkles,
  AlertTriangle,
  Package,
  Search,
  Check,
  Filter,
  Layers,
  Truck,
  ArrowRight,
  Info,
  SlidersHorizontal,
  RotateCcw,
  Zap,
} from 'lucide-react';

export default function ImportLowStockModal({ open, onClose }) {
  const {
    products = [],
    categories = [],
    purchaseOrders = [],
    importLowStockToPurchaseOrders,
    isProductLowStock,
    formatMoney,
    t,
    lang,
    isRTL,
    isAdmin,
  } = useApp();

  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedSubCat, setSelectedSubCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState({});
  const [customQuantities, setCustomQuantities] = useState({});
  const [massQtyValue, setMassQtyValue] = useState('10');

  // All low-stock products in the system
  const allLowStockProducts = useMemo(() => {
    return products.filter((p) => isProductLowStock(p));
  }, [products, isProductLowStock]);

  // Sub-categories available for the selected category or all sub-categories
  const availableSubCategories = useMemo(() => {
    const set = new Set();
    const result = [];

    if (selectedCat !== 'all') {
      const cat = categories.find((c) => c.id === selectedCat || c.label === selectedCat || c.name === selectedCat);
      (cat?.subCategories || []).forEach((s) => {
        const name = typeof s === 'string' ? s.trim() : (s?.name || s?.label || '').trim();
        if (name && !set.has(name)) {
          set.add(name);
          result.push(name);
        }
      });
      allLowStockProducts.filter((p) => p.category === selectedCat && p.subCategory).forEach((p) => {
        const name = typeof p.subCategory === 'string' ? p.subCategory.trim() : '';
        if (name && !set.has(name)) {
          set.add(name);
          result.push(name);
        }
      });
    } else {
      categories.forEach((cat) => {
        (cat.subCategories || []).forEach((s) => {
          const name = typeof s === 'string' ? s.trim() : (s?.name || s?.label || '').trim();
          if (name && !set.has(name)) {
            set.add(name);
            result.push(name);
          }
        });
      });
      allLowStockProducts.forEach((p) => {
        if (p.subCategory && typeof p.subCategory === 'string' && p.subCategory.trim()) {
          const name = p.subCategory.trim();
          if (!set.has(name)) {
            set.add(name);
            result.push(name);
          }
        }
      });
    }

    return result.sort((a, b) => a.localeCompare(b));
  }, [categories, selectedCat, allLowStockProducts]);

  // Filtered low stock products matching active modal filters
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allLowStockProducts.filter((p) => {
      if (selectedCat !== 'all' && p.category !== selectedCat) return false;
      if (selectedSubCat !== 'all' && p.subCategory !== selectedSubCat) return false;
      if (q) {
        const matchName = p.name && p.name.toLowerCase().includes(q);
        const matchBarcode = p.barcode && p.barcode.toLowerCase().includes(q);
        const matchSupplier = p.supplier && p.supplier.toLowerCase().includes(q);
        if (!matchName && !matchBarcode && !matchSupplier) return false;
      }
      return true;
    });
  }, [allLowStockProducts, selectedCat, selectedSubCat, searchQuery]);

  // On open or filter change, initialize selection and quantities for visible low-stock products
  useEffect(() => {
    if (open) {
      const initialSelected = {};
      const initialQuantities = {};

      filteredProducts.forEach((p) => {
        // By default check products that are NOT already in pending/ordered purchase orders
        const alreadyListed = purchaseOrders.some(
          (o) =>
            (o.linkedProductId === p.id || o.title?.toLowerCase().trim() === p.name?.toLowerCase().trim()) &&
            (o.status === 'pending' || o.status === 'ordered')
        );

        initialSelected[p.id] = !alreadyListed;

        const threshold = Number(p.minStockAlert) || 5;
        const currentStock = Number(p.stock) || 0;
        const recommendedQty = Math.max(5, threshold * 2 - currentStock);
        initialQuantities[p.id] = recommendedQty;
      });

      setSelectedProductIds(initialSelected);
      setCustomQuantities(initialQuantities);
    }
  }, [open, selectedCat, selectedSubCat]);

  if (!open) return null;

  const toggleSelectAll = (checkAll) => {
    const next = { ...selectedProductIds };
    filteredProducts.forEach((p) => {
      next[p.id] = checkAll;
    });
    setSelectedProductIds(next);
  };

  const toggleSelectProduct = (id) => {
    setSelectedProductIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleQuantityChange = (id, val) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    setCustomQuantities((prev) => ({
      ...prev,
      [id]: num,
    }));
  };

  // Mass Set Quantity for all selected items (or all visible items)
  const handleApplyMassQuantity = (val) => {
    const qty = Math.max(1, parseInt(val, 10) || 1);
    const targetProducts = selectedList.length > 0 ? selectedList : filteredProducts;
    if (targetProducts.length === 0) return;

    setCustomQuantities((prev) => {
      const next = { ...prev };
      targetProducts.forEach((p) => {
        next[p.id] = qty;
      });
      return next;
    });

    toast.success(
      lang === 'ar'
        ? `تم تعيين الكمية (${qty}) لـ ${targetProducts.length} عنصر بنجاح`
        : `Quantité réglée sur ${qty} pour ${targetProducts.length} article(s).`
    );
  };

  // Reset all visible products to their recommended formula (threshold * 2 - currentStock)
  const handleResetRecommendedQuantities = () => {
    const targetProducts = selectedList.length > 0 ? selectedList : filteredProducts;
    if (targetProducts.length === 0) return;

    setCustomQuantities((prev) => {
      const next = { ...prev };
      targetProducts.forEach((p) => {
        const threshold = Number(p.minStockAlert) || 5;
        const currentStock = Number(p.stock) || 0;
        next[p.id] = Math.max(5, threshold * 2 - currentStock);
      });
      return next;
    });

    toast.success(
      lang === 'ar'
        ? 'تمت إعادة ضبط الكميات حسب معادلة النقص الموصى بها'
        : 'Quantités réinitialisées selon les seuils recommandés (Seuil x2 - Stock).'
    );
  };

  // Compute selected items statistics
  const selectedList = filteredProducts.filter((p) => Boolean(selectedProductIds[p.id]));
  const totalSelectedCount = selectedList.length;
  const totalEstimatedCost = selectedList.reduce((sum, p) => {
    const qty = Number(customQuantities[p.id]) || 1;
    const price = Number(p.purchasePrice) || 0;
    return sum + qty * price;
  }, 0);

  const handleConfirmImport = () => {
    if (selectedList.length === 0) {
      toast.error(
        lang === 'ar'
          ? 'الرجاء تحديد عنصر واحد على الأقل للاستيراد'
          : 'Veuillez sélectionner au moins un article à importer.'
      );
      return;
    }

    const itemsPayload = selectedList.map((p) => {
      const threshold = Number(p.minStockAlert) || 5;
      const currentStock = Number(p.stock) || 0;
      const qty = Number(customQuantities[p.id]) || Math.max(5, threshold * 2 - currentStock);

      return {
        id: p.id,
        linkedProductId: p.id,
        name: p.name,
        category: p.category || '',
        subCategory: p.subCategory || '',
        quantityToOrder: qty,
        purchasePrice: Number(p.purchasePrice) || 0,
        supplier: p.supplier || '',
        stock: currentStock,
        minStockAlert: threshold,
        notes: `Alerte stock : Stock restant (${currentStock}) / Seuil min (${threshold})`,
      };
    });

    const count = importLowStockToPurchaseOrders(itemsPayload);
    toast.success(
      lang === 'ar'
        ? `تم استيراد ${count} منتج(ات) بنجاح إلى دفتر الطلبيات`
        : `${count} article(s) en alerte stock importé(s) avec succès dans le cahier de commandes !`
    );
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '860px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {lang === 'ar'
                  ? 'استيراد نواقص المخزون والتنبيهات'
                  : 'Importer les Alertes Stock Faible & Ruptures'}
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {lang === 'ar'
                  ? 'اختر الصنف والصنف الفرعي، حدد الكميات مجمّعاً وأضفها إلى دفتر المشتريات'
                  : 'Filtrez par rayon & sous-catégorie, définissez les quantités en masse et importez.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ padding: '0.4rem', borderRadius: '8px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters Toolbar: Category + Subcategory + Search */}
        <div
          style={{
            padding: '0.9rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Category and Subcategory Selectors */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <select
                className="form-select"
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem', minWidth: '170px' }}
                value={selectedCat}
                onChange={(e) => {
                  setSelectedCat(e.target.value);
                  setSelectedSubCat('all');
                }}
              >
                <option value="all">
                  📁 {lang === 'ar' ? 'جميع الأصناف' : 'Toutes les catégories'} ({allLowStockProducts.length})
                </option>
                {categories.map((cat) => {
                  const countInCat = allLowStockProducts.filter((p) => p.category === cat.id).length;
                  const label = cat.label || cat.name || cat.id;
                  return (
                    <option key={cat.id} value={cat.id}>
                      {label} ({countInCat})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Sub-category Selector */}
            {availableSubCategories.length > 0 && (
              <select
                className="form-select"
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem', minWidth: '160px' }}
                value={selectedSubCat}
                onChange={(e) => setSelectedSubCat(e.target.value)}
              >
                <option value="all">
                  📂 {lang === 'ar' ? 'جميع الأصناف الفرعية' : 'Toutes les sous-catégories'}
                </option>
                {availableSubCategories.map((sub, idx) => {
                  const countInSub = allLowStockProducts.filter(
                    (p) => (selectedCat === 'all' || p.category === selectedCat) && p.subCategory === sub
                  ).length;
                  return (
                    <option key={idx} value={sub}>
                      {sub} ({countInSub})
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Search within low-stock products */}
          <div className="input-with-icon" style={{ minWidth: '220px', flex: '0 1 240px' }}>
            <Search size={15} />
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.5rem 0.35rem 2.2rem' }}
              placeholder={lang === 'ar' ? 'بحث بالاسم أو الكود...' : 'Filtrer article, code...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Mass Quantity Setting & Batch Action Bar */}
        <div
          style={{
            padding: '0.65rem 1.5rem',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.8rem',
          }}
        >
          {/* Left: Check / Uncheck All */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: 'var(--accent-primary)', fontWeight: 700 }}
              onClick={() => toggleSelectAll(true)}
            >
              ✓ {lang === 'ar' ? 'تحديد الكل' : 'Tout cocher'}
            </button>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: 'var(--text-secondary)' }}
              onClick={() => toggleSelectAll(false)}
            >
              ✕ {lang === 'ar' ? 'إلغاء التحديد' : 'Tout décocher'}
            </button>
          </div>

          {/* Right: Mass Set Quantity Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {lang === 'ar' ? 'ضبط الكمية بالدفعة :' : 'Définir Qté en masse :'}
              </span>

              {/* Quick Presets */}
              <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                {['5', '10', '20', '50'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{
                      padding: '0.15rem 0.45rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                    }}
                    onClick={() => handleApplyMassQuantity(preset)}
                    title={`Définir la quantité sur ${preset} pour tous les articles sélectionnés`}
                  >
                    x{preset}
                  </button>
                ))}
              </div>

              {/* Custom Input + Apply Button */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  className="form-input"
                  style={{
                    width: '58px',
                    textAlign: 'center',
                    padding: '0.2rem 0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                  }}
                  value={massQtyValue}
                  onChange={(e) => setMassQtyValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyMassQuantity(massQtyValue);
                    }
                  }}
                  placeholder="Qté"
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                  onClick={() => handleApplyMassQuantity(massQtyValue)}
                  title="Appliquer cette quantité aux articles sélectionnés"
                >
                  <Check size={12} />
                  <span>{lang === 'ar' ? 'تطبيق' : 'Appliquer'}</span>
                </button>
              </div>
            </div>

            {/* Reset to Formula button */}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.5rem',
                color: 'var(--accent-info)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
              onClick={handleResetRecommendedQuantities}
              title="Réinitialiser toutes les quantités selon la formule automatique (Seuil x2 - Stock)"
            >
              <RotateCcw size={11} />
              <span>{lang === 'ar' ? 'إعادة ضبط ذكية' : 'Formule Seuil'}</span>
            </button>
          </div>
        </div>

        {/* Product Items Table / List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <Package size={44} style={{ margin: '0 auto 0.75rem auto', opacity: 0.3 }} />
              <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                {lang === 'ar' ? 'لا توجد تنبيهات مخزون تطابق هذا الاختيار' : 'Aucune alerte stock pour ce filtre'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {allLowStockProducts.length === 0
                  ? (lang === 'ar' ? 'جميع مستويات المخزون كافية وممتازة.' : 'Tous les niveaux de stock sont satisfaisants.')
                  : (lang === 'ar' ? 'جرب تغيير الصنف أو مسح خانة البحث.' : 'Essayez de sélectionner une autre catégorie.')}
              </p>
            </div>
          ) : (
            <div className="table-responsive" style={{ margin: 0 }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={filteredProducts.length > 0 && filteredProducts.every((p) => selectedProductIds[p.id])}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th>{t('productName') || 'Article & Catégorie'}</th>
                    <th style={{ textAlign: 'center', width: '130px' }}>{lang === 'ar' ? 'المخزون / التنبيه' : 'Stock / Seuil'}</th>
                    <th style={{ textAlign: 'center', width: '150px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>{lang === 'ar' ? 'الكمية المطلوبة' : 'Qté à Recharger'}</span>
                      </div>
                    </th>
                    {isAdmin && <th style={{ textAlign: isRTL ? 'left' : 'right', width: '120px' }}>{t('purchasePrice') || 'Prix Achat'}</th>}
                    {isAdmin && <th style={{ textAlign: isRTL ? 'left' : 'right', width: '130px' }}>{lang === 'ar' ? 'المجموع المقدر' : 'Total Estimé'}</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isSelected = Boolean(selectedProductIds[p.id]);
                    const currentStock = Number(p.stock) || 0;
                    const threshold = Number(p.minStockAlert) || 5;
                    const isOutOfStock = currentStock <= 0;
                    const orderQty = customQuantities[p.id] || Math.max(5, threshold * 2 - currentStock);
                    const unitPrice = Number(p.purchasePrice) || 0;
                    const itemTotal = orderQty * unitPrice;

                    // Check if already listed in active purchase orders
                    const alreadyListed = purchaseOrders.some(
                      (o) =>
                        (o.linkedProductId === p.id || o.title?.toLowerCase().trim() === p.name?.toLowerCase().trim()) &&
                        (o.status === 'pending' || o.status === 'ordered')
                    );

                    const catObj = categories.find((c) => c.id === p.category || c.label === p.category || c.name === p.category);

                    return (
                      <tr
                        key={p.id}
                        style={{
                          background: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleSelectProduct(p.id)}
                      >
                        {/* 1. Checkbox */}
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectProduct(p.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>

                        {/* 2. Product Name & Category */}
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            {p.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                            {catObj && (
                              <span
                                className="badge"
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '0.1rem 0.4rem',
                                  background: 'rgba(99, 102, 241, 0.1)',
                                  color: 'var(--accent-primary)',
                                }}
                              >
                                {catObj.label || catObj.name || catObj.id}
                              </span>
                            )}
                            {p.subCategory && (
                              <span
                                className="badge"
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '0.1rem 0.4rem',
                                  background: 'rgba(148, 163, 184, 0.1)',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                {p.subCategory}
                              </span>
                            )}
                            {p.supplier && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Truck size={10} /> {p.supplier}
                              </span>
                            )}
                            {alreadyListed && (
                              <span
                                className="badge badge-yellow"
                                style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}
                                title="Cet article a déjà une note active dans le cahier de commandes"
                              >
                                ⏳ {lang === 'ar' ? 'مسجل مسبقاً' : 'Déjà noté'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Current Stock / Threshold */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`badge ${isOutOfStock ? 'badge-red' : 'badge-yellow'}`}
                            style={{ fontSize: '0.78rem', fontWeight: 800 }}
                          >
                            {isOutOfStock ? '0 (Rupture)' : `${currentStock} / ${threshold}`}
                          </span>
                        </td>

                        {/* 4. Order Quantity Input */}
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>x</span>
                            <input
                              type="number"
                              min="1"
                              max="9999"
                              className="form-input"
                              style={{
                                width: '70px',
                                textAlign: 'center',
                                padding: '0.25rem 0.4rem',
                                fontSize: '0.88rem',
                                fontWeight: 800,
                              }}
                              value={orderQty}
                              onChange={(e) => handleQuantityChange(p.id, e.target.value)}
                            />
                          </div>
                        </td>

                        {/* 5. Purchase Price */}
                        {isAdmin && (
                          <td style={{ textAlign: isRTL ? 'left' : 'right' }}>
                            <span className="privacy-blur" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {unitPrice > 0 ? formatMoney(unitPrice) : '—'}
                            </span>
                          </td>
                        )}

                        {/* 6. Total Cost */}
                        {isAdmin && (
                          <td style={{ textAlign: isRTL ? 'left' : 'right' }}>
                            <strong className="privacy-blur" style={{ fontSize: '0.92rem', color: 'var(--accent-success)' }}>
                              {formatMoney(itemTotal)}
                            </strong>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Summary & Action Buttons */}
        <div
          className="modal-footer"
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Stats Summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                {lang === 'ar' ? 'العناصر المحددة' : 'Articles sélectionnés'}
              </span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--accent-primary)' }}>
                {totalSelectedCount} / {filteredProducts.length}
              </strong>
            </div>
            {isAdmin && (
              <>
                <div style={{ borderLeft: '1px solid var(--border-color)', height: '28px' }} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                    {lang === 'ar' ? 'التكلفة الإجمالية التقديرية' : 'Budget d’achat estimé'}
                  </span>
                  <strong className="privacy-blur" style={{ fontSize: '1.05rem', color: 'var(--accent-success)' }}>
                    {formatMoney(totalEstimatedCost)}
                  </strong>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              {t('cancel') || 'Annuler'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmImport}
              disabled={totalSelectedCount === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: 700,
                padding: '0.55rem 1.25rem',
              }}
            >
              <Sparkles size={16} />
              <span>
                {lang === 'ar'
                  ? `إضافة (${totalSelectedCount}) إلى دفتر الطلبيات`
                  : `Importer (${totalSelectedCount}) dans le Cahier`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
