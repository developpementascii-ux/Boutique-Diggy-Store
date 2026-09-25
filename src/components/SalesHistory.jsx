import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import EditSaleModal from './EditSaleModal';
import RepairModal from './RepairModal';
import {
  History,
  Search,
  Printer,
  Eye,
  Edit2,
  Trash2,
  ShoppingCart,
  Wrench,
  Coins,
  Users,
  CreditCard,
  Wallet,
  Calendar,
  Layers,
  LayoutList,
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  FileText,
  Smartphone,
  Package,
} from 'lucide-react';

export default function SalesHistory({ onEditRepair }) {
  const {
    sales = [],
    repairs = [],
    products = [],
    clients = [],
    cancelSale,
    formatMoney,
    setActiveReceipt,
    privacyMode,
    t,
    lang,
    isAdmin,
  } = useApp();

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Date Filter: 'today' | 'yesterday' | '7d' | '30d' | 'custom'
  const [dateFilter, setDateFilter] = useState(() => {
    try {
      const saved = localStorage.getItem('sales_history_date_filter_v2');
      return saved && ['today', 'yesterday', '7d', '30d', 'custom'].includes(saved) ? saved : '7d';
    } catch {
      return '7d';
    }
  });

  // Custom Date (YYYY-MM-DD)
  const [customDate, setCustomDate] = useState(() => {
    try {
      return localStorage.getItem('sales_history_custom_date_v2') || new Date().toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  });

  // Operation Type Filter: 'all' | 'sales' | 'repairs' | 'credits'
  const [typeFilter, setTypeFilter] = useState(() => {
    try {
      return localStorage.getItem('sales_history_type_filter_v2') || 'all';
    } catch {
      return 'all';
    }
  });

  // Payment Method Filter: 'all' | 'cash' | 'card' | 'credit' | 'partial'
  const [paymentFilter, setPaymentFilter] = useState(() => {
    try {
      return localStorage.getItem('sales_history_payment_filter_v2') || 'all';
    } catch {
      return 'all';
    }
  });

  // View Mode: 'table' | 'cards'
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('sales_history_view_mode_v2') || 'table';
    } catch {
      return 'table';
    }
  });

  // Modals
  const [cancelModal, setCancelModal] = useState({ open: false, sale: null });
  const [editSaleModal, setEditSaleModal] = useState({ open: false, sale: null });
  const [editRepairModal, setEditRepairModal] = useState({ open: false, repair: null });

  // Auto-persist filters
  useEffect(() => {
    try {
      localStorage.setItem('sales_history_view_mode_v2', viewMode);
      localStorage.setItem('sales_history_date_filter_v2', dateFilter);
      localStorage.setItem('sales_history_custom_date_v2', customDate);
      localStorage.setItem('sales_history_type_filter_v2', typeFilter);
      localStorage.setItem('sales_history_payment_filter_v2', paymentFilter);
    } catch (e) {
      console.error(e);
    }
  }, [viewMode, dateFilter, customDate, typeFilter, paymentFilter]);

  // Date Boundary Calculation
  const periodBounds = useMemo(() => {
    const now = new Date();
    let startDate = null;
    let endDate = null;
    let periodLabel = '7 derniers jours';

    if (dateFilter === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      periodLabel = "aujourd'hui";
    } else if (dateFilter === 'yesterday') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      periodLabel = 'hier';
    } else if (dateFilter === '7d') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      periodLabel = '7 derniers jours';
    } else if (dateFilter === '30d') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      periodLabel = '30 derniers jours';
    } else if (dateFilter === 'custom') {
      const targetDate = customDate ? new Date(customDate + 'T00:00:00') : new Date();
      startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
      periodLabel = customDate;
    }

    const isInPeriod = (dateStr) => {
      if (!startDate || !endDate) return true;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= startDate && d <= endDate;
    };

    return { startDate, endDate, isInPeriod, periodLabel };
  }, [dateFilter, customDate]);

  // Build Unified Active Operations List (Excluding archived items)
  const allOperations = useMemo(() => {
    const list = [];

    // Helper map of products by ID and name for fast image & data lookup
    const prodMap = new Map();
    (products || []).forEach((p) => {
      if (p.id) prodMap.set(p.id, p);
      if (p.name) prodMap.set(p.name.toLowerCase().trim(), p);
    });

    // 1. Map Counter Sales (Strictly unarchived)
    (sales || []).filter((s) => !s.archived && !s.archivedAt).forEach((sale) => {
      const debt = Number(sale.remainingCredit || sale.remainingDebt || 0);
      const total = Number(sale.totalAmount || sale.total || 0);
      const amountPaid = Number(sale.amountPaid) > 0
        ? Number(sale.amountPaid)
        : Math.max(0, total - debt);

      // Find item image if available
      const firstItem = (sale.items && sale.items[0]) || null;
      const matchedProd = firstItem ? (prodMap.get(firstItem.productId) || prodMap.get(firstItem.name?.toLowerCase().trim())) : null;
      const itemImage = firstItem?.image || matchedProd?.image || null;

      list.push({
        id: `sale-${sale.id}`,
        kind: 'sale',
        ref: sale.invoiceNumber || `#V-${String(sale.id).slice(-4)}`,
        date: sale.date,
        clientName: sale.clientName || (lang === 'ar' ? 'زبون مباشر' : 'Client Comptoir'),
        clientPhone: sale.clientPhone || '',
        detailsSummary: (sale.items || []).map((it) => `${it.name}${it.quantity > 1 ? ` (${it.quantity})` : ''}`).join(' + ') || 'Vente d\'articles',
        image: itemImage,
        totalAmount: total,
        amountPaid,
        remainingDue: debt,
        profit: Number(sale.totalProfit) || 0,
        paymentType: sale.paymentType || (debt > 0 ? (amountPaid > 0 ? 'partial' : 'credit') : 'cash'),
        status: debt === 0 ? 'settled' : amountPaid > 0 ? 'partial' : 'credit',
        raw: sale,
      });
    });

    // 2. Map Repair Tickets (Strictly unarchived)
    (repairs || []).filter((r) => !r.archived && !r.archivedAt).forEach((rep) => {
      const isDelivered = rep.status === 'delivered';
      const effectiveDate = rep.deliveredAt || rep.createdAt;
      const advance = Number(rep.advancePaid || rep.initialAdvance || rep.deposit || 0);
      const remainingDue = rep.remainingDue !== undefined ? Number(rep.remainingDue) : (isDelivered ? 0 : Math.max(0, (Number(rep.totalPrice || rep.finalCost) || 0) - advance));
      const totalAmount = Math.max(Number(rep.totalPrice || rep.finalCost || 0), advance + remainingDue);
      const amountPaid = isDelivered
        ? Math.max(0, totalAmount - remainingDue)
        : (advance > 0 ? advance : Math.max(0, totalAmount - remainingDue));

      const baseLabor = Number(rep.laborCost) > 0
        ? Number(rep.laborCost)
        : Math.max(0, totalAmount - (Number(rep.pieceCost) || 0));

      const profit = isDelivered
        ? (baseLabor > 0 ? baseLabor : totalAmount)
        : (amountPaid > 0 ? amountPaid : (baseLabor > 0 ? baseLabor : 0));

      const matchedPiece = rep.pieceUsedId ? prodMap.get(rep.pieceUsedId) : null;
      const repImage = rep.image || rep.deviceImage || matchedPiece?.image || null;

      list.push({
        id: `repair-${rep.id}`,
        kind: 'repair',
        ref: rep.ticketNumber || `#SAV-${String(rep.id).slice(-4)}`,
        date: effectiveDate,
        clientName: rep.clientName || (lang === 'ar' ? 'حريف ورشة' : 'Client Atelier'),
        clientPhone: rep.clientPhone || '',
        detailsSummary: `${rep.deviceModel || 'Appareil'} — ${rep.issueDescription || rep.diagnostic || 'Réparation'}${rep.pieceName ? ` + ${rep.pieceName}` : ''}`,
        image: repImage,
        totalAmount,
        amountPaid,
        remainingDue,
        profit,
        paymentType: remainingDue === 0 ? 'cash' : (amountPaid > 0 ? 'partial' : 'credit'),
        status: isDelivered ? 'settled' : rep.status === 'in_progress' ? 'in_progress' : 'pending',
        raw: rep,
      });
    });

    // 3. Map Credit Settlements (Strictly unarchived)
    (clients || []).forEach((client) => {
      (client.history || []).forEach((trx) => {
        const isPayment = !trx.archived && !trx.archivedAt && (Number(trx.amount) < 0 || trx.type === 'payment' || trx.type === 'repair_payment' || trx.type === 'settlement');
        if (isPayment) {
          const collected = Math.abs(Number(trx.amount) || 0);
          list.push({
            id: `credit-${client.id}-${trx.id || trx.date}`,
            kind: 'credit_payment',
            ref: trx.id ? `#CR-${String(trx.id).replace('trx-', '').slice(-4).toUpperCase()}` : '#CR-REGL',
            date: trx.date,
            clientName: client.name || 'Client',
            clientPhone: client.phone || '',
            detailsSummary: `Règlement Crédit • ${trx.note || 'Espèces'}`,
            image: null,
            totalAmount: collected,
            amountPaid: collected,
            remainingDue: 0,
            profit: 0,
            paymentType: 'cash',
            status: 'settled',
            raw: { ...trx, clientId: client.id, clientName: client.name, clientPhone: client.phone },
          });
        }
      });
    });

    // Sort newest first
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [sales, repairs, products, clients, lang]);

  // Reactive Filter Logic
  const filteredOperations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return allOperations.filter((op) => {
      // Type Filter
      if (typeFilter === 'sales' && op.kind !== 'sale') return false;
      if (typeFilter === 'repairs' && op.kind !== 'repair') return false;
      if (typeFilter === 'credits' && op.kind !== 'credit_payment') return false;

      // Payment Method Filter
      if (paymentFilter === 'cash' && op.paymentType !== 'cash') return false;
      if (paymentFilter === 'card' && op.paymentType !== 'card') return false;
      if (paymentFilter === 'credit' && op.status !== 'credit' && op.remainingDue <= 0) return false;
      if (paymentFilter === 'partial' && op.status !== 'partial') return false;

      // Date Range Filter
      if (!periodBounds.isInPeriod(op.date)) return false;

      // Search Filter
      if (q) {
        const matchRef = (op.ref || '').toLowerCase().includes(q);
        const matchClient = (op.clientName || '').toLowerCase().includes(q);
        const matchPhone = (op.clientPhone || '').toLowerCase().includes(q);
        const matchDetails = (op.detailsSummary || '').toLowerCase().includes(q);
        if (!matchRef && !matchClient && !matchPhone && !matchDetails) {
          return false;
        }
      }

      return true;
    });
  }, [allOperations, searchQuery, periodBounds, typeFilter, paymentFilter]);

  // Aggregate KPI Calculations
  const kpiTotals = useMemo(() => {
    let totalRevenue = 0;
    let totalCollected = 0;
    let totalNetProfit = 0;
    let totalCreditsGranted = 0;

    filteredOperations.forEach((op) => {
      totalRevenue += Number(op.totalAmount) || 0;
      totalCollected += Number(op.amountPaid) || 0;
      totalNetProfit += Number(op.profit) || 0;
      totalCreditsGranted += Number(op.remainingDue) || 0;
    });

    return {
      totalRevenue,
      totalCollected,
      totalNetProfit,
      totalCreditsGranted,
      transactionsCount: filteredOperations.length,
    };
  }, [filteredOperations]);

  // Format date display for date picker pill
  const formattedCustomDate = useMemo(() => {
    if (!customDate) return '22/09/2026';
    const parts = customDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return customDate;
  }, [customDate]);

  const handleConfirmCancelSale = () => {
    if (!cancelModal.sale) return;
    const sale = cancelModal.sale;
    cancelSale(sale.id);
    toast.info(
      lang === 'ar'
        ? `تم إلغاء عملية البيع ${sale.invoiceNumber} بنجاح`
        : `Vente ${sale.invoiceNumber} annulée avec succès.`
    );
    setCancelModal({ open: false, sale: null });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2.5rem' }}>
      
      {/* 1. HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1.5px solid #f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b',
            boxShadow: '0 0 14px rgba(245, 158, 11, 0.25)',
            flexShrink: 0,
          }}
        >
          <FileText size={22} strokeWidth={2.2} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Journal & Historique des Ventes
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.15rem 0 0 0' }}>
            Consultation des transactions, tickets de caisse, réparations et règlements.
          </p>
        </div>
      </div>

      {/* 2. TOP 4 KPI CARDS */}
      <div className="sales-kpi-grid-4">
        
        {/* KPI 1: Chiffre d'Affaires */}
        <div className="dash-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <ShoppingCart size={18} />
            </div>
            <div className="dash-kpi-sparkbars" style={{ color: '#f59e0b' }}>
              <div className="dash-kpi-sparkbar" style={{ height: '8px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '14px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '11px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '20px' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('metricRevenue') || "Chiffre d'Affaires"}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {privacyMode ? '••••••' : formatMoney(kpiTotals.totalRevenue)}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center' }}>
                ↗ +12%
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {kpiTotals.transactionsCount} {lang === 'ar' ? 'عمليات' : 'transactions'} • {periodBounds.periodLabel}
            </div>
          </div>
        </div>

        {/* KPI 2: Total Encaissé */}
        <div className="dash-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <Wallet size={18} />
            </div>
            <div className="dash-kpi-sparkbars" style={{ color: '#ef4444' }}>
              <div className="dash-kpi-sparkbar" style={{ height: '14px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '10px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '18px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '12px' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total Encaissé
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {privacyMode ? '••••••' : formatMoney(kpiTotals.totalCollected)}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center' }}>
                ↗ +8%
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Espèces, cartes • {periodBounds.periodLabel}
            </div>
          </div>
        </div>

        {/* KPI 3: Bénéfice Net Période */}
        <div className="dash-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
              <Coins size={18} />
            </div>
            <div className="dash-kpi-sparkbars" style={{ color: '#10b981' }}>
              <div className="dash-kpi-sparkbar" style={{ height: '10px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '14px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '16px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '22px' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('metricNetProfit') || 'Bénéfice Net'} Période
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {privacyMode ? '••••••' : formatMoney(kpiTotals.totalNetProfit)}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center' }}>
                ↗ +18%
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Marge bénéficiaire • {periodBounds.periodLabel}
            </div>
          </div>
        </div>

        {/* KPI 4: Crédits Accordés */}
        <div className="dash-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Users size={18} />
            </div>
            <div className="dash-kpi-sparkbars" style={{ color: '#ef4444' }}>
              <div className="dash-kpi-sparkbar" style={{ height: '6px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '12px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '18px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '14px' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Crédits Accordés
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {privacyMode ? '••••••' : formatMoney(kpiTotals.totalCreditsGranted)}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                ↗ +5%
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Reste à recouvrer • {periodBounds.periodLabel}
            </div>
          </div>
        </div>

      </div>

      {/* 3. FILTER ROW 1: OPERATION TYPES + PERIOD BUTTONS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        
        {/* Left: Operation Type Pills */}
        <div className="dash-period-pill-group">
          <button
            type="button"
            className={`dash-period-btn ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            Toutes les Opérations
          </button>
          <button
            type="button"
            className={`dash-period-btn ${typeFilter === 'sales' ? 'active' : ''}`}
            onClick={() => setTypeFilter('sales')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ShoppingCart size={14} />
            <span>Ventes au Comptoir</span>
          </button>
          <button
            type="button"
            className={`dash-period-btn ${typeFilter === 'repairs' ? 'active' : ''}`}
            onClick={() => setTypeFilter('repairs')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Wrench size={14} />
            <span>Fiches Réparation & SAV</span>
          </button>
          <button
            type="button"
            className={`dash-period-btn ${typeFilter === 'credits' ? 'active' : ''}`}
            onClick={() => setTypeFilter('credits')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Coins size={14} />
            <span>Crédits Collectés</span>
          </button>
        </div>

        {/* Right: Date Range Pills + Date Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
          <div className="dash-period-pill-group">
            <button
              type="button"
              className={`dash-period-btn ${dateFilter === 'today' ? 'active' : ''}`}
              onClick={() => setDateFilter('today')}
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              className={`dash-period-btn ${dateFilter === 'yesterday' ? 'active' : ''}`}
              onClick={() => setDateFilter('yesterday')}
            >
              Hier
            </button>
            <button
              type="button"
              className={`dash-period-btn ${dateFilter === '7d' ? 'active' : ''}`}
              onClick={() => setDateFilter('7d')}
            >
              7 Derniers Jours
            </button>
            <button
              type="button"
              className={`dash-period-btn ${dateFilter === '30d' ? 'active' : ''}`}
              onClick={() => setDateFilter('30d')}
            >
              30 Derniers Jours
            </button>
          </div>

          {/* Date Picker Pill */}
          <div className="dash-date-picker-wrap">
            <Calendar size={14} style={{ color: 'var(--accent-primary)' }} />
            <span>{formattedCustomDate}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>▾</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                if (e.target.value) {
                  setCustomDate(e.target.value);
                  setDateFilter('custom');
                }
              }}
            />
          </div>
        </div>

      </div>

      {/* 4. FILTER ROW 2: SEARCH INPUT + PAYMENT METHODS + VIEW TOGGLE */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        
        {/* Search Bar Input */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: '460px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '0.45rem 0.85rem',
            gap: '0.6rem',
          }}
        >
          <Search size={15} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            placeholder="Rechercher par N° facture, ticket SAV, client, article, modèle..."
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.83rem',
              width: '100%',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Middle Payment Method Pills + Right View Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          
          <div className="dash-period-pill-group">
            <button
              type="button"
              className={`dash-period-btn ${paymentFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPaymentFilter('all')}
            >
              Tous
            </button>
            <button
              type="button"
              className={`dash-period-btn ${paymentFilter === 'cash' ? 'active' : ''}`}
              onClick={() => setPaymentFilter('cash')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
              <span>Espèces / Cash</span>
            </button>
            <button
              type="button"
              className={`dash-period-btn ${paymentFilter === 'card' ? 'active' : ''}`}
              onClick={() => setPaymentFilter('card')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#38bdf8' }} />
              <span>Carte</span>
            </button>
            <button
              type="button"
              className={`dash-period-btn ${paymentFilter === 'credit' ? 'active' : ''}`}
              onClick={() => setPaymentFilter('credit')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }} />
              <span>Crédit</span>
            </button>
            <button
              type="button"
              className={`dash-period-btn ${paymentFilter === 'partial' ? 'active' : ''}`}
              onClick={() => setPaymentFilter('partial')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b' }} />
              <span>Partiel</span>
            </button>
          </div>

          {/* View Mode Toggle: Tableau / Cartes */}
          <div className="dash-period-pill-group">
            <button
              type="button"
              className={`dash-period-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <LayoutList size={14} />
              <span>Tableau</span>
            </button>
            <button
              type="button"
              className={`dash-period-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <LayoutGrid size={14} />
              <span>Cartes</span>
            </button>
          </div>

        </div>

      </div>

      {/* 5. TRANSACTIONS TABLE VIEW */}
      {viewMode === 'table' ? (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    color: 'var(--text-muted)',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '0.85rem 1rem' }}>RÉF / N°</th>
                  <th style={{ padding: '0.85rem 0.75rem' }}>DATE & HEURE</th>
                  <th style={{ padding: '0.85rem 0.75rem' }}>CLIENT</th>
                  <th style={{ padding: '0.85rem 0.75rem' }}>ARTICLES / APPAREIL & DIAGNOSTIC</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>TOTAL</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>ENCAISSÉ / RESTE</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>MARGE NETTE</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>RÈGLEMENT / STATUT</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOperations.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Aucune transaction trouvée pour ces filtres
                    </td>
                  </tr>
                ) : (
                  filteredOperations.map((op, idx) => {
                    const isSale = op.kind === 'sale';
                    const isRepair = op.kind === 'repair';
                    const isCredit = op.kind === 'credit_payment';

                    // Format date
                    const dateObj = new Date(op.date);
                    const dateStr = !isNaN(dateObj.getTime())
                      ? `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`
                      : op.date;

                    return (
                      <tr
                        key={op.id || idx}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* 1. Ref Badge */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              background: isSale
                                ? 'rgba(99, 102, 241, 0.18)'
                                : isRepair
                                ? 'rgba(245, 158, 11, 0.18)'
                                : 'rgba(236, 72, 153, 0.18)',
                              color: isSale ? '#818cf8' : isRepair ? '#fbbf24' : '#f472b6',
                              border: `1px solid ${isSale ? 'rgba(99, 102, 241, 0.3)' : isRepair ? 'rgba(245, 158, 11, 0.3)' : 'rgba(236, 72, 153, 0.3)'}`,
                            }}
                          >
                            {op.ref}
                          </span>
                        </td>

                        {/* 2. Date & Heure */}
                        <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {dateStr}
                        </td>

                        {/* 3. Client */}
                        <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          {op.clientName}
                        </td>

                        {/* 4. Articles / Appareil */}
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isSale ? '#818cf8' : isRepair ? '#fbbf24' : '#f472b6',
                                flexShrink: 0,
                                overflow: 'hidden',
                              }}
                            >
                              {op.image ? (
                                <img src={op.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : isSale ? (
                                <Package size={15} />
                              ) : isRepair ? (
                                <Smartphone size={15} />
                              ) : (
                                <Coins size={15} />
                              )}
                            </div>
                            <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                              {op.detailsSummary}
                            </div>
                          </div>
                        </td>

                        {/* 5. Total */}
                        <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          {privacyMode ? '••••' : formatMoney(op.totalAmount)}
                        </td>

                        {/* 6. Encaissé / Reste */}
                        <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700, color: '#10b981' }}>
                            {privacyMode ? '•••' : formatMoney(op.amountPaid)}
                          </span>
                          {Number(op.remainingDue) > 0 ? (
                            <span style={{ marginLeft: '0.45rem', fontWeight: 600, color: '#ef4444', fontSize: '0.75rem' }}>
                              {privacyMode ? '•••' : formatMoney(op.remainingDue)}
                            </span>
                          ) : (
                            <span style={{ marginLeft: '0.45rem', color: '#10b981', fontSize: '0.75rem', opacity: 0.8 }}>
                              0.00 DT
                            </span>
                          )}
                        </td>

                        {/* 7. Marge Nette */}
                        <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' }}>
                          {privacyMode ? '••••' : `+${formatMoney(op.profit || 0)}`}
                        </td>

                        {/* 8. Règlement / Statut */}
                        <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {op.status === 'settled' || op.status === 'delivered' ? (
                            <span
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                              }}
                            >
                              Clôturé & Payé
                            </span>
                          ) : op.status === 'partial' ? (
                            <span
                              style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                              }}
                            >
                              Partiel
                            </span>
                          ) : op.status === 'credit' ? (
                            <span
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                              }}
                            >
                              Crédit
                            </span>
                          ) : (
                            <span
                              style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                              }}
                            >
                              En cours
                            </span>
                          )}
                        </td>

                        {/* 9. Actions */}
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                            {/* View Receipt */}
                            <button
                              type="button"
                              className="dash-action-btn"
                              onClick={() => {
                                if (isSale) setActiveReceipt({ type: 'sale', data: op.raw });
                                else if (isRepair) setActiveReceipt({ type: 'repair', data: op.raw });
                                else if (isCredit) setActiveReceipt({ type: 'credit_payment', data: op.raw });
                              }}
                              title="Voir le reçu"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Print Receipt */}
                            <button
                              type="button"
                              className="dash-action-btn"
                              onClick={() => {
                                if (isSale) setActiveReceipt({ type: 'sale', data: op.raw, autoPrint: true });
                                else if (isRepair) setActiveReceipt({ type: 'repair', data: op.raw, autoPrint: true });
                                else if (isCredit) setActiveReceipt({ type: 'credit_payment', data: op.raw, autoPrint: true });
                              }}
                              title="Imprimer le ticket"
                            >
                              <Printer size={15} />
                            </button>

                            {/* Edit Action (Admin only) */}
                            {isAdmin && (
                              <button
                                type="button"
                                className="dash-action-btn"
                                onClick={() => {
                                  if (isSale) setEditSaleModal({ open: true, sale: op.raw });
                                  else if (isRepair) {
                                    if (onEditRepair) onEditRepair(op.raw);
                                    else setEditRepairModal({ open: true, repair: op.raw });
                                  }
                                }}
                                title="Modifier la transaction"
                              >
                                <Edit2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View Mode */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filteredOperations.map((op) => (
            <div key={op.id} className="dash-card" style={{ gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: op.kind === 'sale' ? 'rgba(99, 102, 241, 0.18)' : op.kind === 'repair' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(236, 72, 153, 0.18)',
                    color: op.kind === 'sale' ? '#818cf8' : op.kind === 'repair' ? '#fbbf24' : '#f472b6',
                  }}
                >
                  {op.ref}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(op.date).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR')}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: op.kind === 'sale' ? '#818cf8' : op.kind === 'repair' ? '#fbbf24' : '#f472b6',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {op.image ? (
                    <img src={op.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : op.kind === 'sale' ? (
                    <Package size={16} />
                  ) : op.kind === 'repair' ? (
                    <Smartphone size={16} />
                  ) : (
                    <Coins size={16} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{op.clientName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{op.detailsSummary}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Total Transaction</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {privacyMode ? '••••' : formatMoney(op.totalAmount)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Marge Nette</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>
                    {privacyMode ? '••••' : `+${formatMoney(op.profit || 0)}`}
                  </div>
                </div>
              </div>

              {/* Actions Footer in Cards View */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.55rem' }}>
                <button
                  type="button"
                  className="dash-action-btn"
                  onClick={() => {
                    if (op.kind === 'sale') setActiveReceipt({ type: 'sale', data: op.raw });
                    else if (op.kind === 'repair') setActiveReceipt({ type: 'repair', data: op.raw });
                    else if (op.kind === 'credit_payment') setActiveReceipt({ type: 'credit_payment', data: op.raw });
                  }}
                  title="Voir le reçu"
                >
                  <Eye size={15} />
                </button>

                <button
                  type="button"
                  className="dash-action-btn"
                  onClick={() => {
                    if (op.kind === 'sale') setActiveReceipt({ type: 'sale', data: op.raw, autoPrint: true });
                    else if (op.kind === 'repair') setActiveReceipt({ type: 'repair', data: op.raw, autoPrint: true });
                    else if (op.kind === 'credit_payment') setActiveReceipt({ type: 'credit_payment', data: op.raw, autoPrint: true });
                  }}
                  title="Imprimer le ticket"
                >
                  <Printer size={15} />
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    className="dash-action-btn"
                    onClick={() => {
                      if (op.kind === 'sale') setEditSaleModal({ open: true, sale: op.raw });
                      else if (op.kind === 'repair') {
                        if (onEditRepair) onEditRepair(op.raw);
                        else setEditRepairModal({ open: true, repair: op.raw });
                      }
                    }}
                    title="Modifier la transaction"
                  >
                    <Edit2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Sale Modal */}
      {editSaleModal.open && (
        <EditSaleModal
          sale={editSaleModal.sale}
          onClose={() => setEditSaleModal({ open: false, sale: null })}
        />
      )}

      {/* Edit Repair Modal */}
      {editRepairModal.open && (
        <RepairModal
          isOpen={editRepairModal.open}
          repairToEdit={editRepairModal.repair}
          onClose={() => setEditRepairModal({ open: false, repair: null })}
        />
      )}

      {/* Cancel Sale Modal */}
      {cancelModal.open && (
        <ConfirmDeleteModal
          isOpen={cancelModal.open}
          title="Annuler la vente"
          message={`Êtes-vous sûr de vouloir annuler la vente ${cancelModal.sale?.invoiceNumber} ? Les articles seront réintégrés en stock.`}
          onConfirm={handleConfirmCancelSale}
          onClose={() => setCancelModal({ open: false, sale: null })}
        />
      )}

    </div>
  );
}
