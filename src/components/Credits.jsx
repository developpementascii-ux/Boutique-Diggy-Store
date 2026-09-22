import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import {
  CreditCard,
  Search,
  HandCoins,
  History,
  Phone,
  User,
  Plus,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Calendar,
  TrendingUp,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import ClientModal from './ClientModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function Credits({ onOpenPaymentModal, onPayCredit }) {
  const {
    clients,
    totalClientsDebt,
    clientsWithDebt,
    formatMoney,
    deleteClient,
    deleteClientTransaction,
    t,
    lang,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [filterMode, setFilterMode] = useState('with_debt'); // 'with_debt', 'all', 'settled'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'yesterday', '7d', '30d', 'custom'
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Modal State for Edit/Create client or transaction
  const [modalState, setModalState] = useState({
    open: false,
    client: null,
    transaction: null,
  });

  // Modal State for Delete Confirmation Modal (replacing window.confirm)
  const [deleteConfirmState, setDeleteConfirmState] = useState({
    open: false,
    type: null, // 'transaction' or 'client'
    client: null,
    transaction: null,
  });

  const localeCode = lang === 'ar' ? 'ar-TN' : lang === 'en' ? 'en-US' : 'fr-FR';

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
    } else if (dateFilter === '7d') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (dateFilter === '30d') {
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

  const [showCollectedModal, setShowCollectedModal] = useState(false);
  const [collectedSearch, setCollectedSearch] = useState('');

  // Statistics for the selected date period
  const periodStats = useMemo(() => {
    let collectedAmount = 0;
    let collectedCount = 0;
    let newDebtAmount = 0;
    let newDebtCount = 0;
    const collectedList = [];
    const seenCollected = new Set();
    const seenDebt = new Set();

    clients.forEach((c) => {
      if (Array.isArray(c.history)) {
        c.history.forEach((trx, idx) => {
          if (periodBounds.isInPeriod(trx.date)) {
            const isPayment = Number(trx.amount) < 0 || trx.type === 'payment' || trx.type === 'repair_payment' || trx.type === 'settlement';
            const amt = Math.abs(Number(trx.amount) || 0);
            const dateMin = trx.date ? trx.date.substring(0, 16) : '';
            const refKey = trx.referenceId ? `ref:${trx.referenceId}:${trx.type}` : null;
            const noteKey = trx.note ? `note:${trx.note.trim().toLowerCase()}:${amt}:${dateMin}` : null;
            const dedupeKey = refKey || noteKey || `idx:${c.id || c.name}:${trx.id || idx}`;

            if (isPayment) {
              if (!seenCollected.has(dedupeKey)) {
                seenCollected.add(dedupeKey);
                collectedAmount += amt;
                collectedCount += 1;
                collectedList.push({
                  ...trx,
                  clientId: c.id,
                  clientName: c.name,
                  clientPhone: c.phone,
                  paidAmount: amt,
                });
              }
            } else {
              if (!seenDebt.has(dedupeKey)) {
                seenDebt.add(dedupeKey);
                newDebtAmount += Number(trx.amount) || 0;
                newDebtCount += 1;
              }
            }
          }
        });
      }
    });

    collectedList.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      collectedAmount,
      collectedCount,
      newDebtAmount,
      newDebtCount,
      collectedList,
    };
  }, [clients, periodBounds]);

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  const filteredClients = useMemo(() => {
    const seen = new Set();
    return clients.filter((c) => {
      if (!c || !c.id) return false;
      const dedupeKey = c.id || `${c.name?.trim().toLowerCase()}-${c.phone || ''}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q));

      const hasDebt = Number(c.totalDebt) > 0;
      let matchFilterMode = true;
      if (filterMode === 'with_debt') matchFilterMode = hasDebt;
      if (filterMode === 'settled') matchFilterMode = !hasDebt;

      // When dateFilter !== 'all', also filter clients who had transactions in that period
      if (dateFilter !== 'all') {
        const hadTrxInPeriod = (c.history || []).some((trx) => periodBounds.isInPeriod(trx.date));
        return matchQuery && matchFilterMode && hadTrxInPeriod;
      }

      return matchQuery && matchFilterMode;
    });
  }, [clients, searchQuery, filterMode, dateFilter, periodBounds]);

  // Clean deduplicated transaction history for selected client
  const clientHistory = useMemo(() => {
    if (!selectedClient || !Array.isArray(selectedClient.history)) return [];
    const seenTrx = new Set();
    return selectedClient.history.filter((trx, idx) => {
      if (!trx) return false;
      const dateMin = trx.date ? trx.date.substring(0, 16) : '';
      const amt = Number(trx.amount) || 0;
      const refKey = trx.referenceId ? `ref:${trx.referenceId}:${trx.type}` : null;
      const noteKey = trx.note ? `note:${trx.note.trim().toLowerCase()}:${amt}:${dateMin}` : null;
      const key = refKey || noteKey || trx.id || `idx-${idx}`;
      if (seenTrx.has(key)) return false;
      seenTrx.add(key);
      return true;
    });
  }, [selectedClient]);

  // Filtered collected transactions for collected view & modal
  const filteredCollectedList = useMemo(() => {
    const q = (collectedSearch || searchQuery).toLowerCase().trim();
    if (!q) return periodStats.collectedList;
    return periodStats.collectedList.filter((item) =>
      item.clientName?.toLowerCase().includes(q) ||
      item.clientPhone?.toLowerCase().includes(q) ||
      item.note?.toLowerCase().includes(q)
    );
  }, [periodStats.collectedList, collectedSearch, searchQuery]);

  // Open modal to confirm client account deletion
  const requestDeleteClient = (client) => {
    setDeleteConfirmState({
      open: true,
      type: 'client',
      client,
      transaction: null,
    });
  };

  // Open modal to confirm transaction deletion
  const requestDeleteTransaction = (client, transaction) => {
    setDeleteConfirmState({
      open: true,
      type: 'transaction',
      client,
      transaction,
    });
  };

  // Execute deletion upon modal confirmation
  const handleConfirmDelete = () => {
    if (deleteConfirmState.type === 'transaction' && deleteConfirmState.client && deleteConfirmState.transaction) {
      deleteClientTransaction(deleteConfirmState.client.id, deleteConfirmState.transaction.id);
      toast.success(
        lang === 'ar'
          ? 'تم حذف المعاملة المالية وتحديث الرصيد'
          : lang === 'en'
          ? 'Transaction deleted and balance updated'
          : 'Ligne de transaction supprimée avec succès !'
      );
    } else if (deleteConfirmState.type === 'client' && deleteConfirmState.client) {
      deleteClient(deleteConfirmState.client.id);
      if (selectedClientId === deleteConfirmState.client.id) {
        setSelectedClientId(null);
      }
      toast.success(
        lang === 'ar'
          ? `تم حذف حساب الزبون "${deleteConfirmState.client.name}" بنجاح`
          : lang === 'en'
          ? `Customer account "${deleteConfirmState.client.name}" deleted`
          : `Compte client "${deleteConfirmState.client.name}" supprimé avec succès !`
      );
    }
    setDeleteConfirmState({ open: false, type: null, client: null, transaction: null });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            <div style={{ padding: '0.45rem', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e', display: 'flex' }}>
              <CreditCard size={24} />
            </div>
            {t('creditsTitle')}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
            {t('creditsSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Button to view collected credits */}
          <button
            className="btn btn-secondary"
            onClick={() => setShowCollectedModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.1rem',
              fontWeight: 700,
              borderColor: '#10b981',
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.08)',
            }}
            title="Afficher l'historique détaillé des crédits collectés"
          >
            <HandCoins size={18} />
            <span>{t('collectedCreditPeriod') || 'Crédits Collectés'}</span>
            <span className="badge badge-green" style={{ fontSize: '0.75rem', padding: '0.1rem 0.45rem', fontWeight: 800 }}>
              +{formatMoney(periodStats.collectedAmount)}
            </span>
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setModalState({ open: true, client: null, transaction: null })}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', fontWeight: 700 }}
          >
            <Plus size={18} />
            {t('newClientCreditTitle')}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Total Current Debt */}
        <div className="ui-card" style={{ padding: '1.1rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('totalDebtAmount')}
              </span>
              <div className="privacy-blur" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f43f5e', marginTop: '0.25rem' }}>
                {formatMoney(totalClientsDebt)}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', display: 'block' }}>
                {clientsWithDebt.length} {t('totalDebtors')}
              </span>
            </div>
            <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e' }}>
              <CreditCard size={20} />
            </div>
          </div>
        </div>

        {/* Collected Credits in Period */}
        <div
          className="ui-card"
          onClick={() => setShowCollectedModal(true)}
          style={{
            padding: '1.1rem 1.25rem',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            background: 'linear-gradient(180deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.05) 100%)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          title="Cliquer pour afficher la liste des crédits collectés"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('collectedCreditPeriod')} ({dateFilter === 'all' ? t('allDates') : dateFilter === 'today' ? t('periodToday') : dateFilter === 'yesterday' ? t('periodYesterday') : dateFilter === '7d' ? t('period7d') : dateFilter === '30d' ? t('period30d') : customDate})
              </span>
              <div className="privacy-blur" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
                +{formatMoney(periodStats.collectedAmount)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {periodStats.collectedCount} {t('settlementsCount')}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>• Voir détails →</span>
              </div>
            </div>
            <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        {/* New Debt Created in Period */}
        <div className="ui-card" style={{ padding: '1.1rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('newCreditsGiven')}
              </span>
              <div className="privacy-blur" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>
                +{formatMoney(periodStats.newDebtAmount)}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', display: 'block' }}>
                {periodStats.newDebtCount} {t('operationsCount') || 'opérations'}
              </span>
            </div>
            <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <ArrowDownRight size={20} />
            </div>
          </div>
        </div>

        {/* Debtor Accounts filtered */}
        <div className="ui-card" style={{ padding: '1.1rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('totalDebtors')}
              </span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                {filteredClients.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', display: 'block' }}>
                {clients.length} {t('clientsTitle') || 'clients enregistrés'}
              </span>
            </div>
            <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)' }}>
              <User size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar: Search + Period Selector + Debt Status Filter */}
      <div
        className="ui-card"
        style={{
          padding: '0.85rem 1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.85rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={filterMode === 'collected' ? 'Rechercher par client, tél ou note...' : t('creditsSearchPlaceholder')}
            style={{ paddingLeft: '2.1rem', width: '100%' }}
          />
        </div>

        {/* Period Selector Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem' }}>
          <button
            className={`btn btn-sm ${dateFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDateFilter('all')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            {t('allDates')}
          </button>
          <button
            className={`btn btn-sm ${dateFilter === 'today' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDateFilter('today')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            {t('periodToday')}
          </button>
          <button
            className={`btn btn-sm ${dateFilter === 'yesterday' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDateFilter('yesterday')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            {t('periodYesterday')}
          </button>
          <button
            className={`btn btn-sm ${dateFilter === '7d' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDateFilter('7d')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            {t('period7d')}
          </button>
          <button
            className={`btn btn-sm ${dateFilter === '30d' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDateFilter('30d')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            {t('period30d')}
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

        {/* Debt Status Mode */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${filterMode === 'with_debt' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setFilterMode('with_debt')}
            style={{ fontSize: '0.78rem', fontWeight: filterMode === 'with_debt' ? 700 : 500 }}
          >
            {t('totalDebtors')} ({clientsWithDebt.length})
          </button>
          <button
            className={`btn btn-sm ${filterMode === 'collected' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setFilterMode('collected')}
            style={{
              fontSize: '0.78rem',
              fontWeight: filterMode === 'collected' ? 700 : 500,
              color: filterMode === 'collected' ? '#10b981' : undefined,
              borderColor: filterMode === 'collected' ? '#10b981' : undefined,
            }}
          >
            <HandCoins size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            {t('collectedCreditPeriod') || 'Crédits Collectés'} ({periodStats.collectedList.length})
          </button>
          <button
            className={`btn btn-sm ${filterMode === 'all' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setFilterMode('all')}
            style={{ fontSize: '0.78rem', fontWeight: filterMode === 'all' ? 700 : 500 }}
          >
            {t('all')} ({clients.length})
          </button>
        </div>
      </div>

      {/* Clients List & Detail Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedClient ? '1.2fr 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* Table View */}
        <div className="ui-card">
          <div className="table-responsive">
            {filterMode === 'collected' ? (
              /* COLLECTED CREDITS TABLE */
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>{t('clientNameCol')}</th>
                    <th>{t('contactCol')}</th>
                    <th>Date & Heure</th>
                    <th>Motif / Transaction</th>
                    <th>Montant Perçu</th>
                    <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollectedList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        Aucun crédit collecté pour cette période.
                      </td>
                    </tr>
                  ) : (
                    filteredCollectedList.map((trx, idx) => {
                      const client = clients.find((c) => c.id === trx.clientId);
                      return (
                        <tr
                          key={`${trx.id || idx}`}
                          style={{
                            background: selectedClient?.id === trx.clientId ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          }}
                        >
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{trx.clientName}</div>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              Solde restant : {formatMoney(client?.totalDebt || 0)}
                            </span>
                          </td>
                          <td>
                            {trx.clientPhone ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}>
                                <Phone size={13} />
                                <span>{trx.clientPhone}</span>
                              </div>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>-</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                              {new Date(trx.date).toLocaleDateString(localeCode)}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              {new Date(trx.date).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-purple" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {trx.note || 'Règlement solde'}
                            </span>
                          </td>
                          <td>
                            <strong className="profit-blur" style={{ fontSize: '1.05rem', color: '#34d399' }}>
                              +{formatMoney(trx.paidAmount)}
                            </strong>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => setSelectedClientId(trx.clientId)}
                                title="Voir historique complet"
                              >
                                <History size={13} />
                                {t('viewAll')}
                              </button>
                              {client && Number(client.totalDebt) > 0 && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => onPayCredit(client)}
                                  title={t('settleBtn')}
                                >
                                  <HandCoins size={13} />
                                  {t('settleBtn')}
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
            ) : (
              /* STANDARD DEBTORS TABLE */
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>{t('clientNameCol')}</th>
                    <th>{t('contactCol')}</th>
                    <th>{t('lastDebtDateCol')}</th>
                    <th>{t('currentBalanceCol')}</th>
                    <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        {t('noDebts')}
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => {
                      const hasDebt = Number(client.totalDebt) > 0;
                      const lastTrx = client.history && client.history[0];

                      return (
                        <tr
                          key={client.id}
                          style={{
                            background: selectedClient?.id === client.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          }}
                        >
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{client.name}</div>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {client.history?.length || 0} {t('items')}
                            </span>
                          </td>
                          <td>
                            {client.phone ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}>
                                <Phone size={13} />
                                <span>{client.phone}</span>
                              </div>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>-</span>
                            )}
                          </td>
                          <td>
                            {lastTrx ? (
                              <div>
                                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{lastTrx.note}</div>
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                  {new Date(lastTrx.date).toLocaleDateString(localeCode)}
                                </span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>
                            <span
                              className="privacy-blur"
                              style={{
                                fontSize: '1.05rem',
                                fontWeight: 800,
                                color: hasDebt ? '#f87171' : '#34d399',
                              }}
                            >
                              {formatMoney(client.totalDebt)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                              {/* View History */}
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => setSelectedClientId(client.id)}
                                title={t('viewAll')}
                              >
                                <History size={13} />
                                {t('viewAll')}
                              </button>

                              {/* Edit Client */}
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setModalState({ open: true, client, transaction: null })}
                                title={t('edit')}
                                style={{ padding: '0.35rem 0.6rem' }}
                              >
                                <Edit2 size={13} />
                              </button>

                              {/* Settle Debt Button */}
                              {hasDebt && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => onPayCredit(client)}
                                  title={t('settleBtn')}
                                >
                                  <HandCoins size={13} />
                                  {t('settleBtn')}
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
            )}
          </div>
        </div>

        {/* Client Detailed History Drawer */}
        {selectedClient && (
          <div className="ui-card" style={{ height: 'fit-content' }}>
            <div className="ui-card-header" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.2rem', fontWeight: 700 }}>{selectedClient.name}</h3>
                {selectedClient.phone && (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Phone size={12} /> {selectedClient.phone}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                {/* Edit Client */}
                <button
                  className="btn-icon btn-secondary btn-sm"
                  onClick={() => setModalState({ open: true, client: selectedClient, transaction: null })}
                  title={t('editClientModalTitle')}
                >
                  <Edit2 size={15} />
                </button>

                {/* Delete Client */}
                <button
                  className="btn-icon btn-danger btn-sm"
                  onClick={() => requestDeleteClient(selectedClient)}
                  title={t('delete')}
                >
                  <Trash2 size={15} />
                </button>

                {/* Close Drawer */}
                <button
                  className="btn-icon btn-outline btn-sm"
                  onClick={() => setSelectedClientId(null)}
                  title={t('close')}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Total Balance Card */}
            <div
              style={{
                background: selectedClient.totalDebt > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${selectedClient.totalDebt > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '1rem 0',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('currentBalanceCol')}
                </span>
                <div className="privacy-blur" style={{ fontSize: '1.4rem', fontWeight: 800, color: selectedClient.totalDebt > 0 ? '#f87171' : '#34d399' }}>
                  {formatMoney(selectedClient.totalDebt)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setModalState({ open: true, client: selectedClient, transaction: null })}
                  title={t('editClientModalTitle')}
                  style={{ fontSize: '0.78rem' }}
                >
                  <SlidersHorizontal size={13} />
                  {t('edit')}
                </button>

                {selectedClient.totalDebt > 0 && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => onPayCredit(selectedClient)}
                    style={{ fontSize: '0.78rem' }}
                  >
                    <HandCoins size={13} />
                    {t('settleBtn')}
                  </button>
                )}
              </div>
            </div>

            {/* History List Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <h4 style={{ fontSize: '0.85rem', margin: 0, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('creditHistoryTitle')} ({clientHistory.length})
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '2px' }}>
              {clientHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                  {t('noDebts')}
                </div>
              ) : (
                clientHistory.map((trx) => {
                  const isPayment = Number(trx.amount) < 0 || trx.type === 'payment' || trx.type === 'repair_payment' || trx.type === 'settlement';
                  return (
                    <div
                      key={trx.id}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {trx.note}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {new Date(trx.date).toLocaleString(localeCode)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div
                          className="privacy-blur"
                          style={{
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            color: isPayment ? '#34d399' : '#f87171',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isPayment ? `${formatMoney(Math.abs(trx.amount))}` : `+${formatMoney(trx.amount)}`}
                        </div>

                        {/* Inline Actions for Transaction */}
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            className="btn-icon btn-secondary btn-xs"
                            onClick={() =>
                              setModalState({
                                open: true,
                                client: selectedClient,
                                transaction: trx,
                              })
                            }
                            title={t('editTransactionModalTitle')}
                            style={{ padding: '4px', width: '24px', height: '24px' }}
                          >
                            <Edit2 size={12} />
                          </button>

                          <button
                            className="btn-icon btn-danger btn-xs"
                            onClick={() => requestDeleteTransaction(selectedClient, trx)}
                            title={t('delete')}
                            style={{ padding: '4px', width: '24px', height: '24px' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modern Client / Transaction Edit Modal */}
      {modalState.open && (
        <ClientModal
          client={modalState.client}
          transaction={modalState.transaction}
          onClose={() => setModalState({ open: false, client: null, transaction: null })}
        />
      )}

      {/* Styled Delete Confirmation Modal */}
      {deleteConfirmState.open && (
        <ConfirmDeleteModal
          title={
            deleteConfirmState.type === 'transaction'
              ? (lang === 'ar' ? 'حذف معاملة مالية' : lang === 'en' ? 'Delete Transaction' : 'Supprimer la Transaction')
              : (lang === 'ar' ? 'حذف حساب الزبون' : lang === 'en' ? 'Delete Customer Account' : 'Supprimer le Compte Client')
          }
          message={
            deleteConfirmState.type === 'transaction'
              ? (lang === 'ar'
                  ? 'هل أنت متأكد من رغبتك في حذف هذه المعاملة من سجل الزبون؟'
                  : lang === 'en'
                  ? 'Are you sure you want to delete this transaction from customer history?'
                  : "Êtes-vous sûr de vouloir supprimer cette ligne de transaction de l'historique du client ?")
              : (lang === 'ar'
                  ? 'هل أنت متأكد من حذف هذا الحساب وكافة سجلاته نهائياً؟'
                  : lang === 'en'
                  ? 'Are you sure you want to permanently delete this customer account?'
                  : 'Êtes-vous sûr de vouloir supprimer définitivement ce compte client et toutes ses transactions ?')
          }
          itemDetails={
            deleteConfirmState.type === 'transaction'
              ? {
                  title: deleteConfirmState.transaction?.note || 'Transaction',
                  subtitle: new Date(deleteConfirmState.transaction?.date).toLocaleString(localeCode),
                  value:
                    Number(deleteConfirmState.transaction?.amount) < 0
                      ? formatMoney(Math.abs(deleteConfirmState.transaction?.amount))
                      : `+${formatMoney(deleteConfirmState.transaction?.amount)}`,
                  valueColor: Number(deleteConfirmState.transaction?.amount) < 0 ? '#34d399' : '#f87171',
                }
              : {
                  title: deleteConfirmState.client?.name,
                  subtitle: deleteConfirmState.client?.phone
                    ? `${t('clientPhone')}: ${deleteConfirmState.client?.phone}`
                    : `${deleteConfirmState.client?.history?.length || 0} opérations`,
                  value: `${t('currentBalanceCol')} : ${formatMoney(deleteConfirmState.client?.totalDebt || 0)}`,
                  valueColor: '#f87171',
                }
          }
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteConfirmState({ open: false, type: null, client: null, transaction: null })}
          confirmButtonText={lang === 'ar' ? 'تأكيد الحذف' : lang === 'en' ? 'Confirm Delete' : 'Confirmer la suppression'}
        />
      )}

      {/* Dedicated Collected Credits Modal */}
      {showCollectedModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.45rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex' }}>
                  <HandCoins size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {t('collectedCreditPeriod') || 'Journal des Crédits Collectés'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Période : {dateFilter === 'all' ? t('allDates') : dateFilter === 'today' ? t('periodToday') : dateFilter === 'yesterday' ? t('periodYesterday') : dateFilter === '7d' ? t('period7d') : dateFilter === '30d' ? t('period30d') : customDate}
                  </span>
                </div>
              </div>
              <button className="btn-icon btn-outline btn-sm" onClick={() => setShowCollectedModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Summary Banner */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Total Encaissé sur la Période
                  </span>
                  <div className="privacy-blur" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#34d399', marginTop: '0.2rem' }}>
                    +{formatMoney(periodStats.collectedAmount)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.85rem', padding: '0.25rem 0.65rem' }}>
                    {periodStats.collectedCount} règlements
                  </span>
                </div>
              </div>

              {/* Search Inside Modal */}
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="input"
                  value={collectedSearch}
                  onChange={(e) => setCollectedSearch(e.target.value)}
                  placeholder="Rechercher par client, téléphone ou motif..."
                  style={{ paddingLeft: '2.1rem', width: '100%' }}
                />
              </div>

              {/* List of Collected Transactions */}
              {filteredCollectedList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <HandCoins size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Aucun règlement ou crédit collecté trouvé pour cette sélection.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {filteredCollectedList.map((trx, idx) => {
                    const client = clients.find((c) => c.id === trx.clientId);
                    return (
                      <div
                        key={`${trx.id || idx}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem 1rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                            <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{trx.clientName}</strong>
                            {trx.clientPhone && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {trx.clientPhone}</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {trx.note || 'Règlement solde'}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {new Date(trx.date).toLocaleString(localeCode)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <strong className="profit-blur" style={{ fontSize: '1.15rem', color: '#34d399', display: 'block' }}>
                              +{formatMoney(trx.paidAmount)}
                            </strong>
                            {client && (
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                Reste : {formatMoney(client.totalDebt)}
                              </span>
                            )}
                          </div>

                          <button
                            className="btn btn-sm btn-outline"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                            onClick={() => {
                              setSelectedClientId(trx.clientId);
                              setShowCollectedModal(false);
                            }}
                            title="Ouvrir la fiche client"
                          >
                            <History size={13} />
                            <span>Compte</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowCollectedModal(false)}>
                {t('close') || 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
