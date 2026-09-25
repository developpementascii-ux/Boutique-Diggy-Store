import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import DailyCashChart from './DailyCashChart';
import CashSessionModal from './CashSessionModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import {
  Wallet,
  Plus,
  Search,
  Calendar,
  Filter,
  DollarSign,
  TrendingDown,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Tag,
  CreditCard,
  Edit2,
  Trash2,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  Printer,
  BarChart3,
  RotateCcw,
  Sliders,
  History,
  AlertTriangle,
  Lock,
  Unlock,
  Archive,
} from 'lucide-react';

export default function Expenses({ onOpenNewExpense, onEditExpense }) {
  const {
    expenses,
    deleteExpense,
    archiveExpense,
    cashSessions,
    deleteCashSession,
    currentSession,
    reopenCashSession,
    todayExpensesAmount,
    todayCashExpensesAmount,
    todayCashInflow,
    netCashRegisterBalance,
    openingCash,
    theoreticalCashInDrawer,
    yesterdayClosingBalance,
    monthExpensesAmount,
    formatMoney,
    setActiveReceipt,
    lang,
    t,
    isRTL,
    isAdmin,
  } = useApp();

  // Active subtab: 'session', 'expenses', 'chart'
  const [activeSubTab, setActiveSubTab] = useState('session');

  // Modal for Cash Session (open / close)
  const [sessionModalState, setSessionModalState] = useState({ open: false, mode: 'open' });
  const [deleteModal, setDeleteModal] = useState({ open: false, type: null, data: null });

  // Expenses filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(() => {
    try {
      return localStorage.getItem('expenses_category_filter') || 'all';
    } catch {
      return 'all';
    }
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(() => {
    try {
      return localStorage.getItem('expenses_payment_filter') || 'all';
    } catch {
      return 'all';
    }
  });
  const [dateFilter, setDateFilter] = useState(() => {
    try {
      return localStorage.getItem('expenses_date_filter') || 'month';
    } catch {
      return 'month';
    }
  }); // 'today', 'yesterday', '7days', 'month', 'custom', 'all'
  const [customDate, setCustomDate] = useState(() => {
    try {
      return localStorage.getItem('expenses_custom_date') || new Date().toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  });

  // Persist filters in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('expenses_category_filter', selectedCategory);
      localStorage.setItem('expenses_payment_filter', selectedPaymentMethod);
      localStorage.setItem('expenses_date_filter', dateFilter);
      localStorage.setItem('expenses_custom_date', customDate);
    } catch (e) {
      console.error(e);
    }
  }, [selectedCategory, selectedPaymentMethod, dateFilter, customDate]);

  // Date boundary calculation for period filtering
  const periodBounds = useMemo(() => {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    if (dateFilter === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (dateFilter === 'yesterday') {
      const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      startDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      endDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    } else if (dateFilter === '7days') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (dateFilter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateFilter === '30days') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (dateFilter === 'custom') {
      const targetDate = customDate ? new Date(customDate + 'T00:00:00') : new Date();
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    }

    const isInPeriod = (dateStr) => {
      if (!startDate || !endDate) return true;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= startDate && d <= endDate;
    };

    return { startDate, endDate, isInPeriod };
  }, [dateFilter, customDate]);

  // Category labels and theme colors
  const categoryConfig = {
    supplies: { label: t('catSupplies') || 'Fournitures', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
    food: { label: t('catFood') || 'Alimentation', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    bills: { label: t('catBills') || 'Factures', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)' },
    transport: { label: t('catTransport') || 'Transport', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
    salary: { label: t('catSalary') || 'Salaires', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
    rent: { label: t('catRent') || 'Loyer', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
    other: { label: t('catOther') || 'Autre', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
  };

  // Filter expenses (Active only, excluding archived)
  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter((exp) => !exp.archived).filter((exp) => {
      if (!periodBounds.isInPeriod(exp.date)) {
        return false;
      }

      if (selectedCategory !== 'all' && exp.category !== selectedCategory) {
        return false;
      }

      if (selectedPaymentMethod !== 'all' && exp.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const titleMatch = (exp.title || '').toLowerCase().includes(query);
        const notesMatch = (exp.notes || '').toLowerCase().includes(query);
        const catLabel = (categoryConfig[exp.category]?.label || '').toLowerCase();
        const catMatch = catLabel.includes(query);
        if (!titleMatch && !notesMatch && !catMatch) return false;
      }

      return true;
    });
  }, [expenses, periodBounds, selectedCategory, selectedPaymentMethod, searchTerm]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [filteredExpenses]);

  const categoryStats = useMemo(() => {
    const counts = {};
    filteredExpenses.forEach((exp) => {
      const cat = exp.category || 'other';
      counts[cat] = (counts[cat] || 0) + Number(exp.amount);
    });
    return counts;
  }, [filteredExpenses]);

  const handleDeleteExpense = (exp) => {
    setDeleteModal({ open: true, type: 'expense', data: exp });
  };

  const handlePrintZReport = (session) => {
    setActiveReceipt({
      type: 'z_report',
      data: session,
    });
  };

  const handleDeleteSession = (sess) => {
    setDeleteModal({ open: true, type: 'session', data: sess });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.data) return;
    if (deleteModal.type === 'expense') {
      const exp = deleteModal.data;
      deleteExpense(exp.id);
      toast.success(
        lang === 'ar'
          ? `تم حذف المصروف "${exp.title}" بنجاح`
          : lang === 'en'
          ? `Expense "${exp.title}" deleted successfully`
          : `Dépense "${exp.title}" supprimée avec succès !`
      );
    } else if (deleteModal.type === 'session') {
      const sess = deleteModal.data;
      deleteCashSession(sess.id);
      toast.success(
        lang === 'ar'
          ? `تم حذف جلسة الصندوق (${sess.date}) بنجاح`
          : lang === 'en'
          ? `Cash session (${sess.date}) deleted successfully`
          : `Session de caisse (${sess.date}) supprimée avec succès !`
      );
    }
    setDeleteModal({ open: false, type: null, data: null });
  };

  const isTodayClosed = currentSession?.isClosed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner & Quick Actions */}
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
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet size={26} className="text-primary" />
            <span>{t('expensesTitle')}</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            {t('expensesSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onOpenNewExpense}>
            <Plus size={18} />
            {t('newExpenseBtn')}
          </button>
          {!isTodayClosed ? (
            <button
              className="btn btn-secondary"
              style={{ background: '#7c3aed', color: '#fff' }}
              onClick={() => setSessionModalState({ open: true, mode: 'close' })}
            >
              <Lock size={16} />
              {t('closeSessionBtn')}
            </button>
          ) : (
            <button
              className="btn btn-outline"
              style={{ borderColor: '#34d399', color: '#34d399' }}
              onClick={reopenCashSession}
            >
              <Unlock size={16} />
              {t('reopenSessionBtn')}
            </button>
          )}
        </div>
      </div>

      {/* Main Subtabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.5rem',
        }}
      >
        <button
          type="button"
          className={`btn btn-sm ${activeSubTab === 'session' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveSubTab('session')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Wallet size={16} />
          <span>{t('tabCashSession')}</span>
          {isTodayClosed && <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Z</span>}
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeSubTab === 'expenses' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveSubTab('expenses')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Receipt size={16} />
          <span>{t('tabExpensesList')}</span>
          <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>{(expenses || []).filter((e) => !e.archived).length}</span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeSubTab === 'chart' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveSubTab('chart')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <BarChart3 size={16} />
          <span>{t('tabEvolutionChart')}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SESSION & SOLDE CAISSE (OUVERTURE & CLÔTURE) */}
      {/* ======================================================== */}
      {activeSubTab === 'session' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main Today Live Register Card */}
          <div
            className="ui-card"
            style={{
              padding: '1.5rem',
              background: isTodayClosed
                ? 'linear-gradient(135deg, var(--bg-card) 0%, rgba(168, 85, 247, 0.08) 100%)'
                : 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: `1px solid ${isTodayClosed ? 'rgba(168, 85, 247, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            }}
          >
            {/* Header with status badge */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.25rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: isTodayClosed ? 'rgba(168, 85, 247, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: isTodayClosed ? '#c084fc' : '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isTodayClosed ? <Lock size={22} /> : <Unlock size={22} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                      {t('tabCashSession')} ({new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })})
                    </h3>
                    <span
                      className={`badge ${isTodayClosed ? 'badge-purple' : 'badge-green'}`}
                      style={{ fontSize: '0.75rem' }}
                    >
                      {isTodayClosed ? `🔒 ${t('sessionStatusClosed')}` : `🟢 ${t('sessionStatusOpen')}`}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                    {currentSession?.openedAt && `Ouvert à ${new Date(currentSession.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    {currentSession?.closedAt && ` • Clôturé à ${new Date(currentSession.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {isAdmin && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => setSessionModalState({ open: true, mode: 'open' })}
                  >
                    <Sliders size={14} />
                    {t('editOpeningCash')} <span className="privacy-blur">({formatMoney(openingCash)})</span>
                  </button>
                )}
                {isTodayClosed ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => handlePrintZReport(currentSession)}
                  >
                    <Printer size={14} />
                    {t('printZReport')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
                    onClick={() => setSessionModalState({ open: true, mode: 'close' })}
                  >
                    <Lock size={14} />
                    {t('closeSessionBtn')}
                  </button>
                )}
              </div>
            </div>

            {/* 4 Pillars of the Daily Register */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              {/* 1. Fond d'Ouverture */}
              <div
                style={{
                  padding: '1rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  1. {t('openingCash')}
                </div>
                <div className="privacy-blur" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#e2e8f0' }}>
                  {formatMoney(openingCash)}
                </div>
                <div className="privacy-blur" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  {t('yesterdayClosingBalance')} {formatMoney(yesterdayClosingBalance)}
                </div>
              </div>

              {/* 2. Entrées Espèces */}
              <div
                style={{
                  padding: '1rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: '#38bdf8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  2. {t('totalCashIn')}
                </div>
                <div className="privacy-blur" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#38bdf8' }}>
                  +{formatMoney(todayCashInflow)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  Ventes comptoir & règlements
                </div>
              </div>

              {/* 3. Dépenses Espèces */}
              <div
                style={{
                  padding: '1rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: '#f87171', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  3. {t('totalCashOut')}
                </div>
                <div className="privacy-blur" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f87171' }}>
                  -{formatMoney(todayCashExpensesAmount)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  Frais & achats en espèces
                </div>
              </div>

              {/* 4. Solde Théorique Attendu */}
              <div
                style={{
                  padding: '1rem',
                  background: isTodayClosed ? 'rgba(168, 85, 247, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  border: `1px solid ${isTodayClosed ? 'rgba(168, 85, 247, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                  borderRadius: '10px',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: isTodayClosed ? '#c084fc' : '#34d399', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 700 }}>
                  4. {t('theoreticalCash')}
                </div>
                <div
                  className="privacy-blur"
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 900,
                    color: isTodayClosed ? '#c084fc' : '#34d399',
                  }}
                >
                  {formatMoney(theoreticalCashInDrawer)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                  (1) + (2) - (3) = Cash attendu
                </div>
              </div>
            </div>

            {/* If closed, show discrepancy and notes bar */}
            {isTodayClosed && (
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '0.9rem 1.25rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {t('countedCash')} : <strong className="privacy-blur">{formatMoney(currentSession?.countedCash)}</strong>
                  </div>
                  {currentSession?.notes && (
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      <strong>{t('notes')} :</strong> {currentSession.notes}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {t('cashDiscrepancy')} :
                  </span>
                  <span
                    className={`badge ${
                      (currentSession?.discrepancy || 0) === 0
                        ? 'badge-green'
                        : (currentSession?.discrepancy || 0) > 0
                        ? 'badge-blue'
                        : 'badge-red'
                    } privacy-blur`}
                    style={{ fontSize: '0.9rem', fontWeight: 800 }}
                  >
                    {(currentSession?.discrepancy || 0) > 0
                      ? `+${formatMoney(currentSession.discrepancy)}`
                      : formatMoney(currentSession?.discrepancy || 0)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Closings History Table (Rapports Z) */}
          <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                <History size={18} className="text-primary" />
                <span>{t('sessionHistoryTitle')}</span>
                <span className="badge badge-purple">{cashSessions.length}</span>
              </div>
            </div>

            {cashSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                <CheckCircle2 size={36} style={{ color: '#64748b', margin: '0 auto 0.5rem auto', opacity: 0.6 }} />
                <p>{t('noSessionsRecorded')}</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>{t('date')}</th>
                      <th style={{ textAlign: isRTL ? 'left' : 'right' }}>{t('openingCash')}</th>
                      <th style={{ textAlign: isRTL ? 'left' : 'right' }}>+ {t('receiptCashSales')}</th>
                      <th style={{ textAlign: isRTL ? 'left' : 'right' }}>- {t('receiptCashExpenses')}</th>
                      <th style={{ textAlign: isRTL ? 'left' : 'right' }}>{t('theoreticalCash')}</th>
                      <th style={{ textAlign: isRTL ? 'left' : 'right' }}>{t('countedCash')}</th>
                      <th style={{ textAlign: 'center' }}>{t('cashDiscrepancy')}</th>
                      <th style={{ textAlign: 'center', width: '100px' }}>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashSessions.map((sess) => {
                      const disc = Number(sess.discrepancy) || 0;
                      return (
                        <tr key={sess.id}>
                          <td>
                            <strong style={{ fontSize: '0.9rem' }}>{sess.date}</strong>
                            {sess.closedAt && (
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                {new Date(sess.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </td>
                          <td className="privacy-blur" style={{ textAlign: isRTL ? 'left' : 'right', color: '#cbd5e1' }}>
                            {formatMoney(sess.openingCash)}
                          </td>
                          <td className="privacy-blur" style={{ textAlign: isRTL ? 'left' : 'right', color: '#38bdf8', fontWeight: 600 }}>
                            +{formatMoney(sess.cashSales)}
                          </td>
                          <td className="privacy-blur" style={{ textAlign: isRTL ? 'left' : 'right', color: '#f87171', fontWeight: 600 }}>
                            -{formatMoney(sess.cashExpenses)}
                          </td>
                          <td className="privacy-blur" style={{ textAlign: isRTL ? 'left' : 'right', fontWeight: 700 }}>
                            {formatMoney(sess.theoreticalCash)}
                          </td>
                          <td className="privacy-blur" style={{ textAlign: isRTL ? 'left' : 'right', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {formatMoney(sess.countedCash)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              className={`badge ${
                                disc === 0 ? 'badge-green' : disc > 0 ? 'badge-blue' : 'badge-red'
                              } privacy-blur`}
                              style={{ fontWeight: 700 }}
                            >
                              {disc === 0 ? '0.00' : disc > 0 ? `+${formatMoney(disc)}` : formatMoney(disc)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem' }}>
                              <button
                                type="button"
                                className="btn-icon btn-outline btn-sm"
                                title={t('printZReport')}
                                onClick={() => handlePrintZReport(sess)}
                              >
                                <Printer size={14} />
                              </button>
                              {isAdmin && (
                                <button
                                  type="button"
                                  className="btn-icon btn-outline btn-sm"
                                  style={{ color: 'var(--accent-danger)' }}
                                  title={t('delete')}
                                  onClick={() => handleDeleteSession(sess)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: JOURNAL DES DÉPENSES (TABLE & FILTRES) */}
      {/* ======================================================== */}
      {activeSubTab === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Category Breakdown Pills */}
          {Object.keys(categoryStats).length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.65rem',
                padding: '1rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
              }}
            >
              <div style={{ width: '100%', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.2rem' }}>
                {t('dailyBudgetSummary')} :
              </div>
              {Object.entries(categoryStats).map(([catKey, total]) => {
                const cfg = categoryConfig[catKey] || categoryConfig.other;
                return (
                  <div
                    key={catKey}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '20px',
                      background: cfg.bg,
                      color: cfg.color,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      border: `1px solid ${cfg.color}33`,
                    }}
                  >
                    <span>{cfg.label}:</span>
                    <span className="privacy-blur" style={{ fontWeight: 800 }}>{formatMoney(total)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Filters and Search Bar */}
          <div className="ui-card" style={{ padding: '1rem' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {/* Search input */}
              <div style={{ flex: '1 1 240px', position: 'relative' }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    [isRTL ? 'right' : 'left']: '12px',
                    color: '#64748b',
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{
                    [isRTL ? 'paddingRight' : 'paddingLeft']: '38px',
                    width: '100%',
                  }}
                  placeholder={t('search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Timeframe Filter Buttons */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${dateFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setDateFilter('all')}
                >
                  {t('allDates') || t('all') || 'Tout'}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${dateFilter === 'today' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setDateFilter('today')}
                >
                  {t('periodToday') || t('filterDateToday') || "Aujourd'hui"}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${dateFilter === 'yesterday' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setDateFilter('yesterday')}
                >
                  {t('periodYesterday') || 'Hier'}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${dateFilter === '7days' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setDateFilter('7days')}
                >
                  {t('period7d') || t('filterDateWeek') || '7 Jours'}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${dateFilter === 'month' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setDateFilter('month')}
                >
                  {t('filterDateMonth') || 'Ce Mois'}
                </button>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${dateFilter === 'custom' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setDateFilter('custom')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Calendar size={13} />
                    <span>{t('periodCustom') || 'Date Précise'}</span>
                  </button>
                  {dateFilter === 'custom' && (
                    <input
                      type="date"
                      className="form-input"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', width: 'auto' }}
                    />
                  )}
                </div>
              </div>

              {/* Category dropdown filter */}
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '160px' }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">{t('expensesFilterAll')}</option>
                {Object.keys(categoryConfig).map((key) => (
                  <option key={key} value={key}>
                    {categoryConfig[key].label}
                  </option>
                ))}
              </select>

              {/* Payment method filter */}
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '150px' }}
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              >
                <option value="all">{t('all')}</option>
                <option value="cash">{t('paymentCash')}</option>
                <option value="bank">{t('paymentBank')}</option>
              </select>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <span>{t('headerExpensesTitle')}</span>
                <span className="badge badge-purple">{filteredExpenses.length} {t('items')}</span>
              </div>

              <div className="privacy-blur" style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f87171' }}>
                {t('total')} : {formatMoney(totalFilteredAmount)}
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                <Receipt size={48} style={{ color: '#64748b', margin: '0 auto 0.75rem auto', opacity: 0.6 }} />
                <p style={{ fontSize: '1rem', fontWeight: 500 }}>{t('noExpensesPeriod')}</p>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '0.75rem' }}
                  onClick={onOpenNewExpense}
                >
                  <Plus size={16} />
                  {t('newExpenseBtn')}
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '130px' }}>{t('date')}</th>
                      <th>{t('expenseTitleLabel')}</th>
                      <th>{t('expenseCategoryLabel')}</th>
                      <th>{t('expensePaymentMethod')}</th>
                      <th style={{ textAlign: isRTL ? 'left' : 'right' }}>{t('expenseAmountLabel')}</th>
                      <th>{t('notes')}</th>
                      {isAdmin && <th style={{ textAlign: 'center', width: '100px' }}>{t('actions')}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((exp) => {
                      const cfg = categoryConfig[exp.category] || categoryConfig.other;
                      const expDate = new Date(exp.date || Date.now());
                      const formattedDate = expDate.toLocaleDateString(undefined, {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      });
                      const formattedTime = expDate.toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr key={exp.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{formattedDate}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formattedTime}</div>
                          </td>
                          <td>
                            <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                              {exp.title}
                            </strong>
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: cfg.bg,
                                color: cfg.color,
                                fontWeight: 600,
                                border: `1px solid ${cfg.color}44`,
                              }}
                            >
                              {cfg.label}
                            </span>
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: exp.paymentMethod === 'cash' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                                color: exp.paymentMethod === 'cash' ? '#f87171' : '#38bdf8',
                                fontSize: '0.75rem',
                              }}
                            >
                              {exp.paymentMethod === 'cash' ? t('paymentCash') : t('paymentBank')}
                            </span>
                          </td>
                          <td
                            className="privacy-blur"
                            style={{
                              textAlign: isRTL ? 'left' : 'right',
                              fontWeight: 800,
                              fontSize: '0.98rem',
                              color: '#f87171',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            -{formatMoney(exp.amount)}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: '#94a3b8', maxWidth: '200px' }}>
                            {exp.notes || '-'}
                          </td>
                          {isAdmin && (
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                                <button
                                  type="button"
                                  className="btn-icon btn-outline btn-sm"
                                  title={t('archiveItem') || 'Archiver cette dépense'}
                                  onClick={() => {
                                    archiveExpense(exp.id);
                                    toast.success(lang === 'ar' ? 'تمت أرشفة المصروف بنجاح' : 'Dépense archivée avec succès !');
                                  }}
                                >
                                  <Archive size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon btn-outline btn-sm"
                                  title={t('edit')}
                                  onClick={() => onEditExpense(exp)}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon btn-outline btn-sm"
                                  style={{ color: 'var(--accent-danger)' }}
                                  title={t('delete')}
                                  onClick={() => handleDeleteExpense(exp)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
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
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: CHARTE & ÉVOLUTION DES JOURS */}
      {/* ======================================================== */}
      {activeSubTab === 'chart' && (
        <DailyCashChart />
      )}

      {/* Cash Session Open / Close Modal */}
      {sessionModalState.open && (
        <CashSessionModal
          mode={sessionModalState.mode}
          onClose={() => setSessionModalState({ open: false, mode: 'open' })}
        />
      )}

      {/* Confirm Delete Modal */}
      {deleteModal.open && deleteModal.data && (
        <ConfirmDeleteModal
          title={
            deleteModal.type === 'expense'
              ? `${t('deleteExpenseConfirm') || 'Supprimer la dépense'} : "${deleteModal.data.title}"`
              : `${t('deleteSessionConfirm')} (${deleteModal.data.date})`
          }
          message={
            deleteModal.type === 'expense'
              ? lang === 'ar'
                ? `هل أنت متأكد من حذف المصروف "${deleteModal.data.title}" (${formatMoney(deleteModal.data.amount)}) ؟`
                : `Êtes-vous sûr de vouloir supprimer la dépense "${deleteModal.data.title}" (${formatMoney(deleteModal.data.amount)}) ?`
              : lang === 'ar'
              ? `هل أنت متأكد من حذف جلسة الصندوق المؤرخة بـ (${deleteModal.data.date}) ؟`
              : `Êtes-vous sûr de vouloir supprimer la session de caisse du (${deleteModal.data.date}) ?`
          }
          itemDetails={
            deleteModal.type === 'expense'
              ? {
                  title: deleteModal.data.title,
                  subtitle: `${deleteModal.data.category || 'Autre'} • ${deleteModal.data.date}`,
                  value: formatMoney(deleteModal.data.amount),
                  valueColor: 'var(--accent-danger)',
                }
              : {
                  title: `Session du ${deleteModal.data.date}`,
                  subtitle: `Clôturé par ${deleteModal.data.closedBy || 'Gérant'}`,
                  value: formatMoney(deleteModal.data.countedCash || deleteModal.data.theoreticalCash),
                  valueColor: 'var(--accent-purple)',
                }
          }
          warningText={
            deleteModal.type === 'expense'
              ? lang === 'ar'
                ? 'سيتم حذف هذا المصروف نهائياً وسيعاد احتساب رصيد الصندوق.'
                : 'Cette dépense sera définitivement supprimée et le solde sera recalculé.'
              : lang === 'ar'
              ? 'سيتم حذف تقرير الإغلاق هذا نهائياً من الأرشيف.'
              : 'Ce rapport de clôture Z sera définitivement effacé du journal.'
          }
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteModal({ open: false, type: null, data: null })}
          confirmButtonText={lang === 'ar' ? 'تأكيد الحذف' : 'Supprimer'}
        />
      )}
    </div>
  );
}
