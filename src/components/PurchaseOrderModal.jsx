import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import {
  X,
  ClipboardList,
  Package,
  User,
  FileText,
  AlertTriangle,
  Phone,
  DollarSign,
  Layers,
  Truck,
  Check,
  Plus,
  Search,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function PurchaseOrderModal({ order, onClose }) {
  const {
    addPurchaseOrder,
    updatePurchaseOrder,
    products = [],
    categories = [],
    clients = [],
    isProductLowStock,
    formatMoney,
    t,
    lang,
    isRTL,
  } = useApp();

  const isEdit = Boolean(order);

  const [formData, setFormData] = useState({
    type: 'stock_refill', // 'stock_refill' | 'client_request' | 'general_note'
    title: '',
    category: '',
    subCategory: '',
    quantity: 1,
    estimatedCost: '',
    priority: 'normal', // 'urgent' | 'high' | 'normal' | 'low'
    status: 'pending', // 'pending' | 'ordered' | 'received' | 'cancelled'
    supplier: '',
    notes: '',
    clientName: '',
    clientPhone: '',
    clientDeposit: '',
    linkedProductId: '',
    autoRestock: true,
  });

  // Category and Subcategory browser states for linking catalogue products
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedSubCat, setSelectedSubCat] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [showCatalogBrowser, setShowCatalogBrowser] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData({
        type: order.type || 'stock_refill',
        title: order.title || '',
        category: order.category || '',
        subCategory: order.subCategory || '',
        quantity: order.quantity !== undefined ? order.quantity : 1,
        estimatedCost: order.estimatedCost !== undefined ? order.estimatedCost : '',
        priority: order.priority || 'normal',
        status: order.status || 'pending',
        supplier: order.supplier || '',
        notes: order.notes || '',
        clientName: order.clientName || '',
        clientPhone: order.clientPhone || '',
        clientDeposit: order.clientDeposit !== undefined ? order.clientDeposit : '',
        linkedProductId: order.linkedProductId || '',
        autoRestock: order.autoRestock !== undefined ? order.autoRestock : true,
      });

      if (!order.linkedProductId) {
        setShowCatalogBrowser(false);
      }
    }
  }, [order]);

  // Selected linked product object
  const linkedProduct = useMemo(() => {
    if (!formData.linkedProductId) return null;
    return products.find((p) => p.id === formData.linkedProductId) || null;
  }, [products, formData.linkedProductId]);

  // Available sub-categories for active category
  const availableSubCategories = useMemo(() => {
    if (selectedCat === 'all') return [];
    const found = categories.find((c) => c.id === selectedCat);
    return found && Array.isArray(found.subCategories) ? found.subCategories : [];
  }, [categories, selectedCat]);

  // Filtered products based on category, sub-category, and search
  const filteredCatalogProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    return products.filter((p) => {
      const matchCat = selectedCat === 'all' || p.category === selectedCat;
      const matchSub = selectedSubCat === 'all' || p.subCategory === selectedSubCat;
      const matchSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.supplier && p.supplier.toLowerCase().includes(q));
      const matchStock = !onlyInStock || Number(p.stock) > 0;
      return matchCat && matchSub && matchSearch && matchStock;
    });
  }, [products, selectedCat, selectedSubCat, productSearch, onlyInStock]);

  const handleSelectProduct = (prod) => {
    setFormData((prev) => ({
      ...prev,
      linkedProductId: prod.id,
      title: prod.name,
      category: prod.category || '',
      subCategory: prod.subCategory || '',
      estimatedCost: prod.purchasePrice !== undefined ? String(prod.purchasePrice) : prev.estimatedCost,
      supplier: prod.supplier || prev.supplier,
      autoRestock: true,
    }));
    setShowCatalogBrowser(false);
  };

  const handleClearLinkedProduct = () => {
    setFormData((prev) => ({
      ...prev,
      linkedProductId: '',
    }));
  };

  const handleClientSelect = (clientId) => {
    if (!clientId) return;
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        clientName: found.name || '',
        clientPhone: found.phone || prev.clientPhone,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error(t('required') || 'Veuillez saisir le nom de l’article');
      return;
    }

    const payload = {
      ...formData,
      title: formData.title.trim(),
      category: formData.category || (linkedProduct?.category || ''),
      subCategory: formData.subCategory || (linkedProduct?.subCategory || ''),
      quantity: Number(formData.quantity) || 1,
      estimatedCost: Number(formData.estimatedCost) || 0,
      clientDeposit: Number(formData.clientDeposit) || 0,
      supplier: formData.supplier.trim(),
      notes: formData.notes.trim(),
      clientName: formData.clientName.trim(),
      clientPhone: formData.clientPhone.trim(),
    };

    if (isEdit) {
      updatePurchaseOrder(order.id, payload);
    } else {
      addPurchaseOrder(payload);
    }

    onClose();
  };

  const totalEstimatedAmount = (Number(formData.quantity) || 1) * (Number(formData.estimatedCost) || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ClipboardList size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {isEdit ? t('editPurchaseOrderBtn') : t('newPurchaseOrderBtn')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {t('purchaseOrdersSubtitle')}
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon btn-outline" onClick={onClose} aria-label={t('close')}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* 1. Type Selector (3 Tabs) */}
            <div>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>
                {t('orderType')} :
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                }}
              >
                <button
                  type="button"
                  className={`btn btn-sm ${formData.type === 'stock_refill' ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.6rem 0.4rem',
                    height: 'auto',
                  }}
                  onClick={() => setFormData({ ...formData, type: 'stock_refill', autoRestock: true })}
                >
                  <Package size={18} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('typeStockRefill')}</span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm ${formData.type === 'client_request' ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.6rem 0.4rem',
                    height: 'auto',
                    borderColor: formData.type === 'client_request' ? '#c084fc' : undefined,
                    background: formData.type === 'client_request' ? 'rgba(168, 85, 247, 0.2)' : undefined,
                    color: formData.type === 'client_request' ? '#c084fc' : undefined,
                  }}
                  onClick={() => setFormData({ ...formData, type: 'client_request' })}
                >
                  <User size={18} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('typeClientRequest')}</span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm ${formData.type === 'general_note' ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.6rem 0.4rem',
                    height: 'auto',
                  }}
                  onClick={() => setFormData({ ...formData, type: 'general_note', autoRestock: false })}
                >
                  <FileText size={18} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('typeGeneralNote')}</span>
                </button>
              </div>
            </div>

            {/* 2. PIÈCES & PRODUITS DU CATALOGUE AVEC NAVIGATION MULTI-CATÉGORIES & SOUS-CATÉGORIES */}
            {formData.type === 'stock_refill' && (
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {/* Header Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <Layers size={16} className="text-primary" />
                    <span>{t('linkExistingProduct')}</span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={() => setShowCatalogBrowser(!showCatalogBrowser)}
                  >
                    {showCatalogBrowser ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span>{showCatalogBrowser ? (lang === 'ar' ? 'إخفاء الكتالوج' : 'Masquer catalogue') : (lang === 'ar' ? 'تصفح الكتالوج والأقسام' : 'Parcourir le catalogue')}</span>
                  </button>
                </div>

                {/* Linked Product Banner if one is selected */}
                {linkedProduct && !showCatalogBrowser && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: 'var(--accent-primary-light)',
                      border: '1px solid var(--accent-primary)',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {linkedProduct.image ? (
                          <img src={linkedProduct.image} alt={linkedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <Package size={18} style={{ color: 'var(--accent-primary)' }} />
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {linkedProduct.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem' }}>
                          <span>{linkedProduct.subCategory || linkedProduct.category}</span>
                          <span>•</span>
                          <span style={{ color: Number(linkedProduct.stock) <= 0 ? 'var(--accent-danger)' : isProductLowStock(linkedProduct) ? 'var(--accent-warning)' : 'var(--accent-success)', fontWeight: 600 }}>
                            {linkedProduct.stock} {t('inStock')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem' }}
                        onClick={() => setShowCatalogBrowser(true)}
                      >
                        <RotateCcw size={12} />
                        <span>{lang === 'ar' ? 'تغيير' : 'Changer'}</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem', color: 'var(--accent-danger)' }}
                        onClick={handleClearLinkedProduct}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Full Interactive Product Browser with Categories & Subcategories */}
                {showCatalogBrowser && (
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    {/* Row 1: Categories filter chips */}
                    <div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                        {t('categoryCol') || 'Catégorie'} :
                      </span>
                      <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
                        <button
                          type="button"
                          className={`btn btn-sm ${selectedCat === 'all' ? 'btn-primary' : 'btn-outline'}`}
                          style={{ fontSize: '0.74rem', padding: '0.2rem 0.55rem', whiteSpace: 'nowrap' }}
                          onClick={() => {
                            setSelectedCat('all');
                            setSelectedSubCat('all');
                          }}
                        >
                          {t('all')} ({products.length})
                        </button>

                        {categories.map((cat) => {
                          const count = products.filter((p) => p.category === cat.id).length;
                          const isChosen = selectedCat === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              className={`btn btn-sm ${isChosen ? 'btn-primary' : 'btn-outline'}`}
                              style={{
                                fontSize: '0.74rem',
                                padding: '0.2rem 0.55rem',
                                whiteSpace: 'nowrap',
                                borderColor: isChosen ? cat.color : undefined,
                              }}
                              onClick={() => {
                                setSelectedCat(cat.id);
                                setSelectedSubCat('all');
                              }}
                            >
                              <span>{cat.label}</span>
                              <span style={{ opacity: 0.8, fontSize: '0.68rem' }}>({count})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Row 2: Sub-categories filter chips */}
                    {availableSubCategories.length > 0 && (
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                          {t('subCategoryCol') || 'Sous-Catégorie'} :
                        </span>
                        <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.2rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${selectedSubCat === 'all' ? 'btn-secondary' : 'btn-outline'}`}
                            style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', whiteSpace: 'nowrap' }}
                            onClick={() => setSelectedSubCat('all')}
                          >
                            {t('all')}
                          </button>
                          {availableSubCategories.map((sub, idx) => {
                            const isSubChosen = selectedSubCat === sub;
                            return (
                              <button
                                key={idx}
                                type="button"
                                className={`btn btn-sm ${isSubChosen ? 'btn-secondary' : 'btn-outline'}`}
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '0.15rem 0.5rem',
                                  whiteSpace: 'nowrap',
                                  background: isSubChosen ? 'var(--accent-primary-light)' : 'transparent',
                                  color: isSubChosen ? 'var(--accent-primary)' : 'var(--text-primary)',
                                  borderColor: isSubChosen ? 'var(--accent-primary)' : 'var(--border-color)',
                                  fontWeight: isSubChosen ? 700 : 400,
                                }}
                                onClick={() => setSelectedSubCat(sub)}
                              >
                                {sub}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Row 3: Search Bar */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div className="input-with-icon" style={{ flex: 1 }}>
                        <Search size={14} />
                        <input
                          type="text"
                          className="form-input"
                          style={{ height: '32px', fontSize: '0.8rem', paddingLeft: isRTL ? '0.75rem' : '2rem', paddingRight: isRTL ? '2rem' : '0.75rem' }}
                          placeholder={lang === 'ar' ? 'بحث في منتجات المحل...' : 'Filtrer un produit par nom ou code...'}
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                        />
                        {productSearch && (
                          <button
                            type="button"
                            onClick={() => setProductSearch('')}
                            style={{
                              position: 'absolute',
                              [isRTL ? 'left' : 'right']: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                            }}
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.74rem',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          userSelect: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={onlyInStock}
                          onChange={(e) => setOnlyInStock(e.target.checked)}
                        />
                        <span>{t('onlyInStockLabel') || 'En stock'}</span>
                      </label>
                    </div>

                    {/* Row 4: Products Scrollable List */}
                    <div
                      style={{
                        maxHeight: '190px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                        paddingRight: '0.2rem',
                      }}
                    >
                      {filteredCatalogProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          <Package size={22} style={{ margin: '0 auto 0.3rem auto', opacity: 0.3 }} />
                          <span>{t('noData')}</span>
                        </div>
                      ) : (
                        filteredCatalogProducts.map((prod) => {
                          const isChosen = formData.linkedProductId === prod.id;
                          const isStockLow = isProductLowStock(prod);
                          const isOut = Number(prod.stock) <= 0;

                          return (
                            <div
                              key={prod.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.45rem 0.65rem',
                                borderRadius: '8px',
                                background: isChosen ? 'var(--accent-primary-light)' : 'var(--bg-secondary)',
                                border: `1px solid ${isChosen ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                gap: '0.5rem',
                              }}
                              onClick={() => handleSelectProduct(prod)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                                <div
                                  style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '6px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    overflow: 'hidden',
                                  }}
                                >
                                  {prod.image ? (
                                    <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                  ) : (
                                    <Package size={14} style={{ color: 'var(--text-muted)' }} />
                                  )}
                                </div>

                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {prod.name}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '0.35rem' }}>
                                    <span>{prod.subCategory || prod.category}</span>
                                    <span>•</span>
                                    <span style={{ color: isOut ? 'var(--accent-danger)' : isStockLow ? 'var(--accent-warning)' : 'var(--accent-success)', fontWeight: 600 }}>
                                      {prod.stock} {t('inStock')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {Number(prod.purchasePrice) > 0 && (
                                  <div className="privacy-blur" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                    Achat: <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(prod.purchasePrice)}</strong>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  className={`btn btn-sm ${isChosen ? 'btn-primary' : 'btn-outline'}`}
                                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectProduct(prod);
                                  }}
                                >
                                  {isChosen ? <Check size={12} /> : (lang === 'ar' ? 'اختيار' : 'Choisir')}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Title / Article Name */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t('itemTitleLabel')} *</label>
              <input
                type="text"
                className="form-input"
                placeholder={
                  formData.type === 'stock_refill'
                    ? (lang === 'ar' ? 'مثال: شاشات سامسونج A51، كابلات Type-C...' : 'Ex: Afficheurs Samsung A51, Câbles Type-C Anker...')
                    : formData.type === 'client_request'
                    ? (lang === 'ar' ? 'مثال: بطارية آيفون 11 برو أصلية للحريف...' : 'Ex: Batterie iPhone 11 Pro originale pour client...')
                    : (lang === 'ar' ? 'مثال: طقم مفكات تبريد، لصاق شاشات T7000...' : 'Ex: Jeu de tournevis atelier, colle B7000, gants...')
                }
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* 4. Quantity, Unit Cost & Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('quantityLabel')} *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('estimatedCostLabel')}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="form-input"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('priority')}</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="normal">{t('priorityNormal')}</option>
                  <option value="high">{t('priorityHigh')}</option>
                  <option value="urgent">{t('priorityUrgent')}</option>
                  <option value="low">{lang === 'ar' ? 'منخفضة' : 'Faible'}</option>
                </select>
              </div>
            </div>

            {/* 5. Client Information (If Client Request) */}
            {formData.type === 'client_request' && (
              <div
                style={{
                  background: 'rgba(168, 85, 247, 0.08)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', fontWeight: 700, fontSize: '0.85rem' }}>
                    <User size={15} />
                    <span>{t('typeClientRequest')}</span>
                  </div>

                  {clients.length > 0 && (
                    <select
                      className="form-select"
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', width: 'auto' }}
                      onChange={(e) => handleClientSelect(e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        {lang === 'ar' ? 'اختيار من الزبائن المسجلين...' : 'Choisir client enregistré...'}
                      </option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '0.65rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.76rem' }}>{t('clientName')}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={lang === 'ar' ? 'اسم الحريف...' : 'Nom du client...'}
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.76rem' }}>{t('clientPhone')}</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Ex: 98 123 456"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.76rem' }}>{t('clientDepositLabel')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      value={formData.clientDeposit}
                      onChange={(e) => setFormData({ ...formData, clientDeposit: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. Supplier & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('supplierLabel')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={lang === 'ar' ? 'اسم المورد أو مكان الشراء...' : 'Nom du grossiste / boutique fournisseur...'}
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('status')}</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="pending">⏳ {t('statusPending')}</option>
                  <option value="ordered">🚚 {t('statusOrdered')}</option>
                  <option value="received">✅ {t('statusReceived')}</option>
                  <option value="cancelled">❌ {t('statusCancelled')}</option>
                </select>
              </div>
            </div>

            {/* 7. Notes & Specs */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t('notes')}</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder={lang === 'ar' ? 'تفاصيل إضافية، اللون، الموديل الدقيق، ملاحظات...' : 'Détails techniques, modèle exact, couleur, références grossiste...'}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {/* Auto Restock Checkbox when linked */}
            {formData.linkedProductId && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.autoRestock}
                  onChange={(e) => setFormData({ ...formData, autoRestock: e.target.checked })}
                />
                <span>{t('autoRestockLabel')}</span>
              </label>
            )}

            {/* Total Estimated Cost Banner */}
            {totalEstimatedAmount > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                }}
              >
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {t('totalEstimatedCost')} ({formData.quantity}x) :
                </span>
                <strong className="privacy-blur" style={{ fontSize: '1.1rem', color: 'var(--accent-primary)' }}>
                  {formatMoney(totalEstimatedAmount)}
                </strong>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? t('saveChanges') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
