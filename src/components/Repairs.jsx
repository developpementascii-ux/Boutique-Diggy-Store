import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import {
  Wrench,
  Search,
  Plus,
  Printer,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Smartphone,
  Calendar,
  Layers,
  List,
  AlertTriangle,
  ArrowRight,
  Filter,
  DollarSign,
  User,
  Phone,
  Check,
} from 'lucide-react';

export default function Repairs({ onOpenNewRepair, onEditRepair }) {
  const {
    repairs,
    updateRepairStatus,
    deleteRepair,
    formatMoney,
    setActiveReceipt,
    t,
    lang,
    isAdmin,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => {
    try {
      return localStorage.getItem('repairs_status_filter') || 'all';
    } catch {
      return 'all';
    }
  }); // 'all', 'received', 'in_progress', 'ready', 'delivered'
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [displayMode, setDisplayMode] = useState(() => {
    try {
      return localStorage.getItem('repairs_display_mode') || 'cards';
    } catch {
      return 'cards';
    }
  }); // 'cards' or 'table'
  const [deleteModal, setDeleteModal] = useState({ open: false, repair: null });

  // Persist filters and display mode in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('repairs_status_filter', statusFilter);
      localStorage.setItem('repairs_display_mode', displayMode);
    } catch (e) {
      console.error(e);
    }
  }, [statusFilter, displayMode]);

  // Filtered repairs list
  const filteredRepairs = useMemo(() => {
    return repairs.filter((rep) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (rep.ticketNumber && rep.ticketNumber.toLowerCase().includes(q)) ||
        (rep.deviceModel && rep.deviceModel.toLowerCase().includes(q)) ||
        (rep.clientName && rep.clientName.toLowerCase().includes(q)) ||
        (rep.clientPhone && rep.clientPhone.toLowerCase().includes(q)) ||
        (rep.issueDescription && rep.issueDescription.toLowerCase().includes(q)) ||
        (rep.pieceName && rep.pieceName.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'all' || rep.status === statusFilter;
      const matchUrgent = !onlyUrgent || rep.priority === 'urgent';

      return matchQuery && matchStatus && matchUrgent;
    });
  }, [repairs, searchQuery, statusFilter, onlyUrgent]);

  // Counts for each status
  const counts = useMemo(() => {
    return {
      all: repairs.length,
      received: repairs.filter((r) => r.status === 'received').length,
      in_progress: repairs.filter((r) => r.status === 'in_progress').length,
      ready: repairs.filter((r) => r.status === 'ready').length,
      delivered: repairs.filter((r) => r.status === 'delivered').length,
      urgent: repairs.filter((r) => r.priority === 'urgent').length,
      totalRemainingDue: repairs
        .filter((r) => r.status !== 'delivered')
        .reduce((sum, r) => sum + (Number(r.remainingDue) || 0), 0),
    };
  }, [repairs]);

  const handleStatusChange = (rep, newStatus) => {
    updateRepairStatus(rep.id, newStatus);
    if (newStatus === 'delivered') {
      const remainingPaid = Number(rep.remainingDue) || 0;
      toast.success(
        lang === 'ar'
          ? `تم تسليم الجهاز وإغلاق تذكرة الصيانة (${rep.ticketNumber}) بنجاح`
          : lang === 'en'
          ? `Device delivered and ticket (${rep.ticketNumber}) closed successfully`
          : `Dossier de réparation (${rep.ticketNumber}) clôturé et livré avec succès !`,
        {
          description: remainingPaid > 0
            ? (lang === 'ar' ? `المبلغ المستخلص: ${formatMoney(remainingPaid)}` : `Montant restant encaissé : ${formatMoney(remainingPaid)}`)
            : undefined,
          action: {
            label: lang === 'ar' ? '🖨️ طباعة الوصل' : '🖨️ Imprimer Reçu',
            onClick: () => setActiveReceipt({ type: 'repair', data: { ...rep, status: 'delivered', remainingDue: 0 } }),
          },
        }
      );
    } else {
      toast.info(
        lang === 'ar'
          ? `تم تغيير حالة التذكرة (${rep.ticketNumber}) بنجاح`
          : `Statut du ticket (${rep.ticketNumber}) mis à jour avec succès.`
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.repair) return;
    const rep = deleteModal.repair;
    deleteRepair(rep.id);
    toast.success(
      lang === 'ar'
        ? `تم حذف تذكرة الصيانة (${rep.ticketNumber}) بنجاح`
        : lang === 'en'
        ? `Repair ticket (${rep.ticketNumber}) deleted successfully`
        : `Ticket de réparation (${rep.ticketNumber}) supprimé avec succès !`
    );
    setDeleteModal({ open: false, repair: null });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'received':
        return <span className="badge badge-yellow">{t('statusReceived')}</span>;
      case 'in_progress':
        return <span className="badge badge-blue">{t('statusInProgress')}</span>;
      case 'ready':
        return <span className="badge badge-green">{t('statusReady')}</span>;
      case 'delivered':
        return <span className="badge badge-purple">{t('statusDelivered')}</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getStatusBorderColor = (status) => {
    switch (status) {
      case 'received':
        return 'var(--accent-warning)';
      case 'in_progress':
        return 'var(--accent-info)';
      case 'ready':
        return 'var(--accent-success)';
      case 'delivered':
        return 'var(--accent-purple)';
      default:
        return 'var(--border-color)';
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
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Wrench size={24} className="text-primary" />
            {t('repairsTitle')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {t('repairsSubtitle')}
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenNewRepair}>
          <Plus size={16} />
          {t('newRepairTicket')}
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div
          className="stat-card"
          style={{ cursor: 'pointer', borderLeft: statusFilter === 'all' ? '3px solid var(--accent-primary)' : 'none' }}
          onClick={() => setStatusFilter('all')}
        >
          <div className="stat-header">
            <span className="stat-title">{t('totalRepairs')}</span>
            <div className="stat-icon-wrapper" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}>
              <Wrench size={18} />
            </div>
          </div>
          <div className="stat-value">{counts.all}</div>
          <div className="stat-footer">
            <span>{t('statusAll')}</span>
          </div>
        </div>

        <div
          className="stat-card"
          style={{ cursor: 'pointer', borderLeft: statusFilter === 'in_progress' ? '3px solid var(--accent-info)' : 'none' }}
          onClick={() => setStatusFilter('in_progress')}
        >
          <div className="stat-header">
            <span className="stat-title">{t('inProgressRepairs')}</span>
            <div className="stat-icon-wrapper" style={{ background: 'var(--accent-info-light)', color: 'var(--accent-info)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-info)' }}>
            {counts.in_progress}
          </div>
          <div className="stat-footer">
            <span>{counts.received} {t('statusReceived')}</span>
          </div>
        </div>

        <div
          className="stat-card"
          style={{ cursor: 'pointer', borderLeft: statusFilter === 'ready' ? '3px solid var(--accent-success)' : 'none' }}
          onClick={() => setStatusFilter('ready')}
        >
          <div className="stat-header">
            <span className="stat-title">{t('readyRepairs')}</span>
            <div className="stat-icon-wrapper" style={{ background: 'var(--accent-success-light)', color: 'var(--accent-success)' }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-success)' }}>
            {counts.ready}
          </div>
          <div className="stat-footer">
            <span style={{ color: 'var(--accent-success)' }}>{t('statusReady')}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">{t('remainingDueRepairs')}</span>
            <div className="stat-icon-wrapper" style={{ background: 'var(--accent-danger-light)', color: 'var(--accent-danger)' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="stat-value privacy-blur" style={{ color: counts.totalRemainingDue > 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
            {formatMoney(counts.totalRemainingDue)}
          </div>
          <div className="stat-footer">
            <span>{t('remainingDue')}</span>
          </div>
        </div>
      </div>

      {/* SINGLE UNIFIED MAIN CARD CONTAINER */}
      <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Card Header Toolbar: Search + Status Filter Chips + View Switcher */}
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
          {/* Row 1: Search & Controls */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="input-with-icon" style={{ flex: 1, minWidth: '260px' }}>
              <Search size={16} />
              <input
                type="text"
                className="form-input"
                placeholder={t('repairSearchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Urgent Filter Button */}
            {counts.urgent > 0 && (
              <button
                className={`btn btn-sm ${onlyUrgent ? 'btn-danger' : 'btn-outline'}`}
                onClick={() => setOnlyUrgent(!onlyUrgent)}
              >
                <AlertTriangle size={14} />
                {onlyUrgent ? t('statusAll') : `🔴 ${t('statusUrgent')} (${counts.urgent})`}
              </button>
            )}

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
                className={`btn btn-sm ${displayMode === 'cards' ? 'btn-primary' : 'btn-outline'}`}
                style={{ border: 'none', padding: '0.35rem 0.65rem' }}
                onClick={() => setDisplayMode('cards')}
                title={t('ticketCardView')}
              >
                <Layers size={14} />
                {t('ticketCardView')}
              </button>
              <button
                className={`btn btn-sm ${displayMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
                style={{ border: 'none', padding: '0.35rem 0.65rem' }}
                onClick={() => setDisplayMode('table')}
                title={t('ticketTableView')}
              >
                <List size={14} />
                {t('ticketTableView')}
              </button>
            </div>
          </div>

          {/* Row 2: Status Filter Tabs (Single Card Navigation) */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
            <button
              className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}
              onClick={() => setStatusFilter('all')}
            >
              {t('statusAll')} ({counts.all})
            </button>

            <button
              className={`btn btn-sm ${statusFilter === 'received' ? 'btn-primary' : 'btn-outline'}`}
              style={{
                whiteSpace: 'nowrap',
                fontSize: '0.82rem',
                borderColor: statusFilter === 'received' ? 'var(--accent-warning)' : 'var(--border-color)',
                background: statusFilter === 'received' ? 'var(--accent-warning-light)' : 'transparent',
                color: statusFilter === 'received' ? 'var(--accent-warning)' : 'var(--text-primary)',
                fontWeight: statusFilter === 'received' ? 700 : 500,
              }}
              onClick={() => setStatusFilter('received')}
            >
              {t('statusReceived')} ({counts.received})
            </button>

            <button
              className={`btn btn-sm ${statusFilter === 'in_progress' ? 'btn-primary' : 'btn-outline'}`}
              style={{
                whiteSpace: 'nowrap',
                fontSize: '0.82rem',
                borderColor: statusFilter === 'in_progress' ? 'var(--accent-info)' : 'var(--border-color)',
                background: statusFilter === 'in_progress' ? 'var(--accent-info-light)' : 'transparent',
                color: statusFilter === 'in_progress' ? 'var(--accent-info)' : 'var(--text-primary)',
                fontWeight: statusFilter === 'in_progress' ? 700 : 500,
              }}
              onClick={() => setStatusFilter('in_progress')}
            >
              {t('statusInProgress')} ({counts.in_progress})
            </button>

            <button
              className={`btn btn-sm ${statusFilter === 'ready' ? 'btn-primary' : 'btn-outline'}`}
              style={{
                whiteSpace: 'nowrap',
                fontSize: '0.82rem',
                borderColor: statusFilter === 'ready' ? 'var(--accent-success)' : 'var(--border-color)',
                background: statusFilter === 'ready' ? 'var(--accent-success-light)' : 'transparent',
                color: statusFilter === 'ready' ? 'var(--accent-success)' : 'var(--text-primary)',
                fontWeight: statusFilter === 'ready' ? 700 : 500,
              }}
              onClick={() => setStatusFilter('ready')}
            >
              {t('statusReady')} ({counts.ready})
            </button>

            <button
              className={`btn btn-sm ${statusFilter === 'delivered' ? 'btn-primary' : 'btn-outline'}`}
              style={{
                whiteSpace: 'nowrap',
                fontSize: '0.82rem',
                borderColor: statusFilter === 'delivered' ? 'var(--accent-purple)' : 'var(--border-color)',
                background: statusFilter === 'delivered' ? 'var(--accent-purple-light)' : 'transparent',
                color: statusFilter === 'delivered' ? 'var(--accent-purple)' : 'var(--text-primary)',
                fontWeight: statusFilter === 'delivered' ? 700 : 500,
              }}
              onClick={() => setStatusFilter('delivered')}
            >
              {t('statusDelivered')} ({counts.delivered})
            </button>
          </div>
        </div>

        {/* Card Body: Content List / Cards */}
        <div style={{ padding: '1.25rem' }}>
          {filteredRepairs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <Wrench size={48} style={{ margin: '0 auto 0.75rem auto', opacity: 0.3 }} />
              <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {t('noRepairsFound')}
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {t('repairsSubtitle')}
              </p>
              <button className="btn btn-primary btn-sm" onClick={onOpenNewRepair}>
                <Plus size={14} />
                {t('newRepairTicket')}
              </button>
            </div>
          ) : displayMode === 'cards' ? (
            /* Cards Grid Inside the Single Main Card */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {filteredRepairs.map((rep) => {
                const isPaid = Number(rep.remainingDue) <= 0;
                const statusBorder = getStatusBorderColor(rep.status);

                return (
                  <div
                    key={rep.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `5px solid ${statusBorder}`,
                      borderRadius: '12px',
                      padding: '1.1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.85rem',
                      transition: 'all 0.2s ease',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {/* Top Row: Ticket Number & Badges */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            className="badge badge-blue"
                            style={{ fontWeight: 800, letterSpacing: '0.04em', fontSize: '0.78rem' }}
                          >
                            {rep.ticketNumber}
                          </span>
                          {rep.priority === 'urgent' && (
                            <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>
                              🔴 {t('priorityUrgent')}
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div>{getStatusBadge(rep.status)}</div>
                      </div>

                      {/* Device & Client Info */}
                      <div style={{ marginBottom: '0.65rem' }}>
                        <div
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            marginBottom: '0.2rem',
                          }}
                        >
                          <Smartphone size={17} className="text-primary" />
                          {rep.deviceModel}
                        </div>

                        <div
                          style={{
                            fontSize: '0.84rem',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                            <User size={13} /> {rep.clientName?.trim() ? rep.clientName : (lang === 'ar' ? 'زبون عابر' : lang === 'en' ? 'Walk-in Client' : 'Client comptoir')}
                          </span>
                          {rep.clientPhone && (
                            <a
                              href={`tel:${rep.clientPhone}`}
                              style={{
                                color: 'var(--accent-info)',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                fontSize: '0.8rem',
                              }}
                            >
                              <Phone size={12} /> {rep.clientPhone}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Issue Description & Spare Part */}
                      <div
                        style={{
                          background: 'var(--bg-secondary)',
                          padding: '0.65rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.82rem',
                        }}
                      >
                        <div style={{ color: 'var(--text-primary)', marginBottom: rep.pieceName ? '0.35rem' : 0 }}>
                          <strong style={{ color: 'var(--text-muted)' }}>{t('issueDiagnostic')} : </strong>
                          {rep.issueDescription}
                        </div>

                        {rep.pieceName && (
                          <div
                            style={{
                              color: 'var(--accent-info)',
                              fontSize: '0.78rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Wrench size={12} />
                            <span>{t('sparePart')} : {rep.pieceName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div
                      style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        padding: '0.6rem 0.8rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>{t('totalQuote')}</span>
                        <strong className="privacy-blur" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{formatMoney(rep.totalPrice)}</strong>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>{t('advancePaid')}</span>
                        <span className="privacy-blur" style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{formatMoney(rep.advancePaid)}</span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>{t('remainingDue')}</span>
                        <strong className="privacy-blur" style={{ color: isPaid ? 'var(--accent-success)' : 'var(--accent-danger)', fontSize: '0.95rem' }}>
                          {formatMoney(rep.remainingDue)}
                        </strong>
                      </div>
                    </div>

                    {/* Actions & Status Workflow Controls */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        paddingTop: '0.4rem',
                        borderTop: '1px solid var(--border-color)',
                      }}
                    >
                      {/* Left: Tools */}
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button
                          className="btn-icon btn-outline btn-sm"
                          title={t('printTicket')}
                          onClick={() => setActiveReceipt({ type: 'repair', data: rep })}
                        >
                          <Printer size={14} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              className="btn-icon btn-outline btn-sm"
                              title={t('editTicket')}
                              onClick={() => onEditRepair(rep)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn-icon btn-outline btn-sm"
                              title={t('deleteTicket')}
                              style={{ color: 'var(--accent-danger)' }}
                              onClick={() => setDeleteModal({ open: true, repair: rep })}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Right: Quick Status Shift */}
                      <div>
                        {rep.status === 'received' && (
                          <button
                            className="btn btn-sm btn-outline"
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--accent-info)',
                              borderColor: 'var(--accent-info)',
                              padding: '0.3rem 0.65rem',
                            }}
                            onClick={() => handleStatusChange(rep, 'in_progress')}
                          >
                            {t('passInProgress')} <ArrowRight size={13} />
                          </button>
                        )}
                        {rep.status === 'in_progress' && (
                          <button
                            className="btn btn-sm btn-success"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                            onClick={() => handleStatusChange(rep, 'ready')}
                          >
                            <Check size={13} /> {t('markReady')}
                          </button>
                        )}
                        {rep.status === 'ready' && (
                          <button
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                            onClick={() => handleStatusChange(rep, 'delivered')}
                          >
                            <CheckCircle size={13} /> {t('deliverAndClose')}
                          </button>
                        )}
                        {rep.status === 'delivered' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 600 }}>
                            {t('fileClosed')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table Mode inside the Single Card */
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>{t('ticketNumCol')}</th>
                    <th>{t('deviceModel')}</th>
                    <th>{t('clientSection')}</th>
                    <th>{t('issueDiagnostic')}</th>
                    <th>{t('totalQuote')}</th>
                    <th>{t('advancePaid')} / {t('remainingDue')}</th>
                    <th>{t('status')}</th>
                    <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepairs.map((rep) => {
                    const isPaid = Number(rep.remainingDue) <= 0;
                    return (
                      <tr key={rep.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span className="badge badge-blue">{rep.ticketNumber}</span>
                            {rep.priority === 'urgent' && <span className="badge badge-red">{t('priorityUrgent')}</span>}
                          </div>
                        </td>
                        <td>
                          <strong style={{ fontSize: '0.9rem' }}>{rep.deviceModel}</strong>
                        </td>
                        <td>
                          <div>{rep.clientName?.trim() ? rep.clientName : (lang === 'ar' ? 'زبون عابر' : lang === 'en' ? 'Walk-in Client' : 'Client comptoir')}</div>
                          {rep.clientPhone && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rep.clientPhone}</span>
                          )}
                        </td>
                        <td style={{ maxWidth: '250px' }}>
                          <div style={{ fontSize: '0.82rem' }}>{rep.issueDescription}</div>
                          {rep.pieceName && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--accent-info)' }}>🔧 {rep.pieceName}</div>
                          )}
                        </td>
                        <td>
                          <strong className="privacy-blur" style={{ fontSize: '0.92rem' }}>{formatMoney(rep.totalPrice)}</strong>
                        </td>
                        <td>
                          <div className="privacy-blur" style={{ fontSize: '0.78rem', color: 'var(--accent-success)' }}>
                            {t('advancePaid')} : {formatMoney(rep.advancePaid)}
                          </div>
                          <div
                            className="privacy-blur"
                            style={{
                              fontSize: '0.78rem',
                              color: isPaid ? 'var(--accent-success)' : 'var(--accent-danger)',
                              fontWeight: isPaid ? 400 : 700,
                            }}
                          >
                            {t('remainingDue')} : {formatMoney(rep.remainingDue)}
                          </div>
                        </td>
                        <td>
                          <select
                            className="form-select"
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.5rem',
                              width: 'auto',
                              borderColor: getStatusBorderColor(rep.status),
                            }}
                            value={rep.status}
                            onChange={(e) => handleStatusChange(rep, e.target.value)}
                          >
                            <option value="received">{t('statusReceived')}</option>
                            <option value="in_progress">{t('statusInProgress')}</option>
                            <option value="ready">{t('statusReady')}</option>
                            <option value="delivered">{t('statusDelivered')}</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                            <button
                              className="btn-icon btn-outline btn-sm"
                              title={t('printTicket')}
                              onClick={() => setActiveReceipt({ type: 'repair', data: rep })}
                            >
                              <Printer size={13} />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  className="btn-icon btn-outline btn-sm"
                                  title={t('editTicket')}
                                  onClick={() => onEditRepair(rep)}
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  className="btn-icon btn-outline btn-sm"
                                  title={t('deleteTicket')}
                                  style={{ color: 'var(--accent-danger)' }}
                                  onClick={() => setDeleteModal({ open: true, repair: rep })}
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
          )}
        </div>
      </div>


      {/* Modal for Deleting a Repair Ticket without alert() */}
      {deleteModal.open && deleteModal.repair && (
        <ConfirmDeleteModal
          title={`${t('deleteTicketConfirm')} : "${deleteModal.repair.ticketNumber}"`}
          message={
            lang === 'ar'
              ? `هل أنت متأكد من حذف تذكرة الصيانة "${deleteModal.repair.ticketNumber}" (${deleteModal.repair.deviceModel})؟`
              : lang === 'en'
              ? `Are you sure you want to delete repair ticket "${deleteModal.repair.ticketNumber}" (${deleteModal.repair.deviceModel})?`
              : `Êtes-vous sûr de vouloir supprimer la fiche de réparation "${deleteModal.repair.ticketNumber}" (${deleteModal.repair.deviceModel}) ?`
          }
          itemDetails={{
            title: deleteModal.repair.ticketNumber,
            subtitle: `${deleteModal.repair.deviceModel} — ${deleteModal.repair.clientName || 'Client'}`,
            value: formatMoney(deleteModal.repair.totalPrice),
            valueColor: 'var(--accent-warning)',
          }}
          warningText={
            lang === 'ar'
              ? 'سيتم حذف التذكرة وسجلاتها نهائياً من الورشة.'
              : lang === 'en'
              ? 'This ticket and its diagnostic data will be permanently removed.'
              : 'Cette fiche SAV et ses données techniques seront définitivement supprimées.'
          }
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteModal({ open: false, repair: null })}
          confirmButtonText={lang === 'ar' ? 'تأكيد الحذف' : lang === 'en' ? 'Delete Ticket' : 'Supprimer le Ticket'}
        />
      )}
    </div>
  );
}
