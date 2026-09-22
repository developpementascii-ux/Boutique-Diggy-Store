import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Wrench,
  Package,
  CreditCard,
  History,
  Sparkles,
  Calendar,
  Settings,
  Globe,
  PanelLeftClose,
  PanelLeft,
  Moon,
  Sun,
  Palette,
  Sparkle,
  Wallet,
  Coins,
  Eye,
  EyeOff,
  ClipboardList,
  User,
  ShieldCheck,
  LogOut,
  Lock,
} from 'lucide-react';

export default function TopHeader() {
  const {
    currentTab,
    settings,
    activeRepairs,
    lowStockProducts,
    clientsWithDebt,
    pendingPurchaseOrdersCount,
    lang,
    setLang,
    theme,
    setTheme,
    privacyMode,
    togglePrivacyMode,
    sidebarCollapsed,
    toggleSidebar,
    t,
    currentUser,
    logout,
    isAdmin,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);

  const getPageInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: t('headerDashboardTitle'),
          subtitle: t('headerDashboardSub'),
          icon: LayoutDashboard,
        };
      case 'pos':
        return {
          title: t('headerPOSTitle'),
          subtitle: t('headerPOSSub'),
          icon: ShoppingCart,
        };
      case 'sessions':
        return {
          title: t('headerSessionsTitle'),
          subtitle: t('headerSessionsSub'),
          icon: Coins,
        };
      case 'repairs':
        return {
          title: t('headerRepairsTitle'),
          subtitle: `${activeRepairs.length} ${t('headerRepairsSub')}`,
          icon: Wrench,
        };
      case 'inventory':
        return {
          title: t('headerInventoryTitle'),
          subtitle: `${lowStockProducts.length} ${t('headerInventorySub')}`,
          icon: Package,
        };
      case 'purchase_orders':
        return {
          title: t('headerPurchaseOrdersTitle'),
          subtitle: t('headerPurchaseOrdersSub'),
          icon: ClipboardList,
        };
      case 'categories':
      case 'settings':
        return {
          title: t('headerSettingsTitle'),
          subtitle: t('headerSettingsSub'),
          icon: Settings,
        };
      case 'credits':
        return {
          title: t('headerCreditsTitle'),
          subtitle: `${clientsWithDebt.length} ${t('headerCreditsSub')}`,
          icon: CreditCard,
        };
      case 'expenses':
        return {
          title: t('headerExpensesTitle'),
          subtitle: t('headerExpensesSub'),
          icon: Wallet,
        };
      case 'sales_history':
        return {
          title: t('headerSalesHistoryTitle'),
          subtitle: t('headerSalesHistorySub'),
          icon: History,
        };
      default:
        return {
          title: settings.shopName || t('appName'),
          subtitle: t('appSubtitle'),
          icon: Sparkles,
        };
    }
  };

  const info = getPageInfo();
  const Icon = info.icon;

  const localeCode = lang === 'ar' ? 'ar-TN' : lang === 'en' ? 'en-US' : 'fr-FR';
  const todayStr = new Date().toLocaleDateString(localeCode, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="app-topbar no-print">
      <div className="topbar-title-area" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Sidebar Show / Hide Toggle Button */}
        <button
          type="button"
          className="btn-icon btn-outline btn-sm"
          style={{
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
          }}
          onClick={toggleSidebar}
          title={sidebarCollapsed ? t('sidebarExpand') : t('sidebarCollapse')}
        >
          {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <div className="topbar-icon-badge">
          <Icon size={20} />
        </div>
        <div>
          <h1 className="topbar-title">{info.title}</h1>
          <p className="topbar-subtitle">{info.subtitle}</p>
        </div>
      </div>

      <div className="topbar-right-area" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        {/* Theme Switcher Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '0.2rem 0.45rem',
          }}
          title={t('themeLabel')}
        >
          {theme === 'dark' && <Moon size={14} style={{ color: '#818cf8' }} />}
          {theme === 'light' && <Sun size={14} style={{ color: '#f59e0b' }} />}
          {theme === 'cyber' && <Sparkles size={14} style={{ color: '#c084fc' }} />}
          {theme === 'emerald' && <Palette size={14} style={{ color: '#34d399' }} />}
          
          <select
            className="form-select"
            style={{
              border: 'none',
              background: 'transparent',
              padding: '0.2rem 0.35rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--text-primary)',
            }}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="dark" style={{ background: '#1e293b', color: '#fff' }}>🌙 {t('themeDark')}</option>
            <option value="light" style={{ background: '#ffffff', color: '#0f172a' }}>☀️ {t('themeLight')}</option>
            <option value="cyber" style={{ background: '#170e2e', color: '#faf5ff' }}>🔮 {t('themeCyber')}</option>
            <option value="emerald" style={{ background: '#0c2b23', color: '#ecfdf5' }}>🌿 {t('themeEmerald')}</option>
          </select>
        </div>

        {/* Privacy Mode Eye Toggle Button (Icon-Only: Eye Open / Eye Closed) */}
        <button
          type="button"
          className="btn-icon"
          style={{
            borderRadius: '10px',
            width: '34px',
            height: '34px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: privacyMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${privacyMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.35)'}`,
            color: privacyMode ? '#f87171' : '#10b981',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: privacyMode ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none',
          }}
          onClick={togglePrivacyMode}
          title={
            privacyMode
              ? (lang === 'ar' ? 'وضع السرية مفعل (الأرباح والأسعار محجوبة) - اضغط للإظهار' : 'Mode Discret Actif (Bénéfices & Prix Secrets masqués) - Cliquer pour afficher')
              : (lang === 'ar' ? 'الوضع العادي (الأرقام ظاهرة) - اضغط لإخفاء الأرباح والأسعار' : 'Mode Public (Données visibles) - Cliquer pour masquer/flouter les bénéfices et prix face au client')
          }
        >
          {privacyMode ? (
            <EyeOff size={18} style={{ color: '#f87171' }} />
          ) : (
            <Eye size={18} style={{ color: '#10b981' }} />
          )}
        </button>

        {/* Language Switcher Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '0.2rem 0.45rem',
          }}
        >
          <Globe size={14} style={{ color: '#818cf8', opacity: 0.8 }} />
          <select
            className="form-select"
            style={{
              border: 'none',
              background: 'transparent',
              padding: '0.2rem 0.35rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--text-primary)',
            }}
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="fr" style={{ background: '#1e293b', color: '#fff' }}>🇫🇷 Français</option>
            <option value="ar" style={{ background: '#1e293b', color: '#fff' }}>🇸🇦 العربية</option>
            <option value="en" style={{ background: '#1e293b', color: '#fff' }}>🇬🇧 English</option>
          </select>
        </div>

        {/* Date Pill */}
        <div className="topbar-date-pill">
          <Calendar size={14} style={{ color: '#818cf8' }} />
          <span style={{ textTransform: 'capitalize' }}>{todayStr}</span>
        </div>

        {/* User Session Pill & Dropdown */}
        {currentUser && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowUserMenu((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: isAdmin
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
                border: `1px solid ${isAdmin ? 'rgba(245, 158, 11, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                borderRadius: '12px',
                padding: '0.3rem 0.65rem 0.3rem 0.4rem',
                cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '8px',
                  background: isAdmin ? '#f59e0b' : '#3b82f6',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isAdmin ? <ShieldCheck size={16} /> : <User size={16} />}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{currentUser.name}</div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: isAdmin ? '#f59e0b' : '#3b82f6',
                  }}
                >
                  {isAdmin ? 'Admin' : 'Vendeur'}
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                  onClick={() => setShowUserMenu(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    minWidth: '190px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35)',
                    padding: '0.4rem',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                  }}
                >
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      fontSize: '0.82rem',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                  >
                    <Lock size={15} />
                    Verrouiller / Changer
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      fontSize: '0.82rem',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      color: '#ef4444',
                    }}
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                  >
                    <LogOut size={15} />
                    Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

