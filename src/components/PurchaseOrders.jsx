import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import ImportLowStockModal from './ImportLowStockModal';
import {
  ClipboardList,
  Search,
  Plus,
  Package,
  User,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  Edit2,
  Trash2,
  Phone,
  MessageCircle,
  Truck,
  Sparkles,
  LayoutGrid,
  LayoutList,
  ArrowRight,
  RotateCcw,
  Check,
  DollarSign,
  Layers,
  ArrowUpRight,
  Filter,
  Download,
  FileDown,
  X,
} from 'lucide-react';

export default function PurchaseOrders({ onOpenNewOrder, onEditOrder }) {
  const {
    purchaseOrders,
    deletePurchaseOrder,
    resetPurchaseOrders,
    togglePurchaseOrderStatus,
    products = [],
    categories = [],
    settings = {},
    formatMoney,
    t,
    lang,
    isRTL,
    isAdmin,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(() => {
    try {
      return localStorage.getItem('po_type_filter') || 'all';
    } catch {
      return 'all';
    }
  }); // 'all' | 'stock_refill' | 'client_request' | 'general_note'
  const [statusFilter, setStatusFilter] = useState(() => {
    try {
      return localStorage.getItem('po_status_filter') || 'all';
    } catch {
      return 'all';
    }
  }); // 'all' | 'pending' | 'ordered' | 'received' | 'cancelled'
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all' | 'urgent'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('po_view_mode') || 'table';
    } catch {
      return 'table';
    }
  }); // 'table' | 'cards'

  const [deleteModal, setDeleteModal] = useState({ open: false, order: null });
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Persist view mode and filters in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('po_view_mode', viewMode);
      localStorage.setItem('po_type_filter', typeFilter);
      localStorage.setItem('po_status_filter', statusFilter);
    } catch (e) {
      console.error(e);
    }
  }, [viewMode, typeFilter, statusFilter]);

  // Sub-categories for currently selected category filter or all sub-categories
  const availableSubCategories = useMemo(() => {
    const set = new Set();
    const result = [];

    if (categoryFilter !== 'all') {
      const cat = categories.find((c) => c.id === categoryFilter || c.label === categoryFilter || c.name === categoryFilter);
      (cat?.subCategories || []).forEach((s) => {
        const name = typeof s === 'string' ? s.trim() : (s?.name || s?.label || '').trim();
        if (name && !set.has(name)) {
          set.add(name);
          result.push(name);
        }
      });
      products.filter((p) => (p.category === categoryFilter || p.category === cat?.id) && p.subCategory).forEach((p) => {
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
      products.forEach((p) => {
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
  }, [categories, categoryFilter, products]);

  // Helper to extract category & subcategory info for an order
  const getOrderCategoryInfo = (po) => {
    let catId = po.category || '';
    let subCat = po.subCategory || '';
    if (!catId || !subCat) {
      const linked = po.linkedProductId
        ? products.find((p) => p.id === po.linkedProductId)
        : products.find((p) => p.name?.toLowerCase().trim() === po.title?.toLowerCase().trim());
      if (linked) {
        if (!catId) catId = linked.category || '';
        if (!subCat) subCat = linked.subCategory || '';
      }
    }
    const catObj = categories.find((c) => c.id === catId || c.label === catId || c.name === catId);
    return {
      categoryId: catId,
      categoryName: catObj?.label || catObj?.name || catId || '',
      subCategory: subCat,
      categoryColor: catObj?.color || 'var(--accent-primary)',
    };
  };

  // Filtered List
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return purchaseOrders.filter((po) => {
      // Type filter
      if (typeFilter !== 'all' && po.type !== typeFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && po.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter === 'urgent' && po.priority !== 'urgent') return false;

      // Category filter
      const catInfo = getOrderCategoryInfo(po);
      if (categoryFilter !== 'all' && catInfo.categoryId !== categoryFilter) return false;
      if (subCategoryFilter !== 'all' && catInfo.subCategory !== subCategoryFilter) return false;

      // Search Query
      if (q) {
        const matchTitle = po.title && po.title.toLowerCase().includes(q);
        const matchSupplier = po.supplier && po.supplier.toLowerCase().includes(q);
        const matchClient = po.clientName && po.clientName.toLowerCase().includes(q);
        const matchPhone = po.clientPhone && po.clientPhone.toLowerCase().includes(q);
        const matchNotes = po.notes && po.notes.toLowerCase().includes(q);
        const matchCat = catInfo.categoryName && catInfo.categoryName.toLowerCase().includes(q);
        const matchSub = catInfo.subCategory && catInfo.subCategory.toLowerCase().includes(q);
        if (!matchTitle && !matchSupplier && !matchClient && !matchPhone && !matchNotes && !matchCat && !matchSub) {
          return false;
        }
      }

      return true;
    });
  }, [purchaseOrders, products, categories, searchQuery, typeFilter, statusFilter, priorityFilter, categoryFilter, subCategoryFilter]);

  // KPI Statistics
  const activeOrders = useMemo(() => {
    return purchaseOrders.filter((po) => po.status === 'pending' || po.status === 'ordered');
  }, [purchaseOrders]);

  const clientRequests = useMemo(() => {
    return activeOrders.filter((po) => po.type === 'client_request');
  }, [activeOrders]);

  const stockRefills = useMemo(() => {
    return activeOrders.filter((po) => po.type === 'stock_refill');
  }, [activeOrders]);

  const totalEstimatedCost = useMemo(() => {
    return activeOrders.reduce((sum, po) => {
      const qty = Number(po.quantity) || 1;
      const cost = Number(po.estimatedCost) || 0;
      return sum + qty * cost;
    }, 0);
  }, [activeOrders]);

  const receivedOrdersCount = useMemo(() => {
    return purchaseOrders.filter((po) => po.status === 'received').length;
  }, [purchaseOrders]);

  const isFiltered = useMemo(() => {
    return (
      typeFilter !== 'all' ||
      statusFilter !== 'all' ||
      priorityFilter !== 'all' ||
      categoryFilter !== 'all' ||
      subCategoryFilter !== 'all' ||
      Boolean(searchQuery.trim())
    );
  }, [typeFilter, statusFilter, priorityFilter, categoryFilter, subCategoryFilter, searchQuery]);

  const handleConfirmDelete = () => {
    if (!deleteModal.order) return;
    deletePurchaseOrder(deleteModal.order.id);
    setDeleteModal({ open: false, order: null });
  };

  const handleExecuteReset = (mode) => {
    if (mode === 'received') {
      const count = receivedOrdersCount;
      resetPurchaseOrders('received');
      toast.success(
        lang === 'ar'
          ? `تم حذف ${count} طلبيات مستلمة بنجاح`
          : `${count} article(s) reçus retiré(s) du cahier !`
      );
    } else if (mode === 'filtered') {
      const ids = filteredOrders.map((o) => o.id);
      resetPurchaseOrders('selected', ids);
      toast.success(
        lang === 'ar'
          ? `تم حذف ${ids.length} عناصر من القائمة بنجاح`
          : `${ids.length} article(s) filtré(s) supprimé(s) du cahier !`
      );
    } else {
      resetPurchaseOrders('all');
      toast.success(
        lang === 'ar'
          ? 'تم تفريغ كامل قائمة الطلبيات بنجاح'
          : 'Cahier de commandes entièrement réinitialisé !'
      );
    }
    setShowResetModal(false);
  };

  const handlePrintList = () => {
    window.print();
  };

  const cleanPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/[^0-9+]/g, '');
  };

  const getWhatsAppLink = (po) => {
    const raw = cleanPhone(po.clientPhone);
    if (!raw) return '#';
    const intl = raw.startsWith('+') ? raw.replace('+', '') : raw.length === 8 ? `216${raw}` : raw;
    const msg =
      lang === 'ar'
        ? `مرحباً ${po.clientName || 'حريفنا الكريم'}، نعلمك أن طلبيتك (${po.title}) متوفرة وجاهزة للاستلام في المحل. أهلاً وسهلاً بك!`
        : `Bonjour ${po.clientName || 'cher client'}, nous vous informons que votre commande (${po.title}) est bien arrivée et prête en boutique. À très bientôt !`;
    return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'stock_refill':
        return (
          <span className="badge badge-blue" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Package size={12} /> {t('typeStockRefill')}
          </span>
        );
      case 'client_request':
        return (
          <span className="badge badge-purple" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <User size={12} /> {t('typeClientRequest')}
          </span>
        );
      case 'general_note':
      default:
        return (
          <span className="badge" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' }}>
            <FileText size={12} /> {t('typeGeneralNote')}
          </span>
        );
    }
  };

  const handleExportTxtList = () => {
    if (filteredOrders.length === 0) {
      toast.error(
        lang === 'ar'
          ? 'لا توجد عناصر للتصدير حالياً'
          : 'Aucune note ou commande à exporter pour cette sélection.'
      );
      return;
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR');
    const timeFormatted = now.toLocaleTimeString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });

    let content = '===========================================================\n';
    content += `   ${(settings?.shopName || 'BOUTIQUE PRO').toUpperCase()}\n`;
    content += `   CAHIER DE COMMANDES & NOTES D'ACHATS FOURNISSEURS\n`;
    content += `   Date d'export : ${dateFormatted} à ${timeFormatted}\n`;
    content += '===========================================================\n\n';

    content += `LISTE DES ARTICLES À COMMANDER (${filteredOrders.length}) :\n`;
    content += `-----------------------------------------------------------\n`;

    let totalQty = 0;
    let globalIndex = 0;

    // Group orders by Category and Sub-category
    const groupedByCategory = {};
    filteredOrders.forEach((po) => {
      const catInfo = getOrderCategoryInfo(po);
      const catKey = catInfo.categoryName || (lang === 'ar' ? 'أخرى / بدون تصنيف' : 'Autres / Sans catégorie');
      const subCatKey = catInfo.subCategory || (lang === 'ar' ? 'عام' : 'Général');

      if (!groupedByCategory[catKey]) {
        groupedByCategory[catKey] = {};
      }
      if (!groupedByCategory[catKey][subCatKey]) {
        groupedByCategory[catKey][subCatKey] = [];
      }
      groupedByCategory[catKey][subCatKey].push({ po, catInfo });
    });

    const categoryNames = Object.keys(groupedByCategory).sort((a, b) => {
      if (a.includes('Autres') || a.includes('بدون')) return 1;
      if (b.includes('Autres') || b.includes('بدون')) return -1;
      return a.localeCompare(b);
    });

    categoryNames.forEach((catName) => {
      const subCats = groupedByCategory[catName];
      const subCatKeys = Object.keys(subCats).sort((a, b) => {
        if (a === 'Général' || a === 'عام') return 1;
        if (b === 'Général' || b === 'عام') return -1;
        return a.localeCompare(b);
      });

      // Calculate totals for this category
      let catTotalLines = 0;
      let catTotalQty = 0;
      subCatKeys.forEach((subKey) => {
        subCats[subKey].forEach(({ po }) => {
          catTotalLines += 1;
          catTotalQty += Number(po.quantity) || 1;
        });
      });

      content += `\n📦 CATÉGORIE : ${catName.toUpperCase()} (${catTotalLines} article${catTotalLines > 1 ? 's' : ''} • ${catTotalQty} unité${catTotalQty > 1 ? 's' : ''})\n`;
      content += `-----------------------------------------------------------\n`;

      subCatKeys.forEach((subKey) => {
        const items = subCats[subKey];
        const isGeneral = subKey === 'Général' || subKey === 'عام';
        if (!isGeneral && (subCatKeys.length > 1 || subKey !== 'Général')) {
          content += `\n▶ [${subKey}]\n`;
        }

        items.forEach(({ po, catInfo }) => {
          globalIndex += 1;
          const qty = Number(po.quantity) || 1;
          totalQty += qty;

          const subCatPrefix = catInfo.subCategory
            ? `[${catInfo.subCategory}] `
            : (catInfo.categoryName ? `[${catInfo.categoryName}] ` : '');

          content += `  ${globalIndex}. [ ] ${subCatPrefix}${po.title} (x${qty})\n`;

          const details = [];
          if (po.supplier) {
            details.push(`Fournisseur / Grossiste : ${po.supplier}`);
          }
          if (po.type === 'client_request') {
            details.push(`Demande Client : ${po.clientName || 'Client'}${po.clientPhone ? ` (Tél : ${po.clientPhone})` : ''}`);
          }
          if (po.notes) {
            const isStockAlertNote = /alerte stock|stock restant|généré (depuis|automatiquement)/i.test(po.notes);
            if (!isStockAlertNote) {
              details.push(`Note : ${po.notes}`);
            }
          }

          if (details.length > 0) {
            details.forEach((d) => {
              content += `     • ${d}\n`;
            });
          }
        });
      });
      content += `\n`;
    });

    content += `===========================================================\n`;
    content += `RÉCAPITULATIF GLOBAL :\n`;
    content += `- Nombre de catégories : ${categoryNames.length}\n`;
    content += `- Nombre de lignes de commande : ${filteredOrders.length}\n`;
    content += `- Quantité totale d'articles à commander : ${totalQty}\n`;

    // Trigger download of the .txt file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanDate = now.toISOString().split('T')[0];
    link.download = `liste_commandes_achats_${cleanDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(
      lang === 'ar'
        ? 'تم تصدير وتحميل القائمة النصية بنجاح (.txt)'
        : 'Liste des commandes exportée et téléchargée avec succès (.txt) !'
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-yellow" style={{ fontSize: '0.72rem' }}>⏳ {t('statusPending')}</span>;
      case 'ordered':
        return <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>🚚 {t('statusOrdered')}</span>;
      case 'received':
        return <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>✅ {t('statusReceived')}</span>;
      case 'cancelled':
        return <span className="badge badge-red" style={{ fontSize: '0.72rem' }}>❌ {t('statusCancelled')}</span>;
      default:
        return <span className="badge">{status}</span>;
    }
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
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', margin: 0 }}>
            <ClipboardList size={24} className="text-primary" />
            {t('purchaseOrdersTitle')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
            {t('purchaseOrdersSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Export TXT button */}
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleExportTxtList}
            style={{
              borderColor: 'var(--accent-primary)',
              color: 'var(--accent-primary)',
              background: 'rgba(99, 102, 241, 0.08)',
              fontWeight: 700,
            }}
            title={lang === 'ar' ? 'تصدير القائمة كملف نصي .txt' : 'Exporter la liste au format texte .txt'}
          >
            <FileDown size={16} />
            <span>{lang === 'ar' ? 'تصدير TXT' : 'Exporter TXT'}</span>
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowImportModal(true)}
            style={{
              borderColor: '#f59e0b',
              color: '#f59e0b',
              background: 'rgba(245, 158, 11, 0.08)',
              fontWeight: 700,
            }}
            title={t('importLowStockBtn')}
          >
            <Sparkles size={16} />
            <span>{t('importLowStockBtn')}</span>
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={handlePrintList}
            title={t('printPurchaseList')}
          >
            <Printer size={16} />
            <span>{t('printPurchaseList')}</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowResetModal(true)}
              style={{
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.06)',
                fontWeight: 700,
              }}
              title={lang === 'ar' ? 'إعادة ضبط / تفريغ القائمة' : 'Réinitialiser / Vider la liste'}
            >
              <RotateCcw size={16} />
              <span>{lang === 'ar' ? 'إعادة ضبط القائمة' : 'Reset Liste'}</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenNewOrder}
              style={{ fontWeight: 700 }}
            >
              <Plus size={16} />
              <span>{t('newPurchaseOrderBtn')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregate KPI Stat Cards */}
      <div className="stats-grid">
        {/* 1. Total Notes Actives */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">{t('activeOrdersCount')}</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
              <ClipboardList size={18} />
            </div>
          </div>
          <div className="stat-value">{activeOrders.length}</div>
          <div className="stat-footer">
            <span>{purchaseOrders.length} {t('items')} au total</span>
          </div>
        </div>

        {/* 2. Demandes Clients */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">{t('clientRequestsCountLabel')}</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <User size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#c084fc' }}>{clientRequests.length}</div>
          <div className="stat-footer">
            <span>Articles réservés / attendus</span>
          </div>
        </div>

        {/* 3. Recharges Stock */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">{t('stockRefillsCountLabel')}</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-info)' }}>
              <Package size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-info)' }}>{stockRefills.length}</div>
          <div className="stat-footer">
            <span>Fournisseurs & grossistes</span>
          </div>
        </div>

        {/* 4. Coût Total Estimé - Admin Only */}
        {isAdmin && (
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">{t('totalEstimatedCost')}</span>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)' }}>
                <DollarSign size={18} />
              </div>
            </div>
            <div className="stat-value privacy-blur" style={{ color: 'var(--accent-success)' }}>
              {formatMoney(totalEstimatedCost)}
            </div>
            <div className="stat-footer">
              <span>Budget d'achat estimé</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Single Card Container */}
      <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Toolbar Header */}
        <div
          style={{
            padding: '1.25rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'var(--bg-secondary)',
          }}
        >
          {/* Row 1: Search, Category & Sub-category filter, Priority & View Mode */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="input-with-icon" style={{ flex: '1 1 240px', minWidth: '220px' }}>
              <Search size={16} />
              <input
                type="text"
                className="form-input"
                placeholder={lang === 'ar' ? 'بحث بالاسم، الحريف، الهاتف، الصنف أو المورد...' : 'Rechercher par article, client, catégorie, grossiste...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Dropdown Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <select
                className="form-select"
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', minWidth: '160px' }}
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setSubCategoryFilter('all');
                }}
              >
                <option value="all">📁 {lang === 'ar' ? 'جميع الأصناف' : 'Toutes les catégories'}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label || cat.name || cat.id}
                  </option>
                ))}
              </select>

              {/* Sub-category Dropdown Filter */}
              {availableSubCategories.length > 0 && (
                <select
                  className="form-select"
                  style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', minWidth: '150px' }}
                  value={subCategoryFilter}
                  onChange={(e) => setSubCategoryFilter(e.target.value)}
                >
                  <option value="all">📂 {lang === 'ar' ? 'جميع الأصناف الفرعية' : 'Toutes sous-catégories'}</option>
                  {availableSubCategories.map((sub, idx) => (
                    <option key={idx} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Priority urgent toggle */}
            <button
              type="button"
              className={`btn btn-sm ${priorityFilter === 'urgent' ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => setPriorityFilter(priorityFilter === 'urgent' ? 'all' : 'urgent')}
            >
              <AlertTriangle size={14} />
              <span>{priorityFilter === 'urgent' ? t('all') : `🔴 ${t('priorityUrgent')}`}</span>
            </button>

            {/* Display Mode Toggle */}
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-input)',
                padding: '0.2rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
                style={{ border: 'none', padding: '0.35rem 0.65rem' }}
                onClick={() => setViewMode('table')}
                title="Vue Tableau"
              >
                <LayoutList size={14} />
                <span>{t('tableView') || 'Tableau'}</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline'}`}
                style={{ border: 'none', padding: '0.35rem 0.65rem' }}
                onClick={() => setViewMode('cards')}
                title="Vue Cartes"
              >
                <LayoutGrid size={14} />
                <span>{t('cardsView') || 'Cartes'}</span>
              </button>
            </div>
          </div>

          {/* Row 2: Type Filter Tabs + Status Pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            {/* Type Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn btn-sm ${typeFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setTypeFilter('all')}
              >
                <Layers size={13} />
                <span>{t('all')} ({purchaseOrders.length})</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm ${typeFilter === 'stock_refill' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setTypeFilter('stock_refill')}
              >
                <Package size={13} />
                <span>{t('typeStockRefill')} ({purchaseOrders.filter(p => p.type === 'stock_refill').length})</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm ${typeFilter === 'client_request' ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  borderColor: typeFilter === 'client_request' ? '#c084fc' : undefined,
                  background: typeFilter === 'client_request' ? 'rgba(168, 85, 247, 0.2)' : undefined,
                  color: typeFilter === 'client_request' ? '#c084fc' : undefined,
                }}
                onClick={() => setTypeFilter('client_request')}
              >
                <User size={13} />
                <span>{t('typeClientRequest')} ({purchaseOrders.filter(p => p.type === 'client_request').length})</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm ${typeFilter === 'general_note' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setTypeFilter('general_note')}
              >
                <FileText size={13} />
                <span>{t('typeGeneralNote')} ({purchaseOrders.filter(p => p.type === 'general_note').length})</span>
              </button>
            </div>

            {/* Status Filter Pills */}
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'all' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ fontSize: '0.74rem', padding: '0.2rem 0.5rem' }}
                onClick={() => setStatusFilter('all')}
              >
                {t('all')}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ fontSize: '0.74rem', padding: '0.2rem 0.5rem' }}
                onClick={() => setStatusFilter('pending')}
              >
                ⏳ {t('statusPending')}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'ordered' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ fontSize: '0.74rem', padding: '0.2rem 0.5rem' }}
                onClick={() => setStatusFilter('ordered')}
              >
                🚚 {t('statusOrdered')}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'received' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ fontSize: '0.74rem', padding: '0.2rem 0.5rem' }}
                onClick={() => setStatusFilter('received')}
              >
                ✅ {t('statusReceived')}
              </button>
            </div>
          </div>
        </div>

        {/* Content Section: Table vs Cards */}
        <div style={{ padding: viewMode === 'table' ? 0 : '1.25rem' }}>
          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <ClipboardList size={48} style={{ margin: '0 auto 0.75rem auto', opacity: 0.3 }} />
              <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {lang === 'ar' ? 'لا توجد مذكرات أو طلبات مسجلة' : 'Aucune note d’achat ou commande trouvée'}
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {categoryFilter !== 'all'
                  ? (lang === 'ar' ? 'جرب اختيار صنف آخر أو إعادة تعيين الفلتر.' : 'Essayez de sélectionner une autre catégorie ou de réinitialiser les filtres.')
                  : t('purchaseOrdersSubtitle')}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {categoryFilter !== 'all' && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setCategoryFilter('all');
                      setSubCategoryFilter('all');
                    }}
                  >
                    {lang === 'ar' ? 'عرض جميع الأصناف' : 'Toutes les catégories'}
                  </button>
                )}
                <button className="btn btn-primary btn-sm" onClick={onOpenNewOrder}>
                  <Plus size={14} />
                  {t('newPurchaseOrderBtn')}
                </button>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            /* Table View */
            <div className="table-responsive">
              <table className="custom-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '150px' }}>{t('orderType')}</th>
                    <th>{t('itemTitleLabel')}</th>
                    <th style={{ textAlign: 'center' }}>{t('quantityLabel')}</th>
                    {isAdmin && <th style={{ textAlign: isRTL ? 'left' : 'right' }}>{t('estimatedCostLabel')}</th>}
                    <th>{t('clientSection') || 'Client'} / {t('supplierLabel')}</th>
                    <th>{t('status')}</th>
                    <th style={{ textAlign: 'end' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((po) => {
                    const unitCost = Number(po.estimatedCost) || 0;
                    const totalCost = (Number(po.quantity) || 1) * unitCost;
                    const isClientReq = po.type === 'client_request';
                    const isReceived = po.status === 'received';
                    const catInfo = getOrderCategoryInfo(po);

                    return (
                      <tr key={po.id} style={{ opacity: isReceived ? 0.75 : 1 }}>
                        {/* 1. Type & Priority */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                            {getTypeBadge(po.type)}
                            {po.priority === 'urgent' && (
                              <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>
                                🔴 {t('priorityUrgent')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Item Title, Category Badge & Notes */}
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', textDecoration: isReceived ? 'line-through' : 'none' }}>
                            {po.title}
                          </div>

                          {/* Category & Subcategory tags */}
                          {(catInfo.categoryName || catInfo.subCategory) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                              {catInfo.categoryName && (
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: '0.68rem',
                                    padding: '0.1rem 0.4rem',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    color: 'var(--accent-primary)',
                                  }}
                                >
                                  📁 {catInfo.categoryName}
                                </span>
                              )}
                              {catInfo.subCategory && (
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: '0.68rem',
                                    padding: '0.1rem 0.4rem',
                                    background: 'rgba(148, 163, 184, 0.12)',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  📂 {catInfo.subCategory}
                                </span>
                              )}
                            </div>
                          )}

                          {po.notes && !/alerte stock|stock restant|généré (depuis|automatiquement)/i.test(po.notes) && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.15rem', maxWidth: '280px' }}>
                              {po.notes}
                            </div>
                          )}
                          {po.linkedProductId && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', marginTop: '0.15rem' }}>
                              🔗 Produit catalogue lié (Auto-stock)
                            </div>
                          )}
                        </td>

                        {/* 3. Quantity */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              background: 'var(--bg-secondary)',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            x{po.quantity}
                          </span>
                        </td>

                        {/* 4. Estimated Cost */}
                        {isAdmin && (
                          <td style={{ textAlign: isRTL ? 'left' : 'right' }}>
                            {unitCost > 0 ? (
                              <div>
                                <strong className="privacy-blur" style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                  {formatMoney(totalCost)}
                                </strong>
                                {po.quantity > 1 && (
                                  <div className="privacy-blur" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    ({formatMoney(unitCost)} / u)
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                            )}
                          </td>
                        )}

                        {/* 5. Client / Supplier Details */}
                        <td>
                          {isClientReq ? (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <User size={12} />
                                <span>{po.clientName || 'Client'}</span>
                              </div>
                              {po.clientPhone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                                  <a
                                    href={`tel:${cleanPhone(po.clientPhone)}`}
                                    style={{ color: 'var(--accent-info)', fontSize: '0.76rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                                    title={t('callClient')}
                                  >
                                    <Phone size={11} /> {po.clientPhone}
                                  </a>
                                  <a
                                    href={getWhatsAppLink(po)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: '#22c55e', fontSize: '0.76rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                                    title={t('whatsappClient')}
                                  >
                                    <MessageCircle size={12} />
                                  </a>
                                </div>
                              )}
                              {Number(po.clientDeposit) > 0 && (
                                <div className="privacy-blur" style={{ fontSize: '0.72rem', color: 'var(--accent-success)', fontWeight: 600, marginTop: '0.15rem' }}>
                                  Acompte: {formatMoney(po.clientDeposit)}
                                </div>
                              )}
                            </div>
                          ) : po.supplier ? (
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Truck size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                              <span>{po.supplier}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                          )}
                        </td>

                        {/* 6. Status Selector */}
                        <td>
                          <select
                            className="form-select"
                            style={{
                              fontSize: '0.76rem',
                              padding: '0.25rem 0.5rem',
                              width: 'auto',
                              borderColor: isReceived ? 'var(--accent-success)' : undefined,
                            }}
                            value={po.status}
                            onChange={(e) => togglePurchaseOrderStatus(po.id, e.target.value)}
                          >
                            <option value="pending">⏳ {t('statusPending')}</option>
                            <option value="ordered">🚚 {t('statusOrdered')}</option>
                            <option value="received">✅ {t('statusReceived')}</option>
                            <option value="cancelled">❌ {t('statusCancelled')}</option>
                          </select>
                        </td>

                        {/* 7. Actions */}
                        <td style={{ textAlign: 'end' }}>
                          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {!isReceived && (
                              <button
                                type="button"
                                className="btn btn-sm btn-success"
                                style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                                title={t('markAsReceived')}
                                onClick={() => togglePurchaseOrderStatus(po.id, 'received')}
                              >
                                <Check size={13} />
                                <span>{lang === 'ar' ? 'استلام' : 'Reçu'}</span>
                              </button>
                            )}

                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  className="btn-icon btn-outline btn-sm"
                                  title={t('edit')}
                                  onClick={() => onEditOrder(po)}
                                >
                                  <Edit2 size={13} />
                                </button>

                                <button
                                  type="button"
                                  className="btn-icon btn-outline btn-sm"
                                  style={{ color: 'var(--accent-danger)' }}
                                  title={t('delete')}
                                  onClick={() => setDeleteModal({ open: true, order: po })}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards Grid View */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {filteredOrders.map((po) => {
                const unitCost = Number(po.estimatedCost) || 0;
                const totalCost = (Number(po.quantity) || 1) * unitCost;
                const isClientReq = po.type === 'client_request';
                const isReceived = po.status === 'received';
                const catInfo = getOrderCategoryInfo(po);

                return (
                  <div
                    key={po.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${isReceived ? 'var(--accent-success)' : 'var(--border-color)'}`,
                      borderLeft: `5px solid ${isReceived ? 'var(--accent-success)' : po.priority === 'urgent' ? 'var(--accent-danger)' : 'var(--accent-primary)'}`,
                      borderRadius: '12px',
                      padding: '1.1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.85rem',
                      boxShadow: 'var(--shadow-sm)',
                      opacity: isReceived ? 0.8 : 1,
                    }}
                  >
                    {/* Top Row: Type, Priority, Status */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {getTypeBadge(po.type)}
                          {po.priority === 'urgent' && (
                            <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>
                              🔴 {t('priorityUrgent')}
                            </span>
                          )}
                        </div>

                        <div>{getStatusBadge(po.status)}</div>
                      </div>

                      {/* Title & Quantity */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', textDecoration: isReceived ? 'line-through' : 'none' }}>
                          {po.title}
                        </div>
                        <span
                          style={{
                            background: 'var(--bg-secondary)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            border: '1px solid var(--border-color)',
                            flexShrink: 0,
                          }}
                        >
                          x{po.quantity}
                        </span>
                      </div>

                      {/* Category & Subcategory tags */}
                      {(catInfo.categoryName || catInfo.subCategory) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                          {catInfo.categoryName && (
                            <span
                              className="badge"
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.1rem 0.4rem',
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: 'var(--accent-primary)',
                              }}
                            >
                              📁 {catInfo.categoryName}
                            </span>
                          )}
                          {catInfo.subCategory && (
                            <span
                              className="badge"
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.1rem 0.4rem',
                                background: 'rgba(148, 163, 184, 0.12)',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              📂 {catInfo.subCategory}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Notes / Technical Specs */}
                      {po.notes && !/alerte stock|stock restant|généré (depuis|automatiquement)/i.test(po.notes) && (
                        <div
                          style={{
                            background: 'var(--bg-secondary)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '0.5rem',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          {po.notes}
                        </div>
                      )}

                      {/* Client Info Block if Client Request */}
                      {isClientReq && (
                        <div
                          style={{
                            background: 'rgba(168, 85, 247, 0.08)',
                            border: '1px solid rgba(168, 85, 247, 0.25)',
                            borderRadius: '8px',
                            padding: '0.6rem 0.75rem',
                            fontSize: '0.8rem',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <div style={{ fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                            <User size={13} />
                            <span>{po.clientName || 'Client'}</span>
                          </div>

                          {po.clientPhone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                              <a
                                href={`tel:${cleanPhone(po.clientPhone)}`}
                                style={{ color: 'var(--accent-info)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem' }}
                              >
                                <Phone size={12} /> {po.clientPhone}
                              </a>
                              <a
                                href={getWhatsAppLink(po)}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#22c55e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem' }}
                              >
                                <MessageCircle size={13} /> WhatsApp
                              </a>
                            </div>
                          )}

                          {Number(po.clientDeposit) > 0 && (
                            <div className="privacy-blur" style={{ color: 'var(--accent-success)', fontWeight: 700, fontSize: '0.76rem', marginTop: '0.25rem' }}>
                              Acompte versé : {formatMoney(po.clientDeposit)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Supplier info */}
                      {po.supplier && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                          <Truck size={12} style={{ color: 'var(--accent-primary)' }} />
                          <span>Fournisseur : <strong style={{ color: 'var(--text-primary)' }}>{po.supplier}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Financial Summary & Actions Bottom Bar */}
                    <div>
                      {isAdmin && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid var(--border-color)',
                            marginBottom: '0.65rem',
                          }}
                        >
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Coût estimé :</span>
                          <strong className="privacy-blur" style={{ fontSize: '1rem', color: 'var(--accent-primary)' }}>
                            {unitCost > 0 ? formatMoney(totalCost) : '—'}
                          </strong>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                        {isAdmin ? (
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button
                              type="button"
                              className="btn-icon btn-outline btn-sm"
                              title={t('edit')}
                              onClick={() => onEditOrder(po)}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon btn-outline btn-sm"
                              style={{ color: 'var(--accent-danger)' }}
                              title={t('delete')}
                              onClick={() => setDeleteModal({ open: true, order: po })}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ) : <div />}

                        <div>
                          {!isReceived ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                              onClick={() => togglePurchaseOrderStatus(po.id, 'received')}
                            >
                              <Check size={13} />
                              <span>{t('markAsReceived')}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                              onClick={() => togglePurchaseOrderStatus(po.id, 'pending')}
                            >
                              <RotateCcw size={12} />
                              <span>{t('statusPending')}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Import Low Stock Interactive Modal */}
      {showImportModal && (
        <ImportLowStockModal
          open={showImportModal}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.order && (
        <ConfirmDeleteModal
          title={`${t('deletePurchaseOrderConfirm')} : "${deleteModal.order.title}"`}
          message={
            lang === 'ar'
              ? `هل أنت متأكد من حذف هذه المذكرة "${deleteModal.order.title}" من دفتر المشتريات؟`
              : `Êtes-vous sûr de vouloir supprimer la note d’achat "${deleteModal.order.title}" du cahier ?`
          }
          itemDetails={{
            title: deleteModal.order.title,
            subtitle: `${deleteModal.order.type === 'client_request' ? 'Demande Client' : 'Recharge Stock'} • Qté: ${deleteModal.order.quantity}`,
            value: deleteModal.order.estimatedCost ? formatMoney((Number(deleteModal.order.quantity) || 1) * (Number(deleteModal.order.estimatedCost) || 0)) : undefined,
            valueColor: 'var(--accent-danger)',
          }}
          warningText={
            lang === 'ar'
              ? 'سيتم حذف المذكرة نهائياً.'
              : 'Cette note d’achat sera définitivement retirée de votre cahier.'
          }
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteModal({ open: false, order: null })}
          confirmButtonText={lang === 'ar' ? 'تأكيد الحذف' : 'Supprimer'}
        />
      )}

      {/* Reset Orders Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '490px', width: '95%', border: '1px solid rgba(239, 68, 68, 0.35)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {lang === 'ar' ? 'إعادة ضبط / تفريغ دفتر الطلبيات' : 'Réinitialiser la Liste des Commandes'}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {lang === 'ar' ? 'اختر خيار إعادة الضبط المناسب لك' : 'Choisissez le mode de réinitialisation souhaité'}
                  </p>
                </div>
              </div>
              <button type="button" className="btn-icon btn-outline" onClick={() => setShowResetModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem 0' }}>
              
              {/* Option 1: Vider les articles reçus */}
              <button
                type="button"
                className="btn btn-outline"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  textAlign: 'left',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  cursor: receivedOrdersCount > 0 ? 'pointer' : 'not-allowed',
                  opacity: receivedOrdersCount > 0 ? 1 : 0.5,
                }}
                disabled={receivedOrdersCount === 0}
                onClick={() => handleExecuteReset('received')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {lang === 'ar' ? 'حذف الطلبيات المستلمة فقط' : 'Vider uniquement les articles reçus'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {lang === 'ar' ? 'الاحتفاظ بالطلبيات قيد الانتظار وحذف المستلمة' : 'Conserve les commandes en cours et supprime les commandes traitées'}
                    </div>
                  </div>
                </div>
                <span className="badge badge-green" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                  {receivedOrdersCount} {lang === 'ar' ? 'مستلم' : 'reçu(s)'}
                </span>
              </button>

              {/* Option 2: Vider la sélection filtrée */}
              {isFiltered && (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    textAlign: 'left',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    background: 'rgba(245, 158, 11, 0.06)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleExecuteReset('filtered')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Filter size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f59e0b' }}>
                        {lang === 'ar' ? 'حذف العناصر المفلترة الحالية' : 'Vider la sélection filtrée actuelle'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {lang === 'ar' ? 'حذف النتائج الظاهرة حالياً في الجدول' : 'Supprime uniquement les lignes correspondant aux filtres actifs'}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-yellow" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                    {filteredOrders.length} {lang === 'ar' ? 'عنصر' : 'ligne(s)'}
                  </span>
                </button>
              )}

              {/* Option 3: Tout réinitialiser / Vider tout le cahier */}
              <button
                type="button"
                className="btn btn-outline"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  textAlign: 'left',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  background: 'rgba(239, 68, 68, 0.06)',
                  color: '#ef4444',
                  cursor: purchaseOrders.length > 0 ? 'pointer' : 'not-allowed',
                  opacity: purchaseOrders.length > 0 ? 1 : 0.5,
                }}
                disabled={purchaseOrders.length === 0}
                onClick={() => handleExecuteReset('all')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Trash2 size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {lang === 'ar' ? 'تفريغ كامل القائمة (حذف الكل)' : 'Vider TOUTE la liste (Remise à zéro)'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {lang === 'ar' ? 'حذف كافة الملاحظات والطلبيات نهائياً' : 'Supprime définitivement toutes les notes et commandes'}
                    </div>
                  </div>
                </div>
                <span className="badge badge-red" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                  {purchaseOrders.length} {lang === 'ar' ? 'الكل' : 'au total'}
                </span>
              </button>

            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowResetModal(false)}
              >
                {t('cancel') || 'Annuler'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
