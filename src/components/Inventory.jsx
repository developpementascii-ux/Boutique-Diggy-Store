import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import {
  Package,
  Search,
  Plus,
  Minus,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Tag,
  DollarSign,
  Filter,
  Layers,
  LayoutGrid,
  LayoutList,
  ChevronDown,
  FileText,
  X,
} from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function Inventory({ onOpenNewProduct, onEditProduct }) {
  const {
    products,
    categories,
    lowStockProducts,
    isProductLowStock,
    adjustStock,
    deleteProduct,
    formatMoney,
    t,
    lang,
    isAdmin,
    inventorySearchQuery,
    setInventorySearchQuery,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState(inventorySearchQuery || '');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('inventory_view_mode') || 'table';
    } catch {
      return 'table';
    }
  }); // 'table' | 'cards'
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [deleteProductModal, setDeleteProductModal] = useState({ open: false, product: null });

  // Sync with global header search query when navigated to inventory
  useEffect(() => {
    if (inventorySearchQuery !== undefined && inventorySearchQuery !== null) {
      setSearchQuery(inventorySearchQuery);
      if (inventorySearchQuery.trim()) {
        setSelectedCategory('all');
        setSelectedSubCategory('all');
      }
    }
  }, [inventorySearchQuery]);

  // Persist view mode preference across visits
  useEffect(() => {
    try {
      localStorage.setItem('inventory_view_mode', viewMode);
    } catch (e) {
      console.error(e);
    }
  }, [viewMode]);

  const handleSelectCategory = (catId, subCat = 'all') => {
    setSelectedCategory(catId);
    setSelectedSubCategory(subCat);
    setHoveredCategory(null);
  };

  // Active category object
  const activeCategoryObj = useMemo(() => {
    return categories.find((c) => c.id === selectedCategory);
  }, [categories, selectedCategory]);

  // Available sub-categories for current active category (only when a specific category is selected)
  const availableSubCategories = useMemo(() => {
    if (selectedCategory === 'all') {
      return [];
    }

    const definedSubs = activeCategoryObj?.subCategories || [];
    const fromProducts = products
      .filter((p) => p.category === selectedCategory && p.subCategory && p.subCategory.trim())
      .map((p) => p.subCategory.trim());

    return Array.from(new Set([...definedSubs, ...fromProducts]));
  }, [selectedCategory, activeCategoryObj, products]);

  // Helper to get subcategories of any specific category for the hover popover
  const getCategorySubList = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    const definedSubs = cat?.subCategories || [];
    const fromProducts = products
      .filter((p) => p.category === catId && p.subCategory && p.subCategory.trim())
      .map((p) => p.subCategory.trim());
    return Array.from(new Set([...definedSubs, ...fromProducts]));
  };

  // Filtered list based on active category, subcategory, search query and low stock filter (Triage par prix décroissant: les plus chers en haut)
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
        const matchSubCat =
          selectedSubCategory === 'all' ||
          (p.subCategory && p.subCategory.trim().toLowerCase() === selectedSubCategory.trim().toLowerCase());
        const q = searchQuery.toLowerCase().trim();
        const matchQuery =
          !q ||
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.subCategory && p.subCategory.toLowerCase().includes(q));

        const isLow = isProductLowStock(p);
        const matchLow = !onlyLowStock || isLow;

        return matchCat && matchSubCat && matchQuery && matchLow;
      })
      .sort((a, b) => {
        const priceDiff = (Number(b.sellingPrice) || 0) - (Number(a.sellingPrice) || 0);
        if (priceDiff !== 0) return priceDiff;
        return a.name.localeCompare(b.name);
      });
  }, [products, selectedCategory, selectedSubCategory, searchQuery, onlyLowStock, isProductLowStock]);

  // DYNAMIC STATS: Updated dynamically with active filters
  const isFiltered =
    selectedCategory !== 'all' ||
    selectedSubCategory !== 'all' ||
    searchQuery.trim() !== '' ||
    onlyLowStock;

  const totalStockItems = filteredProducts.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const totalCostValue = filteredProducts.reduce((acc, p) => acc + (Number(p.purchasePrice) || 0) * (Number(p.stock) || 0), 0);
  const totalSaleValue = filteredProducts.reduce((acc, p) => acc + (Number(p.sellingPrice) || 0) * (Number(p.stock) || 0), 0);
  const totalPotentialProfit = totalSaleValue - totalCostValue;
  const filteredLowStockCount = filteredProducts.filter((p) => isProductLowStock(p)).length;

  const handleConfirmDelete = () => {
    if (!deleteProductModal.product) return;
    const { id, name } = deleteProductModal.product;
    deleteProduct(id);
    toast.success(
      lang === 'ar'
        ? `تم حذف المنتج "${name}" بنجاح`
        : lang === 'en'
        ? `Product "${name}" deleted successfully`
        : `Produit "${name}" supprimé avec succès !`
    );
    setDeleteProductModal({ open: false, product: null });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
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
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Package size={24} className="text-primary" />
            {t('inventoryTitle')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
            {t('inventorySubtitle')}
          </p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={onOpenNewProduct}>
            <Plus size={16} />
            {t('newProductBtn')}
          </button>
        )}
      </div>

      {/* Stock Value Stats (Dynamically Updated with Filters) */}
      <div className="stats-grid">
        {/* Card 1: Total Références */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">
              {t('totalRefs')} {isFiltered && `(${filteredProducts.length}/${products.length})`}
            </span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <Package size={18} />
            </div>
          </div>
          <div className="stat-value">{filteredProducts.length}</div>
          <div className="stat-footer">
            <span>{totalStockItems} {t('unitsInStock')}</span>
          </div>
        </div>

        {/* Card 2: Filtrer Stock Faible */}
        <div
          className="stat-card"
          style={{
            cursor: 'pointer',
            borderLeft: onlyLowStock ? '3px solid var(--accent-warning)' : undefined,
            background: onlyLowStock ? 'rgba(234, 179, 8, 0.08)' : undefined,
          }}
          onClick={() => setOnlyLowStock(!onlyLowStock)}
          title={t('filterLowStock')}
        >
          <div className="stat-header">
            <span className="stat-title">{t('filterLowStock')}</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div
            className="stat-value"
            style={{ color: filteredLowStockCount > 0 ? 'var(--accent-warning)' : 'var(--text-secondary)' }}
          >
            {filteredLowStockCount}
          </div>
          <div className="stat-footer">
            <span style={{ color: filteredLowStockCount > 0 ? 'var(--accent-warning)' : 'var(--text-muted)' }}>
              {filteredLowStockCount > 0
                ? `🔴 ${t('reorderUrgent') || 'À réapprovisionner'}`
                : `✓ ${t('allStockOk') || 'Stocks optimaux'}`}
            </span>
          </div>
        </div>

        {/* Card 3: Valeur Stock (Achat) - Admin Only */}
        {isAdmin && (
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">{t('costStockValue')}</span>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <DollarSign size={18} />
              </div>
            </div>
            <div className="stat-value privacy-blur" style={{ color: 'var(--accent-success)' }}>
              {formatMoney(totalCostValue)}
            </div>
            <div className="stat-footer">
              <span>{t('inventoryCostValue') || 'Valeur prix d’achat'}</span>
            </div>
          </div>
        )}

        {/* Card 4: Valeur Stock (Vente) & Bénéfice - Admin Only */}
        {isAdmin && (
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">{t('saleStockValue')}</span>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="stat-value privacy-blur" style={{ color: 'var(--accent-primary)' }}>
              {formatMoney(totalSaleValue)}
            </div>
            <div className="stat-footer">
              <span className="privacy-blur" style={{ color: '#34d399', fontWeight: 600 }}>
                {t('potentialProfit')} +{formatMoney(totalPotentialProfit)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter and View Bar */}
      <div
        className="ui-card"
        style={{
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        {/* Search, Low Stock, and View Mode Switcher */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="input-with-icon" style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} />
            <input
              type="text"
              className="form-input"
              style={{ paddingRight: searchQuery ? '2rem' : undefined }}
              placeholder={t('inventorySearchPlaceholder')}
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (setInventorySearchQuery) setInventorySearchQuery(val);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (setInventorySearchQuery) setInventorySearchQuery('');
                }}
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Effacer la recherche"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            className={`btn btn-sm ${onlyLowStock ? 'btn-danger' : 'btn-outline'}`}
            onClick={() => setOnlyLowStock(!onlyLowStock)}
          >
            <AlertTriangle size={14} />
            {onlyLowStock
              ? t('showAllStocks')
              : `${t('filterLowStock')} (${filteredLowStockCount})`}
          </button>

          {/* View Mode Toggle (Table / Cards) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-secondary)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderRadius: '6px',
              }}
              onClick={() => setViewMode('table')}
              title={t('tableView')}
            >
              <LayoutList size={15} />
              <span>{t('tableView')}</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderRadius: '6px',
              }}
              onClick={() => setViewMode('cards')}
              title={t('cardsView')}
            >
              <LayoutGrid size={15} />
              <span>{t('cardsView')}</span>
            </button>
          </div>
        </div>

        {/* Main Categories Tabs with Hover Dropdown */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', paddingBottom: '0.2rem', position: 'relative' }}>
          {/* Tous les produits (No subcategories shown for all) */}
          <button
            className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
            style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}
            onClick={() => handleSelectCategory('all')}
          >
            {t('allProducts')} ({products.length})
          </button>

          {/* Each Category Button with Subcategory Hover Popover */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = products.filter((p) => p.category === cat.id).length;
            const catSubs = getCategorySubList(cat.id);
            const isHovered = hoveredCategory === cat.id;

            return (
              <div
                key={cat.id}
                style={{ position: 'relative', display: 'inline-block' }}
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <button
                  className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    whiteSpace: 'nowrap',
                    fontSize: '0.82rem',
                    borderColor: isSelected ? cat.color || 'var(--accent-primary)' : 'var(--border-color)',
                    background: isSelected ? cat.color || 'var(--accent-primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  onClick={() => handleSelectCategory(cat.id)}
                >
                  <span>{cat.label}</span>
                  <span style={{ opacity: 0.8, fontSize: '0.75rem' }}>({count})</span>
                  {catSubs.length > 0 && <ChevronDown size={12} style={{ opacity: 0.6 }} />}
                </button>

                {/* Hover Popover showing Subcategories */}
                {isHovered && catSubs.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      zIndex: 100,
                      marginTop: '4px',
                      minWidth: catSubs.length > 8 ? '360px' : '200px',
                      background: 'var(--bg-card)',
                      border: `1px solid ${cat.color || 'var(--border-color)'}`,
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                      padding: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: cat.color || 'var(--accent-primary)',
                        padding: '0.2rem 0.5rem',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Layers size={11} />
                        {cat.label}
                      </span>
                      <span style={{ opacity: 0.7 }}>{catSubs.length} {t('subCategoriesTitle') || 'sous-cat.'}</span>
                    </div>

                    <div
                      style={{
                        padding: '0.35rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: isSelected && selectedSubCategory === 'all' ? 'var(--bg-secondary)' : 'transparent',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onClick={() => handleSelectCategory(cat.id, 'all')}
                    >
                      <span>{t('allSubCategories')}</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{count}</span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: catSubs.length > 8 ? 'repeat(2, 1fr)' : '1fr',
                        gap: '0.25rem',
                      }}
                    >
                      {catSubs.map((subName) => {
                        const subCount = products.filter(
                          (p) => p.category === cat.id && (p.subCategory || '').trim().toLowerCase() === subName.trim().toLowerCase()
                        ).length;
                        const isSubActive = isSelected && selectedSubCategory.toLowerCase() === subName.toLowerCase();

                        return (
                          <div
                            key={subName}
                            style={{
                              padding: '0.35rem 0.5rem',
                              fontSize: '0.75rem',
                              fontWeight: isSubActive ? 700 : 500,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              background: isSubActive ? `${cat.color || 'var(--accent-primary)'}22` : 'transparent',
                              color: isSubActive ? cat.color || 'var(--accent-primary)' : 'var(--text-secondary)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--bg-secondary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = isSubActive
                                ? `${cat.color || 'var(--accent-primary)'}22`
                                : 'transparent';
                            }}
                            onClick={() => handleSelectCategory(cat.id, subName)}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span
                                style={{
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: '50%',
                                  background: cat.color || 'var(--accent-primary)',
                                }}
                              />
                              {subName}
                            </span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.05rem 0.35rem',
                                borderRadius: '999px',
                                background: 'var(--bg-input)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {subCount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sub-Categories Filter Bar under Selected Category (HIDDEN when selectedCategory === 'all') */}
        {selectedCategory !== 'all' && availableSubCategories.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.45rem',
              paddingTop: '0.65rem',
              borderTop: '1px dashed var(--border-color)',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                whiteSpace: 'nowrap',
                marginRight: '0.2rem',
              }}
            >
              <Layers size={13} style={{ color: activeCategoryObj?.color || 'var(--accent-primary)' }} />
              <span>{t('subCategoriesTitle')} :</span>
            </span>

            {/* All Sub-categories Chip */}
            <button
              type="button"
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: selectedSubCategory === 'all' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: selectedSubCategory === 'all' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: selectedSubCategory === 'all' ? '#ffffff' : 'var(--text-secondary)',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
              onClick={() => setSelectedSubCategory('all')}
            >
              {t('allSubCategories')} ({products.filter((p) => p.category === selectedCategory).length})
            </button>

            {/* Sub-category chips */}
            {availableSubCategories.map((subName) => {
              const isSelected = selectedSubCategory.toLowerCase() === subName.toLowerCase();
              const count = products.filter((p) => {
                const matchCat = p.category === selectedCategory;
                const matchSub = (p.subCategory || '').trim().toLowerCase() === subName.trim().toLowerCase();
                return matchCat && matchSub;
              }).length;

              const themeColor = activeCategoryObj?.color || 'var(--accent-primary)';

              return (
                <button
                  key={subName}
                  type="button"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: isSelected ? `1px solid ${themeColor}` : '1px solid var(--border-color)',
                    background: isSelected ? themeColor : 'var(--bg-secondary)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setSelectedSubCategory(isSelected ? 'all' : subName)}
                >
                  <span>{subName}</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      opacity: isSelected ? 0.9 : 0.75,
                      background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-card)',
                      borderRadius: '4px',
                      padding: '0.05rem 0.3rem',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* View Switch: Table View vs Cards View */}
      {viewMode === 'table' ? (
        /* Products Table View with Dedicated Sub-Category Column */
        <div className="ui-card" style={{ padding: '0.5rem 0' }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{t('productCol')}</th>
                  <th>{t('categoryCol')}</th>
                  <th>{t('subCategoryCol')}</th>
                  {isAdmin && <th>{t('buyPriceCol')}</th>}
                  <th>{t('salePriceCol')}</th>
                  {isAdmin && <th>{t('marginCol')}</th>}
                  <th style={{ textAlign: 'center' }}>{t('stockQtyCol')}</th>
                  <th>{t('stockStateCol')}</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>{t('actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      {t('noData')}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const pPrice = Number(p.purchasePrice) || 0;
                    const sPrice = Number(p.sellingPrice) || 0;
                    const margin = sPrice - pPrice;
                    const marginPercent = pPrice > 0 ? ((margin / pPrice) * 100).toFixed(0) : '100';
                    const isOutOfStock = Number(p.stock) <= 0;
                    const isLowStock = isProductLowStock(p) && !isOutOfStock;
                    const catObj = categories.find((c) => c.id === p.category);

                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Package size={20} style={{ color: '#64748b' }} />
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <span>{p.name}</span>
                                {p.notes && p.notes.trim() && (
                                  <div className="product-notes-wrapper" title={p.notes}>
                                    <span className="product-notes-badge">
                                      <FileText size={10} />
                                      <span>{t('notes') || 'Notes'}</span>
                                    </span>
                                    <div className="product-notes-popover">
                                      <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <FileText size={12} />
                                        <span>{t('specsAndNotes') || 'Remarques & Spécifications'}</span>
                                      </div>
                                      <div>{p.notes}</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {p.barcode && (
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                  {p.barcode}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Main Category */}
                        <td>
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.72rem',
                              background: catObj?.color ? `${catObj.color}22` : 'rgba(168, 85, 247, 0.15)',
                              color: catObj?.color || '#c084fc',
                              border: `1px solid ${catObj?.color || 'rgba(168, 85, 247, 0.25)'}55`,
                            }}
                          >
                            {catObj?.label || p.category}
                          </span>
                        </td>

                        {/* Sub-Category Column */}
                        <td>
                          {p.subCategory && p.subCategory.trim() ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                              }}
                            >
                              <Layers size={11} style={{ color: catObj?.color || 'var(--accent-primary)' }} />
                              {p.subCategory}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>

                        {isAdmin && <td className="privacy-blur" style={{ color: 'var(--text-secondary)' }}>{formatMoney(pPrice)}</td>}
                        <td>
                          <strong style={{ fontSize: '0.95rem' }}>{formatMoney(sPrice)}</strong>
                        </td>
                        {isAdmin && (
                          <td className="privacy-blur">
                            <div
                              style={{
                                color: margin >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                              }}
                            >
                              +{formatMoney(margin)}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              +{marginPercent}% {t('marginUnit')}
                            </span>
                          </td>
                        )}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                            {isAdmin && (
                              <button
                                className="btn-icon btn-outline btn-sm"
                                style={{ width: '24px', height: '24px' }}
                                onClick={() => adjustStock(p.id, -1)}
                                disabled={p.stock <= 0}
                              >
                                <Minus size={12} />
                              </button>
                            )}
                            <span
                              style={{
                                fontWeight: 800,
                                minWidth: '40px',
                                fontSize: '1rem',
                                color: isOutOfStock ? 'var(--accent-danger)' : 'var(--text-primary)',
                              }}
                            >
                              {p.stock}
                            </span>
                            {isAdmin && (
                              <button
                                className="btn-icon btn-outline btn-sm"
                                style={{ width: '24px', height: '24px' }}
                                onClick={() => adjustStock(p.id, 1)}
                              >
                                <Plus size={12} />
                              </button>
                            )}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.unit || t('piece')}</span>
                        </td>
                        <td>
                          {isOutOfStock && <span className="badge badge-red">{t('stateOutOfStock')}</span>}
                          {isLowStock && <span className="badge badge-yellow">{t('stateLowStock')} ({p.stock})</span>}
                          {!isOutOfStock && !isLowStock && (
                            <span className="badge badge-green">{t('stateInStock')}</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                              <button
                                className="btn-icon btn-outline btn-sm"
                                title={t('edit')}
                                onClick={() => onEditProduct(p)}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="btn-icon btn-outline btn-sm"
                                title={t('delete')}
                                style={{ color: 'var(--accent-danger)' }}
                                onClick={() => setDeleteProductModal({ open: true, product: p })}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Visual Cards Grid View */
        <div>
          {filteredProducts.length === 0 ? (
            <div className="ui-card" style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
              <Package size={42} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>{t('noData')}</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {filteredProducts.map((p) => {
                const pPrice = Number(p.purchasePrice) || 0;
                const sPrice = Number(p.sellingPrice) || 0;
                const margin = sPrice - pPrice;
                const marginPercent = pPrice > 0 ? ((margin / pPrice) * 100).toFixed(0) : '100';
                const isOutOfStock = Number(p.stock) <= 0;
                const isLowStock = isProductLowStock(p) && !isOutOfStock;
                const catObj = categories.find((c) => c.id === p.category);

                return (
                  <div
                    key={p.id}
                    className="ui-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: isOutOfStock
                        ? '1px solid rgba(239, 68, 68, 0.4)'
                        : isLowStock
                        ? '1px solid rgba(245, 158, 11, 0.4)'
                        : '1px solid var(--border-color)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Card Media Header */}
                    <div
                      style={{
                        position: 'relative',
                        height: '140px',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Package size={40} style={{ opacity: 0.35, color: catObj?.color || 'var(--accent-primary)' }} />
                      )}

                      {/* Stock Status Badge */}
                      <span
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          background: isOutOfStock
                            ? '#ef4444'
                            : isLowStock
                            ? '#f59e0b'
                            : 'rgba(15, 23, 42, 0.85)',
                          color: '#ffffff',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        }}
                      >
                        {isOutOfStock ? t('stateOutOfStock') : `${p.stock} ${p.unit || t('piece')}`}
                      </span>
                    </div>

                    {/* Card Content Body */}
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.75rem' }}>
                      {/* Categories Badges */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.68rem',
                            background: catObj?.color ? `${catObj.color}22` : 'rgba(168, 85, 247, 0.15)',
                            color: catObj?.color || '#c084fc',
                            border: `1px solid ${catObj?.color || 'rgba(168, 85, 247, 0.25)'}55`,
                          }}
                        >
                          {catObj?.label || p.category}
                        </span>

                        {p.subCategory && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '6px',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-color)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <Layers size={10} style={{ color: catObj?.color || 'var(--accent-primary)' }} />
                            {p.subCategory}
                          </span>
                        )}
                      </div>

                      {/* Title & Barcode & Notes */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.4rem' }}>
                          <h4
                            style={{
                              margin: 0,
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              lineHeight: 1.3,
                              flex: 1,
                            }}
                            title={p.name}
                          >
                            {p.name}
                          </h4>

                          {p.notes && p.notes.trim() && (
                            <div className="product-notes-wrapper" title={p.notes}>
                              <span className="product-notes-badge">
                                <FileText size={10} />
                                <span>{t('notes') || 'Notes'}</span>
                              </span>
                              <div className="product-notes-popover">
                                <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <FileText size={12} />
                                  <span>{t('specsAndNotes') || 'Remarques & Spécifications'}</span>
                                </div>
                                <div>{p.notes}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        {p.barcode && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                            {p.barcode}
                          </span>
                        )}
                      </div>

                      {/* Pricing Details */}
                      {isAdmin ? (
                        <div
                          style={{
                            background: 'var(--bg-secondary)',
                            padding: '0.65rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t('buyPriceCol')}</div>
                            <div className="privacy-blur" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                              {formatMoney(pPrice)}
                            </div>
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t('marginCol')}</div>
                            <div
                              className="privacy-blur"
                              style={{
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: margin >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
                              }}
                            >
                              +{formatMoney(margin)}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t('salePriceCol')}</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                              {formatMoney(sPrice)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            background: 'var(--bg-secondary)',
                            padding: '0.65rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {t('salePriceCol')}
                          </div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                            {formatMoney(sPrice)}
                          </div>
                        </div>
                      )}

                      {/* Stock Adjustment Controls & Actions */}
                      <div
                        style={{
                          marginTop: 'auto',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid var(--border-color)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {isAdmin && (
                            <button
                              className="btn-icon btn-outline btn-sm"
                              style={{ width: '26px', height: '26px' }}
                              onClick={() => adjustStock(p.id, -1)}
                              disabled={p.stock <= 0}
                            >
                              <Minus size={13} />
                            </button>
                          )}
                          <span
                            style={{
                              fontWeight: 800,
                              minWidth: '35px',
                              textAlign: 'center',
                              fontSize: '0.92rem',
                              color: isOutOfStock ? 'var(--accent-danger)' : 'var(--text-primary)',
                            }}
                          >
                            {p.stock} {p.unit ? <small style={{ fontWeight: 500, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.unit}</small> : ''}
                          </span>
                          {isAdmin && (
                            <button
                              className="btn-icon btn-outline btn-sm"
                              style={{ width: '26px', height: '26px' }}
                              onClick={() => adjustStock(p.id, 1)}
                            >
                              <Plus size={13} />
                            </button>
                          )}
                        </div>

                        {isAdmin && (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              className="btn-icon btn-outline btn-sm"
                              title={t('edit')}
                              onClick={() => onEditProduct(p)}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              className="btn-icon btn-outline btn-sm"
                              title={t('delete')}
                              style={{ color: 'var(--accent-danger)' }}
                              onClick={() => setDeleteProductModal({ open: true, product: p })}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirm Delete Product Modal */}
      {deleteProductModal.open && deleteProductModal.product && (
        <ConfirmDeleteModal
          title={t('deleteProductConfirmTitle') || t('delete')}
          message={
            lang === 'ar'
              ? `هل أنت متأكد من رغبتك في حذف هذا المنتج من المخزون نهائياً؟`
              : lang === 'en'
              ? `Are you sure you want to permanently delete this product from inventory?`
              : `Êtes-vous sûr de vouloir supprimer définitivement cet article de l'inventaire ?`
          }
          itemDetails={{
            title: deleteProductModal.product.name,
            subtitle: `${categories.find((c) => c.id === deleteProductModal.product.category)?.label || deleteProductModal.product.category || ''} • ${deleteProductModal.product.stock || 0} ${deleteProductModal.product.unit || t('piece')}`,
            value: `${formatMoney(Number(deleteProductModal.product.sellingPrice) || 0)} (${t('salePriceCol')})`,
            valueColor: 'var(--accent-primary)',
          }}
          warningText={t('deleteProductWarning')}
          confirmButtonText={t('delete')}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteProductModal({ open: false, product: null })}
        />
      )}
    </div>
  );
}
