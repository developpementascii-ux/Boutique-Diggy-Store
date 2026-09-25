import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  X,
  Package,
  Wrench,
  Users,
  Sun,
  Moon,
  Eye,
  EyeOff,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  Check,
  Lock,
  LogOut,
  Smartphone,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function TopHeader() {
  const {
    products = [],
    clients = [],
    repairs = [],
    lang,
    setLang,
    theme,
    setTheme,
    privacyMode,
    togglePrivacyMode,
    sidebarCollapsed,
    toggleSidebar,
    setCurrentTab,
    formatMoney,
    t,
    currentUser,
    logout,
    isAdmin,
    isRTL,
    setInventorySearchQuery,
  } = useApp();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Menus State
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const langMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Keyboard shortcut Ctrl + K / Cmd + K for quick search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setShowLangMenu(false);
        setShowUserMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Search Filter
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { products: [], repairs: [], clients: [] };

    const matchedProducts = products
      .filter((p) => {
        const name = (p.name || '').toLowerCase();
        const sku = (p.sku || p.barcode || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return name.includes(q) || sku.includes(q) || cat.includes(q);
      })
      .slice(0, 5);

    const matchedRepairs = repairs
      .filter((r) => {
        if (r.archived) return false;
        const ticket = (r.ticketNumber || '').toLowerCase();
        const model = (r.deviceModel || '').toLowerCase();
        const client = (r.clientName || '').toLowerCase();
        const phone = (r.clientPhone || '').toLowerCase();
        return ticket.includes(q) || model.includes(q) || client.includes(q) || phone.includes(q);
      })
      .slice(0, 5);

    const matchedClients = clients
      .filter((c) => {
        const name = (c.name || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        return name.includes(q) || phone.includes(q);
      })
      .slice(0, 4);

    return {
      products: matchedProducts,
      repairs: matchedRepairs,
      clients: matchedClients,
    };
  }, [searchQuery, products, repairs, clients]);

  const totalResultsCount =
    searchResults.products.length + searchResults.repairs.length + searchResults.clients.length;

  // Language options with flags
  const languageOptions = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  const currentLangObj = languageOptions.find((l) => l.code === lang) || languageOptions[0];

  return (
    <header className="app-topbar no-print">
      
      {/* 1. LEFT: SIDEBAR TOGGLE + GLOBAL SEARCH BAR */}
      <div className="topbar-title-area" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, maxWidth: '520px' }}>
        
        {/* Sidebar Collapse / Expand Toggle Button */}
        <button
          type="button"
          className="btn-icon btn-outline btn-sm"
          style={{
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            flexShrink: 0,
            width: '36px',
            height: '36px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={toggleSidebar}
          title={sidebarCollapsed ? t('sidebarExpand') : t('sidebarCollapse')}
        >
          {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {/* Global Search Input with Ctrl + K */}
        <div ref={searchContainerRef} style={{ position: 'relative', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              background: 'var(--bg-input)',
              border: isSearchOpen ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '0.45rem 0.85rem',
              gap: '0.6rem',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              boxShadow: isSearchOpen ? '0 0 12px rgba(245, 158, 11, 0.2)' : 'none',
            }}
          >
            <Search size={15} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              placeholder={t('globalSearchPlaceholder') || 'Rechercher un produit, un client, un ticket...'}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  e.preventDefault();
                  const q = searchQuery.trim();
                  if (searchResults.products.length > 0) {
                    if (setInventorySearchQuery) setInventorySearchQuery(searchResults.products[0].name);
                  } else {
                    if (setInventorySearchQuery) setInventorySearchQuery(q);
                  }
                  setCurrentTab('inventory');
                  setIsSearchOpen(false);
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.83rem',
                width: '100%',
              }}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            ) : (
              <span
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '0.1rem 0.4rem',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                }}
              >
                Ctrl + K
              </span>
            )}
          </div>

          {/* Search Results Dropdown Overlay */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.55)',
                zIndex: 999,
                maxHeight: '440px',
                overflowY: 'auto',
                padding: '0.65rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {totalResultsCount === 0 ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {t('globalSearchNoResults') || 'Aucun résultat correspondant'}
                </div>
              ) : (
                <>
                  {/* Products Section */}
                  {searchResults.products.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--accent-primary)',
                          padding: '0.2rem 0.4rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          if (setInventorySearchQuery) setInventorySearchQuery(searchQuery.trim());
                          setCurrentTab('inventory');
                          setIsSearchOpen(false);
                        }}
                        title="Ouvrir tous les résultats dans Stock & Produits"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Package size={13} />
                          <span>{t('navInventory') || 'Produits'} ({searchResults.products.length})</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                          Voir tout dans Stock →
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.2rem' }}>
                        {searchResults.products.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              if (setInventorySearchQuery) setInventorySearchQuery(p.name);
                              setCurrentTab('inventory');
                              setIsSearchOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.45rem 0.6rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background: 'var(--bg-input)',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-input)')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                              <div
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '6px',
                                  background: 'var(--bg-card)',
                                  border: '1px solid var(--border-color)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  overflow: 'hidden',
                                }}
                              >
                                {p.image ? (
                                  <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <Smartphone size={13} style={{ color: 'var(--text-secondary)' }} />
                                )}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                  {p.category || 'Général'} • Stock: {p.stock ?? 0}
                                </div>
                              </div>
                            </div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                              {formatMoney(p.sellingPrice || p.price || 0)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Repair Tickets Section */}
                  {searchResults.repairs.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#38bdf8',
                          padding: '0.2rem 0.4rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Wrench size={13} />
                        <span>{t('navRepairs') || 'Réparations'} ({searchResults.repairs.length})</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.2rem' }}>
                        {searchResults.repairs.map((r) => (
                          <div
                            key={r.id}
                            onClick={() => {
                              setCurrentTab('repairs');
                              setIsSearchOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.45rem 0.6rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background: 'var(--bg-input)',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-input)')}
                          >
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {r.ticketNumber} — {r.deviceModel}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                {r.clientName} ({r.clientPhone || 'N/A'})
                              </div>
                            </div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8' }}>
                              {r.status === 'delivered' ? 'Terminé' : r.status === 'in_progress' ? 'En cours' : 'Nouveau'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clients Section */}
                  {searchResults.clients.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#10b981',
                          padding: '0.2rem 0.4rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Users size={13} />
                        <span>{t('navClients') || 'Clients'} ({searchResults.clients.length})</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.2rem' }}>
                        {searchResults.clients.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setCurrentTab('clients');
                              setIsSearchOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.45rem 0.6rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background: 'var(--bg-input)',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-input)')}
                          >
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{c.phone || 'Pas de numéro'}</div>
                            </div>
                            {Number(c.currentDebt || 0) > 0 && (
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444' }}>
                                Dette: {formatMoney(c.currentDebt)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. RIGHT: THEME PILL + FLAG LANGUAGE + NOTIFICATIONS + PRIVACY + USER */}
      <div className="topbar-right-area" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        
        {/* Sun / Moon Theme Toggle Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            padding: '2px',
            gap: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => setTheme('light')}
            style={{
              background: theme === 'light' ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'transparent',
              color: theme === 'light' ? '#000' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '20px',
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            title={t('themeLight') || 'Mode Clair'}
          >
            <Sun size={14} />
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            style={{
              background: theme === 'dark' ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'transparent',
              color: theme === 'dark' ? '#000' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '20px',
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            title={t('themeDark') || 'Mode Sombre'}
          >
            <Moon size={14} />
          </button>
        </div>

        {/* Flag Language Dropdown Pill */}
        <div ref={langMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowLangMenu((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '0.35rem 0.65rem',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{currentLangObj.flag}</span>
            <span>{currentLangObj.label}</span>
            <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
          </button>

          {showLangMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: isRTL ? 'auto' : 0,
                left: isRTL ? 0 : 'auto',
                minWidth: '150px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.45)',
                padding: '0.35rem',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
              }}
            >
              {languageOptions.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => {
                    setLang(opt.code);
                    setShowLangMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: lang === opt.code ? 'var(--accent-primary-light)' : 'transparent',
                    color: lang === opt.code ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: lang === opt.code ? 700 : 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.05rem' }}>{opt.flag}</span>
                    <span>{opt.label}</span>
                  </div>
                  {lang === opt.code && <Check size={14} style={{ color: 'var(--accent-primary)' }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Privacy Mode Toggle Button */}
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
            background: privacyMode ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-input)',
            border: `1px solid ${privacyMode ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)'}`,
            color: privacyMode ? '#f87171' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={togglePrivacyMode}
          title={privacyMode ? 'Mode Discret Actif (Chiffres masqués)' : 'Mode Public (Afficher les chiffres)'}
        >
          {privacyMode ? <EyeOff size={16} style={{ color: '#f87171' }} /> : <Eye size={16} />}
        </button>

        {/* User Session Pill & Dropdown */}
        {currentUser && (
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowUserMenu((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                background: 'transparent',
                border: 'none',
                padding: '0.2rem 0.4rem',
                cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: '#000',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.95rem',
                }}
              >
                A
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{currentUser.name || 'Administrateur'}</div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                  }}
                >
                  {isAdmin ? 'ADMIN' : 'VENDEUR'}
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: isRTL ? 'auto' : 0,
                  left: isRTL ? 0 : 'auto',
                  minWidth: '190px',
                  background: 'var(--bg-card)',
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
            )}
          </div>
        )}
      </div>

    </header>
  );
}
