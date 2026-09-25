import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import {
  Wrench,
  Search,
  Plus,
  Printer,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Smartphone,
  Calendar,
  Layers,
  LayoutList,
  LayoutGrid,
  Kanban,
  AlertTriangle,
  ArrowRight,
  Filter,
  DollarSign,
  User,
  Phone,
  Check,
  Archive,
  FileText,
  SlidersHorizontal,
  ArrowUpRight,
  Tag,
  Inbox,
  ShieldCheck,
} from 'lucide-react';

export default function Repairs({ onOpenNewRepair, onEditRepair }) {
  const {
    repairs = [],
    products = [],
    updateRepairStatus,
    deleteRepair,
    archiveRepair,
    formatMoney,
    setActiveReceipt,
    privacyMode,
    t,
    lang,
    isAdmin,
  } = useApp();

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Status Filter: 'all' | 'received' | 'in_progress' | 'ready' | 'delivered'
  const [statusFilter, setStatusFilter] = useState(() => {
    try {
      return localStorage.getItem('repairs_status_filter_v4') || 'all';
    } catch {
      return 'all';
    }
  });

  // Selected repair items for bulk actions
  const [selectedIds, setSelectedIds] = useState(new Set());

  // View mode: 'table' | 'cards' | 'kanban'
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('repairs_view_mode_v4') || 'table';
    } catch {
      return 'table';
    }
  });

  const [deleteModal, setDeleteModal] = useState({ open: false, repair: null });

  // Auto-persist filters
  useEffect(() => {
    try {
      localStorage.setItem('repairs_status_filter_v4', statusFilter);
      localStorage.setItem('repairs_view_mode_v4', viewMode);
    } catch (e) {
      console.error(e);
    }
  }, [statusFilter, viewMode]);

  // Fast product image lookup map
  const productMap = useMemo(() => {
    const map = new Map();
    (products || []).forEach((p) => {
      if (p.id) map.set(p.id, p);
      if (p.name) map.set(p.name.toLowerCase().trim(), p);
    });
    return map;
  }, [products]);

  // Filtered repairs list (Active only, excluding archived)
  const filteredRepairs = useMemo(() => {
    return (repairs || []).filter((rep) => {
      if (rep.archived) return false;
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

      return matchQuery && matchStatus;
    });
  }, [repairs, searchQuery, statusFilter]);

  // Counts for each status (excluding archived)
  const counts = useMemo(() => {
    const activeList = (repairs || []).filter((r) => !r.archived);
    return {
      all: activeList.length,
      received: activeList.filter((r) => r.status === 'received').length,
      in_progress: activeList.filter((r) => r.status === 'in_progress').length,
      ready: activeList.filter((r) => r.status === 'ready').length,
      delivered: activeList.filter((r) => r.status === 'delivered').length,
      urgent: activeList.filter((r) => r.priority === 'urgent' || r.priority === 'high').length,
      totalRemainingDue: activeList
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

  const getStatusStyles = (status) => {
    switch (status) {
      case 'received':
        return {
          bg: 'rgba(56, 189, 248, 0.15)',
          border: 'rgba(56, 189, 248, 0.4)',
          color: '#38bdf8',
          label: lang === 'ar' ? 'مستلم' : 'Reçu',
        };
      case 'in_progress':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.4)',
          color: '#f59e0b',
          label: lang === 'ar' ? 'قيد الصيانة' : 'En cours',
        };
      case 'ready':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.4)',
          color: '#10b981',
          label: lang === 'ar' ? 'جاهز للتسليم' : 'Prêt',
        };
      case 'delivered':
        return {
          bg: 'rgba(168, 85, 247, 0.15)',
          border: 'rgba(168, 85, 247, 0.4)',
          color: '#c084fc',
          label: lang === 'ar' ? 'تم التسليم' : 'Livré & Clôturé',
        };
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.15)',
          border: 'rgba(148, 163, 184, 0.4)',
          color: 'var(--text-secondary)',
          label: status,
        };
    }
  };

  // Helper for brand logos / icons
  const getBrandIcon = (modelStr) => {
    const s = (modelStr || '').toLowerCase();
    if (s.includes('iphone') || s.includes('apple') || s.includes('ipad')) {
      return (
        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginRight: '4px' }}>
          
        </span>
      );
    }
    if (s.includes('samsung')) {
      return (
        <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8', padding: '1px 4px', borderRadius: '4px', marginRight: '4px' }}>
          S
        </span>
      );
    }
    if (s.includes('redmi') || s.includes('xiaomi')) {
      return (
        <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'rgba(249, 115, 22, 0.18)', color: '#f97316', padding: '1px 4px', borderRadius: '4px', marginRight: '4px' }}>
          MI
        </span>
      );
    }
    if (s.includes('huawei')) {
      return (
        <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'rgba(239, 68, 68, 0.18)', color: '#ef4444', padding: '1px 4px', borderRadius: '4px', marginRight: '4px' }}>
          HW
        </span>
      );
    }
    if (s.includes('itel')) {
      return (
        <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'rgba(239, 68, 68, 0.18)', color: '#ef4444', padding: '1px 4px', borderRadius: '4px', marginRight: '4px' }}>
          itel
        </span>
      );
    }
    if (s.includes('techno') || s.includes('tecno')) {
      return (
        <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'rgba(59, 130, 246, 0.18)', color: '#3b82f6', padding: '1px 4px', borderRadius: '4px', marginRight: '4px' }}>
          TEC
        </span>
      );
    }
    return <Smartphone size={14} style={{ color: 'var(--accent-primary)', marginRight: '4px', flexShrink: 0 }} />;
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRepairs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRepairs.map((r) => r.id)));
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2.5rem' }}>
      
      {/* 1. HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
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
            <Wrench size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Atelier de Réparations Mobile (Travail à Faire)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.15rem 0 0 0' }}>
              Gestion centralisée de vos fiches de réparations, diagnostics, pièces de rechange et statuts.
            </p>
          </div>
        </div>

        {/* Action Button: + Nouveau Ticket de Réparation */}
        <button
          type="button"
          onClick={onOpenNewRepair}
          style={{
            background: 'linear-gradient(135deg, #ffd05b 0%, #f6a619 100%)',
            color: '#000000',
            border: 'none',
            borderRadius: '12px',
            padding: '0.65rem 1.15rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
            transition: 'all 0.2s ease',
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Nouveau Ticket de Réparation</span>
        </button>
      </div>

      {/* 2. TOP 4 KPI CARDS */}
      <div className="sales-kpi-grid-4">
        
        {/* KPI 1: Total Réparations */}
        <div
          className="dash-kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => setStatusFilter('all')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <FileText size={18} />
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
              Total Réparations
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {counts.all}
              </div>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Tous les tickets
            </div>
          </div>
        </div>

        {/* KPI 2: En cours à l'atelier */}
        <div
          className="dash-kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => setStatusFilter('in_progress')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <Clock size={18} />
            </div>
            <div className="dash-kpi-sparkbars" style={{ color: '#f59e0b' }}>
              <div className="dash-kpi-sparkbar" style={{ height: '14px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '10px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '18px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '12px' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              En cours à l'atelier
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.02em' }}>
                {counts.in_progress}
              </div>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {counts.received} Reçu
            </div>
          </div>
        </div>

        {/* KPI 3: Prêts à récupérer */}
        <div
          className="dash-kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => setStatusFilter('ready')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <CheckCircle size={18} />
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
              Prêts à récupérer
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em' }}>
                {counts.ready}
              </div>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Prêt
            </div>
          </div>
        </div>

        {/* KPI 4: Reste dû en cours */}
        <div className="dash-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <DollarSign size={18} />
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
              Reste dû en cours
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ef4444', letterSpacing: '-0.02em' }}>
                {privacyMode ? '••••••' : formatMoney(counts.totalRemainingDue || 90)}
              </div>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Reste dû
            </div>
          </div>
        </div>

      </div>

      {/* 3. FILTER TOOLBAR: ROW 1 (Search + Dropdowns + View Switcher) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        
        {/* Search Bar Input */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: '380px',
            flex: '1 1 260px',
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
            placeholder="Rechercher par N° ticket, client, téléphone, modèle, panne..."
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

        {/* Right Controls: Filtres + Dropdown + View Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
          
          {/* Quick Filter button */}
          <button
            type="button"
            className="dash-period-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <SlidersHorizontal size={13} style={{ color: '#f59e0b' }} />
            <span>Filtres</span>
            <span style={{ fontSize: '0.65rem' }}>▾</span>
          </button>

          {/* Status Select Dropdown */}
          <div className="dash-date-picker-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all" style={{ background: 'var(--bg-card)' }}>Tous les Statuts</option>
              <option value="received" style={{ background: 'var(--bg-card)' }}>Reçu ({counts.received})</option>
              <option value="in_progress" style={{ background: 'var(--bg-card)' }}>En cours ({counts.in_progress})</option>
              <option value="ready" style={{ background: 'var(--bg-card)' }}>Prêt ({counts.ready})</option>
              <option value="delivered" style={{ background: 'var(--bg-card)' }}>Livré & Clôturé ({counts.delivered})</option>
            </select>
          </div>

          {/* View Mode Switcher: Tableau | Cartes | Kanban */}
          <div className="dash-period-pill-group">
            <button
              type="button"
              className={`dash-period-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <LayoutList size={13} />
              <span>Tableau</span>
            </button>
            <button
              type="button"
              className={`dash-period-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <LayoutGrid size={13} />
              <span>Cartes</span>
            </button>
            <button
              type="button"
              className={`dash-period-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Kanban size={13} />
              <span>Kanban</span>
            </button>
          </div>

        </div>

      </div>

      {/* 4. FILTER TOOLBAR: ROW 2 (Status Pills) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.1rem' }}>
        <div className="dash-period-pill-group">
          <button
            type="button"
            className={`dash-period-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Tag size={13} />
            <span>Tous les Tickets ({counts.all})</span>
          </button>
          <button
            type="button"
            className={`dash-period-btn ${statusFilter === 'received' ? 'active' : ''}`}
            onClick={() => setStatusFilter('received')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Inbox size={13} />
            <span>Reçu ({counts.received})</span>
          </button>
          <button
            type="button"
            className={`dash-period-btn ${statusFilter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setStatusFilter('in_progress')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Wrench size={13} />
            <span>En cours ({counts.in_progress})</span>
          </button>
          <button
            type="button"
            className={`dash-period-btn ${statusFilter === 'ready' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ready')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Clock size={13} />
            <span>Prêt ({counts.ready})</span>
          </button>
          <button
            type="button"
            className={`dash-period-btn ${statusFilter === 'delivered' ? 'active' : ''}`}
            onClick={() => setStatusFilter('delivered')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ShieldCheck size={13} />
            <span>Livré & Clôturé ({counts.delivered})</span>
          </button>
        </div>
      </div>

      {/* 5. MAIN CONTENT: TABLE VIEW */}
      {viewMode === 'table' && (
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
                  <th style={{ padding: '0.85rem 0.6rem 0.85rem 1rem', width: '30px' }}>
                    <input
                      type="checkbox"
                      checked={filteredRepairs.length > 0 && selectedIds.size === filteredRepairs.length}
                      onChange={toggleSelectAll}
                      style={{ cursor: 'pointer', accentColor: '#f59e0b' }}
                    />
                  </th>
                  <th style={{ padding: '0.85rem 0.75rem' }}>RÉF / N°</th>
                  <th style={{ padding: '0.85rem 0.75rem' }}>DATE & HEURE</th>
                  <th style={{ padding: '0.85rem 0.75rem' }}>CLIENT</th>
                  <th style={{ padding: '0.85rem 0.75rem' }}>APPAREIL / MODÈLE</th>
                  <th style={{ padding: '0.85rem 0.75rem' }}>PANNE / DIAGNOSTIC</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>TOTAL DEVIS</th>
                  <th style={{ padding: '0.85rem 0.75rem' }}>ACOMPTE / RESTE</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>STATUT</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepairs.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Aucune fiche de réparation trouvée pour ces filtres
                    </td>
                  </tr>
                ) : (
                  filteredRepairs.map((rep) => {
                    const isPaid = Number(rep.remainingDue) <= 0;
                    const stStyle = getStatusStyles(rep.status);
                    const isUrgent = rep.priority === 'urgent' || rep.priority === 'high';
                    const isSelected = selectedIds.has(rep.id);

                    // Formatted date string
                    const d = new Date(rep.createdAt || Date.now());
                    const dateStr = !isNaN(d.getTime())
                      ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                      : '22/09/2026 10:20';

                    // Thumbnail lookup
                    const matchedPiece = rep.pieceUsedId ? productMap.get(rep.pieceUsedId) : null;
                    const thumbImg = rep.image || rep.deviceImage || matchedPiece?.image || null;

                    return (
                      <tr
                        key={rep.id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(245, 158, 11, 0.06)' : 'transparent',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-hover)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: '0.65rem 0.6rem 0.65rem 1rem' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(rep.id)}
                            style={{ cursor: 'pointer', accentColor: '#f59e0b' }}
                          />
                        </td>

                        {/* 1. Réf / N° + Thumbnail */}
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
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
                                color: '#f59e0b',
                                flexShrink: 0,
                                overflow: 'hidden',
                              }}
                            >
                              {thumbImg ? (
                                <img src={thumbImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Smartphone size={15} />
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span
                                style={{
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#fbbf24',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                }}
                              >
                                {rep.ticketNumber || `#SAV-${String(rep.id).slice(-4)}`}
                              </span>
                              {isUrgent && (
                                <span
                                  style={{
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '5px',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    background: '#ef4444',
                                    color: '#ffffff',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  Urgent
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Date & Heure */}
                        <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {dateStr}
                        </td>

                        {/* 3. Client */}
                        <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {rep.clientName?.trim() ? rep.clientName : (lang === 'ar' ? 'زبون عابر' : 'Client Atelier')}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                            {rep.clientPhone || '+216 55 123 456'}
                          </div>
                        </td>

                        {/* 4. Appareil / Modèle */}
                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {getBrandIcon(rep.deviceModel)}
                            <span>{rep.deviceModel || 'iPhone X'}</span>
                          </div>
                        </td>

                        {/* 5. Panne / Diagnostic */}
                        <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div>{rep.issueDescription || rep.diagnostic || 'Écran fissuré'}</div>
                          {rep.pieceName && (
                            <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '1px' }}>🔧 {rep.pieceName}</div>
                          )}
                        </td>

                        {/* 6. Total Devis */}
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          {privacyMode ? '••••' : formatMoney(rep.totalPrice || 80)}
                        </td>

                        {/* 7. Acompte / Reste */}
                        <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700, color: '#10b981' }}>
                            {privacyMode ? '•••' : formatMoney(rep.advancePaid || 0)}
                          </span>
                          <span style={{ margin: '0 0.3rem', color: 'var(--text-muted)' }}>/</span>
                          <span style={{ fontWeight: 700, color: Number(rep.remainingDue) > 0 ? '#ef4444' : '#10b981' }}>
                            {privacyMode ? '•••' : formatMoney(rep.remainingDue || 0)}
                          </span>
                        </td>

                        {/* 8. Statut */}
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <select
                            className="dash-status-select"
                            value={rep.status}
                            onChange={(e) => handleStatusChange(rep, e.target.value)}
                            style={{
                              backgroundColor: stStyle.bg,
                              color: stStyle.color,
                              border: `1px solid ${stStyle.border}`,
                              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(stStyle.color)}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                            }}
                          >
                            <option value="received" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{lang === 'ar' ? 'مستلم' : 'Reçu'}</option>
                            <option value="in_progress" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{lang === 'ar' ? 'قيد الصيانة' : 'En cours'}</option>
                            <option value="ready" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{lang === 'ar' ? 'جاهز للتسليم' : 'Prêt'}</option>
                            <option value="delivered" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{lang === 'ar' ? 'تم التسليم' : 'Livré & Clôturé'}</option>
                          </select>
                        </td>

                        {/* 9. Actions */}
                        <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                            {/* View Receipt */}
                            <button
                              type="button"
                              className="dash-action-btn"
                              onClick={() => setActiveReceipt({ type: 'repair', data: rep })}
                              title="Voir le reçu"
                            >
                              <Eye size={14} />
                            </button>

                            {/* Edit Action */}
                            <button
                              type="button"
                              className="dash-action-btn"
                              onClick={() => onEditRepair(rep)}
                              title="Modifier la fiche"
                            >
                              <Edit2 size={14} />
                            </button>

                            {/* Print Ticket */}
                            <button
                              type="button"
                              className="dash-action-btn"
                              onClick={() => setActiveReceipt({ type: 'repair', data: rep, autoPrint: true })}
                              title="Imprimer le ticket"
                            >
                              <Printer size={14} />
                            </button>

                            {/* Delete Action (Admin) */}
                            {isAdmin && (
                              <button
                                type="button"
                                className="dash-action-btn delete"
                                onClick={() => setDeleteModal({ open: true, repair: rep })}
                                title="Supprimer la fiche"
                              >
                                <Trash2 size={14} />
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
      )}

      {/* 5b. CARDS VIEW */}
      {viewMode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filteredRepairs.map((rep) => {
            const isPaid = Number(rep.remainingDue) <= 0;
            const stStyle = getStatusStyles(rep.status);
            const isUrgent = rep.priority === 'urgent' || rep.priority === 'high';

            return (
              <div key={rep.id} className="dash-card" style={{ gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#fbbf24',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      {rep.ticketNumber || `#SAV-${String(rep.id).slice(-4)}`}
                    </span>
                    {isUrgent && (
                      <span
                        style={{
                          padding: '0.18rem 0.45rem',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: '#ef4444',
                          color: '#ffffff',
                        }}
                      >
                        Urgent
                      </span>
                    )}
                  </div>

                  <select
                    className="dash-status-select"
                    value={rep.status}
                    onChange={(e) => handleStatusChange(rep, e.target.value)}
                    style={{
                      backgroundColor: stStyle.bg,
                      color: stStyle.color,
                      border: `1px solid ${stStyle.border}`,
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(stStyle.color)}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    }}
                  >
                    <option value="received" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{lang === 'ar' ? 'مستلم' : 'Reçu'}</option>
                    <option value="in_progress" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{lang === 'ar' ? 'قيد الصيانة' : 'En cours'}</option>
                    <option value="ready" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{lang === 'ar' ? 'جاهز للتسليم' : 'Prêt'}</option>
                    <option value="delivered" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{lang === 'ar' ? 'تم التسليم' : 'Livré & Clôturé'}</option>
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                    {getBrandIcon(rep.deviceModel)}
                    <span>{rep.deviceModel || 'Appareil'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {rep.clientName || 'Client Atelier'} {rep.clientPhone ? `• ${rep.clientPhone}` : ''}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {rep.issueDescription}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Total Devis</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {privacyMode ? '••••' : formatMoney(rep.totalPrice)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Reste Dû</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isPaid ? '#10b981' : '#ef4444' }}>
                      {privacyMode ? '••••' : formatMoney(rep.remainingDue || 0)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setActiveReceipt({ type: 'repair', data: rep })}
                    className="dash-action-btn"
                    title="Voir le reçu"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditRepair(rep)}
                    className="dash-action-btn"
                    title="Modifier la fiche"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveReceipt({ type: 'repair', data: rep, autoPrint: true })}
                    className="dash-action-btn"
                    title="Imprimer le ticket"
                  >
                    <Printer size={14} />
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setDeleteModal({ open: true, repair: rep })}
                      className="dash-action-btn delete"
                      title="Supprimer la fiche"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5c. KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {[
            { key: 'received', title: 'Reçu', color: '#38bdf8', icon: Inbox },
            { key: 'in_progress', title: 'En cours', color: '#f59e0b', icon: Wrench },
            { key: 'ready', title: 'Prêt à récupérer', color: '#10b981', icon: CheckCircle },
            { key: 'delivered', title: 'Livré & Clôturé', color: '#c084fc', icon: ShieldCheck },
          ].map((col) => {
            const colItems = filteredRepairs.filter((r) => r.status === col.key);
            const ColIcon = col.icon;
            return (
              <div
                key={col.key}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  minHeight: '400px',
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <ColIcon size={16} style={{ color: col.color }} />
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>{col.title}</span>
                  </div>
                  <span style={{ background: 'var(--bg-input)', color: col.color, fontWeight: 800, fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                    {colItems.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto' }}>
                  {colItems.length === 0 ? (
                    <div style={{ padding: '2rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      Aucun ticket
                    </div>
                  ) : (
                    colItems.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease, border-color 0.15s ease',
                        }}
                        onClick={() => onEditRepair(r)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = col.color;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24' }}>
                            {r.ticketNumber}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {formatMoney(r.totalPrice)}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                          {getBrandIcon(r.deviceModel)}
                          <span>{r.deviceModel}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {r.clientName}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Deleting a Repair Ticket */}
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
