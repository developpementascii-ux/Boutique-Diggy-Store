import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  LayoutDashboard,
  ShoppingCart,
  Wrench,
  Package,
  CreditCard,
  History,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Wallet,
  Receipt,
  Coins,
  Users,
  Truck,
  ClipboardList,
  Archive,
} from 'lucide-react';

export default function Sidebar({ onOpenNewSale, onOpenNewRepair, onOpenNewExpense }) {
  const {
    currentTab,
    setCurrentTab,
    currentSession,
    settings,
    categories,
    products,
    clients,
    activeRepairs,
    lowStockProducts,
    clientsWithDebt,
    pendingPurchaseOrdersCount,
    totalArchivedCount,
    urgentRepairs,
    todaySalesAmount,
    todayExpensesAmount,
    netCashRegisterBalance,
    formatMoney,
    sidebarCollapsed,
    toggleSidebar,
    isRTL,
    t,
    isAdmin,
  } = useApp();

  const isSessionClosed = Boolean(currentSession?.isClosed);

  const sidebarMenuItems = [
    {
      id: 'dashboard',
      label: t('navDashboard') || 'Tableau de Bord',
      icon: LayoutDashboard,
    },
    {
      id: 'sales_history',
      label: 'Journal des Ventes',
      icon: ShoppingCart,
    },
    {
      id: 'repairs',
      label: 'Atelier Réparations',
      icon: Wrench,
      badge: (activeRepairs && activeRepairs.length > 0) ? activeRepairs.length : undefined,
    },
    {
      id: 'inventory',
      label: 'Stock & Produits',
      icon: Package,
      badge: (products && products.length > 0) ? products.length : undefined,
    },
    {
      id: 'clients',
      label: 'Clients & Fidélité',
      icon: Users,
    },
    {
      id: 'credits',
      label: 'Crédits Clients',
      icon: CreditCard,
      badge: (clientsWithDebt && clientsWithDebt.length > 0) ? clientsWithDebt.length : undefined,
    },
    {
      id: 'purchase_orders',
      label: 'Commandes & Achats',
      icon: Truck,
      badge: pendingPurchaseOrdersCount > 0 ? pendingPurchaseOrdersCount : undefined,
    },
    {
      id: 'expenses',
      label: 'Dépenses & Sorties',
      icon: Wallet,
    },
    {
      id: 'sessions',
      label: 'Caisse & Bénéfices',
      icon: Coins,
    },
    {
      id: 'archives',
      label: 'Archives',
      icon: Archive,
    },
    {
      id: 'settings',
      label: 'Paramètres & Configuration',
      icon: Settings,
    },
  ];

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = currentTab === item.id;
    return (
      <button
        key={item.id}
        className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
        onClick={() => {
          if (item.customAction) item.customAction();
          else setCurrentTab(item.id);
        }}
        title={sidebarCollapsed ? item.label : ''}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          padding: '0.62rem 0.85rem',
          borderRadius: '10px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: '0.25rem',
          width: '100%',
          background: isActive ? 'linear-gradient(135deg, #ffd05b 0%, #f6a619 100%)' : 'transparent',
          color: isActive ? '#000000' : 'var(--text-secondary)',
          fontWeight: isActive ? 700 : 500,
          boxShadow: isActive ? '0 4px 14px rgba(245, 158, 11, 0.35)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Icon size={18} style={{ color: isActive ? '#000000' : 'inherit', flexShrink: 0 }} />
          {!sidebarCollapsed && (
            <span style={{ fontSize: '0.86rem', whiteSpace: 'nowrap' }}>{item.label}</span>
          )}
        </div>
        {!sidebarCollapsed && item.badge !== undefined && (
          <span
            style={{
              padding: '0.12rem 0.45rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: isActive ? '#000000' : '#f59e0b',
              color: isActive ? '#fbbf24' : '#000000',
              lineHeight: 1.2,
            }}
          >
            {item.badge}
          </span>
        )}
        {!sidebarCollapsed && item.hasSubmenu && !item.badge && (
          <ChevronRight size={14} style={{ color: isActive ? '#000000' : 'var(--text-muted)' }} />
        )}
      </button>
    );
  };

  return (
    <aside
      className={`app-sidebar no-print ${sidebarCollapsed ? 'collapsed' : ''}`}
      style={{
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 0.85rem',
        height: '100vh',
      }}
    >
      <div>
        {/* Brand Header: Diggy Store with cloned golden hexagon shield icon */}
        <div
          className="sidebar-brand"
          onClick={() => setCurrentTab('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.25rem 0.35rem 1.25rem',
            cursor: 'pointer',
          }}
        >
          {/* Cloned Gold Hexagon Shield Logo Icon */}
          <div
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
              {/* Outer gold hexagon */}
              <path
                d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
                stroke="#f59e0b"
                strokeWidth="2"
                fill="rgba(245, 158, 11, 0.12)"
              />
              {/* Inner geometric cube / D polygon */}
              <path
                d="M16 7L23 11V21L16 25L9 21V11L16 7Z"
                stroke="#fbbf24"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M16 7V25M9 11L23 21M9 21L23 11"
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeOpacity="0.4"
              />
              <circle cx="16" cy="16" r="2.8" fill="#f59e0b" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Diggy Store
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                Mobile • Vape • Parfums
              </span>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        {!sidebarCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.9rem' }}>
            {/* + Nouvelle Vente */}
            <button
              type="button"
              onClick={() => {
                if (onOpenNewSale) onOpenNewSale();
                else setCurrentTab('pos');
              }}
              style={{
                background: 'linear-gradient(135deg, #ffd05b 0%, #f6a619 100%)',
                color: '#000000',
                border: 'none',
                borderRadius: '10px',
                padding: '0.58rem 0.85rem',
                fontSize: '0.84rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                width: '100%',
                transition: 'all 0.2s ease',
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Nouvelle Vente</span>
            </button>

            {/* Ticket Réparation */}
            <button
              type="button"
              onClick={() => {
                if (onOpenNewRepair) onOpenNewRepair();
                else setCurrentTab('repairs');
              }}
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.52rem 0.85rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s ease',
              }}
            >
              <Receipt size={15} style={{ color: '#f59e0b' }} />
              <span>Ticket Réparation</span>
            </button>
          </div>
        )}

        {/* Section Header */}
        {!sidebarCollapsed && (
          <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.2rem 0.5rem 0.35rem' }}>
            ACTIVITÉS & SERVICES
          </div>
        )}

        {/* Navigation Links */}
        <nav className="sidebar-nav" style={{ marginTop: '0.1rem', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)', paddingRight: '2px' }}>
          {sidebarMenuItems.map((item) => renderNavItem(item))}
        </nav>
      </div>

      {/* Quick Collapse Button at Bottom of Sidebar */}
      <div style={{ padding: '0.4rem 0.5rem 0.2rem', display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          className="btn-icon btn-outline btn-sm sidebar-collapse-btn"
          style={{ width: '100%', borderRadius: '8px' }}
          onClick={toggleSidebar}
          title={sidebarCollapsed ? t('sidebarExpand') : t('sidebarCollapse')}
        >
          {sidebarCollapsed ? (
            isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />
          ) : (
            isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />
          )}
        </button>
      </div>
    </aside>
  );
}

