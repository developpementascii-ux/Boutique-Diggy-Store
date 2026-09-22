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
  ClipboardList,
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

  const activityMenuItems = [
    {
      id: 'sales_history',
      label: t('navSalesHistory'),
      icon: History,
      description: t('navSalesHistorySub'),
    },
    {
      id: 'repairs',
      label: t('navRepairs'),
      icon: Wrench,
      badge: activeRepairs.length > 0 ? activeRepairs.length : null,
      badgeType: 'badge-warning',
      description: t('navRepairsSub'),
    },
    {
      id: 'purchase_orders',
      label: t('navPurchaseOrders'),
      icon: ClipboardList,
      badge: pendingPurchaseOrdersCount > 0 ? pendingPurchaseOrdersCount : null,
      badgeType: 'badge-primary',
      description: t('navPurchaseOrdersSub'),
    },
  ];

  const cashMenuItems = [
    {
      id: 'sessions',
      label: t('navSessions'),
      icon: Coins,
      badge: null,
      description: t('navSessionsSub'),
    },
    {
      id: 'expenses',
      label: t('navExpenses'),
      icon: Wallet,
      badge: null,
      description: t('navExpensesSub'),
    },
  ];

  const baseManagementMenuItems = [
    {
      id: 'inventory',
      label: t('navInventory'),
      icon: Package,
      badge: lowStockProducts.length > 0 ? lowStockProducts.length : null,
      badgeType: 'badge-alert',
      description: t('navInventorySub'),
    },
    {
      id: 'clients',
      label: t('navClients'),
      icon: Users,
      description: t('navClientsSub'),
    },
    {
      id: 'credits',
      label: t('navCredits'),
      icon: CreditCard,
      badge: clientsWithDebt.length > 0 && !sidebarCollapsed ? clientsWithDebt.length : null,
      badgeType: 'badge-alert',
      description: t('navCreditsSub'),
    },
  ];

  const managementMenuItems = isAdmin
    ? [
        ...baseManagementMenuItems,
        {
          id: 'settings',
          label: t('navSettings'),
          icon: Settings,
          badge: categories.length > 0 && !sidebarCollapsed ? `${categories.length} ${t('categoriesBadge')}` : null,
          badgeType: '',
          description: t('navSettingsSub'),
        },
      ]
    : baseManagementMenuItems;

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = currentTab === item.id;
    return (
      <button
        key={item.id}
        className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
        onClick={() => setCurrentTab(item.id)}
        title={sidebarCollapsed ? `${item.label} (${item.description})` : ''}
      >
        <div className="nav-item-icon-wrapper">
          <Icon size={18} />
        </div>
        <div className="nav-item-content">
          <div className="nav-item-title">{item.label}</div>
        </div>
        {item.badge !== null && item.badge !== undefined && (
          <span className={`tab-badge ${item.badgeType || ''}`}>
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className={`app-sidebar no-print ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div
        className="sidebar-brand"
        onClick={() => setCurrentTab('dashboard')}
        title={sidebarCollapsed ? settings.shopName || t('appName') : ''}
      >
        <div className="logo-icon">
          <Store size={22} />
        </div>
        <div className="brand-text">
          <h2>{settings.shopName || t('appName')}</h2>
          <span>{t('appSubtitle')}</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="sidebar-quick-actions">
        <button
          className="btn btn-primary btn-sm sidebar-btn-action"
          onClick={onOpenNewSale}
          title={t('newSale')}
        >
          <Plus size={16} />
          <span>{t('newSale')}</span>
        </button>
        <button
          className="btn btn-secondary btn-sm sidebar-btn-action"
          onClick={onOpenNewRepair}
          title={t('newRepair')}
        >
          <Wrench size={16} />
          <span>{t('newRepair')}</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">{t('sectionMain')}</div>
        {activityMenuItems.map((item) => renderNavItem(item))}

        {isAdmin && (
          <>
            <div className="sidebar-divider" />
            <div className="sidebar-section-label">{t('sectionCash')}</div>
            {cashMenuItems.map((item) => renderNavItem(item))}
          </>
        )}

        <div className="sidebar-divider" />

        <div className="sidebar-section-label">{t('sectionConfig')}</div>
        {managementMenuItems.map((item) => renderNavItem(item))}
      </nav>

      {/* Quick Collapse Button at Bottom of Sidebar */}
      <div style={{ marginTop: 'auto', padding: '0.75rem 0.5rem', display: 'flex', justifyContent: 'center' }}>
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

