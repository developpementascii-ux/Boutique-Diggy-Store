import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import {
  History,
  Search,
  Printer,
  RotateCcw,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  ShoppingCart,
  Wrench,
  Layers,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  LayoutGrid,
  LayoutList,
  User,
  Phone,
  Package,
  Calendar,
  Edit2,
  HandCoins,
} from 'lucide-react';
import EditSaleModal from './EditSaleModal';
import RepairModal from './RepairModal';

export default function SalesHistory({ onEditRepair }) {
  const { sales, repairs, products, clients, cancelSale, formatMoney, setActiveReceipt, t, lang, isAdmin } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(() => {
    try {
      return localStorage.getItem('sales_history_date_filter') || 'today';
    } catch {
      return 'today';
    }
  }); // 'today', 'yesterday', '7d', '30d', 'custom', 'all'
  const [customDate, setCustomDate] = useState(() => {
    try {
      return localStorage.getItem('sales_history_custom_date') || new Date().toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  });
  const [typeFilter, setTypeFilter] = useState(() => {
    try {
      return localStorage.getItem('sales_history_type_filter') || 'all';
    } catch {
      return 'all';
    }
  }); // 'all', 'sales', 'repairs', 'credits'
  const [paymentFilter, setPaymentFilter] = useState(() => {
    try {
      return localStorage.getItem('sales_history_payment_filter') || 'all';
    } catch {
      return 'all';
    }
  }); // 'all', 'cash', 'credit', 'partial'
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('sales_history_view_mode') || 'table';
    } catch {
      return 'table';
    }
  }); // 'table' | 'cards'
  const [cancelModal, setCancelModal] = useState({ open: false, sale: null });
  const [editSaleModal, setEditSaleModal] = useState({ open: false, sale: null });
  const [editRepairModal, setEditRepairModal] = useState({ open: false, repair: null });

  // Persist view mode and filters preference across visits
  useEffect(() => {
    try {
      localStorage.setItem('sales_history_view_mode', viewMode);
      localStorage.setItem('sales_history_date_filter', dateFilter);
      localStorage.setItem('sales_history_custom_date', customDate);
      localStorage.setItem('sales_history_type_filter', typeFilter);
      localStorage.setItem('sales_history_payment_filter', paymentFilter);
    } catch (e) {
      console.error(e);
    }
  }, [viewMode, dateFilter, customDate, typeFilter, paymentFilter]);

  // Date boundary calculation for period filtering
  const periodBounds = useMemo(() => {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    if (dateFilter === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (dateFilter === 'yesterday') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateFilter === '7d' || dateFilter === 'week') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (dateFilter === '30d' || dateFilter === 'month') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (dateFilter === 'custom') {
      const targetDate = customDate ? new Date(customDate + 'T00:00:00') : new Date();
      startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
    }

    const isInPeriod = (dateStr) => {
      if (!startDate || !endDate) return true;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= startDate && d <= endDate;
    };

    return { startDate, endDate, isInPeriod };
  }, [dateFilter, customDate]);

  // Build unified operations list
  const allOperations = useMemo(() => {
    const list = [];

    // Map sales
    (sales || []).forEach((sale) => {
      list.push({
        id: `sale-${sale.id}`,
        kind: 'sale',
        ref: sale.invoiceNumber,
        date: sale.date,
        clientName: sale.clientName || (lang === 'ar' ? 'زبون عابر' : lang === 'en' ? 'Walk-in Client' : 'Client Comptoir'),
        clientPhone: sale.clientPhone || '',
        itemsList: sale.items || [],
        detailsSummary: (sale.items || []).map((it) => `${it.name} (x${it.quantity})`).join(', '),
        totalAmount: Number(sale.totalAmount) || 0,
        amountPaid: Number(sale.amountPaid) || 0,
        remainingDue: Number(sale.remainingCredit) || 0,
        profit: Number(sale.totalProfit) || 0,
        paymentType: sale.paymentType || 'cash',
        status: 'completed',
        raw: sale,
      });
    });

    // Map repairs
    (repairs || []).forEach((rep) => {
      const isDelivered = rep.status === 'delivered';
      const effectiveDate = rep.deliveredAt || rep.createdAt;
      const totalAmount = Number(rep.totalPrice) || 0;
      const remainingDue = rep.remainingDue !== undefined ? Number(rep.remainingDue) : (isDelivered ? 0 : Math.max(0, totalAmount - (Number(rep.advancePaid) || 0)));
      const amountPaid = rep.advancePaid !== undefined ? Number(rep.advancePaid) : Math.max(0, totalAmount - remainingDue);

      const baseLabor = Number(rep.laborCost) > 0
        ? Number(rep.laborCost)
        : Math.max(0, totalAmount - (Number(rep.pieceCost) || 0));

      // Realized profit: if delivered -> full labor gain; if advance paid -> advance amount
      const profit = isDelivered
        ? (baseLabor > 0 ? baseLabor : totalAmount)
        : (amountPaid > 0 ? amountPaid : (baseLabor > 0 ? baseLabor : 0));

      list.push({
        id: `repair-${rep.id}`,
        kind: 'repair',
        ref: rep.ticketNumber,
        date: effectiveDate,
        clientName: rep.clientName || (lang === 'ar' ? 'زبون صيانة' : lang === 'en' ? 'Repair Client' : 'Client Atelier'),
        clientPhone: rep.clientPhone || '',
        itemsList: [],
        deviceModel: rep.deviceModel,
        issueDescription: rep.issueDescription,
        pieceName: rep.pieceName,
        detailsSummary: `${rep.deviceModel} — ${rep.issueDescription || 'Réparation'}${rep.pieceName ? ` (Pièce: ${rep.pieceName})` : ''}`,
        totalAmount,
        amountPaid,
        remainingDue,
        profit,
        paymentType: remainingDue === 0 ? 'cash' : (amountPaid > 0 ? 'partial' : 'credit'),
        status: rep.status,
        raw: rep,
      });
    });

    // Map credit payments (collected debt settlements)
    (clients || []).forEach((client) => {
      (client.history || []).forEach((trx) => {
        const isPayment = Number(trx.amount) < 0 || trx.type === 'payment' || trx.type === 'repair_payment' || trx.type === 'settlement';
        if (isPayment) {
          const collectedAmount = Math.abs(Number(trx.amount) || 0);
          list.push({
            id: `credit-pmt-${client.id}-${trx.id || trx.date}`,
            kind: 'credit_payment',
            ref: trx.id ? `REC-${String(trx.id).replace('trx-', '').slice(-6).toUpperCase()}` : 'RECOUV',
            date: trx.date,
            clientName: client.name || (lang === 'ar' ? 'زبون' : lang === 'en' ? 'Customer' : 'Client'),
            clientPhone: client.phone || '',
            itemsList: [],
            detailsSummary: `${t('opTypeCredit')} • ${trx.note || (lang === 'ar' ? 'سداد نقداً' : lang === 'en' ? 'Cash settlement' : 'Règlement espèces')}`,
            totalAmount: collectedAmount,
            amountPaid: collectedAmount,
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
  }, [sales, repairs, clients, lang, t]);

  // Filter logic (Strictly reactive to date, type, payment method and search query)
  const filteredOperations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return allOperations.filter((op) => {
      // Type filter
      if (typeFilter === 'sales' && op.kind !== 'sale') return false;
      if (typeFilter === 'repairs' && op.kind !== 'repair') return false;
      if (typeFilter === 'credits' && op.kind !== 'credit_payment') return false;

      // Payment filter
      if (paymentFilter === 'cash' && op.paymentType !== 'cash') return false;
      if (paymentFilter === 'credit' && op.paymentType !== 'credit' && op.remainingDue <= 0) return false;
      if (paymentFilter === 'partial' && op.paymentType !== 'partial') return false;

      // Date filter
      if (!periodBounds.isInPeriod(op.date)) return false;

      // Query filter
      if (q) {
        const matchRef = op.ref && op.ref.toLowerCase().includes(q);
        const matchClient = op.clientName && op.clientName.toLowerCase().includes(q);
        const matchPhone = op.clientPhone && op.clientPhone.toLowerCase().includes(q);
        const matchDetails = op.detailsSummary && op.detailsSummary.toLowerCase().includes(q);
        if (!matchRef && !matchClient && !matchPhone && !matchDetails) {
          return false;
        }
      }

      return true;
    });
  }, [allOperations, searchQuery, periodBounds, typeFilter, paymentFilter]);

  // Dynamic KPI Summary calculated strictly from current active filter results (excluding granted credit)
  const totalVolume = useMemo(() => {
    return filteredOperations.reduce((acc, op) => acc + (Number(op.amountPaid) || 0), 0);
  }, [filteredOperations]);

  const totalCollected = useMemo(() => {
    return filteredOperations.reduce((acc, op) => acc + (Number(op.amountPaid) || 0), 0);
  }, [filteredOperations]);

  const totalRemaining = useMemo(() => {
    return filteredOperations.reduce((acc, op) => acc + (Number(op.remainingDue) || 0), 0);
  }, [filteredOperations]);

  const totalProfit = useMemo(() => {
    return filteredOperations.reduce((acc, op) => acc + (Number(op.profit) || 0), 0);
  }, [filteredOperations]);

  const salesCount = filteredOperations.filter((op) => op.kind === 'sale').length;
  const repairsCount = filteredOperations.filter((op) => op.kind === 'repair').length;
  const creditsCount = filteredOperations.filter((op) => op.kind === 'credit_payment').length;

  const handleConfirmCancelSale = () => {
    if (!cancelModal.sale) return;
    const sale = cancelModal.sale;
    cancelSale(sale.id);
    toast.info(
      lang === 'ar'
        ? `تم إلغاء عملية البيع ${sale.invoiceNumber} وإعادة السلع إلى المخزون بنجاح`
        : lang === 'en'
        ? `Sale ${sale.invoiceNumber} cancelled and items returned to inventory`
        : `Vente ${sale.invoiceNumber} annulée et articles réintégrés en stock avec succès !`
    );
    setCancelModal({ open: false, sale: null });
  };

  const getLocale = () => {
    if (lang === 'ar') return 'ar-SA';
    if (lang === 'en') return 'en-US';
    return 'fr-FR';
  };

  // Helper date filter label
  const getDateFilterLabel = () => {
    if (dateFilter === 'today') return t('periodToday') || t('filterDateToday');
    if (dateFilter === 'yesterday') return t('periodYesterday') || 'Hier';
    if (dateFilter === '7d' || dateFilter === 'week') return t('period7d') || t('filterDateWeek');
    if (dateFilter === '30d' || dateFilter === 'month') return t('period30d') || t('filterDateMonth');
    if (dateFilter === 'custom') return customDate;
    return t('allDates') || t('filterDateAll');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={24} className="text-primary" />
          {t('historyTitle')}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {t('historySubtitle')}
        </p>
      </div>

      {/* Aggregate KPI Stat Cards (Strictly follows active filters) */}
      <div className="stats-grid">
        {/* 1. Total Chiffre d'Affaires */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">{t('totalRevenue')}</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="stat-value privacy-blur">{formatMoney(totalVolume)}</div>
          <div className="stat-footer">
            <span>
              {filteredOperations.length} {t('transactions')} ({salesCount} 🛒 / {repairsCount} 🔧 / {creditsCount} 💰) • {getDateFilterLabel()}
            </span>
          </div>
        </div>

        {/* 2. Total Encaissé */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">{t('totalCollected')}</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)' }}>
              <Banknote size={18} />
            </div>
          </div>
          <div className="stat-value privacy-blur" style={{ color: 'var(--accent-success)' }}>
            {formatMoney(totalCollected)}
          </div>
          <div className="stat-footer">
            <span>{t('cashInRegister')} ({getDateFilterLabel()})</span>
          </div>
        </div>

        {/* 3. Bénéfice Net Période - Admin Only */}
        {isAdmin && (
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">{t('netPeriodProfit')}</span>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-info)' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="stat-value profit-blur" style={{ color: 'var(--accent-info)' }}>
              +{formatMoney(totalProfit)}
            </div>
            <div className="stat-footer">
              <span>{t('commercialMargin')} ({getDateFilterLabel()})</span>
            </div>
          </div>
        )}

        {/* 4. Crédits Accordés */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">{t('grantedCredit')}</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div className="stat-value privacy-blur" style={{ color: totalRemaining > 0 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
            {formatMoney(totalRemaining)}
          </div>
          <div className="stat-footer">
            <span>{t('remainingToCollect')} ({getDateFilterLabel()})</span>
          </div>
        </div>
      </div>

      {/* Operation Type Switcher & Date Range Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Operation Category Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${typeFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTypeFilter('all')}
          >
            <Layers size={14} />
            {t('journalTabAll')}
          </button>
          <button
            className={`btn btn-sm ${typeFilter === 'sales' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTypeFilter('sales')}
          >
            <ShoppingCart size={14} />
            {t('journalTabSales')}
          </button>
          <button
            className={`btn btn-sm ${typeFilter === 'repairs' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTypeFilter('repairs')}
          >
            <Wrench size={14} />
            {t('journalTabRepairs')}
          </button>
          <button
            className={`btn btn-sm ${typeFilter === 'credits' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTypeFilter('credits')}
          >
            <HandCoins size={14} />
            {t('journalTabCredits')}
          </button>
        </div>

        {/* Right: Date Range Selector */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className={`btn btn-sm ${dateFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDateFilter('all')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            {t('allDates') || t('filterDateAll')}
          </button>
          <button
            className={`btn btn-sm ${dateFilter === 'today' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDateFilter('today')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            {t('periodToday') || t('filterDateToday')}
          </button>
          <button
            className={`btn btn-sm ${dateFilter === 'yesterday' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDateFilter('yesterday')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            {t('periodYesterday') || 'Hier'}
          </button>
          <button
            className={`btn btn-sm ${dateFilter === '7d' || dateFilter === 'week' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDateFilter('7d')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            {t('period7d') || t('filterDateWeek')}
          </button>
          <button
            className={`btn btn-sm ${dateFilter === '30d' || dateFilter === 'month' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDateFilter('30d')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            {t('period30d') || t('filterDateMonth')}
          </button>

          {/* Date Picker Button / Input */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              className={`btn btn-sm ${dateFilter === 'custom' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setDateFilter('custom')}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Calendar size={13} />
              {t('periodCustom')}
            </button>
            {dateFilter === 'custom' && (
              <input
                type="date"
                className="input"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', width: 'auto' }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Search Bar and View Mode Switcher */}
      <div
        className="ui-card"
        style={{
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div className="input-with-icon" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={16} />
          <input
            type="text"
            className="form-input"
            placeholder={t('historySearchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Payment Filter Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${paymentFilter === 'all' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
            onClick={() => setPaymentFilter('all')}
          >
            {t('all')}
          </button>
          <button
            className={`btn btn-sm ${paymentFilter === 'cash' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
            onClick={() => setPaymentFilter('cash')}
          >
            💵 {t('cash')}
          </button>
          <button
            className={`btn btn-sm ${paymentFilter === 'credit' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
            onClick={() => setPaymentFilter('credit')}
          >
            🔴 {t('credit')}
          </button>
          <button
            className={`btn btn-sm ${paymentFilter === 'partial' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
            onClick={() => setPaymentFilter('partial')}
          >
            🟡 {t('partial')}
          </button>
        </div>

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

      {/* Main Content: Table View OR Cards View */}
      {viewMode === 'table' ? (
        /* Unified Journal Table */
        <div className="ui-card" style={{ padding: '0.5rem 0' }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{t('ticketNumCol')}</th>
                  <th>{t('colDateTime')}</th>
                  <th>{t('colClient')}</th>
                  <th>{t('itemsSoldCol')}</th>
                  <th>{t('colTotalAmount')}</th>
                  <th>{t('totalEncaisseCol')}</th>
                  {isAdmin && <th>{t('netProfitCol')}</th>}
                  <th>{t('paymentTypeCol')}</th>
                  <th style={{ textAlign: 'end' }}>{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOperations.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      {t('noSalesRecorded')}
                    </td>
                  </tr>
                ) : (
                  filteredOperations.map((op) => {
                    const isSale = op.kind === 'sale';
                    const isRepair = op.kind === 'repair';
                    const isCreditPmt = op.kind === 'credit_payment';
                    const isDelivered = op.status === 'delivered';

                    return (
                      <tr key={op.id}>
                        {/* 1. Reference & Type Badge */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span className={`badge ${isSale ? 'badge-blue' : isRepair ? 'badge-purple' : 'badge-green'}`}>
                              {isSale ? <ShoppingCart size={11} /> : isRepair ? <Wrench size={11} /> : <HandCoins size={11} />}
                              {op.ref}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {isSale ? t('opTypeSale') : isRepair ? t('opTypeRepair') : t('opTypeCredit')}
                            </span>
                          </div>
                        </td>

                        {/* 2. Date & Time */}
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {new Date(op.date).toLocaleString(getLocale())}
                        </td>

                        {/* 3. Client */}
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{op.clientName}</div>
                          {op.clientPhone && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{op.clientPhone}</span>
                          )}
                        </td>

                        {/* 4. Details (Items or Device Diagnostic or Credit Settlement) */}
                        <td style={{ maxWidth: '280px' }}>
                          {isCreditPmt ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem' }}>
                              <HandCoins size={15} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('opTypeCredit')}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
                                  {op.raw?.note || (lang === 'ar' ? 'سداد نقداً' : lang === 'en' ? 'Cash settlement' : 'Règlement espèces')}
                                </div>
                              </div>
                            </div>
                          ) : isSale ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              {op.itemsList.map((it, idx) => {
                                const matchingProd = (products || []).find((p) => p.id === it.productId || p.name === it.name);
                                const img = it.image || matchingProd?.image;
                                return (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                    {img ? (
                                      <img
                                        src={img}
                                        alt={it.name}
                                        style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'contain', flexShrink: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                    ) : (
                                      <Package size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    )}
                                    <span style={{ fontSize: '0.82rem' }}>
                                      {it.name} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>(x{it.quantity})</span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.82rem' }}>
                              <strong style={{ color: 'var(--text-primary)' }}>{op.deviceModel}</strong>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                                {op.issueDescription}
                              </div>
                              {op.pieceName && (
                                <div style={{ color: 'var(--accent-info)', fontSize: '0.74rem' }}>
                                  🔧 {op.pieceName}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 5. Total Amount */}
                        <td>
                          <strong className="privacy-blur" style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {formatMoney(op.totalAmount)}
                          </strong>
                        </td>

                        {/* 6. Collected / Remaining */}
                        <td>
                          <div className="privacy-blur" style={{ fontSize: '0.82rem', color: 'var(--accent-success)', fontWeight: 600 }}>
                            {t('paid')}: {formatMoney(op.amountPaid)}
                          </div>
                          {isCreditPmt ? (
                            <span className="badge badge-green" style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>
                              <CheckCircle2 size={10} /> {t('paid') || 'Encaissé'}
                            </span>
                          ) : op.remainingDue > 0 ? (
                            <div className="privacy-blur" style={{ fontSize: '0.82rem', color: 'var(--accent-danger)', fontWeight: 700 }}>
                              {t('credit')}: {formatMoney(op.remainingDue)}
                            </div>
                          ) : (
                            !isSale && isDelivered && (
                              <span className="badge badge-green" style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>
                                <CheckCircle2 size={10} /> {t('repairDeliveredSettled')}
                              </span>
                            )
                          )}
                        </td>

                        {/* 7. Profit Margin */}
                        {isAdmin && (
                          <td className="profit-blur">
                            {isCreditPmt ? (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                            ) : (
                              <span style={{ color: 'var(--accent-success)', fontWeight: 700, fontSize: '0.85rem' }}>
                                +{formatMoney(op.profit)}
                              </span>
                            )}
                          </td>
                        )}

                        {/* 8. Payment Method & Status */}
                        <td>
                          {isCreditPmt ? (
                            <span className="badge badge-green">💵 {t('cash')}</span>
                          ) : isSale ? (
                            <>
                              {op.paymentType === 'cash' && <span className="badge badge-green">{t('cash')}</span>}
                              {op.paymentType === 'credit' && <span className="badge badge-red">{t('credit')}</span>}
                              {op.paymentType === 'partial' && <span className="badge badge-yellow">{t('partial')}</span>}
                            </>
                          ) : (
                            <>
                              {isDelivered ? (
                                <span className="badge badge-purple">{t('repairDeliveredSettled')}</span>
                              ) : op.status === 'ready' ? (
                                <span className="badge badge-green">{t('statusReady')}</span>
                              ) : op.status === 'in_progress' ? (
                                <span className="badge badge-yellow">{t('statusInProgress')}</span>
                              ) : (
                                <span className="badge badge-blue">{t('statusReceived')}</span>
                              )}
                            </>
                          )}
                        </td>

                        {/* 9. Actions */}
                        <td style={{ textAlign: 'end' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                            {!isCreditPmt && (
                              <button
                                className="btn-icon btn-outline btn-sm"
                                title={t('reprintBtn')}
                                onClick={() =>
                                  setActiveReceipt({
                                    type: isSale ? 'sale' : 'repair',
                                    data: op.raw,
                                  })
                                }
                              >
                                <Printer size={14} />
                              </button>
                            )}

                            {isSale && isAdmin && (
                              <button
                                className="btn-icon btn-outline btn-sm"
                                title={t('editSale') || 'Modifier la Vente / Assigner Client'}
                                onClick={() => setEditSaleModal({ open: true, sale: op.raw })}
                              >
                                <Edit2 size={13} />
                              </button>
                            )}

                            {isRepair && isAdmin && (
                              <button
                                className="btn-icon btn-outline btn-sm"
                                title={t('editRepairModal') || 'Modifier le Ticket / Assigner Client'}
                                onClick={() => {
                                  if (onEditRepair) {
                                    onEditRepair(op.raw);
                                  } else {
                                    setEditRepairModal({ open: true, repair: op.raw });
                                  }
                                }}
                              >
                                <Edit2 size={13} />
                              </button>
                            )}

                            {isSale && isAdmin && (
                              <button
                                className="btn-icon btn-outline btn-sm"
                                title={t('cancelSale')}
                                style={{ color: 'var(--accent-danger)' }}
                                onClick={() => setCancelModal({ open: true, sale: op.raw })}
                              >
                                <RotateCcw size={14} />
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
        /* Unified Cards View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1rem' }}>
          {filteredOperations.length === 0 ? (
            <div
              className="ui-card"
              style={{
                gridColumn: '1 / -1',
                padding: '3rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              {t('noSalesRecorded')}
            </div>
          ) : (
            filteredOperations.map((op) => {
              const isSale = op.kind === 'sale';
              const isRepair = op.kind === 'repair';
              const isCreditPmt = op.kind === 'credit_payment';
              const isDelivered = op.status === 'delivered';

              return (
                <div
                  key={op.id}
                  className="ui-card"
                  style={{
                    padding: '1.1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Card Header: Type, Ref & Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span
                        className={`badge ${isSale ? 'badge-blue' : isRepair ? 'badge-purple' : 'badge-green'}`}
                        style={{ fontSize: '0.78rem', fontWeight: 700 }}
                      >
                        {isSale ? <ShoppingCart size={13} /> : isRepair ? <Wrench size={13} /> : <HandCoins size={13} />}
                        {op.ref}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={11} />
                        {new Date(op.date).toLocaleString(getLocale())}
                      </span>
                    </div>

                    {/* Status / Payment Badge */}
                    <div>
                      {isCreditPmt ? (
                        <span className="badge badge-green">{t('opTypeCredit')}</span>
                      ) : isSale ? (
                        <>
                          {op.paymentType === 'cash' && <span className="badge badge-green">{t('cash')}</span>}
                          {op.paymentType === 'credit' && <span className="badge badge-red">{t('credit')}</span>}
                          {op.paymentType === 'partial' && <span className="badge badge-yellow">{t('partial')}</span>}
                        </>
                      ) : (
                        <>
                          {isDelivered ? (
                            <span className="badge badge-purple">{t('repairDeliveredSettled')}</span>
                          ) : op.status === 'ready' ? (
                            <span className="badge badge-green">{t('statusReady')}</span>
                          ) : op.status === 'in_progress' ? (
                            <span className="badge badge-yellow">{t('statusInProgress')}</span>
                          ) : (
                            <span className="badge badge-blue">{t('statusReceived')}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.65rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                      <User size={14} style={{ color: 'var(--accent-primary)' }} />
                      <span>{op.clientName}</span>
                    </div>
                    {op.clientPhone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <Phone size={12} />
                        <span>{op.clientPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Details Summary (Items or Repair Diagnosis or Credit Settlement) */}
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-input)',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px dashed var(--border-color)',
                      minHeight: '52px',
                    }}
                  >
                    {isCreditPmt ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0' }}>
                        <HandCoins size={18} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />
                        <div>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>{t('opTypeCredit')}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {op.raw?.note || (lang === 'ar' ? 'سداد نقداً' : lang === 'en' ? 'Cash settlement' : 'Règlement espèces')}
                          </div>
                        </div>
                      </div>
                    ) : isSale ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {op.itemsList.slice(0, 3).map((it, idx) => {
                          const matchingProd = (products || []).find((p) => p.id === it.productId || p.name === it.name);
                          const img = it.image || matchingProd?.image;
                          return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                                {img ? (
                                  <img
                                    src={img}
                                    alt={it.name}
                                    style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'contain', flexShrink: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  <Package size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                )}
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                  {it.name}
                                </span>
                              </div>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.74rem', flexShrink: 0 }}>
                                x{it.quantity}
                              </span>
                            </div>
                          );
                        })}
                        {op.itemsList.length > 3 && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontStyle: 'italic' }}>
                            +{op.itemsList.length - 3} {t('items')}...
                          </span>
                        )}
                      </div>
                    ) : (
                      <div>
                        <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{op.deviceModel}</strong>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>{op.issueDescription}</div>
                        {op.pieceName && (
                          <div style={{ color: 'var(--accent-info)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                            🔧 {op.pieceName}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Financial breakdown */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      paddingTop: '0.4rem',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t('colTotalAmount')} :</span>
                      <strong className="privacy-blur" style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {formatMoney(op.totalAmount)}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                      <span className="privacy-blur" style={{ color: 'var(--accent-success)', fontWeight: 600 }}>
                        {t('paid')}: {formatMoney(op.amountPaid)}
                      </span>
                      {op.remainingDue > 0 ? (
                        <span className="privacy-blur" style={{ color: 'var(--accent-danger)', fontWeight: 700 }}>
                          {t('credit')}: {formatMoney(op.remainingDue)}
                        </span>
                      ) : isCreditPmt ? (
                        <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>
                          ✓ {t('paid') || 'Encaissé'}
                        </span>
                      ) : (
                        isAdmin && (
                          <span className="profit-blur" style={{ color: 'var(--accent-info)', fontWeight: 600 }}>
                            {t('netProfitCol')}: +{formatMoney(op.profit)}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.25rem' }}>
                    {!isCreditPmt && (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem' }}
                        onClick={() =>
                          setActiveReceipt({
                            type: isSale ? 'sale' : 'repair',
                            data: op.raw,
                          })
                        }
                      >
                        <Printer size={14} />
                        <span>{t('reprintBtn')}</span>
                      </button>
                    )}

                    {isSale && isAdmin && (
                      <button
                        className="btn btn-outline btn-sm"
                        title={t('editSale') || 'Modifier la Vente / Assigner Client'}
                        onClick={() => setEditSaleModal({ open: true, sale: op.raw })}
                      >
                        <Edit2 size={14} />
                      </button>
                    )}

                    {isRepair && isAdmin && (
                      <button
                        className="btn btn-outline btn-sm"
                        title={t('editRepairModal') || 'Modifier le Ticket / Assigner Client'}
                        onClick={() => {
                          if (onEditRepair) {
                            onEditRepair(op.raw);
                          } else {
                            setEditRepairModal({ open: true, repair: op.raw });
                          }
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                    )}

                    {isSale && isAdmin && (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }}
                        title={t('cancelSale')}
                        onClick={() => setCancelModal({ open: true, sale: op.raw })}
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal for Cancelling a Sale without browser alert */}
      {cancelModal.open && cancelModal.sale && (
        <ConfirmDeleteModal
          title={`${t('cancelSale')} : "${cancelModal.sale.invoiceNumber}"`}
          message={
            lang === 'ar'
              ? `هل أنت متأكد من إلغاء عملية البيع "${cancelModal.sale.invoiceNumber}"؟ ستتم إعادة المنتجات للمخزون تلقائياً.`
              : lang === 'en'
              ? `Are you sure you want to cancel sale "${cancelModal.sale.invoiceNumber}"? Items will be restocked.`
              : `Confirmez-vous l'annulation de la vente "${cancelModal.sale.invoiceNumber}" ? Les articles vendus seront automatiquement réintégrés dans le stock.`
          }
          itemDetails={{
            title: cancelModal.sale.invoiceNumber,
            subtitle: cancelModal.sale.clientName || 'Client Comptoir',
            value: formatMoney(cancelModal.sale.totalAmount),
            valueColor: 'var(--accent-danger)',
          }}
          warningText={
            lang === 'ar'
              ? 'سيتم حذف عملية البيع وخصم مبلغها من الإحصائيات اليومية.'
              : lang === 'en'
              ? 'The sale will be cancelled and revenue subtracted from daily totals.'
              : 'La vente sera annulée et son montant sera déduit du chiffre d’affaires du jour.'
          }
          onConfirm={handleConfirmCancelSale}
          onClose={() => setCancelModal({ open: false, sale: null })}
          confirmButtonText={lang === 'ar' ? 'تأكيد إلغاء البيع' : lang === 'en' ? 'Cancel Sale' : 'Annuler la Vente'}
        />
      )}

      {/* Edit Sale Modal */}
      {editSaleModal.open && editSaleModal.sale && (
        <EditSaleModal
          sale={editSaleModal.sale}
          onClose={() => setEditSaleModal({ open: false, sale: null })}
        />
      )}

      {/* Edit Repair Modal */}
      {editRepairModal.open && editRepairModal.repair && (
        <RepairModal
          repair={editRepairModal.repair}
          onClose={() => setEditRepairModal({ open: false, repair: null })}
        />
      )}
    </div>
  );
}
