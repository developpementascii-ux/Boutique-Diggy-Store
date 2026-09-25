import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TRANSLATIONS } from '../i18n/translations';
import {
  INITIAL_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_REPAIRS,
  INITIAL_SALES,
  INITIAL_CLIENTS,
  INITIAL_EXPENSES,
  INITIAL_CASH_SESSIONS,
  INITIAL_CURRENT_SESSION,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_USERS,
} from '../data/initialData';
import { supabaseService, isSupabaseConfigured } from '../services/supabaseService';

const AppContext = createContext();

const STORAGE_KEYS = {
  LANG: 'boutique_lang_v1',
  THEME: 'boutique_theme_v1',
  SIDEBAR_COLLAPSED: 'boutique_sidebar_collapsed_v1',
  SETTINGS: 'boutique_settings_v1',
  CATEGORIES: 'boutique_categories_v1',
  PRODUCTS: 'boutique_products_v1',
  REPAIRS: 'boutique_repairs_v1',
  SALES: 'boutique_sales_v1',
  CLIENTS: 'boutique_clients_v1',
  EXPENSES: 'boutique_expenses_v1',
  CASH_SESSIONS: 'boutique_cash_sessions_v1',
  CURRENT_CASH_SESSION: 'boutique_current_cash_session_v1',
  PURCHASE_ORDERS: 'boutique_purchase_orders_v1',
  PRIVACY_MODE: 'boutique_privacy_mode_v1',
  USERS: 'boutique_users_v1',
  CURRENT_USER: 'boutique_current_user_v1',
};

// BroadcastChannel for instant real-time synchronization between tabs/windows
const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('boutique_cross_tab_sync_v1') : null;

function broadcastSync(key, data) {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ key, data, timestamp: Date.now() });
    } catch (e) {
      console.warn('BroadcastChannel sync error:', e);
    }
  }
}

function loadStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.error('Storage load error for', key, err);
    return fallback;
  }
}

function saveStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Storage save error for', key, err);
  }
}

export function isGenericClientName(name) {
  if (!name || typeof name !== 'string') return true;
  const n = name.trim().toLowerCase();
  const genericList = [
    '',
    'client comptoir',
    'comptoir',
    'client',
    'زبون عابر',
    'زبon',
    'زبون',
    'الزبون',
    'عميل عابر',
    'عميل',
    'walk-in client',
    'walk in client',
    'walk-in customer',
    'walk in customer',
    'anonymous',
    'anonyme',
  ];
  return genericList.includes(n);
}

export function isProductLowStock(product) {
  if (!product) return false;
  const rawThreshold = product.minStockAlert;
  const threshold = (rawThreshold !== undefined && rawThreshold !== null && rawThreshold !== '')
    ? Number(rawThreshold)
    : 3;

  if (threshold <= 0) {
    return false;
  }

  const stock = Number(product.stock) || 0;
  return stock <= threshold;
}

export function cleanClientHistory(history) {
  if (!Array.isArray(history)) return [];
  const cleanList = [];
  const seenKeys = new Set();

  history.forEach((t, idx) => {
    if (!t) return;
    const type = t.type || 'payment';
    const amount = Number(t.amount) || 0;
    const note = (t.note || '').trim().toLowerCase();
    const dateMinute = t.date ? t.date.substring(0, 16) : '';
    const refId = t.referenceId || t.ticketId || t.invoiceId || '';

    const refKey = refId ? `ref:${refId}:${type}` : null;
    const noteKey = note ? `note:${note}:${amount}:${dateMinute}` : null;
    const matchKey = refKey || noteKey || `id:${t.id || idx}`;

    if (!seenKeys.has(matchKey)) {
      seenKeys.add(matchKey);
      if (refKey && noteKey) seenKeys.add(noteKey);
      cleanList.push({
        ...t,
        amount,
      });
    }
  });

  cleanList.sort((a, b) => new Date(b.date) - new Date(a.date));
  return cleanList;
}

export function AppProvider({ children }) {
  // Language State: 'fr', 'ar', 'en'
  const [lang, setLang] = useState(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEYS.LANG);
      return savedLang && (savedLang === 'fr' || savedLang === 'ar' || savedLang === 'en')
        ? savedLang
        : 'fr';
    } catch {
      return 'fr';
    }
  });

  // Theme State: 'dark', 'light'
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      return savedTheme && ['dark', 'light'].includes(savedTheme)
        ? savedTheme
        : 'dark';
    } catch {
      return 'dark';
    }
  });

  // Privacy Mode State
  const [privacyMode, setPrivacyMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.PRIVACY_MODE) === 'true';
    } catch {
      return false;
    }
  });

  const togglePrivacyMode = () => {
    setPrivacyMode((prev) => {
      const next = !prev;
      saveStorage(STORAGE_KEYS.PRIVACY_MODE, String(next));
      broadcastSync(STORAGE_KEYS.PRIVACY_MODE, next);
      return next;
    });
  };

  // Sidebar Collapsed State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      saveStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, next);
      return next;
    });
  };

  // --- Core Application States (Loaded from LocalStorage once on startup) ---
  const [settings, setSettings] = useState(() => loadStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS));
  const [categories, setCategories] = useState(() => {
    const loaded = loadStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const rawList = Array.isArray(loaded) ? loaded : INITIAL_CATEGORIES;
    return rawList
      .map((cat, idx) => {
        const initCat = INITIAL_CATEGORIES.find((c) => c.id === cat.id);
        const assignedOrder = cat.order !== undefined && cat.order !== null && !isNaN(Number(cat.order))
          ? Number(cat.order)
          : (initCat?.order !== undefined ? initCat.order : idx + 1);
        return {
          ...cat,
          order: assignedOrder,
          subCategories: Array.isArray(cat.subCategories) && cat.subCategories.length > 0
            ? cat.subCategories
            : (initCat?.subCategories || []),
        };
      })
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  });
  const [products, setProducts] = useState(() => loadStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS));
  const [repairs, setRepairs] = useState(() => loadStorage(STORAGE_KEYS.REPAIRS, INITIAL_REPAIRS));
  const [sales, setSales] = useState(() => loadStorage(STORAGE_KEYS.SALES, INITIAL_SALES));
  const [clients, setClients] = useState(() => {
    const raw = loadStorage(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    if (!Array.isArray(raw)) return INITIAL_CLIENTS;

    const clientMap = new Map();
    raw.forEach((c) => {
      if (!c || !c.name || isGenericClientName(c.name)) return;
      const key = (c.name || '').trim().toLowerCase();

      const cleanHistory = cleanClientHistory(c.history || []);
      const computedDebt = Math.max(
        0,
        cleanHistory.reduce((sum, t) => sum + Number(t.amount || 0), 0)
      );
      const initialDebt = c.totalDebt !== undefined && Number(c.totalDebt) >= 0 ? Number(c.totalDebt) : computedDebt;

      if (!clientMap.has(key)) {
        clientMap.set(key, { ...c, totalDebt: initialDebt, history: cleanHistory });
      } else {
        const existing = clientMap.get(key);
        const mergedHistory = cleanClientHistory([...(existing.history || []), ...cleanHistory]);
        const mergedDebt = Math.max(Number(existing.totalDebt) || 0, Number(c.totalDebt) || 0);
        clientMap.set(key, {
          ...existing,
          phone: existing.phone || c.phone,
          totalDebt: mergedDebt,
          history: mergedHistory,
        });
      }
    });

    return Array.from(clientMap.values());
  });
  const [expenses, setExpenses] = useState(() => loadStorage(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES));
  const [cashSessions, setCashSessions] = useState(() => loadStorage(STORAGE_KEYS.CASH_SESSIONS, INITIAL_CASH_SESSIONS));
  const [currentSession, setCurrentSession] = useState(() => loadStorage(STORAGE_KEYS.CURRENT_CASH_SESSION, INITIAL_CURRENT_SESSION));
  const [purchaseOrders, setPurchaseOrders] = useState(() => loadStorage(STORAGE_KEYS.PURCHASE_ORDERS, INITIAL_PURCHASE_ORDERS));
  const [users, setUsers] = useState(() => loadStorage(STORAGE_KEYS.USERS, INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState(() => loadStorage(STORAGE_KEYS.CURRENT_USER, null));

  // Navigation & UI State
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const [activeReceipt, setActiveReceipt] = useState(null);

  // --- STATE MUTATION HELPERS WITH DUAL STORAGE & BROADCAST SYNC ---
  // (Prevents blind useEffects from overwriting localStorage on mount)

  const updateSettingsState = (newSettings) => {
    setSettings(newSettings);
    saveStorage(STORAGE_KEYS.SETTINGS, newSettings);
    broadcastSync(STORAGE_KEYS.SETTINGS, newSettings);
    if (supabaseService.isAvailable()) {
      supabaseService.upsertSettings(newSettings);
    }
  };

  const updateCategoriesState = (updater) => {
    setCategories((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStorage(STORAGE_KEYS.CATEGORIES, next);
      broadcastSync(STORAGE_KEYS.CATEGORIES, next);
      return next;
    });
  };

  const updateProductsState = (updater) => {
    setProducts((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStorage(STORAGE_KEYS.PRODUCTS, next);
      broadcastSync(STORAGE_KEYS.PRODUCTS, next);
      return next;
    });
  };

  const updateSalesState = (updater) => {
    setSales((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStorage(STORAGE_KEYS.SALES, next);
      broadcastSync(STORAGE_KEYS.SALES, next);
      return next;
    });
  };

  const updateRepairsState = (updater) => {
    setRepairs((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStorage(STORAGE_KEYS.REPAIRS, next);
      broadcastSync(STORAGE_KEYS.REPAIRS, next);
      return next;
    });
  };

  const updateClientsState = (updater) => {
    setClients((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStorage(STORAGE_KEYS.CLIENTS, next);
      broadcastSync(STORAGE_KEYS.CLIENTS, next);
      return next;
    });
  };

  const updateExpensesState = (updater) => {
    setExpenses((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStorage(STORAGE_KEYS.EXPENSES, next);
      broadcastSync(STORAGE_KEYS.EXPENSES, next);
      return next;
    });
  };

  const updateCashSessionsState = (updater) => {
    setCashSessions((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStorage(STORAGE_KEYS.CASH_SESSIONS, next);
      broadcastSync(STORAGE_KEYS.CASH_SESSIONS, next);
      return next;
    });
  };

  const updateCurrentSessionState = (updater) => {
    setCurrentSession((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStorage(STORAGE_KEYS.CURRENT_CASH_SESSION, next);
      broadcastSync(STORAGE_KEYS.CURRENT_CASH_SESSION, next);
      return next;
    });
  };

  const updatePurchaseOrdersState = (updater) => {
    setPurchaseOrders((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStorage(STORAGE_KEYS.PURCHASE_ORDERS, next);
      broadcastSync(STORAGE_KEYS.PURCHASE_ORDERS, next);
      return next;
    });
  };

  const updateUsersState = (updater) => {
    setUsers((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStorage(STORAGE_KEYS.USERS, next);
      broadcastSync(STORAGE_KEYS.USERS, next);
      return next;
    });
  };

  const updateCurrentUserState = (user) => {
    setCurrentUser(user);
    saveStorage(STORAGE_KEYS.CURRENT_USER, user);
    broadcastSync(STORAGE_KEYS.CURRENT_USER, user);
  };

  // --- MULTI-TAB & CROSS-WINDOW INSTANT SYNC LISTENER ---
  useEffect(() => {
    const handleSyncMessage = (key, data) => {
      if (!key || data === undefined) return;
      switch (key) {
        case STORAGE_KEYS.SETTINGS:
          setSettings(data);
          break;
        case STORAGE_KEYS.CATEGORIES:
          setCategories(data);
          break;
        case STORAGE_KEYS.PRODUCTS:
          setProducts(data);
          break;
        case STORAGE_KEYS.SALES:
          setSales(data);
          break;
        case STORAGE_KEYS.REPAIRS:
          setRepairs(data);
          break;
        case STORAGE_KEYS.CLIENTS:
          setClients(data);
          break;
        case STORAGE_KEYS.EXPENSES:
          setExpenses(data);
          break;
        case STORAGE_KEYS.CASH_SESSIONS:
          setCashSessions(data);
          break;
        case STORAGE_KEYS.CURRENT_CASH_SESSION:
          setCurrentSession(data);
          break;
        case STORAGE_KEYS.PURCHASE_ORDERS:
          setPurchaseOrders(data);
          break;
        case STORAGE_KEYS.USERS:
          setUsers(data);
          break;
        case STORAGE_KEYS.THEME:
          setTheme(data);
          break;
        case STORAGE_KEYS.LANG:
          setLang(data);
          break;
        case STORAGE_KEYS.PRIVACY_MODE:
          setPrivacyMode(Boolean(data));
          break;
        case STORAGE_KEYS.CURRENT_USER:
          setCurrentUser(data);
          break;
        default:
          break;
      }
    };

    // BroadcastChannel message listener
    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        if (event.data?.key) {
          handleSyncMessage(event.data.key, event.data.data);
        }
      };
    }

    // Storage event listener
    const handleStorageChange = (e) => {
      if (!e.key || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        handleSyncMessage(e.key, parsed);
      } catch (err) {
        console.error('Storage sync parse error:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (syncChannel) {
        syncChannel.onmessage = null;
      }
    };
  }, []);

  // Auto-persist language & sync direction (RTL for Arabic)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LANG, lang);
    } catch (e) {
      console.error(e);
    }
    const isArabic = lang === 'ar';
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    if (isArabic) {
      document.body.classList.add('rtl-mode');
    } else {
      document.body.classList.remove('rtl-mode');
    }
  }, [lang]);

  // Auto-persist & apply Theme
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.error(e);
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Auto-persist & apply Privacy Mode
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRIVACY_MODE, String(privacyMode));
    } catch (e) {
      console.error(e);
    }
    if (privacyMode) {
      document.documentElement.classList.add('privacy-mode');
      document.body.classList.add('privacy-mode');
    } else {
      document.documentElement.classList.remove('privacy-mode');
      document.body.classList.remove('privacy-mode');
    }
  }, [privacyMode]);

  // Translation helper
  const t = (key, fallback = '') => {
    const currentDict = TRANSLATIONS[lang] || TRANSLATIONS.fr;
    if (currentDict && currentDict[key] !== undefined) {
      return currentDict[key];
    }
    const fallbackDict = TRANSLATIONS.fr;
    if (fallbackDict && fallbackDict[key] !== undefined) {
      return fallbackDict[key];
    }
    return fallback || key;
  };

  const isRTL = lang === 'ar';

  // --- SUPABASE POSTGRESQL SYNC & STATE ---
  const [supabaseStatus, setSupabaseStatus] = useState(
    isSupabaseConfigured ? 'connecting' : 'unconfigured'
  );
  const [supabaseLastSync, setSupabaseLastSync] = useState(null);

  // Charger automatiquement les données depuis PostgreSQL Supabase au démarrage si configuré
  useEffect(() => {
    if (!supabaseService.isAvailable()) {
      setSupabaseStatus('unconfigured');
      return;
    }

    let isMounted = true;
    setSupabaseStatus('connecting');

    supabaseService
      .fetchAll()
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          if (data.settings) updateSettingsState(data.settings);
          if (data.categories?.length) updateCategoriesState(data.categories);
          if (data.products?.length) updateProductsState(data.products);
          if (data.clients?.length) updateClientsState(data.clients);
          if (data.repairs?.length) updateRepairsState(data.repairs);
          if (data.sales?.length) updateSalesState(data.sales);
          if (data.expenses?.length) updateExpensesState(data.expenses);
          if (data.cashSessions?.length) updateCashSessionsState(data.cashSessions);
          if (data.purchaseOrders?.length) updatePurchaseOrdersState(data.purchaseOrders);
          if (data.users?.length) updateUsersState(data.users);
          setSupabaseStatus('connected');
          setSupabaseLastSync(new Date());
        } else {
          setSupabaseStatus('error');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Supabase initial fetch error:', err);
        setSupabaseStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshFromSupabase = async () => {
    if (!supabaseService.isAvailable()) return false;
    try {
      setSupabaseStatus('connecting');
      const data = await supabaseService.fetchAll();
      if (data) {
        if (data.settings) updateSettingsState(data.settings);
        if (data.categories?.length) updateCategoriesState(data.categories);
        if (data.products?.length) updateProductsState(data.products);
        if (data.clients?.length) updateClientsState(data.clients);
        if (data.repairs?.length) updateRepairsState(data.repairs);
        if (data.sales?.length) updateSalesState(data.sales);
        if (data.expenses?.length) updateExpensesState(data.expenses);
        if (data.cashSessions?.length) updateCashSessionsState(data.cashSessions);
        if (data.purchaseOrders?.length) updatePurchaseOrdersState(data.purchaseOrders);
        setSupabaseStatus('connected');
        setSupabaseLastSync(new Date());
        return true;
      }
      setSupabaseStatus('error');
      return false;
    } catch (err) {
      console.error(err);
      setSupabaseStatus('error');
      return false;
    }
  };

  const migrateToSupabase = async () => {
    const result = await supabaseService.migrateLocalDataToSupabase({
      settings,
      categories,
      products,
      clients,
      repairs,
      sales,
      expenses,
      cashSessions,
      purchaseOrders,
      users,
    });
    setSupabaseStatus('connected');
    setSupabaseLastSync(new Date());
    return result;
  };

  // --- AUTHENTIFICATION & ROLES (ADMIN / USER) ---
  const login = (userIdOrUsername, pin) => {
    const trimmedPin = String(pin || '').trim();
    const user = users.find(
      (u) =>
        (u.id === userIdOrUsername || u.username?.toLowerCase() === String(userIdOrUsername).trim().toLowerCase()) &&
        String(u.pinCode).trim() === trimmedPin
    );
    if (user) {
      updateCurrentUserState(user);
      return { success: true, user };
    }
    return { success: false, error: 'Code PIN incorrect' };
  };

  const logout = () => {
    updateCurrentUserState(null);
  };

  const switchUser = (userId, pin) => {
    return login(userId, pin);
  };

  const addUser = (userData) => {
    const newUser = {
      id: userData.id || `user-${Date.now()}`,
      username: (userData.username || '').trim().toLowerCase() || `user_${Date.now().toString().slice(-4)}`,
      name: (userData.name || '').trim() || 'Vendeur',
      role: userData.role === 'admin' ? 'admin' : 'user',
      pinCode: String(userData.pinCode || '0000').trim(),
      avatar: userData.avatar || (userData.role === 'admin' ? 'ShieldCheck' : 'User'),
      createdAt: new Date().toISOString(),
    };
    updateUsersState((prev) => [...prev, newUser]);
    if (supabaseService.isAvailable()) {
      supabaseService.upsertUser(newUser);
    }
    return newUser;
  };

  const updateUser = (id, updatedData) => {
    updateUsersState((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const merged = { ...u, ...updatedData };
          if (supabaseService.isAvailable()) {
            supabaseService.upsertUser(merged);
          }
          if (currentUser?.id === id) {
            updateCurrentUserState(merged);
          }
          return merged;
        }
        return u;
      })
    );
  };

  const deleteUser = (id) => {
    if (users.length <= 1) {
      throw new Error('Impossible de supprimer le seul utilisateur restant.');
    }
    updateUsersState((prev) => prev.filter((u) => u.id !== id));
    if (currentUser?.id === id) {
      updateCurrentUserState(null);
    }
    if (supabaseService.isAvailable()) {
      supabaseService.deleteUser(id);
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isLoggedIn = !!currentUser;

  const testSupabaseConnection = async () => {
    return await supabaseService.testConnection();
  };

  // Format currency helper
  const formatMoney = (amount) => {
    const num = Number(amount) || 0;
    return `${num.toFixed(2)} ${settings.currency || 'DT'}`;
  };

  // --- CATEGORIES CRUD ACTIONS ---
  const addCategory = (categoryData) => {
    const slug = (categoryData.label || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const maxOrder = categories.reduce((max, c) => Math.max(max, Number(c.order) || 0), 0);
    const assignedOrder = categoryData.order !== undefined && categoryData.order !== '' && !isNaN(Number(categoryData.order))
      ? Number(categoryData.order)
      : maxOrder + 1;

    const newCategory = {
      ...categoryData,
      id: categoryData.id || `cat_${slug || Date.now()}`,
      label: (categoryData.label || '').trim(),
      icon: categoryData.icon || 'Package',
      color: categoryData.color || '#6366f1',
      description: categoryData.description || '',
      order: assignedOrder,
      subCategories: Array.isArray(categoryData.subCategories) ? categoryData.subCategories : [],
    };

    updateCategoriesState((prev) =>
      [...prev, newCategory].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    );
    if (supabaseService.isAvailable()) {
      supabaseService.upsertCategory(newCategory);
    }
    return newCategory;
  };

  const updateCategory = (id, updatedData) => {
    updateCategoriesState((prev) => {
      const updatedList = prev
        .map((c) => {
          if (c.id === id) {
            const merged = {
              ...c,
              ...updatedData,
              order: updatedData.order !== undefined && updatedData.order !== '' && !isNaN(Number(updatedData.order))
                ? Number(updatedData.order)
                : (c.order || 1),
            };
            if (supabaseService.isAvailable()) {
              supabaseService.upsertCategory(merged);
            }
            return merged;
          }
          return c;
        })
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      return updatedList;
    });
  };

  const moveCategory = (id, direction) => {
    updateCategoriesState((prev) => {
      const sorted = [...prev].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      const index = sorted.findIndex((c) => c.id === id);
      if (index === -1) return prev;
      if (direction === 'up' && index > 0) {
        const temp = sorted[index];
        sorted[index] = sorted[index - 1];
        sorted[index - 1] = temp;
      } else if (direction === 'down' && index < sorted.length - 1) {
        const temp = sorted[index];
        sorted[index] = sorted[index + 1];
        sorted[index + 1] = temp;
      }
      const updated = sorted.map((c, i) => ({ ...c, order: i + 1 }));
      if (supabaseService.isAvailable()) {
        updated.forEach((c) => supabaseService.upsertCategory(c));
      }
      return updated;
    });
  };

  const reorderCategory = (id, targetOrder) => {
    const num = Math.max(1, Number(targetOrder) || 1);
    updateCategory(id, { order: num });
  };

  const deleteCategory = (id) => {
    updateCategoriesState((prev) => prev.filter((c) => c.id !== id));
    if (supabaseService.isAvailable()) {
      supabaseService.deleteCategory(id);
    }
    return true;
  };

  const addSubCategory = (categoryId, subCategoryName) => {
    const trimmed = (subCategoryName || '').trim();
    if (!trimmed) return;
    updateCategoriesState((prev) =>
      prev.map((c) => {
        if (c.id === categoryId) {
          const current = Array.isArray(c.subCategories) ? c.subCategories : [];
          if (current.includes(trimmed)) return c;
          const updated = { ...c, subCategories: [...current, trimmed] };
          if (supabaseService.isAvailable()) {
            supabaseService.upsertCategory(updated);
          }
          return updated;
        }
        return c;
      })
    );
  };

  const renameSubCategory = (categoryId, oldSubCategoryName, newSubCategoryName) => {
    const trimmedNew = (newSubCategoryName || '').trim();
    const trimmedOld = (oldSubCategoryName || '').trim();
    if (!trimmedNew || !trimmedOld || trimmedNew === trimmedOld) return;

    updateCategoriesState((prev) =>
      prev.map((c) => {
        if (c.id === categoryId) {
          const subs = Array.isArray(c.subCategories) ? c.subCategories : [];
          const updated = {
            ...c,
            subCategories: subs.map((s) => (s.toLowerCase() === trimmedOld.toLowerCase() ? trimmedNew : s)),
          };
          if (supabaseService.isAvailable()) {
            supabaseService.upsertCategory(updated);
          }
          return updated;
        }
        return c;
      })
    );

    updateProductsState((prev) =>
      prev.map((p) => {
        if (p.category === categoryId && (p.subCategory || '').trim().toLowerCase() === trimmedOld.toLowerCase()) {
          const updatedP = { ...p, subCategory: trimmedNew };
          if (supabaseService.isAvailable()) {
            supabaseService.upsertProduct(updatedP);
          }
          return updatedP;
        }
        return p;
      })
    );
  };

  const removeSubCategory = (categoryId, subCategoryName) => {
    updateCategoriesState((prev) =>
      prev.map((c) => {
        if (c.id === categoryId) {
          const updated = {
            ...c,
            subCategories: (c.subCategories || []).filter((s) => s !== subCategoryName),
          };
          if (supabaseService.isAvailable()) {
            supabaseService.upsertCategory(updated);
          }
          return updated;
        }
        return c;
      })
    );
  };

  // --- PRODUCT ACTIONS ---
  const addProduct = (prodData) => {
    const newProduct = {
      ...prodData,
      id: prodData.id || `prod-${Date.now()}`,
      purchasePrice: Number(prodData.purchasePrice) || 0,
      sellingPrice: Number(prodData.sellingPrice) || 0,
      stock: Number(prodData.stock) || 0,
      minStockAlert: prodData.minStockAlert !== undefined && prodData.minStockAlert !== ''
        ? Number(prodData.minStockAlert)
        : 3,
      image: prodData.image || '',
    };
    updateProductsState((prev) => [newProduct, ...prev]);
    if (supabaseService.isAvailable()) {
      supabaseService.upsertProduct(newProduct);
    }
    return newProduct;
  };

  const updateProduct = (id, updatedData) => {
    updateProductsState((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedProduct = {
            ...item,
            ...updatedData,
            purchasePrice: Number(updatedData.purchasePrice !== undefined ? updatedData.purchasePrice : item.purchasePrice),
            sellingPrice: Number(updatedData.sellingPrice !== undefined ? updatedData.sellingPrice : item.sellingPrice),
            stock: Number(updatedData.stock !== undefined ? updatedData.stock : item.stock),
            minStockAlert: updatedData.minStockAlert !== undefined && updatedData.minStockAlert !== ''
              ? Number(updatedData.minStockAlert)
              : (item.minStockAlert !== undefined && item.minStockAlert !== '' ? Number(item.minStockAlert) : 3),
            image: updatedData.image !== undefined ? updatedData.image : item.image,
          };
          if (supabaseService.isAvailable()) {
            supabaseService.upsertProduct(updatedProduct);
          }
          return updatedProduct;
        }
        return item;
      })
    );
  };

  const deleteProduct = (id) => {
    updateProductsState((prev) => prev.filter((item) => item.id !== id));
    if (supabaseService.isAvailable()) {
      supabaseService.deleteProduct(id);
    }
  };

  const adjustStock = (productId, delta) => {
    updateProductsState((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newQty = Math.max(0, (Number(p.stock) || 0) + delta);
          const updatedP = { ...p, stock: newQty };
          if (supabaseService.isAvailable()) {
            supabaseService.upsertProduct(updatedP);
          }
          return updatedP;
        }
        return p;
      })
    );
  };

  // --- REPAIR ACTIONS ---
  const addRepair = (repairData) => {
    const currentRepairs = loadStorage(STORAGE_KEYS.REPAIRS, repairs);
    const count = currentRepairs.length + 1;
    const ticketNumber = `REP-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
    const totalPrice = Number(repairData.totalPrice) || 0;
    const advancePaid = Number(repairData.advancePaid) || 0;
    const remainingDue = Math.max(0, totalPrice - advancePaid);

    const newRepair = {
      ...repairData,
      id: repairData.id || `rep-${Date.now()}`,
      ticketNumber,
      pieceCost: Number(repairData.pieceCost) || 0,
      laborCost: Number(repairData.laborCost) || 0,
      totalPrice,
      initialAdvance: advancePaid,
      advancePaid,
      remainingPaid: 0,
      remainingDue,
      status: repairData.status || 'received',
      priority: repairData.priority || 'normal',
      createdAt: repairData.createdAt || new Date().toISOString(),
    };

    updateRepairsState((prev) => [newRepair, ...prev]);
    if (supabaseService.isAvailable()) {
      supabaseService.upsertRepair(newRepair);
    }

    if (repairData.pieceUsedId && repairData.deductStock) {
      adjustStock(repairData.pieceUsedId, -1);
    }

    if (remainingDue > 0 && repairData.clientName) {
      syncClientDebt(
        repairData.clientName,
        repairData.clientPhone,
        remainingDue,
        `Réparation ${repairData.deviceModel} (Total ${totalPrice} DT, Acompte ${advancePaid} DT, Reste ${remainingDue} DT)`,
        'repair_credit',
        newRepair.id
      );
    }

    return newRepair;
  };

  const updateRepair = (id, updatedData) => {
    let debtSync = null;

    updateRepairsState((prev) =>
      prev.map((rep) => {
        if (rep.id === id) {
          const oldTotalPrice = Number(rep.totalPrice) || 0;
          const oldAdvance = Number(rep.advancePaid) || 0;
          const oldRemaining = Number(rep.remainingDue) || 0;

          const totalPrice = Number(updatedData.totalPrice !== undefined ? updatedData.totalPrice : rep.totalPrice) || 0;
          const advancePaid = Number(updatedData.advancePaid !== undefined ? updatedData.advancePaid : rep.advancePaid) || 0;
          const remainingDue = updatedData.remainingDue !== undefined
            ? Math.max(0, Number(updatedData.remainingDue))
            : Math.max(0, totalPrice - advancePaid);

          const clientName = updatedData.clientName || rep.clientName;
          const clientPhone = updatedData.clientPhone || rep.clientPhone;

          const remainingDiff = remainingDue - oldRemaining;
          if (remainingDiff !== 0 && clientName && rep.status !== 'delivered') {
            debtSync = {
              clientName,
              clientPhone,
              amount: remainingDiff,
              note: `Ajustement solde réparation ${rep.ticketNumber} (${rep.deviceModel || updatedData.deviceModel || ''})`,
              type: remainingDiff > 0 ? 'repair_credit' : 'repair_payment',
              referenceId: rep.id,
            };
          }

          const isDelivered = (updatedData.status || rep.status) === 'delivered';
          const nowIso = new Date().toISOString();
          const initialAdvance = updatedData.initialAdvance !== undefined
            ? Number(updatedData.initialAdvance)
            : (rep.initialAdvance !== undefined ? Number(rep.initialAdvance) : advancePaid);

          const effectiveCreatedAt = updatedData.createdAt || rep.createdAt || rep.date || nowIso;
          const effectiveDeliveredAt = isDelivered
            ? (updatedData.deliveredAt || rep.deliveredAt || effectiveCreatedAt)
            : null;

          const updated = {
            ...rep,
            ...updatedData,
            createdAt: effectiveCreatedAt,
            totalPrice,
            initialAdvance,
            advancePaid,
            remainingDue,
            deliveredAt: effectiveDeliveredAt,
            paidAt: isDelivered && remainingDue === 0 ? (updatedData.paidAt || rep.paidAt || effectiveDeliveredAt) : rep.paidAt,
          };

          if (supabaseService.isAvailable()) {
            supabaseService.upsertRepair(updated);
          }

          return updated;
        }
        return rep;
      })
    );

    if (debtSync) {
      syncClientDebt(
        debtSync.clientName,
        debtSync.clientPhone,
        debtSync.amount,
        debtSync.note,
        debtSync.type,
        debtSync.referenceId
      );
    }
  };

  const updateRepairStatus = (id, newStatus) => {
    let debtSync = null;

    updateRepairsState((prev) =>
      prev.map((rep) => {
        if (rep.id === id) {
          const isDelivered = newStatus === 'delivered';
          const nowIso = new Date().toISOString();
          
          const initialAdvance = rep.initialAdvance !== undefined
            ? Number(rep.initialAdvance)
            : (Number(rep.advancePaid) || 0);
          let updatedAdvance = Number(rep.advancePaid) || 0;
          let updatedRemaining = Number(rep.remainingDue) || 0;
          let remainingPaid = Number(rep.remainingPaid) || 0;

          if (isDelivered && rep.status !== 'delivered') {
            if (updatedRemaining > 0) {
              if (rep.clientName) {
                debtSync = {
                  clientName: rep.clientName,
                  clientPhone: rep.clientPhone,
                  amount: -updatedRemaining,
                  note: `Règlement solde réparation ${rep.ticketNumber} (${rep.deviceModel})`,
                  type: 'repair_payment',
                  referenceId: rep.id,
                };
              }
              remainingPaid = updatedRemaining;
              updatedAdvance = Number(rep.totalPrice) || (initialAdvance + updatedRemaining);
              updatedRemaining = 0;
            } else if (remainingPaid === 0) {
              remainingPaid = Math.max(0, (Number(rep.totalPrice) || 0) - initialAdvance);
            }
          }

          const updated = {
            ...rep,
            status: newStatus,
            deliveredAt: isDelivered ? (rep.deliveredAt || nowIso) : rep.deliveredAt,
            paidAt: isDelivered ? nowIso : rep.paidAt,
            initialAdvance,
            remainingPaid,
            advancePaid: updatedAdvance,
            remainingDue: updatedRemaining,
          };

          if (supabaseService.isAvailable()) {
            supabaseService.upsertRepair(updated);
          }

          return updated;
        }
        return rep;
      })
    );

    if (debtSync) {
      syncClientDebt(
        debtSync.clientName,
        debtSync.clientPhone,
        debtSync.amount,
        debtSync.note,
        debtSync.type,
        debtSync.referenceId
      );
    }
  };

  const deleteRepair = (id) => {
    updateRepairsState((prev) => prev.filter((item) => item.id !== id));
    if (supabaseService.isAvailable()) {
      supabaseService.deleteRepair(id);
    }
  };

  // --- REPAIR ARCHIVING ACTIONS (100% Livré & 100% Payé STRICTEMENT) ---
  const archiveRepair = (repairId) => {
    const repair = repairs.find((r) => r.id === repairId);
    if (!repair) return { success: false, error: 'Réparation introuvable' };

    // STRICT VALIDATION: Must be delivered (100%) AND remaining debt must be 0 (100% payé)
    if (repair.status !== 'delivered') {
      return {
        success: false,
        error: lang === 'ar'
          ? 'لا يمكن أرشفة الجهاز إلا بعد تسليمه للزبون بنسبة 100% (Clôturé)'
          : 'Seules les réparations clôturées et livrées au client (100%) peuvent être archivées !',
      };
    }
    const remainingDue = Number(repair.remainingDue) || 0;
    if (remainingDue > 0) {
      return {
        success: false,
        error: lang === 'ar'
          ? `لا يمكن أرشفة هذه الفيشة لأن عليها دين متبقي قدره ${formatMoney(remainingDue)} (لا يتم لمس الديون النشطة)`
          : `Impossible d'archiver : il reste un solde impayé de ${formatMoney(remainingDue)} (les crédits actifs ne sont pas archivables) !`,
      };
    }

    const nowIso = new Date().toISOString();
    updateRepairsState((prev) =>
      prev.map((r) => {
        if (r.id === repairId) {
          const updated = { ...r, archived: true, archivedAt: nowIso };
          if (supabaseService.isAvailable()) {
            supabaseService.upsertRepair(updated);
          }
          return updated;
        }
        return r;
      })
    );
    return { success: true };
  };

  const unarchiveRepair = (repairId) => {
    updateRepairsState((prev) =>
      prev.map((r) => {
        if (r.id === repairId) {
          const updated = { ...r, archived: false, archivedAt: null };
          if (supabaseService.isAvailable()) {
            supabaseService.upsertRepair(updated);
          }
          return updated;
        }
        return r;
      })
    );
  };

  const archiveAllDeliveredRepairs = () => {
    const nowIso = new Date().toISOString();
    let count = 0;
    updateRepairsState((prev) =>
      prev.map((r) => {
        if (!r.archived && r.status === 'delivered' && (Number(r.remainingDue) || 0) <= 0) {
          count++;
          const updated = { ...r, archived: true, archivedAt: nowIso };
          if (supabaseService.isAvailable()) {
            supabaseService.upsertRepair(updated);
          }
          return updated;
        }
        return r;
      })
    );
    return count;
  };

  // --- CLIENT & CREDIT ACTIONS ---
  const addClient = (clientData) => {
    const cleanName = (clientData.name || '').trim();
    if (!cleanName || isGenericClientName(cleanName)) return null;
    const cleanPhone = (clientData.phone || '').trim();

    let existingId = null;
    let savedClient = null;

    updateClientsState((prev) => {
      const existingIdx = prev.findIndex(
        (c) => c.name.toLowerCase().trim() === cleanName.toLowerCase() || (cleanPhone && c.phone && c.phone.trim() === cleanPhone)
      );

      if (existingIdx !== -1) {
        existingId = prev[existingIdx].id;
        const existing = prev[existingIdx];
        const updated = {
          ...existing,
          ...clientData,
          name: cleanName,
          phone: cleanPhone || existing.phone,
          totalDebt: clientData.totalDebt !== undefined ? Number(clientData.totalDebt) : existing.totalDebt,
        };
        savedClient = updated;
        const newList = [...prev];
        newList[existingIdx] = updated;
        return newList;
      }

      const newClient = {
        id: clientData.id || `cli-${Date.now()}`,
        name: cleanName,
        phone: cleanPhone,
        email: (clientData.email || '').trim(),
        address: (clientData.address || '').trim(),
        notes: (clientData.notes || '').trim(),
        customDiscountPercent: Number(clientData.customDiscountPercent) || 0,
        totalDebt: Number(clientData.totalDebt) || 0,
        loyaltyPoints: Number(clientData.loyaltyPoints) || 0,
        isLoyaltyClient: clientData.isLoyaltyClient !== undefined ? Boolean(clientData.isLoyaltyClient) : false,
        createdAt: clientData.createdAt || new Date().toISOString(),
        history: clientData.history || (Number(clientData.totalDebt) > 0 ? [{
          id: `trx-${Date.now()}`,
          date: new Date().toISOString(),
          type: 'initial_credit',
          amount: Number(clientData.totalDebt),
          note: 'Solde débiteur initial',
        }] : []),
      };
      existingId = newClient.id;
      savedClient = newClient;
      return [newClient, ...prev];
    });

    if (savedClient && supabaseService.isAvailable()) {
      supabaseService.upsertClient(savedClient);
    }

    return { id: existingId, name: cleanName, phone: cleanPhone };
  };

  const toggleLoyaltyClient = (clientId) => {
    updateClientsState((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const updated = { ...c, isLoyaltyClient: !c.isLoyaltyClient };
          if (supabaseService.isAvailable()) {
            supabaseService.upsertClient(updated);
          }
          return updated;
        }
        return c;
      })
    );
  };

  const syncClientDebt = (clientName, clientPhone, amountToAdd, note, type = 'sale_credit', referenceId = null, explicitClientId = null, trxDate = null) => {
    if (!amountToAdd || Number(amountToAdd) === 0) return;
    const cleanName = (clientName || '').trim();
    const cleanPhone = (clientPhone || '').trim();

    updateClientsState((prev) => {
      let targetClient = null;
      if (explicitClientId) {
        targetClient = prev.find((c) => c.id === explicitClientId);
      } else if (cleanName && !isGenericClientName(cleanName)) {
        targetClient = prev.find(
          (c) => (c.name && c.name.toLowerCase().trim() === cleanName.toLowerCase()) || (cleanPhone && c.phone && c.phone.trim() === cleanPhone)
        );
      }

      const newTrx = {
        id: `trx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: trxDate || new Date().toISOString(),
        type,
        amount: Number(amountToAdd) || 0,
        note: note || (amountToAdd > 0 ? 'Dette ajoutée' : 'Paiement reçu'),
        referenceId,
      };

      if (!targetClient) {
        if (!cleanName || isGenericClientName(cleanName)) return prev;
        const initialDebt = Math.max(0, Number(amountToAdd) || 0);
        const newClient = {
          id: `cli-${Date.now()}`,
          name: cleanName,
          phone: cleanPhone,
          email: '',
          address: '',
          notes: '',
          customDiscountPercent: 0,
          totalDebt: initialDebt,
          loyaltyPoints: 0,
          isLoyaltyClient: false,
          createdAt: new Date().toISOString(),
          history: [newTrx],
        };
        if (supabaseService.isAvailable()) {
          supabaseService.upsertClient(newClient);
        }
        return [newClient, ...prev];
      }

      return prev.map((c) => {
        if (c.id === targetClient.id) {
          const rawHistory = Array.isArray(c.history) ? c.history : [];
          
          const existingIdx = rawHistory.findIndex((t) =>
            (referenceId && (t.referenceId === referenceId || t.ticketId === referenceId || t.invoiceId === referenceId) && t.type === type) ||
            (t.note && note && t.note.trim().toLowerCase() === note.trim().toLowerCase() && t.type === type)
          );

          let updatedHistory = [...rawHistory];
          if (existingIdx !== -1) {
            const oldAmt = Number(updatedHistory[existingIdx].amount) || 0;
            if (oldAmt === Number(amountToAdd)) {
              return c;
            }
            updatedHistory[existingIdx] = {
              ...updatedHistory[existingIdx],
              ...newTrx,
              id: updatedHistory[existingIdx].id || newTrx.id,
            };
          } else {
            updatedHistory = [newTrx, ...updatedHistory];
          }

          const cleaned = cleanClientHistory(updatedHistory);
          const computedDebt = Math.max(
            0,
            cleaned.reduce((sum, t) => sum + Number(t.amount || 0), 0)
          );

          const updatedClient = {
            ...c,
            totalDebt: computedDebt,
            phone: cleanPhone || c.phone,
            history: cleaned,
          };

          if (supabaseService.isAvailable()) {
            supabaseService.upsertClient(updatedClient);
          }

          return updatedClient;
        }
        return c;
      });
    });
  };

  const recordClientPayment = (clientId, paymentAmount, paymentNote = 'Règlement espèces', paymentDate = null) => {
    const amount = Number(paymentAmount) || 0;
    if (amount <= 0) return;

    let trxDate = new Date().toISOString();
    if (paymentDate) {
      try {
        trxDate = new Date(paymentDate).toISOString();
      } catch {
        trxDate = new Date().toISOString();
      }
    }

    updateClientsState((prev) =>
      prev.map((client) => {
        if (client.id === clientId) {
          const newDebt = Math.max(0, (Number(client.totalDebt) || 0) - amount);
          const newTrx = {
            id: `trx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            date: trxDate,
            type: 'payment',
            amount: -amount,
            note: paymentNote || `Règlement partiel (${formatMoney(amount)})`,
          };
          const updatedHistory = [newTrx, ...(client.history || [])];
          updatedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
          const updatedClient = {
            ...client,
            totalDebt: newDebt,
            history: updatedHistory,
          };
          if (supabaseService.isAvailable()) {
            supabaseService.upsertClient(updatedClient);
          }
          return updatedClient;
        }
        return client;
      })
    );
  };

  const updateClient = (clientId, updatedData) => {
    updateClientsState((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const newDebt = updatedData.totalDebt !== undefined ? Math.max(0, Number(updatedData.totalDebt) || 0) : Number(c.totalDebt) || 0;
          const currentDebt = Number(c.totalDebt) || 0;
          const debtDiff = newDebt - currentDebt;

          let history = c.history || [];
          if (debtDiff !== 0) {
            const adjTrx = {
              id: `trx-${Date.now()}`,
              date: new Date().toISOString(),
              type: debtDiff > 0 ? 'manual_credit' : 'adjustment',
              amount: debtDiff,
              note: updatedData.adjustmentNote || (debtDiff > 0 ? `Ajustement solde (+${formatMoney(debtDiff)})` : `Ajustement solde (${formatMoney(debtDiff)})`),
            };
            history = [adjTrx, ...history];
          }

          const updatedClient = {
            ...c,
            ...updatedData,
            name: updatedData.name ? updatedData.name.trim() : c.name,
            phone: updatedData.phone !== undefined ? updatedData.phone.trim() : c.phone,
            email: updatedData.email !== undefined ? updatedData.email.trim() : (c.email || ''),
            address: updatedData.address !== undefined ? updatedData.address.trim() : (c.address || ''),
            notes: updatedData.notes !== undefined ? updatedData.notes.trim() : (c.notes || ''),
            customDiscountPercent: updatedData.customDiscountPercent !== undefined ? Number(updatedData.customDiscountPercent) || 0 : (c.customDiscountPercent || 0),
            loyaltyPoints: updatedData.loyaltyPoints !== undefined ? Number(updatedData.loyaltyPoints) || 0 : (c.loyaltyPoints || 0),
            totalDebt: newDebt,
            history,
          };

          if (supabaseService.isAvailable()) {
            supabaseService.upsertClient(updatedClient);
          }

          return updatedClient;
        }
        return c;
      })
    );
  };

  const deleteClient = (clientId) => {
    updateClientsState((prev) => prev.filter((c) => c.id !== clientId));
    if (supabaseService.isAvailable()) {
      supabaseService.deleteClient(clientId);
    }
  };

  const updateClientTransaction = (clientId, trxId, updatedTrx) => {
    updateClientsState((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const updatedHistory = (c.history || []).map((t) =>
            t.id === trxId
              ? {
                  ...t,
                  ...updatedTrx,
                  amount: Number(updatedTrx.amount !== undefined ? updatedTrx.amount : t.amount),
                }
              : t
          );
          const recalculatedDebt = Math.max(
            0,
            updatedHistory.reduce((sum, t) => sum + Number(t.amount || 0), 0)
          );

          const updatedClient = {
            ...c,
            totalDebt: recalculatedDebt,
            history: updatedHistory,
          };

          if (supabaseService.isAvailable()) {
            supabaseService.upsertClient(updatedClient);
          }

          return updatedClient;
        }
        return c;
      })
    );
  };

  const deleteClientTransaction = (clientId, trxId) => {
    updateClientsState((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const updatedHistory = (c.history || []).filter((t) => t.id !== trxId);
          const recalculatedDebt = Math.max(
            0,
            updatedHistory.reduce((sum, t) => sum + Number(t.amount || 0), 0)
          );
          const updatedClient = {
            ...c,
            totalDebt: recalculatedDebt,
            history: updatedHistory,
          };

          if (supabaseService.isAvailable()) {
            supabaseService.upsertClient(updatedClient);
          }

          return updatedClient;
        }
        return c;
      })
    );
  };

  // --- CREDIT TRANSACTION ARCHIVING ACTIONS (Crédits collectés / paid UNIQUEMENT) ---
  const archiveCreditTransaction = (clientId, trxId) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return { success: false, error: 'Client introuvable' };
    const trx = (client.history || []).find((t) => t.id === trxId);
    if (!trx) return { success: false, error: 'Transaction introuvable' };

    // STRICT CHECK: Only collected / settlement payments can be archived! Active debts are preserved.
    const isPayment = Number(trx.amount) < 0 || trx.type === 'payment' || trx.type === 'repair_payment' || trx.type === 'settlement';
    if (!isPayment) {
      return {
        success: false,
        error: lang === 'ar'
          ? 'لا يمكن أرشفة الديون النشطة، فقط عمليات السداد المستلمة تقبل الأرشفة'
          : 'Seuls les règlements encaissés peuvent être archivés. Les dettes actives restent visibles.',
      };
    }

    const nowIso = new Date().toISOString();
    updateClientsState((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const updatedHistory = (c.history || []).map((t) =>
            t.id === trxId ? { ...t, archived: true, archivedAt: nowIso } : t
          );
          const updated = { ...c, history: updatedHistory };
          if (supabaseService.isAvailable()) {
            supabaseService.upsertClient(updated);
          }
          return updated;
        }
        return c;
      })
    );
    return { success: true };
  };

  const unarchiveCreditTransaction = (clientId, trxId) => {
    updateClientsState((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const updatedHistory = (c.history || []).map((t) =>
            t.id === trxId ? { ...t, archived: false, archivedAt: null } : t
          );
          const updated = { ...c, history: updatedHistory };
          if (supabaseService.isAvailable()) {
            supabaseService.upsertClient(updated);
          }
          return updated;
        }
        return c;
      })
    );
  };

  const archiveAllSettledCredits = () => {
    const nowIso = new Date().toISOString();
    let count = 0;
    updateClientsState((prev) =>
      prev.map((c) => {
        let modified = false;
        const updatedHistory = (c.history || []).map((t) => {
          const isPayment = Number(t.amount) < 0 || t.type === 'payment' || t.type === 'repair_payment' || t.type === 'settlement';
          if (!t.archived && isPayment) {
            count++;
            modified = true;
            return { ...t, archived: true, archivedAt: nowIso };
          }
          return t;
        });
        if (modified) {
          const updated = { ...c, history: updatedHistory };
          if (supabaseService.isAvailable()) {
            supabaseService.upsertClient(updated);
          }
          return updated;
        }
        return c;
      })
    );
    return count;
  };

  // Helper: compute 360° metrics, loyalty tier and history for a client
  const getClientStats = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return null;

    const clientSales = (sales || []).filter((s) => s.clientId && s.clientId === clientId);
    const clientRepairs = (repairs || []).filter((r) => r.clientId && r.clientId === clientId);

    const totalSalesSpent = clientSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
    const totalRepairsSpent = clientRepairs.reduce((acc, r) => acc + (Number(r.totalPrice) || 0), 0);
    const totalLifetimeSpent = totalSalesSpent + totalRepairsSpent;

    const points = client.loyaltyPoints !== undefined ? client.loyaltyPoints : Math.floor(totalLifetimeSpent);

    let loyaltyTier = 'bronze';
    let suggestedDiscount = 0;
    let nextTierName = 'Silver';
    let nextTierThreshold = 200;
    let tierColor = '#cd7f32';

    if (totalLifetimeSpent >= 1000) {
      loyaltyTier = 'platinum';
      suggestedDiscount = 10;
      nextTierName = null;
      nextTierThreshold = 1000;
      tierColor = '#e5e7eb';
    } else if (totalLifetimeSpent >= 500) {
      loyaltyTier = 'gold';
      suggestedDiscount = 5;
      nextTierName = 'VIP Platine';
      nextTierThreshold = 1000;
      tierColor = '#f59e0b';
    } else if (totalLifetimeSpent >= 200) {
      loyaltyTier = 'silver';
      suggestedDiscount = 3;
      nextTierName = 'Gold';
      nextTierThreshold = 500;
      tierColor = '#94a3b8';
    }

    const effectiveDiscountPercent = Math.max(suggestedDiscount, Number(client.customDiscountPercent) || 0);
    const progressToNext = nextTierThreshold > 0
      ? Math.min(100, Math.round((totalLifetimeSpent / nextTierThreshold) * 100))
      : 100;
    const remainingToNext = nextTierThreshold ? Math.max(0, nextTierThreshold - totalLifetimeSpent) : 0;

    const allDates = [
      ...clientSales.map((s) => new Date(s.date).getTime()),
      ...clientRepairs.map((r) => new Date(r.deliveredAt || r.createdAt).getTime()),
    ].filter(Boolean);
    const lastVisit = allDates.length > 0 ? new Date(Math.max(...allDates)).toISOString() : client.createdAt || null;

    return {
      client,
      clientSales,
      clientRepairs,
      totalSalesSpent,
      totalRepairsSpent,
      totalLifetimeSpent,
      points,
      loyaltyTier,
      tierColor,
      suggestedDiscount,
      effectiveDiscountPercent,
      nextTierName,
      nextTierThreshold,
      progressToNext,
      remainingToNext,
      lastVisit,
    };
  };

  // --- SALES & POS ACTIONS ---
  const processSale = (saleData) => {
    // Read currently saved sales array to ensure perfect sequence
    const currentSales = loadStorage(STORAGE_KEYS.SALES, sales);
    const count = (Array.isArray(currentSales) ? currentSales.length : sales.length) + 1;
    const invoiceNumber = `VTE-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
    
    // Calculate totals and cost
    let totalCost = 0;
    const items = (saleData.items || []).map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const cost = prod ? Number(prod.purchasePrice) || 0 : (Number(item.costPrice) || 0);
      const subCost = cost * item.quantity;
      totalCost += subCost;

      // Deduct stock for each item sold
      adjustStock(item.productId, -item.quantity);

      return {
        ...item,
        costPrice: cost,
        total: item.quantity * item.unitPrice,
      };
    });

    const totalAmount = Number(saleData.totalAmount) || 0;
    const amountPaid = Number(saleData.amountPaid) || 0;
    const remainingCredit = Math.max(0, totalAmount - amountPaid);
    const totalProfit = totalAmount - totalCost;

    const rawClientName = (saleData.clientName || '').trim();
    const rawClientPhone = (saleData.clientPhone || '').trim();

    let linkedClientId = saleData.clientId || null;
    let finalClientName = lang === 'ar' ? 'زبون عابر' : lang === 'en' ? 'Walk-in Client' : 'Client Comptoir';
    let finalClientPhone = '';

    if (linkedClientId) {
      const matchClient = clients.find((c) => c.id === linkedClientId);
      if (matchClient) {
        finalClientName = matchClient.name;
        finalClientPhone = matchClient.phone || rawClientPhone;
      }
    } else if (rawClientName && !isGenericClientName(rawClientName)) {
      finalClientName = rawClientName;
      finalClientPhone = rawClientPhone;
    }

    const newSale = {
      id: saleData.id || `sale-${Date.now()}`,
      invoiceNumber,
      date: saleData.date || new Date().toISOString(),
      clientId: linkedClientId,
      items,
      initialAmount: saleData.initialAmount || totalAmount,
      discount: Number(saleData.discount) || 0,
      totalAmount,
      totalCost,
      totalProfit,
      paymentType: saleData.paymentType || (remainingCredit > 0 ? 'credit' : 'cash'),
      amountPaid,
      cashGiven: saleData.cashGiven || amountPaid,
      changeReturned: saleData.changeReturned || 0,
      remainingCredit,
      clientName: finalClientName,
      clientPhone: finalClientPhone,
      creditDueDate: saleData.creditDueDate || null,
      status: remainingCredit === 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid',
      notes: saleData.notes || '',
      cashier: currentUser?.name || 'Vendeur',
      sessionId: currentSession?.id || '',
    };

    updateSalesState((prev) => [newSale, ...prev]);

    // Persist to Supabase if configured
    if (supabaseService.isAvailable()) {
      supabaseService.insertSale(newSale);
    }

    // Award loyalty points ONLY to an explicitly declared & linked client
    if (linkedClientId) {
      const pointsEarned = Math.floor(totalAmount);
      updateClientsState((prev) =>
        prev.map((c) => {
          if (c.id === linkedClientId) {
            const updatedClient = { ...c, loyaltyPoints: (Number(c.loyaltyPoints) || 0) + pointsEarned };
            if (supabaseService.isAvailable()) {
              supabaseService.upsertClient(updatedClient);
            }
            return updatedClient;
          }
          return c;
        })
      );

      // Sync credit debt to this client if any
      if (remainingCredit > 0) {
        syncClientDebt(
          finalClientName,
          finalClientPhone,
          remainingCredit,
          `Facture ${invoiceNumber} (Total ${totalAmount} DT, Payé ${amountPaid} DT, Reste dû ${remainingCredit} DT)`,
          'sale_credit',
          newSale.id,
          linkedClientId,
          newSale.date
        );
      }
    }

    return newSale;
  };

  const cancelSale = (saleId) => {
    const saleToCancel = sales.find((s) => s.id === saleId);
    if (!saleToCancel) return;

    // Restore stock
    (saleToCancel.items || []).forEach((item) => {
      adjustStock(item.productId, item.quantity);
    });

    // Remove sale
    updateSalesState((prev) => prev.filter((s) => s.id !== saleId));
    if (supabaseService.isAvailable()) {
      supabaseService.deleteSale(saleId);
    }
  };

  const updateSale = (saleId, updatedData) => {
    let oldSale = null;
    let newSaleObj = null;

    let targetClientId = updatedData.clientId !== undefined ? updatedData.clientId : null;
    let finalClientName = updatedData.clientName;
    let finalClientPhone = updatedData.clientPhone;

    if (targetClientId) {
      const match = clients.find((c) => c.id === targetClientId);
      if (match) {
        finalClientName = match.name;
        finalClientPhone = match.phone || finalClientPhone || '';
      }
    } else if (!finalClientName || isGenericClientName(finalClientName)) {
      finalClientName = lang === 'ar' ? 'زبون عابر' : lang === 'en' ? 'Walk-in Client' : 'Client Comptoir';
      finalClientPhone = '';
    }

    updateSalesState((prev) =>
      prev.map((s) => {
        if (s.id === saleId) {
          oldSale = s;
          newSaleObj = {
            ...s,
            ...updatedData,
            clientId: targetClientId,
            clientName: finalClientName || s.clientName,
            clientPhone: finalClientPhone !== undefined ? finalClientPhone : s.clientPhone,
            notes: updatedData.notes !== undefined ? updatedData.notes.trim() : s.notes,
            paymentType: updatedData.paymentType !== undefined ? updatedData.paymentType : s.paymentType,
            date: updatedData.date || s.date,
          };
          if (supabaseService.isAvailable()) {
            supabaseService.insertSale(newSaleObj);
          }
          return newSaleObj;
        }
        return s;
      })
    );

    // If assigned to a client that wasn't previously linked to this sale, award loyalty points
    if (targetClientId && (!oldSale || oldSale.clientId !== targetClientId)) {
      const pointsToAward = Math.floor(Number(oldSale?.totalAmount || updatedData.totalAmount || 0));
      if (pointsToAward > 0) {
        updateClientsState((prev) =>
          prev.map((c) => {
            if (c.id === targetClientId) {
              const updatedClient = { ...c, loyaltyPoints: (Number(c.loyaltyPoints) || 0) + pointsToAward };
              if (supabaseService.isAvailable()) {
                supabaseService.upsertClient(updatedClient);
              }
              return updatedClient;
            }
            return c;
          })
        );
      }
    }

    return newSaleObj;
  };

  // --- SALES ARCHIVING ACTIONS ---
  const archiveSale = (saleId) => {
    const nowIso = new Date().toISOString();
    updateSalesState((prev) =>
      prev.map((s) => {
        if (s.id === saleId) {
          const updated = { ...s, archived: true, archivedAt: nowIso };
          if (supabaseService.isAvailable()) {
            supabaseService.insertSale(updated);
          }
          return updated;
        }
        return s;
      })
    );
  };

  const unarchiveSale = (saleId) => {
    updateSalesState((prev) =>
      prev.map((s) => {
        if (s.id === saleId) {
          const updated = { ...s, archived: false, archivedAt: null };
          if (supabaseService.isAvailable()) {
            supabaseService.insertSale(updated);
          }
          return updated;
        }
        return s;
      })
    );
  };

  const archiveSalesBatch = (saleIds) => {
    if (!Array.isArray(saleIds) || saleIds.length === 0) return;
    const idSet = new Set(saleIds);
    const nowIso = new Date().toISOString();
    updateSalesState((prev) =>
      prev.map((s) => {
        if (idSet.has(s.id)) {
          const updated = { ...s, archived: true, archivedAt: nowIso };
          if (supabaseService.isAvailable()) {
            supabaseService.insertSale(updated);
          }
          return updated;
        }
        return s;
      })
    );
  };

  const archiveSalesBeforeDate = (cutoffDateStr) => {
    const cutoff = new Date(cutoffDateStr);
    cutoff.setHours(23, 59, 59, 999);
    const nowIso = new Date().toISOString();
    let count = 0;
    updateSalesState((prev) =>
      prev.map((s) => {
        if (!s.archived && new Date(s.date) <= cutoff) {
          count++;
          const updated = { ...s, archived: true, archivedAt: nowIso };
          if (supabaseService.isAvailable()) {
            supabaseService.insertSale(updated);
          }
          return updated;
        }
        return s;
      })
    );
    return count;
  };

  // --- EXPENSE ACTIONS ---
  const addExpense = (expenseData) => {
    const newExpense = {
      id: expenseData.id || 'exp-' + Date.now(),
      title: expenseData.title,
      description: expenseData.title,
      amount: Number(expenseData.amount) || 0,
      category: expenseData.category || 'other',
      paymentMethod: expenseData.paymentMethod || 'cash',
      date: expenseData.date || new Date().toISOString(),
      notes: expenseData.notes || '',
    };
    updateExpensesState((prev) => [newExpense, ...prev]);
    if (supabaseService.isAvailable()) {
      supabaseService.insertExpense(newExpense);
    }
    return newExpense;
  };

  const updateExpense = (id, expenseData) => {
    updateExpensesState((prev) =>
      prev.map((exp) => {
        if (exp.id === id) {
          const updated = {
            ...exp,
            ...expenseData,
            amount: Number(expenseData.amount) || 0,
          };
          if (supabaseService.isAvailable()) {
            supabaseService.insertExpense(updated);
          }
          return updated;
        }
        return exp;
      })
    );
  };

  const deleteExpense = (id) => {
    updateExpensesState((prev) => prev.filter((exp) => exp.id !== id));
    if (supabaseService.isAvailable()) {
      supabaseService.deleteExpense(id);
    }
  };

  // --- EXPENSE ARCHIVING ACTIONS ---
  const archiveExpense = (expenseId) => {
    const nowIso = new Date().toISOString();
    updateExpensesState((prev) =>
      prev.map((exp) => {
        if (exp.id === expenseId) {
          const updated = { ...exp, archived: true, archivedAt: nowIso };
          if (supabaseService.isAvailable()) {
            supabaseService.insertExpense(updated);
          }
          return updated;
        }
        return exp;
      })
    );
  };

  const unarchiveExpense = (expenseId) => {
    updateExpensesState((prev) =>
      prev.map((exp) => {
        if (exp.id === expenseId) {
          const updated = { ...exp, archived: false, archivedAt: null };
          if (supabaseService.isAvailable()) {
            supabaseService.insertExpense(updated);
          }
          return updated;
        }
        return exp;
      })
    );
  };

  const archiveExpensesBeforeDate = (cutoffDateStr) => {
    const cutoff = new Date(cutoffDateStr);
    cutoff.setHours(23, 59, 59, 999);
    const nowIso = new Date().toISOString();
    let count = 0;
    updateExpensesState((prev) =>
      prev.map((exp) => {
        if (!exp.archived && new Date(exp.date) <= cutoff) {
          count++;
          const updated = { ...exp, archived: true, archivedAt: nowIso };
          if (supabaseService.isAvailable()) {
            supabaseService.insertExpense(updated);
          }
          return updated;
        }
        return exp;
      })
    );
    return count;
  };

  // --- CASH SESSION ACTIONS (OUVERTURE & CLÔTURE) ---
  const setOpeningCash = (amount) => {
    const num = Math.max(0, Number(amount) || 0);
    updateCurrentSessionState((prev) => ({
      ...prev,
      openingCash: num,
      openedAt: prev.openedAt || new Date().toISOString(),
    }));
  };

  const closeCashSession = (countedAmount, notes = '', closedBy = 'Gérant') => {
    const counted = Number(countedAmount) || 0;
    const opening = Number(currentSession?.openingCash) || 0;
    const theoretical = opening + todayCashInflow - todayCashExpensesAmount;
    const discrepancy = counted - theoretical;

    const closedRecord = {
      id: `sess-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      openedAt: currentSession?.openedAt || new Date().toISOString(),
      closedAt: new Date().toISOString(),
      openingCash: opening,
      cashSales: todayCashInflow,
      cashExpenses: todayCashExpensesAmount,
      theoreticalCash: theoretical,
      countedCash: counted,
      discrepancy,
      isClosed: true,
      notes: notes || '',
      closedBy: closedBy || settings.shopName || 'Gérant',
    };

    updateCashSessionsState((prev) => [closedRecord, ...prev.filter((s) => s.date !== closedRecord.date)]);
    updateCurrentSessionState({
      ...currentSession,
      isClosed: true,
      closedAt: closedRecord.closedAt,
      countedCash: counted,
      theoreticalCash: theoretical,
      discrepancy,
      notes,
      closedBy,
    });

    if (supabaseService.isAvailable()) {
      supabaseService.upsertCashSession(closedRecord);
    }

    return closedRecord;
  };

  const reopenCashSession = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const match = cashSessions.find((s) => s.date === todayStr);
    updateCashSessionsState((prev) => prev.filter((s) => s.date !== todayStr));
    if (match && supabaseService.isAvailable()) {
      supabaseService.deleteCashSession(match.id);
    }
    updateCurrentSessionState((prev) => ({
      ...prev,
      isClosed: false,
      closedAt: null,
      countedCash: null,
      discrepancy: 0,
    }));
  };

  const deleteCashSession = (id) => {
    updateCashSessionsState((prev) => prev.filter((s) => s.id !== id));
    if (supabaseService.isAvailable()) {
      supabaseService.deleteCashSession(id);
    }
  };

  // --- STATS & ANALYTICS HELPERS (ACTIVE ONLY - ARCHIVED EXCLUDED) ---
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const todaySalesList = sales.filter((s) => !s.archived && isToday(s.date));
  const todayDirectSalesAmount = todaySalesList.reduce((acc, s) => acc + (Number(s.amountPaid) || 0), 0);
  const todaySalesProfit = todaySalesList.reduce((acc, s) => acc + (Number(s.totalProfit) || 0), 0);

  const todayRepairInflow = repairs.filter((r) => !r.archived).reduce((acc, rep) => {
    let sum = 0;
    const createdToday = isToday(rep.createdAt);
    const deliveredToday = isToday(rep.deliveredAt);

    const initialAdv = rep.initialAdvance !== undefined
      ? Number(rep.initialAdvance)
      : (rep.status === 'delivered' ? Math.max(0, (Number(rep.totalPrice) || 0) - (Number(rep.remainingPaid) || 0)) : (Number(rep.advancePaid) || 0));

    const remainingSettled = rep.remainingPaid !== undefined
      ? Number(rep.remainingPaid)
      : Math.max(0, (Number(rep.totalPrice) || 0) - initialAdv);

    if (createdToday && !deliveredToday) {
      sum += initialAdv;
    } else if (deliveredToday && createdToday) {
      sum += Number(rep.totalPrice) || (initialAdv + remainingSettled);
    } else if (deliveredToday && !createdToday) {
      const hasClientPayment = rep.clientName && clients.some(c => 
        (c.name.toLowerCase() === rep.clientName.toLowerCase() || (c.phone && c.phone === rep.clientPhone)) &&
        (c.history || []).some(t => !t.archived && isToday(t.date) && (t.referenceId === rep.id || t.type === 'repair_payment'))
      );
      if (!hasClientPayment) {
        sum += remainingSettled;
      }
    }
    return acc + sum;
  }, 0);

  const todayDeliveredRepairs = repairs.filter((r) => !r.archived && r.status === 'delivered' && isToday(r.deliveredAt));
  const todayRepairsProfit = todayDeliveredRepairs.reduce((acc, r) => {
    const revenue = Number(r.totalPrice) || 0;
    const cost = Number(r.pieceCost) || 0;
    const labor = Number(r.laborCost) || 0;
    const profit = labor > 0 ? labor : Math.max(0, revenue - cost);
    return acc + profit;
  }, 0);

  const todayCreditPaymentsAmount = clients.reduce((total, client) => {
    const paymentsToday = (client.history || []).filter(
      (t) => !t.archived && isToday(t.date) && (Number(t.amount) < 0 || t.type === 'payment' || t.type === 'repair_payment' || t.type === 'settlement')
    );
    const sumForClient = paymentsToday.reduce(
      (sub, t) => sub + Math.abs(Number(t.amount) || 0),
      0
    );
    return total + sumForClient;
  }, 0);

  const todaySalesAmount = todayDirectSalesAmount + todayRepairInflow + todayCreditPaymentsAmount;
  const todayProfit = todaySalesProfit + todayRepairsProfit;

  const todayExpensesList = expenses.filter((e) => !e.archived && isToday(e.date));
  const todayExpensesAmount = todayExpensesList.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const todayCashExpensesAmount = todayExpensesList
    .filter((e) => e.paymentMethod === 'cash')
    .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  const todayCashInflow = todayDirectSalesAmount + todayRepairInflow + todayCreditPaymentsAmount;
  const netCashRegisterBalance = todayCashInflow - todayCashExpensesAmount;

  const openingCash = Number(currentSession?.openingCash) || 0;
  const theoreticalCashInDrawer = openingCash + todayCashInflow - todayCashExpensesAmount;

  const lastClosedSession = cashSessions.length > 0 ? cashSessions[0] : null;
  const yesterdayClosingBalance = lastClosedSession
    ? Number(lastClosedSession.countedCash ?? lastClosedSession.theoreticalCash ?? 0)
    : 0;

  const monthExpensesAmount = expenses.filter((e) => !e.archived).reduce((acc, e) => {
    const d = new Date(e.date);
    const now = new Date();
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      return acc + (Number(e.amount) || 0);
    }
    return acc;
  }, 0);

  const activeRepairs = repairs.filter((r) => !r.archived && r.status !== 'delivered' && r.status !== 'cancelled');
  const urgentRepairs = repairs.filter((r) => !r.archived && (r.status === 'received' || r.status === 'in_progress') && (r.priority === 'urgent' || r.priority === 'high'));
  const readyRepairs = repairs.filter((r) => !r.archived && r.status === 'ready');

  const archivedSales = sales.filter((s) => s.archived);
  const archivedRepairs = repairs.filter((r) => r.archived);
  const archivedExpenses = expenses.filter((e) => e.archived);
  const archivedCreditTransactions = clients.flatMap((c) =>
    (c.history || []).filter((t) => t.archived).map((t) => ({ ...t, clientId: c.id, clientName: c.name, clientPhone: c.phone }))
  );
  const archivedSalesCount = archivedSales.length;
  const archivedRepairsCount = archivedRepairs.length;
  const archivedExpensesCount = archivedExpenses.length;
  const archivedCreditsCount = archivedCreditTransactions.length;
  const totalArchivedCount = archivedSalesCount + archivedRepairsCount + archivedCreditsCount + archivedExpensesCount;

  const lowStockProducts = products
    .filter((p) => isProductLowStock(p))
    .sort((a, b) => (Number(b.sellingPrice) || 0) - (Number(a.sellingPrice) || 0));
  const outOfStockProducts = products
    .filter((p) => Number(p.stock) === 0)
    .sort((a, b) => (Number(b.sellingPrice) || 0) - (Number(a.sellingPrice) || 0));

  const totalClientsDebt = clients.reduce((acc, c) => acc + (Number(c.totalDebt) || 0), 0);
  const clientsWithDebt = clients.filter((c) => Number(c.totalDebt) > 0);

  const pendingPurchaseOrdersCount = purchaseOrders.filter((po) => !po.archived && (po.status === 'pending' || po.status === 'ordered')).length;
  const clientRequestsCount = purchaseOrders.filter((po) => !po.archived && po.type === 'client_request' && (po.status === 'pending' || po.status === 'ordered')).length;
  const stockRefillsCount = purchaseOrders.filter((po) => !po.archived && po.type === 'stock_refill' && (po.status === 'pending' || po.status === 'ordered')).length;

  // --- PURCHASE ORDERS CRUD ACTIONS ---
  const addPurchaseOrder = (orderData) => {
    const newOrder = {
      id: orderData.id || `po-${Date.now()}`,
      type: orderData.type || 'stock_refill',
      title: orderData.title?.trim() || 'Article',
      category: orderData.category || '',
      subCategory: orderData.subCategory || '',
      quantity: Number(orderData.quantity) || 1,
      estimatedCost: Number(orderData.estimatedCost) || 0,
      priority: orderData.priority || 'normal',
      status: orderData.status || 'pending',
      supplier: orderData.supplier?.trim() || '',
      notes: orderData.notes?.trim() || '',
      clientName: orderData.clientName?.trim() || '',
      clientPhone: orderData.clientPhone?.trim() || '',
      clientDeposit: Number(orderData.clientDeposit) || 0,
      linkedProductId: orderData.linkedProductId || '',
      autoRestock: orderData.autoRestock !== undefined ? Boolean(orderData.autoRestock) : true,
      createdAt: new Date().toISOString(),
      completedAt: orderData.status === 'received' ? new Date().toISOString() : null,
    };

    updatePurchaseOrdersState((prev) => [newOrder, ...prev]);
    if (supabaseService.isAvailable()) {
      supabaseService.upsertPurchaseOrder(newOrder);
    }
    return newOrder;
  };

  const updatePurchaseOrder = (id, orderData) => {
    updatePurchaseOrdersState((prev) =>
      prev.map((order) => {
        if (order.id !== id) return order;
        const newStatus = orderData.status !== undefined ? orderData.status : order.status;
        const isNowReceived = newStatus === 'received';

        const updatedOrder = {
          ...order,
          ...orderData,
          completedAt: isNowReceived ? (order.completedAt || new Date().toISOString()) : (newStatus !== 'received' ? null : order.completedAt),
        };
        if (supabaseService.isAvailable()) {
          supabaseService.upsertPurchaseOrder(updatedOrder);
        }
        return updatedOrder;
      })
    );
  };

  const deletePurchaseOrder = (id) => {
    updatePurchaseOrdersState((prev) => prev.filter((o) => o.id !== id));
    if (supabaseService.isAvailable()) {
      supabaseService.deletePurchaseOrder(id);
    }
  };

  const resetPurchaseOrders = (mode = 'all', orderIds = null) => {
    if (mode === 'selected' && Array.isArray(orderIds)) {
      updatePurchaseOrdersState((prev) => prev.filter((o) => !orderIds.includes(o.id)));
      if (supabaseService.isAvailable()) {
        orderIds.forEach((id) => supabaseService.deletePurchaseOrder(id));
      }
    } else if (mode === 'received') {
      const toDelete = purchaseOrders.filter((po) => po.status === 'received');
      updatePurchaseOrdersState((prev) => prev.filter((o) => o.status !== 'received'));
      if (supabaseService.isAvailable()) {
        toDelete.forEach((po) => supabaseService.deletePurchaseOrder(po.id));
      }
    } else {
      // mode === 'all'
      const idsToDelete = purchaseOrders.map((o) => o.id);
      updatePurchaseOrdersState([]);
      if (supabaseService.isAvailable()) {
        idsToDelete.forEach((id) => supabaseService.deletePurchaseOrder(id));
      }
    }
  };

  const togglePurchaseOrderStatus = (id, newStatus, restockQuantity = 0) => {
    let orderTitle = '';
    let linkedProdId = '';
    let shouldRestock = false;

    updatePurchaseOrdersState((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          orderTitle = o.title;
          linkedProdId = o.linkedProductId;
          shouldRestock = o.autoRestock && Boolean(o.linkedProductId);
          const updated = {
            ...o,
            status: newStatus,
            completedAt: newStatus === 'received' ? new Date().toISOString() : null,
          };
          if (supabaseService.isAvailable()) {
            supabaseService.upsertPurchaseOrder(updated);
          }
          return updated;
        }
        return o;
      })
    );

    if (newStatus === 'received' && (shouldRestock || restockQuantity > 0) && linkedProdId) {
      const targetOrder = purchaseOrders.find((o) => o.id === id);
      const qtyToAdd = restockQuantity > 0 ? restockQuantity : (targetOrder?.quantity || 1);
      adjustStock(linkedProdId, qtyToAdd);
    }
  };

  const importLowStockToPurchaseOrders = (itemsToImport = null, filterCat = 'all', filterSubCat = 'all') => {
    if (Array.isArray(itemsToImport) && itemsToImport.length > 0) {
      const newEntries = itemsToImport.map((item) => {
        const threshold = Number(item.minStockAlert) || 5;
        const currentStock = Number(item.stock) || 0;
        const qty = Number(item.quantityToOrder) || Math.max(5, threshold * 2 - currentStock);

        return {
          id: `po-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'stock_refill',
          title: item.name || item.title,
          category: item.category || '',
          subCategory: item.subCategory || '',
          quantity: qty,
          estimatedCost: Number(item.purchasePrice !== undefined ? item.purchasePrice : item.estimatedCost) || 0,
          priority: currentStock <= 0 ? 'urgent' : 'normal',
          status: 'pending',
          supplier: item.supplier || '',
          notes: item.notes || '',
          clientName: '',
          clientPhone: '',
          clientDeposit: 0,
          linkedProductId: item.id || item.linkedProductId || '',
          autoRestock: true,
          createdAt: new Date().toISOString(),
          completedAt: null,
        };
      });

      updatePurchaseOrdersState((prev) => [...newEntries, ...prev]);
      if (supabaseService.isAvailable()) {
        newEntries.forEach((e) => supabaseService.upsertPurchaseOrder(e));
      }
      return newEntries.length;
    }

    const lowStockItems = products.filter((p) => {
      if (!isProductLowStock(p)) return false;
      if (filterCat !== 'all' && p.category !== filterCat) return false;
      if (filterSubCat !== 'all' && p.subCategory !== filterSubCat) return false;
      return true;
    });

    if (lowStockItems.length === 0) {
      return 0;
    }

    let addedCount = 0;
    const newEntries = [];

    lowStockItems.forEach((prod) => {
      const alreadyListed = purchaseOrders.some(
        (o) =>
          (o.linkedProductId === prod.id || o.title.toLowerCase() === prod.name.toLowerCase()) &&
          (o.status === 'pending' || o.status === 'ordered')
      );

      if (!alreadyListed) {
        const threshold = Number(prod.minStockAlert) || 5;
        const currentStock = Number(prod.stock) || 0;
        const recommendedQty = Math.max(5, threshold * 2 - currentStock);

        const newPo = {
          id: `po-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'stock_refill',
          title: prod.name,
          category: prod.category || '',
          subCategory: prod.subCategory || '',
          quantity: recommendedQty,
          estimatedCost: Number(prod.purchasePrice) || 0,
          priority: currentStock <= 0 ? 'urgent' : 'normal',
          status: 'pending',
          supplier: prod.supplier || '',
          notes: '',
          clientName: '',
          clientPhone: '',
          clientDeposit: 0,
          linkedProductId: prod.id,
          autoRestock: true,
          createdAt: new Date().toISOString(),
          completedAt: null,
        };
        newEntries.push(newPo);
        if (supabaseService.isAvailable()) {
          supabaseService.upsertPurchaseOrder(newPo);
        }
        addedCount++;
      }
    });

    if (newEntries.length > 0) {
      updatePurchaseOrdersState((prev) => [...newEntries, ...prev]);
    }

    return addedCount;
  };

  // --- BACKUP & RESTORE ---
  const exportBackup = () => {
    const totalSubCategories = categories.reduce((acc, cat) => acc + ((cat.subCategories || []).length), 0);
    const backupData = {
      version: '2.0',
      app: 'Boutique Pro POS & CRM',
      exportedAt: new Date().toISOString(),
      summary: {
        categoriesCount: categories.length,
        subCategoriesCount: totalSubCategories,
        productsCount: products.length,
        salesCount: sales.length,
        clientsCount: clients.length,
        repairsCount: repairs.length,
        expensesCount: expenses.length,
        sessionsCount: cashSessions.length,
        purchaseOrdersCount: purchaseOrders.length,
      },
      settings,
      categories,
      products,
      repairs,
      sales,
      clients,
      expenses,
      cashSessions,
      currentSession,
      purchaseOrders,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boutique_backup_${new Date().toISOString().split('T')[0]}_v2.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (jsonData) => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (data.settings && typeof data.settings === 'object') {
        updateSettingsState(data.settings);
      }
      
      if (Array.isArray(data.categories)) {
        const normalizedCategories = data.categories
          .map((cat, idx) => ({
            ...cat,
            order: typeof cat.order === 'number' ? cat.order : idx + 1,
            subCategories: Array.isArray(cat.subCategories) ? cat.subCategories : [],
          }))
          .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
        updateCategoriesState(normalizedCategories);
      }
      
      if (Array.isArray(data.products)) {
        const normalizedProducts = data.products.map((p) => ({
          ...p,
          notes: p.notes || '',
          subCategory: p.subCategory || '',
          barcode: p.barcode || '',
          minStockAlert: Number(p.minStockAlert) || 3,
        }));
        updateProductsState(normalizedProducts);
      }
      
      if (Array.isArray(data.repairs)) updateRepairsState(data.repairs);
      if (Array.isArray(data.sales)) updateSalesState(data.sales);
      
      if (Array.isArray(data.clients)) {
        const normalizedClients = data.clients.map((c) => ({
          ...c,
          loyaltyPoints: Number(c.loyaltyPoints) || 0,
          customDiscountPercent: Number(c.customDiscountPercent) || 0,
          totalDebt: Number(c.totalDebt) || 0,
          history: Array.isArray(c.history) ? c.history : [],
        }));
        updateClientsState(normalizedClients);
      }
      
      if (Array.isArray(data.expenses)) updateExpensesState(data.expenses);
      if (Array.isArray(data.cashSessions)) updateCashSessionsState(data.cashSessions);
      if (Array.isArray(data.purchaseOrders)) updatePurchaseOrdersState(data.purchaseOrders);
      if (data.currentSession && typeof data.currentSession === 'object') {
        updateCurrentSessionState(data.currentSession);
      }
      
      return { success: true };
    } catch (err) {
      console.error('Import error', err);
      return { success: false, error: err.message };
    }
  };

  const resetToDemoData = () => {
    updateSettingsState(INITIAL_SETTINGS);
    updateCategoriesState(INITIAL_CATEGORIES);
    updateProductsState(INITIAL_PRODUCTS);
    updateRepairsState(INITIAL_REPAIRS);
    updateSalesState(INITIAL_SALES);
    updateClientsState(INITIAL_CLIENTS);
    updateExpensesState(INITIAL_EXPENSES);
    updateCashSessionsState(INITIAL_CASH_SESSIONS);
    updateCurrentSessionState(INITIAL_CURRENT_SESSION);
    updatePurchaseOrdersState(INITIAL_PURCHASE_ORDERS);
  };

  const resetToProductionMode = (options = { wipeProducts: false }) => {
    if (options.wipeProducts) {
      updateProductsState([]);
    }
    updateRepairsState([]);
    updateSalesState([]);
    updateClientsState([]);
    updateExpensesState([]);
    updateCashSessionsState([]);
    updatePurchaseOrdersState([]);
    updateCurrentSessionState({
      openingCash: 0,
      openedAt: null,
      isClosed: false,
      closedAt: null,
      countedCash: null,
      theoreticalCash: null,
      discrepancy: 0,
      notes: '',
      closedBy: '',
    });
  };

  return (
    <AppContext.Provider
      value={{
        // Language & i18n
        lang,
        setLang,
        t,
        isRTL,

        // Theme & UI Preferences
        theme,
        setTheme,
        privacyMode,
        setPrivacyMode,
        togglePrivacyMode,
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,

        // Data states
        settings,
        setSettings: updateSettingsState,
        categories,
        setCategories: updateCategoriesState,
        products,
        repairs,
        sales,
        clients,
        expenses,
        setExpenses: updateExpensesState,
        cashSessions,
        setCashSessions: updateCashSessionsState,
        currentSession,
        setCurrentSession: updateCurrentSessionState,
        purchaseOrders,
        setPurchaseOrders: updatePurchaseOrdersState,

        // Navigation
        currentTab,
        setCurrentTab,
        globalSearch,
        setGlobalSearch,
        activeReceipt,
        setActiveReceipt,

        // Category Actions
        addCategory,
        updateCategory,
        deleteCategory,
        moveCategory,
        reorderCategory,
        addSubCategory,
        renameSubCategory,
        removeSubCategory,

        // Actions
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,

        // Repair Actions
        addRepair,
        updateRepair,
        updateRepairStatus,
        deleteRepair,

        // Sales Actions
        processSale,
        updateSale,
        cancelSale,

        // Client & Debt Actions
        addClient,
        toggleLoyaltyClient,
        recordClientPayment,
        syncClientDebt,
        updateClient,
        deleteClient,
        updateClientTransaction,
        deleteClientTransaction,
        getClientStats,

        // Expense Actions
        addExpense,
        updateExpense,
        deleteExpense,

        // Purchase Orders Actions
        addPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
        resetPurchaseOrders,
        togglePurchaseOrderStatus,
        importLowStockToPurchaseOrders,
        pendingPurchaseOrdersCount,
        clientRequestsCount,
        stockRefillsCount,

        // Cash Session Actions (Ouverture / Clôture)
        setOpeningCash,
        closeCashSession,
        reopenCashSession,
        deleteCashSession,

        // Helpers & Metrics
        formatMoney,
        todaySalesList,
        todaySalesAmount,
        todayProfit,
        todayCreditPaymentsAmount,
        todayExpensesList,
        todayExpensesAmount,
        todayCashExpensesAmount,
        todayCashInflow,
        netCashRegisterBalance,
        openingCash,
        theoreticalCashInDrawer,
        yesterdayClosingBalance,
        lastClosedSession,
        monthExpensesAmount,
        activeRepairs,
        urgentRepairs,
        readyRepairs,
        isProductLowStock,
        lowStockProducts,
        outOfStockProducts,
        todayRepairInflow,
        todayRepairsProfit,
        todayDeliveredRepairs,
        totalClientsDebt,
        clientsWithDebt,

        // Archives Actions & Counts
        archiveSale,
        unarchiveSale,
        archiveSalesBatch,
        archiveSalesBeforeDate,
        archiveRepair,
        unarchiveRepair,
        archiveAllDeliveredRepairs,
        archiveCreditTransaction,
        unarchiveCreditTransaction,
        archiveAllSettledCredits,
        archiveExpense,
        unarchiveExpense,
        archiveExpensesBeforeDate,
        archivedSales,
        archivedRepairs,
        archivedCreditsCount,
        archivedExpenses,
        archivedSalesCount,
        archivedRepairsCount,
        archivedExpensesCount,
        archivedCreditTransactions,
        totalArchivedCount,

        // Users & Auth Session
        users,
        currentUser,
        login,
        logout,
        switchUser,
        addUser,
        updateUser,
        deleteUser,
        isAdmin,
        isLoggedIn,

        // Backup & Database (Supabase PostgreSQL)
        exportBackup,
        importBackup,
        resetToDemoData,
        resetToProductionMode,
        isSupabaseConfigured,
        supabaseStatus,
        supabaseLastSync,
        refreshFromSupabase,
        migrateToSupabase,
        testSupabaseConnection,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
