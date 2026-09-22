import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import ClientProfileModal from './ClientProfileModal';
import ClientModal from './ClientModal';
import CreditPaymentModal from './CreditPaymentModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Award,
  Crown,
  Percent,
  ShoppingCart,
  Wrench,
  CreditCard,
  Banknote,
  DollarSign,
  TrendingUp,
  LayoutGrid,
  LayoutList,
  Eye,
  Calendar,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

export default function ClientsView({ onOpenNewClient }) {
  const {
    clients,
    sales,
    repairs,
    deleteClient,
    getClientStats,
    formatMoney,
    t,
    lang,
    isAdmin,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all'); // 'all', 'platinum', 'gold', 'silver', 'bronze', 'debtors'
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('clients_view_mode') || 'cards';
    } catch {
      return 'cards';
    }
  }); // 'cards' | 'table'

  const [profileModalClient, setProfileModalClient] = useState(null);
  const [editModalClient, setEditModalClient] = useState(null);
  const [payCreditModalClient, setPayCreditModalClient] = useState(null);
  const [deleteModalClient, setDeleteModalClient] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Persist view mode preference in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('clients_view_mode', viewMode);
    } catch (e) {
      console.error(e);
    }
  }, [viewMode]);

  // Strictly filter only real declared loyalty clients
  const loyaltyClients = useMemo(() => {
    return (clients || []).filter((c) => c && c.isLoyaltyClient);
  }, [clients]);

  // Compute enriched client data with loyalty and stats
  const enrichedClients = useMemo(() => {
    return loyaltyClients.map((c) => {
      const stats = getClientStats(c.id);
      return {
        ...c,
        stats,
      };
    });
  }, [loyaltyClients, sales, repairs, getClientStats]);

  // Filter logic
  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return enrichedClients.filter((item) => {
      const { stats } = { stats: item.stats };

      // Search Query
      if (q) {
        const matchName = item.name && item.name.toLowerCase().includes(q);
        const matchPhone = item.phone && item.phone.toLowerCase().includes(q);
        const matchEmail = item.email && item.email.toLowerCase().includes(q);
        const matchAddress = item.address && item.address.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchAddress) {
          return false;
        }
      }

      // Tier Filter
      if (tierFilter === 'debtors') {
        return Number(item.totalDebt) > 0;
      }
      if (tierFilter !== 'all') {
        return stats?.loyaltyTier === tierFilter;
      }

      return true;
    });
  }, [enrichedClients, searchQuery, tierFilter]);

  // Aggregate KPI stats
  const totalRevenueAllClients = useMemo(() => {
    return enrichedClients.reduce((acc, c) => acc + (c.stats?.totalLifetimeSpent || 0), 0);
  }, [enrichedClients]);

  const loyalClientsCount = useMemo(() => {
    return enrichedClients.filter((c) => c.stats?.loyaltyTier !== 'bronze').length;
  }, [enrichedClients]);

  const debtorClients = useMemo(() => {
    return enrichedClients.filter((c) => Number(c.totalDebt) > 0);
  }, [enrichedClients]);

  const totalDebtAmount = useMemo(() => {
    return debtorClients.reduce((acc, c) => acc + (Number(c.totalDebt) || 0), 0);
  }, [debtorClients]);

  const handleConfirmDelete = () => {
    if (!deleteModalClient) return;
    deleteClient(deleteModalClient.id);
    toast.success(t('clientDeletedSuccess'));
    setDeleteModalClient(null);
  };

  const getLocale = () => {
    if (lang === 'ar') return 'ar-SA';
    if (lang === 'en') return 'en-US';
    return 'fr-FR';
  };

  const renderTierBadge = (stats) => {
    const tier = stats?.loyaltyTier || 'bronze';
    const discount = stats?.effectiveDiscountPercent || 0;

    if (tier === 'platinum') {
      return (
        <span
          className="badge"
          style={{
            background: 'linear-gradient(135deg, rgba(229, 231, 235, 0.25), rgba(168, 85, 247, 0.25))',
            color: '#c084fc',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            fontSize: '0.72rem',
            fontWeight: 800,
          }}
        >
          💎 VIP ({discount}%)
        </span>
      );
    }
    if (tier === 'gold') {
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            fontSize: '0.72rem',
            fontWeight: 700,
          }}
        >
          🥇 Gold ({discount}%)
        </span>
      );
    }
    if (tier === 'silver') {
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(148, 163, 184, 0.15)',
            color: '#94a3b8',
            border: '1px solid rgba(148, 163, 184, 0.4)',
            fontSize: '0.72rem',
            fontWeight: 600,
          }}
        >
          🥈 Silver ({discount}%)
        </span>
      );
    }
    return (
      <span
        className="badge"
        style={{
          background: 'rgba(205, 127, 50, 0.12)',
          color: '#d97706',
          border: '1px solid rgba(205, 127, 50, 0.3)',
          fontSize: '0.72rem',
        }}
      >
        🥉 Bronze
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Users size={26} className="text-primary" />
            {t('clientsTitle')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
            {t('clientsSubtitle')}
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setIsCreatingNew(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={16} />
          <span>{t('newClient')}</span>
        </button>
      </div>

      {/* Aggregate KPI Stat Cards */}
      <div className="stats-grid">
        {/* 1. Total Clients */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">{t('totalClients')}</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="stat-value">{loyaltyClients.length}</div>
          <div className="stat-footer">
            <span>{loyalClientsCount} {t('loyalClients')}</span>
          </div>
        </div>

        {/* 2. Clients Fidèles */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">{t('loyalClients')}</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-warning)' }}>
              <Award size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>
            {loyalClientsCount}
          </div>
          <div className="stat-footer">
            <span>Silver, Gold & VIP Platine</span>
          </div>
        </div>

        {/* 3. CA Total Cumulé */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">{t('totalClientSpending')}</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="stat-value privacy-blur" style={{ color: 'var(--accent-success)' }}>
            {formatMoney(totalRevenueAllClients)}
          </div>
          <div className="stat-footer">
            <span>{t('lifetimeStats')}</span>
          </div>
        </div>

        {/* 4. Dettes & Crédits */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">{t('activeDebtsCount')}</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div className="stat-value privacy-blur" style={{ color: totalDebtAmount > 0 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
            {formatMoney(totalDebtAmount)}
          </div>
          <div className="stat-footer">
            <span>{debtorClients.length} {t('activeDebtsCount')}</span>
          </div>
        </div>
      </div>

      {/* Filter and View Bar */}
      <div
        className="ui-card"
        style={{
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        {/* Search, Tier Chips, and View Toggle */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="input-with-icon" style={{ flex: 1, minWidth: '240px' }}>
            <Search size={16} />
            <input
              type="text"
              className="form-input"
              placeholder={t('searchClientPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Mode Toggle (Cards / Table) */}
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
          </div>
        </div>

        {/* Loyalty Tier Filter Chips */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${tierFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.78rem' }}
            onClick={() => setTierFilter('all')}
          >
            {t('filterTierAll')} ({loyaltyClients.length})
          </button>
          <button
            className={`btn btn-sm ${tierFilter === 'platinum' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.78rem' }}
            onClick={() => setTierFilter('platinum')}
          >
            💎 VIP Platine ({enrichedClients.filter((c) => c.stats?.loyaltyTier === 'platinum').length})
          </button>
          <button
            className={`btn btn-sm ${tierFilter === 'gold' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.78rem' }}
            onClick={() => setTierFilter('gold')}
          >
            🥇 Gold ({enrichedClients.filter((c) => c.stats?.loyaltyTier === 'gold').length})
          </button>
          <button
            className={`btn btn-sm ${tierFilter === 'silver' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.78rem' }}
            onClick={() => setTierFilter('silver')}
          >
            🥈 Silver ({enrichedClients.filter((c) => c.stats?.loyaltyTier === 'silver').length})
          </button>
          <button
            className={`btn btn-sm ${tierFilter === 'bronze' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.78rem' }}
            onClick={() => setTierFilter('bronze')}
          >
            🥉 Bronze ({enrichedClients.filter((c) => c.stats?.loyaltyTier === 'bronze').length})
          </button>
          <button
            className={`btn btn-sm ${tierFilter === 'debtors' ? 'btn-danger' : 'btn-outline'}`}
            style={{ fontSize: '0.78rem' }}
            onClick={() => setTierFilter('debtors')}
          >
            🔴 {t('filterTierDebtors')} ({debtorClients.length})
          </button>
        </div>
      </div>

      {/* Main Content: Cards View vs Table View */}
      {viewMode === 'cards' ? (
        /* CARDS GRID VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.15rem' }}>
          {filteredClients.length === 0 ? (
            <div
              className="ui-card"
              style={{
                gridColumn: '1 / -1',
                padding: '3rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Users size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                {lang === 'ar' ? 'لا يوجد زبائن مسجلين في برنامج الوفاء' : 'Aucun client enregistré dans le programme de fidélité'}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                {lang === 'ar'
                  ? 'جميع مبيعاتك تعتبر مبيعات عابرة بشكل افتراضي. اضغط على "+ زبون جديد" لتسجيل زبائنك الدائمين.'
                  : '99% de vos ventes sont passagères par défaut. Cliquez sur "+ Nouveau Client" pour déclarer vos clients réguliers.'}
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => setIsCreatingNew(true)}>
                <Plus size={15} />
                <span>{t('newClient')}</span>
              </button>
            </div>
          ) : (
            filteredClients.map((client) => {
              const stats = client.stats;
              const hasDebt = Number(client.totalDebt) > 0;

              return (
                <div
                  key={client.id}
                  className="ui-card"
                  style={{
                    padding: '1.15rem',
                    borderRadius: '12px',
                    border: hasDebt ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Card Top: Avatar, Name & Loyalty Badge */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            flexShrink: 0,
                          }}
                        >
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {client.name}
                          </h4>
                          {client.phone && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                              <Phone size={11} />
                              {client.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      {renderTierBadge(stats)}
                    </div>

                    {/* Contact details */}
                    {(client.email || client.address) && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        {client.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Mail size={11} className="text-primary" />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</span>
                          </div>
                        )}
                        {client.address && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <MapPin size={11} className="text-primary" />
                            <span>{client.address}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Financial & Loyalty Highlights */}
                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>{t('totalRevenue')}</span>
                      {Number(stats?.totalLifetimeSpent) > 0 ? (
                        <strong className="privacy-blur" style={{ color: 'var(--accent-primary)', fontSize: '0.92rem' }}>
                          {formatMoney(stats.totalLifetimeSpent)}
                        </strong>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                      )}
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>{t('clientColPurchases')}</span>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        {stats?.clientSales.length || 0} 🛒 / {stats?.clientRepairs.length || 0} 🔧
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>{t('clientColPoints')}</span>
                      <strong style={{ color: 'var(--accent-warning)', fontSize: '0.85rem' }}>
                        {stats?.points || 0} {t('points')}
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>{t('clientColDebt')}</span>
                      <strong className="privacy-blur" style={{ color: hasDebt ? 'var(--accent-danger)' : 'var(--text-secondary)', fontSize: '0.88rem' }}>
                        {formatMoney(client.totalDebt || 0)}
                      </strong>
                    </div>
                  </div>

                    {/* Card Actions Footer */}
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem' }}
                        onClick={() => setProfileModalClient(client)}
                      >
                        <Eye size={14} />
                        <span>{t('clientProfile')}</span>
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            className="btn-icon btn-outline btn-sm"
                            title={t('editClient')}
                            onClick={() => setEditModalClient(client)}
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            className="btn-icon btn-outline btn-sm"
                            title={t('delete')}
                            style={{ color: 'var(--accent-danger)' }}
                            onClick={() => setDeleteModalClient(client)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="ui-card" style={{ padding: '0.5rem 0' }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{t('clientColName')}</th>
                  <th>{t('clientColTier')}</th>
                  <th>{t('clientColSpent')}</th>
                  <th>{t('clientColPurchases')}</th>
                  <th>{t('clientColPoints')}</th>
                  <th>{t('clientColDebt')}</th>
                  <th>{t('clientColLastVisit')}</th>
                  <th style={{ textAlign: 'end' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      {t('noData')}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const stats = client.stats;
                    const hasDebt = Number(client.totalDebt) > 0;

                    return (
                      <tr key={client.id}>
                        {/* 1. Client & Contact */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                flexShrink: 0,
                              }}
                            >
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div
                                style={{ fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                                onClick={() => setProfileModalClient(client)}
                              >
                                {client.name}
                              </div>
                              {client.phone && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {client.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Loyalty Tier */}
                        <td>
                          {renderTierBadge(stats)}
                        </td>

                        {/* 3. Total Spent */}
                        <td>
                          {Number(stats?.totalLifetimeSpent) > 0 ? (
                            <strong className="privacy-blur" style={{ color: 'var(--accent-primary)', fontSize: '0.92rem' }}>
                              {formatMoney(stats.totalLifetimeSpent)}
                            </strong>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                          )}
                        </td>

                        {/* 4. Purchases / Repairs count */}
                        <td style={{ fontSize: '0.82rem' }}>
                          <span>{stats?.clientSales.length || 0} 🛒</span>
                          <span style={{ color: 'var(--text-muted)', margin: '0 0.35rem' }}>•</span>
                          <span>{stats?.clientRepairs.length || 0} 🔧</span>
                        </td>

                        {/* 5. Loyalty Points */}
                        <td>
                          <span style={{ color: 'var(--accent-warning)', fontWeight: 700, fontSize: '0.85rem' }}>
                            {stats?.points || 0} {t('points')}
                          </span>
                        </td>

                        {/* 6. Credit Debt */}
                        <td>
                          {hasDebt ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <strong className="privacy-blur" style={{ color: 'var(--accent-danger)', fontSize: '0.9rem' }}>
                                {formatMoney(client.totalDebt)}
                              </strong>
                              <button
                                className="btn btn-sm btn-outline"
                                style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', color: 'var(--accent-danger)' }}
                                onClick={() => setPayCreditModalClient(client)}
                              >
                                {t('payDebtBtn') || 'Régler'}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--accent-success)', fontSize: '0.8rem', fontWeight: 600 }}>
                              ✓ 0.00
                            </span>
                          )}
                        </td>

                        {/* 7. Last Visit */}
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {stats?.lastVisit ? new Date(stats.lastVisit).toLocaleDateString(getLocale()) : '-'}
                        </td>

                        {/* 8. Actions */}
                        <td style={{ textAlign: 'end' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-sm btn-primary"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              onClick={() => setProfileModalClient(client)}
                            >
                              <Eye size={13} />
                              <span>{t('clientProfile')}</span>
                            </button>

                            {isAdmin && (
                              <>
                                <button
                                  className="btn-icon btn-outline btn-sm"
                                  title={t('editClient')}
                                  onClick={() => setEditModalClient(client)}
                                >
                                  <Edit2 size={13} />
                                </button>

                                <button
                                  className="btn-icon btn-outline btn-sm"
                                  title={t('delete')}
                                  style={{ color: 'var(--accent-danger)' }}
                                  onClick={() => setDeleteModalClient(client)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
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
      )}

      {/* 360° Client Profile Modal */}
      {profileModalClient && (
        <ClientProfileModal
          clientId={profileModalClient.id}
          onEditClient={(c) => {
            setProfileModalClient(null);
            setEditModalClient(c);
          }}
          onPayCredit={(c) => {
            setProfileModalClient(null);
            setPayCreditModalClient(c);
          }}
          onClose={() => setProfileModalClient(null)}
        />
      )}

      {/* Client Edit / Create Modal */}
      {(editModalClient || isCreatingNew) && (
        <ClientModal
          client={editModalClient}
          onClose={() => {
            setEditModalClient(null);
            setIsCreatingNew(false);
          }}
        />
      )}

      {/* Settle Debt Modal */}
      {payCreditModalClient && (
        <CreditPaymentModal
          client={payCreditModalClient}
          onClose={() => setPayCreditModalClient(null)}
        />
      )}

      {/* Delete Client Confirmation Modal */}
      {deleteModalClient && (
        <ConfirmDeleteModal
          title={`${t('deleteClientConfirm')} : "${deleteModalClient.name}"`}
          message={
            lang === 'ar'
              ? `هل أنت متأكد من حذف الزبون "${deleteModalClient.name}"؟ سيتم حذف بياناته وسجله.`
              : lang === 'en'
              ? `Are you sure you want to delete client "${deleteModalClient.name}"?`
              : `Confirmez-vous la suppression de la fiche client de "${deleteModalClient.name}" ?`
          }
          itemDetails={{
            title: deleteModalClient.name,
            subtitle: deleteModalClient.phone || deleteModalClient.email || 'Client',
            value: deleteModalClient.totalDebt > 0 ? `${t('clientColDebt')}: ${formatMoney(deleteModalClient.totalDebt)}` : 'Solde 0.00',
            valueColor: deleteModalClient.totalDebt > 0 ? 'var(--accent-danger)' : 'var(--accent-success)',
          }}
          warningText={
            deleteModalClient.totalDebt > 0
              ? (lang === 'ar' ? 'تنبيه: هذا الزبون لديه رصيد دين غير مسدد !' : 'Attention : Ce client possède une dette non soldée !')
              : undefined
          }
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteModalClient(null)}
          confirmButtonText={lang === 'ar' ? 'حذف الزبون' : lang === 'en' ? 'Delete Client' : 'Supprimer le Client'}
        />
      )}
    </div>
  );
}
