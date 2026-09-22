import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Tag,
  Flame,
  Smartphone,
  Sparkles,
  Droplets,
  Wrench,
  Grid,
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
  Package,
  ChevronDown,
  FileText,
} from 'lucide-react';

const ICON_MAP = {
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
  Tag,
  Package,
  Folder,
  Gem,
  ShieldCheck,
  Layers,
  Zap,
  Grid,
};

export default function POS({ onOpenPaymentModal }) {
  const { products, categories, isProductLowStock, formatMoney, t, isAdmin } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // Category icons mapping
  const getCategoryIcon = (cat) => {
    if (!cat) return Grid;
    if (typeof cat === 'string') {
      const found = categories.find((c) => c.id === cat);
      if (found && found.icon && ICON_MAP[found.icon]) return ICON_MAP[found.icon];
      return ICON_MAP[cat] || Grid;
    }
    if (cat.icon && ICON_MAP[cat.icon]) return ICON_MAP[cat.icon];
    return Grid;
  };

  const handleSelectCategory = (catId, subCat = 'all') => {
    setSelectedCategory(catId);
    setSelectedSubCategory(subCat);
    setHoveredCategory(null);
  };

  const activeCategoryObj = useMemo(() => {
    return categories.find((c) => c.id === selectedCategory);
  }, [categories, selectedCategory]);

  const getCategorySubList = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    const definedSubs = cat?.subCategories || [];
    const fromProducts = products
      .filter((p) => p.category === catId && p.subCategory && p.subCategory.trim())
      .map((p) => p.subCategory.trim());
    return Array.from(new Set([...definedSubs, ...fromProducts]));
  };

  const availableSubCategories = useMemo(() => {
    if (selectedCategory === 'all') {
      return [];
    }
    const set = new Set(activeCategoryObj?.subCategories || []);
    products
      .filter((p) => p.category === selectedCategory)
      .forEach((p) => {
        if (p.subCategory && p.subCategory.trim()) set.add(p.subCategory.trim());
      });
    return Array.from(set);
  }, [selectedCategory, activeCategoryObj, products]);

  // Filter products and sort by price descending (les grands en top)
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
        const matchSubCat =
          selectedSubCategory === 'all' ||
          (p.subCategory && p.subCategory.trim().toLowerCase() === selectedSubCategory.trim().toLowerCase());
        const query = searchQuery.toLowerCase().trim();
        const matchSearch =
          !query ||
          p.name.toLowerCase().includes(query) ||
          (p.barcode && p.barcode.toLowerCase().includes(query)) ||
          (p.subCategory && p.subCategory.toLowerCase().includes(query));
        return matchCat && matchSubCat && matchSearch;
      })
      .sort((a, b) => {
        const priceDiff = (Number(b.sellingPrice) || 0) - (Number(a.sellingPrice) || 0);
        if (priceDiff !== 0) return priceDiff;
        return a.name.localeCompare(b.name);
      });
  }, [products, selectedCategory, selectedSubCategory, searchQuery]);

  // Cart operations
  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error(t('outOfStock'));
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.warning(`${t('maxStockReached')} (${product.stock})`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            unitPrice: Number(product.sellingPrice) || 0,
            costPrice: Number(product.purchasePrice) || 0,
            quantity: 1,
            total: Number(product.sellingPrice) || 0,
            unit: product.unit || 'pièce',
            image: product.image || '',
            maxStock: product.stock,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.maxStock) {
              toast.warning(`${t('stockAvailable')} ${item.maxStock}`);
              return item;
            }
            return newQty > 0
              ? { ...item, quantity: newQty, total: newQty * item.unitPrice }
              : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm(t('clearCartConfirm'))) {
      setCart([]);
      toast.info(t('cartEmpty') || 'Panier vidé');
    }
  };

  // Quick custom item
  const addQuickItem = () => {
    const desc = prompt(t('quickItemPromptName'));
    if (!desc) return;
    const price = prompt(t('quickItemPromptPrice'));
    if (!price || isNaN(Number(price))) return;

    setCart((prev) => [
      ...prev,
      {
        productId: `custom-${Date.now()}`,
        name: desc,
        unitPrice: Number(price),
        costPrice: 0,
        quantity: 1,
        total: Number(price),
        unit: 'service',
        maxStock: 999,
      },
    ]);
  };

  // Cart totals
  const totalAmount = cart.reduce((acc, item) => acc + item.total, 0);
  const totalCost = cart.reduce((acc, item) => acc + item.costPrice * item.quantity, 0);
  const totalProfit = totalAmount - totalCost;

  return (
    <div className="pos-layout">
      {/* Catalog & Search Section */}
      <div className="pos-catalog">
        {/* Top Controls: Categories & Search */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="input-with-icon" style={{ flex: 1 }}>
              <Search size={18} />
              <input
                type="text"
                className="form-input"
                placeholder={t('posSearchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <button className="btn btn-outline btn-sm" onClick={addQuickItem} title={t('quickItem')}>
              <Plus size={16} />
              {t('quickItem')}
            </button>
          </div>

          {/* Category Chips with Hover Popover */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', paddingBottom: '0.25rem', position: 'relative' }}>
            {/* All Products Tab */}
            <button
              className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
              style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}
              onClick={() => handleSelectCategory('all')}
            >
              <Grid size={14} />
              <span>{t('allProducts')}</span>
              <span style={{ opacity: 0.75, fontSize: '0.75rem' }}>({products.length})</span>
            </button>

            {/* Configured Categories with Hover Popovers */}
            {categories.map((cat, idx) => {
              const Icon = getCategoryIcon(cat);
              const isSelected = selectedCategory === cat.id;
              const count = products.filter((p) => p.category === cat.id).length;
              const catSubs = getCategorySubList(cat.id);
              const isHovered = hoveredCategory === cat.id;
              const isRightSide = idx >= Math.ceil(categories.length / 2);

              return (
                <div
                  key={cat.id}
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    zIndex: isHovered ? 100 : 1,
                  }}
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
                    <Icon size={14} />
                    <span>{cat.label}</span>
                    <span style={{ opacity: 0.8, fontSize: '0.75rem' }}>({count})</span>
                    {catSubs.length > 0 && <ChevronDown size={12} style={{ opacity: 0.6 }} />}
                  </button>

                  {/* Hover Popover showing Subcategories (Z-INDEX 99999 + Smart Alignment) */}
                  {isHovered && catSubs.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: isRightSide ? 'auto' : 0,
                        right: isRightSide ? 0 : 'auto',
                        zIndex: 99999,
                        marginTop: '4px',
                        minWidth: '220px',
                        maxWidth: '280px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        background: 'var(--bg-card)',
                        border: `1px solid ${cat.color || 'var(--border-color)'}`,
                        borderRadius: '8px',
                        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.45), 0 4px 10px rgba(0, 0, 0, 0.2)',
                        padding: '0.45rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
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
                  )}
                </div>
              );
            })}
          </div>

          {/* Subcategory Chips (Only shown when a specific category is selected) */}
          {selectedCategory !== 'all' && availableSubCategories.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                flexWrap: 'wrap',
                paddingTop: '0.5rem',
                borderTop: '1px dashed var(--border-color)',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  whiteSpace: 'nowrap',
                  marginRight: '0.2rem',
                }}
              >
                <Layers size={12} style={{ color: activeCategoryObj?.color || 'var(--accent-primary)' }} />
                <span>{t('subCategoriesTitle')} :</span>
              </span>

              {/* All Sub-categories Chip */}
              <button
                type="button"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: selectedSubCategory === 'all' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: selectedSubCategory === 'all' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: selectedSubCategory === 'all' ? '#ffffff' : 'var(--text-secondary)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setSelectedSubCategory('all')}
              >
                {t('allSubCategories')} ({products.filter((p) => p.category === selectedCategory).length})
              </button>

              {/* Dynamic subcategory pills */}
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
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isSelected ? `1px solid ${themeColor}` : '1px solid var(--border-color)',
                      background: isSelected ? themeColor : 'var(--bg-secondary)',
                      color: isSelected ? '#ffffff' : 'var(--text-primary)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => setSelectedSubCategory(isSelected ? 'all' : subName)}
                  >
                    <span>{subName}</span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '999px',
                        background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-card)',
                        color: isSelected ? '#ffffff' : 'var(--text-muted)',
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

        {/* Products Visual Grid */}
        <div className="products-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {filteredProducts.map((product) => {
            const isOutOfStock = Number(product.stock) <= 0;
            const isLowStock = isProductLowStock(product) && !isOutOfStock;
            const CatIcon = getCategoryIcon(product.category);
            const catObj = categories.find((c) => c.id === product.category);

            return (
              <div
                key={product.id}
                className={`pos-prod-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                onClick={() => !isOutOfStock && addToCart(product)}
              >
                {/* Visual Image Header */}
                <div className="pos-card-img-container">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="pos-card-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="pos-card-img-placeholder">
                      <CatIcon size={32} style={{ opacity: 0.4, color: catObj?.color || 'var(--accent-primary)' }} />
                    </div>
                  )}

                  {/* Badges on image */}
                  <span
                    className="pos-stock-pill"
                    style={{
                      background: isOutOfStock
                        ? '#ef4444'
                        : isLowStock
                        ? '#f59e0b'
                        : 'rgba(15, 23, 42, 0.85)',
                      color: '#ffffff',
                    }}
                  >
                    {isOutOfStock ? t('outOfStock') : `${product.stock} ${product.unit || t('pieces')}`}
                  </span>
                </div>

                {/* Body details */}
                <div className="pos-card-body">
                  <div className="pos-card-info">
                    {/* Category & Subcategory tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          color: catObj?.color || 'var(--accent-primary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {catObj?.label || product.category}
                      </span>
                      {product.subCategory && (
                        <span
                          style={{
                            fontSize: '0.64rem',
                            fontWeight: 600,
                            padding: '0.08rem 0.35rem',
                            borderRadius: '4px',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                        >
                          <Layers size={9} style={{ color: catObj?.color || 'var(--accent-primary)' }} />
                          {product.subCategory}
                        </span>
                      )}
                      {product.notes && product.notes.trim() && (
                        <div
                          className="product-notes-wrapper"
                          title={product.notes}
                          onClick={(e) => e.stopPropagation()}
                          style={{ marginInlineStart: 'auto' }}
                        >
                          <span className="product-notes-badge">
                            <FileText size={10} />
                            <span>{t('notes') || 'Notes'}</span>
                          </span>
                          <div className="product-notes-popover">
                            <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <FileText size={12} />
                              <span>{t('specsAndNotes') || 'Remarques & Spécifications'}</span>
                            </div>
                            <div>{product.notes}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <h4
                      style={{
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        lineHeight: '1.35',
                        color: 'var(--text-primary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                      }}
                      title={product.name}
                    >
                      {product.name}
                    </h4>
                  </div>

                  <div className="pos-card-footer">
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {formatMoney(product.sellingPrice)}
                    </span>
                    <button
                      className="btn-icon btn-primary btn-sm"
                      style={{ width: '28px', height: '28px', borderRadius: '8px' }}
                      disabled={isOutOfStock}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart & Checkout Panel */}
      <div className="pos-cart-panel">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={20} className="text-primary" />
            <h3 style={{ fontSize: '1.1rem' }}>{t('cartTitle')} ({cart.reduce((a, b) => a + b.quantity, 0)})</h3>
          </div>
          {cart.length > 0 && (
            <button className="btn-icon btn-outline btn-sm" onClick={clearCart} title={t('clearCart')}>
              <Trash2 size={16} style={{ color: 'var(--accent-danger)' }} />
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <ShoppingCart size={48} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem' }}>{t('cartEmpty')}</p>
              <p style={{ fontSize: '0.8rem' }}>{t('cartEmptyHint')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {cart.map((item) => (
                <div
                  key={item.productId}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                  }}
                >
                  {/* Cart Item Thumbnail */}
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {formatMoney(item.unitPrice)}
                      </span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {formatMoney(item.total)}
                      </strong>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <button
                      className="btn-icon btn-outline"
                      style={{ width: '22px', height: '22px' }}
                      onClick={() => updateQuantity(item.productId, -1)}
                    >
                      <Minus size={11} />
                    </button>
                    <span style={{ fontWeight: 700, minWidth: '18px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      {item.quantity}
                    </span>
                    <button
                      className="btn-icon btn-outline"
                      style={{ width: '22px', height: '22px' }}
                      onClick={() => updateQuantity(item.productId, 1)}
                    >
                      <Plus size={11} />
                    </button>
                    <button
                      className="btn-icon btn-outline"
                      style={{ width: '22px', height: '22px', marginLeft: '0.15rem', color: 'var(--accent-danger)' }}
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary & Checkout button */}
        <div style={{ padding: '1rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
          {isAdmin && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>{t('estimatedProfit')}</span>
              <span className="profit-blur" style={{ color: 'var(--accent-success)', fontWeight: 700 }}>+{formatMoney(totalProfit)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('totalToPay')}</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatMoney(totalAmount)}
            </span>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700 }}
            disabled={cart.length === 0}
            onClick={() => onOpenPaymentModal(cart, totalAmount, totalProfit, () => setCart([]))}
          >
            <CheckCircle size={18} />
            {t('checkout')}
          </button>
        </div>
      </div>
    </div>
  );
}
