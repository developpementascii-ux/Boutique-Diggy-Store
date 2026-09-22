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
  Users,
} from 'lucide-react';

export default function Navbar({ onOpenNewSale, onOpenNewRepair, onOpenSettings }) {
  const {
    currentTab,
    setCurrentTab,
    settings,
    activeRepairs,
    lowStockProducts,
    clientsWithDebt,
    urgentRepairs,
    t,
  } = useApp();

  const tabs = [
    {
      id: 'dashboard',
      label: t ? t('navDashboard') : 'Tableau de Bord',
      icon: LayoutDashboard,
      badge: urgentRepairs.length > 0 ? urgentRepairs.length : null,
      badgeType: 'badge-alert',
    },
    {
      id: 'pos',
      label: t ? t('navPOS') : 'Caisse & Ventes',
      icon: ShoppingCart,
    },
    {
      id: 'sales_history',
      label: t ? t('navSalesHistory') : 'Historique Ventes',
      icon: History,
    },
    {
      id: 'clients',
      label: t ? t('navClients') : 'Clients & Fidélité',
      icon: Users,
    },
    {
      id: 'inventory',
      label: t ? t('navInventory') : 'Stock & Produits',
      icon: Package,
      badge: lowStockProducts.length > 0 ? lowStockProducts.length : null,
      badgeType: 'badge-alert',
    },
    {
      id: 'repairs',
      label: t ? t('navRepairs') : 'Atelier Réparations',
      icon: Wrench,
      badge: activeRepairs.length > 0 ? activeRepairs.length : null,
      badgeType: 'badge-warning',
    },
    {
      id: 'credits',
      label: t ? t('navCredits') : 'Crédits Clients',
      icon: CreditCard,
      badge: clientsWithDebt.length > 0 ? clientsWithDebt.length : null,
      badgeType: 'badge-alert',
    },
  ];

  return (
    <header className="app-header no-print">
      <div className="header-inner">
        {/* Brand */}
        <div className="logo-brand" onClick={() => setCurrentTab('dashboard')}>
          <div className="logo-icon">
            <Store size={24} />
          </div>
          <div className="brand-text">
            <h1>{settings.shopName || 'Boutique Pro'}</h1>
            <span>Mobile • Vape • Parfums • Réparations</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`tab-badge ${tab.badgeType || ''}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="header-actions">
          <button className="btn btn-primary btn-sm action-btn-primary" onClick={onOpenNewSale}>
            <Plus size={16} />
            <span>Vente</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onOpenNewRepair}>
            <Wrench size={16} />
            <span>Réparation</span>
          </button>
          <button
            className="action-btn-sm btn-icon"
            onClick={onOpenSettings}
            title="Paramètres & Sauvegarde"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
