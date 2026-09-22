import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import CategoriesView from './CategoriesView';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import {
  Settings,
  Tag,
  Store,
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  AlertTriangle,
  Globe,
  Palette,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
  Lock,
  Database,
  RefreshCw,
  Server,
  User,
  Users,
  KeyRound,
  Plus,
  Trash2,
  Edit2,
  ShieldAlert,
} from 'lucide-react';

export default function SettingsView({ initialTab = 'shop' }) {
  const {
    settings,
    setSettings,
    updateSettings,
    exportBackup,
    importBackup,
    resetToDemoData,
    resetToProductionMode,
    categories,
    products,
    repairs,
    sales,
    clients,
    expenses,
    cashSessions,
    lang,
    setLang,
    theme,
    setTheme,
    privacyMode,
    setPrivacyMode,
    togglePrivacyMode,
    t,
    isSupabaseConfigured,
    supabaseStatus,
    supabaseLastSync,
    refreshFromSupabase,
    migrateToSupabase,
    testSupabaseConnection,
    users,
    addUser,
    updateUser,
    deleteUser,
    isAdmin,
    currentUser,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState(initialTab); // 'categories', 'shop', 'users', 'backup'
  const [formData, setFormData] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetModal, setResetModal] = useState({ open: false, mode: null }); // 'prod' or 'demo'
  const [wipeProductsChecked, setWipeProductsChecked] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userModal, setUserModal] = useState({
    open: false,
    isEdit: false,
    user: null,
    name: '',
    username: '',
    pinCode: '',
    role: 'user',
  });
  const [revealedPins, setRevealedPins] = useState({});
  const fileInputRef = useRef(null);

  const handleSaveShopSettings = (e) => {
    e.preventDefault();
    setSettings(formData);
    setSaveSuccess(true);
    toast.success(
      lang === 'ar'
        ? 'تم حفظ الإعدادات بنجاح !'
        : lang === 'en'
        ? 'Settings saved successfully!'
        : 'Paramètres enregistrés avec succès !'
    );
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = importBackup(event.target.result);
      if (res.success) {
        toast.success(
          lang === 'ar'
            ? 'تمت استعادة النسخة الاحتياطية بنجاح!'
            : lang === 'en'
            ? 'Backup restored successfully!'
            : 'Sauvegarde restaurée avec succès !'
        );
      } else {
        toast.error(
          (lang === 'ar'
            ? 'خطأ في قراءة ملف النسخ الاحتياطي: '
            : lang === 'en'
            ? 'Error reading backup file: '
            : 'Erreur lors de la lecture du fichier de sauvegarde : ') + res.error
        );
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmResetAction = () => {
    if (resetModal.mode === 'prod') {
      resetToProductionMode({ wipeProducts: wipeProductsChecked });
      toast.success(
        lang === 'ar'
          ? 'تمت تهيئة المتجر بنجاح لوضع الإنتاج الحقيقي !'
          : lang === 'en'
          ? 'Store successfully reset to Production Mode!'
          : 'Boutique réinitialisée avec succès en Mode Production !'
      );
    } else if (resetModal.mode === 'demo') {
      resetToDemoData();
      toast.success(
        lang === 'ar'
          ? 'تمت إعادة تحميل البيانات التجريبية بنجاح !'
          : lang === 'en'
          ? 'Demo data reloaded successfully!'
          : 'Données de démonstration rechargées avec succès !'
      );
    }
    setResetModal({ open: false, mode: null });
    setWipeProductsChecked(false);
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    try {
      const res = await testSupabaseConnection();
      if (res.success) {
        toast.success(res.message || 'Connexion Supabase réussie !');
      } else {
        toast.error(res.message || 'Échec de connexion Supabase');
      }
    } catch (err) {
      toast.error(err.message || 'Erreur de test connexion');
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const ok = await refreshFromSupabase();
      if (ok) {
        toast.success('Données rechargées depuis Supabase avec succès !');
      } else {
        toast.error('Impossible de recharger les données depuis Supabase.');
      }
    } catch (err) {
      toast.error(err.message || 'Erreur lors du rechargement');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      await migrateToSupabase();
      toast.success('Données migrées vers PostgreSQL Supabase avec succès !');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la migration vers Supabase');
    } finally {
      setIsMigrating(false);
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
            <Settings size={24} className="text-primary" />
            {t('settingsTitle')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {t('settingsSubtitle')}
          </p>
        </div>
      </div>

      {/* Main Single Settings Navigation Card */}
      <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Sub-Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '1rem 1.25rem',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            overflowX: 'auto',
          }}
        >
          <button
            className={`btn btn-sm ${activeSubTab === 'categories' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem' }}
            onClick={() => setActiveSubTab('categories')}
          >
            <Tag size={15} />
            <span>{t('departmentsTab')}</span>
            <span
              className="badge"
              style={{
                background: activeSubTab === 'categories' ? 'rgba(255,255,255,0.2)' : 'var(--accent-primary-light)',
                color: activeSubTab === 'categories' ? '#ffffff' : 'var(--accent-primary)',
              }}
            >
              {categories.length}
            </span>
          </button>

          <button
            className={`btn btn-sm ${activeSubTab === 'shop' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem' }}
            onClick={() => setActiveSubTab('shop')}
          >
            <Store size={15} />
            <span>{t('shopTab')}</span>
          </button>

          {isAdmin && (
            <button
              className={`btn btn-sm ${activeSubTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.85rem' }}
              onClick={() => setActiveSubTab('users')}
            >
              <Users size={15} />
              <span>Utilisateurs & PIN</span>
              <span
                className="badge"
                style={{
                  background: activeSubTab === 'users' ? 'rgba(255,255,255,0.2)' : 'var(--accent-primary-light)',
                  color: activeSubTab === 'users' ? '#ffffff' : 'var(--accent-primary)',
                }}
              >
                {users?.length || 0}
              </span>
            </button>
          )}

          <button
            className={`btn btn-sm ${activeSubTab === 'backup' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem' }}
            onClick={() => setActiveSubTab('backup')}
          >
            <ShieldCheck size={15} />
            <span>{t('backupTab')}</span>
          </button>
        </div>

        {/* Tab 1: Categories View */}
        {activeSubTab === 'categories' && (
          <div style={{ padding: '1.25rem' }}>
            <CategoriesView isEmbedded={true} />
          </div>
        )}

        {/* Tab 2: Shop & Receipt Settings */}
        {activeSubTab === 'shop' && (
          <div style={{ padding: '1.5rem', maxWidth: '750px' }}>
            {/* Theme Preference Section */}
            <div
              style={{
                background: 'var(--accent-primary-light)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <Palette size={18} className="text-primary" />
                {t('themeLabel')}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${theme === 'dark' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTheme('dark')}
                  style={{ justifyContent: 'center' }}
                >
                  <span>🌙</span>
                  <span>{t('themeDark')}</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${theme === 'light' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTheme('light')}
                  style={{ justifyContent: 'center' }}
                >
                  <span>☀️</span>
                  <span>{t('themeLight')}</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${theme === 'cyber' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTheme('cyber')}
                  style={{ justifyContent: 'center' }}
                >
                  <span>🔮</span>
                  <span>{t('themeCyber')}</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${theme === 'emerald' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTheme('emerald')}
                  style={{ justifyContent: 'center' }}
                >
                  <span>🌿</span>
                  <span>{t('themeEmerald')}</span>
                </button>
              </div>
            </div>

            {/* Language Preference Section */}
            <div
              style={{
                background: 'var(--accent-primary-light)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <Globe size={18} className="text-primary" />
                {t('interfaceLanguage')}
              </h4>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${lang === 'fr' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setLang('fr')}
                >
                  <span>🇫🇷</span>
                  <span>Français</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${lang === 'ar' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setLang('ar')}
                >
                  <span>🇸🇦</span>
                  <span>العربية (RTL)</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${lang === 'en' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setLang('en')}
                >
                  <span>🇬🇧</span>
                  <span>English</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveShopSettings}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Store size={20} className="text-primary" />
                {t('shopInfoHeader')}
              </h3>

              <div className="form-group">
                <label className="form-label">{t('shopNameLabel')} *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Boutique Pro Mobile & Vape"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('shopPhoneLabel')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: 55 123 456 / 98 765 432"
                    value={formData.shopPhone}
                    onChange={(e) => setFormData({ ...formData, shopPhone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('currencyLabel')}</label>
                  <select
                    className="form-select"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <option value="DT">DT (Dinar Tunisien / دينار تونسي)</option>
                    <option value="DA">DA (Dinar Algérien / دينار جزائري)</option>
                    <option value="DH">DH (Dirham Marocain / درهم مغربي)</option>
                    <option value="€">€ (Euro / يورو)</option>
                    <option value="$">$ (Dollar USD / دولار)</option>
                    <option value="FCFA">FCFA (فرنك)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('shopAddressLabel')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Rue de la République, Centre-Ville"
                  value={formData.shopAddress}
                  onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('ticketFooterLabel')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Merci pour votre visite ! Garantie réparation 3 mois."
                  value={formData.ticketFooter}
                  onChange={(e) => setFormData({ ...formData, ticketFooter: e.target.value })}
                />
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle size={16} />
                  {t('saveShopInfo')}
                </button>
                {saveSuccess && (
                  <span style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
                    {t('changesSaved')}
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Backup & Data Management */}
        {activeSubTab === 'backup' && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px' }}>
            {/* Supabase PostgreSQL Cloud Database Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'var(--accent-primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Server size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      Base de données Cloud PostgreSQL (Supabase)
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                      Stockage en ligne sécurisé, multi-postes et synchronisation en direct.
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {supabaseStatus === 'connected' ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#10b981',
                          boxShadow: '0 0 8px #10b981',
                        }}
                      />
                      Connecté à PostgreSQL
                    </span>
                  ) : supabaseStatus === 'connecting' ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#3b82f6',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                      }}
                    >
                      <RefreshCw size={12} className="spin" />
                      Connexion en cours...
                    </span>
                  ) : supabaseStatus === 'error' ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                      }}
                    >
                      <AlertTriangle size={12} />
                      Erreur de connexion
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                      }}
                    >
                      Non configuré (.env)
                    </span>
                  )}
                </div>
              </div>

              {/* Status Details / Instructions */}
              {!isSupabaseConfigured ? (
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '1rem',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ℹ️ Comment activer PostgreSQL avec Supabase ?
                  </p>
                  <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
                    <li>Créez un compte gratuit sur <strong>supabase.com</strong> et créez un projet.</li>
                    <li>Dans Supabase, ouvrez le <strong>SQL Editor</strong>, collez le contenu du fichier <code>supabase_schema.sql</code> et cliquez sur <strong>Run</strong>.</li>
                    <li>Ouvrez le fichier <code>.env</code> du projet et renseignez <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code>.</li>
                    <li>Redémarrez l'application (ou rechargez la page) pour activer la synchronisation !</li>
                  </ol>
                </div>
              ) : (
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    fontSize: '0.82rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Dernière synchronisation : </span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {supabaseLastSync ? supabaseLastSync.toLocaleTimeString() : 'En attente'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                      onClick={handleTestConnection}
                      disabled={isTestingConn}
                    >
                      <CheckCircle size={14} />
                      {isTestingConn ? 'Test...' : 'Tester connexion'}
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                      onClick={handleRefreshData}
                      disabled={isRefreshing}
                    >
                      <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
                      {isRefreshing ? 'Actualisation...' : 'Recharger'}
                    </button>
                  </div>
                </div>
              )}

              {/* Action: Migrate LocalStorage data to Supabase */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '1rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Transférer les données locales vers Supabase
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Envoie l'intégralité de vos articles, ventes, clients et réparations actuels vers PostgreSQL.
                  </p>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleMigrate}
                  disabled={isMigrating || !isSupabaseConfigured}
                  title={!isSupabaseConfigured ? 'Configurez d\'abord le fichier .env' : ''}
                >
                  <Upload size={15} />
                  {isMigrating ? 'Migration en cours...' : 'Migrer vers PostgreSQL'}
                </button>
              </div>
            </div>

            {/* Database Stats */}
            <div
              style={{
                background: 'var(--accent-primary-light)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.25rem',
              }}
            >
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <ShieldCheck size={18} className="text-primary" />
                {t('dataStatusTitle')}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.75rem' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{t('departmentsTab')}</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {categories.length} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>({categories.reduce((acc, c) => acc + ((c.subCategories || []).length), 0)} {t('subCategoriesBadge') || 's/cat'})</span>
                  </strong>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{t('products')}</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{products.length}</strong>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{t('repairTickets')}</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{repairs.length}</strong>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{t('transactions')}</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{sales.length}</strong>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{t('navClients')}</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--accent-primary)' }}>{clients.length}</strong>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{t('navExpenses')}</span>
                  <strong style={{ fontSize: '1.1rem', color: '#c084fc' }}>{expenses.length}</strong>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{t('navSessions')}</span>
                  <strong style={{ fontSize: '1.1rem', color: '#34d399' }}>{cashSessions.length}</strong>
                </div>
              </div>
            </div>

            {/* Export & Import Action Boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* Export Box */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                    <Download size={18} className="text-primary" />
                    {t('exportBackupTitle')}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {t('exportBackupDesc')}
                  </p>
                </div>

                <button className="btn btn-primary" onClick={exportBackup}>
                  <Download size={16} />
                  {t('downloadBackupBtn')}
                </button>
              </div>

              {/* Import Box */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                    <Upload size={18} style={{ color: 'var(--accent-info)' }} />
                    {t('importBackupTitle')}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {t('importBackupDesc')}
                  </p>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".json"
                    onChange={handleFileChange}
                  />
                  <button
                    className="btn btn-outline"
                    style={{ width: '100%' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} />
                    {t('chooseBackupFile')}
                  </button>
                </div>
              </div>
            </div>

            {/* Reset & Data Wipe Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={17} style={{ color: 'var(--accent-warning)' }} />
                  {t('resetDataTitle')}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {t('resetDataDesc')}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {/* 1. Production Mode Reset Card */}
                <div
                  style={{
                    background: 'var(--accent-success-light)',
                    border: '1px solid var(--accent-success)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                        ★ Recommandé pour Démarrer
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--accent-success)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Sparkles size={16} />
                      {t('resetProdModeTitle')}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                      {t('resetProdModeDesc')}
                    </p>
                  </div>

                  <button
                    className="btn btn-success"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setResetModal({ open: true, mode: 'prod' })}
                  >
                    <Sparkles size={15} />
                    {t('resetProdBtn')}
                  </button>
                </div>

                {/* 2. Demo Mode Reset Card */}
                <div
                  style={{
                    background: 'var(--accent-danger-light)',
                    border: '1px solid var(--accent-danger)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--accent-danger)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <RotateCcw size={16} />
                      {t('resetDemoDataTitle')}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                      {t('resetDemoDataDesc')}
                    </p>
                  </div>

                  <button
                    className="btn btn-outline"
                    style={{ width: '100%', justifyContent: 'center', color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }}
                    onClick={() => setResetModal({ open: true, mode: 'demo' })}
                  >
                    <RotateCcw size={15} />
                    {t('resetDemoBtn')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Users & Roles Management */}
        {activeSubTab === 'users' && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Gestion des Vendeurs & Utilisateurs
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Gérez les comptes employés, définissez les rôles (Admin / Vendeur) et les codes PIN de caisse.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  setUserModal({
                    open: true,
                    isEdit: false,
                    user: null,
                    name: '',
                    username: '',
                    pinCode: '',
                    role: 'user',
                  })
                }
              >
                <Plus size={16} />
                Nouveau Vendeur
              </button>
            </div>

            {/* List of Users */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {(users || []).map((u) => {
                const isUserAdmin = u.role === 'admin';
                const isRevealed = Boolean(revealedPins[u.id]);
                const isCurrent = currentUser?.id === u.id;

                return (
                  <div
                    key={u.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: isCurrent
                        ? '2px solid var(--accent-primary)'
                        : '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: isUserAdmin
                              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                              : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isUserAdmin ? <ShieldCheck size={22} /> : <User size={22} />}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                            {u.name}
                          </h4>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: isUserAdmin ? '#f59e0b' : '#3b82f6',
                            }}
                          >
                            {isUserAdmin ? 'Administrateur' : 'Vendeur / Caisse'}
                          </span>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                          Vous
                        </span>
                      )}
                    </div>

                    {/* PIN & Details */}
                    <div
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                        <KeyRound size={14} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Code PIN :</span>
                        <strong style={{ letterSpacing: isRevealed ? '2px' : '3px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {isRevealed ? u.pinCode : '••••'}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="btn-icon btn-ghost"
                        style={{ padding: '0.2rem' }}
                        onClick={() =>
                          setRevealedPins((prev) => ({ ...prev, [u.id]: !prev[u.id] }))
                        }
                        title={isRevealed ? 'Masquer' : 'Révéler'}
                      >
                        {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          setUserModal({
                            open: true,
                            isEdit: true,
                            user: u,
                            name: u.name,
                            username: u.username || '',
                            pinCode: u.pinCode,
                            role: u.role || 'user',
                          })
                        }
                      >
                        <Edit2 size={14} />
                        Modifier
                      </button>

                      {users.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#ef4444' }}
                          onClick={() => {
                            if (window.confirm(`Supprimer l'utilisateur "${u.name}" ?`)) {
                              deleteUser(u.id);
                              toast.success('Utilisateur supprimé');
                            }
                          }}
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Création / Modification Utilisateur */}
        {userModal.open && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '420px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '1.75rem',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Users size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {userModal.isEdit ? 'Modifier Utilisateur' : 'Nouveau Vendeur'}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Configurez le nom, rôle et code PIN
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!userModal.name.trim()) {
                    toast.error('Veuillez renseigner un nom');
                    return;
                  }
                  if (!userModal.pinCode.trim() || userModal.pinCode.length < 4) {
                    toast.error('Le code PIN doit comporter au moins 4 chiffres');
                    return;
                  }

                  if (userModal.isEdit) {
                    updateUser(userModal.user.id, {
                      name: userModal.name.trim(),
                      username: userModal.username.trim(),
                      pinCode: userModal.pinCode.trim(),
                      role: userModal.role,
                    });
                    toast.success('Utilisateur mis à jour !');
                  } else {
                    addUser({
                      name: userModal.name.trim(),
                      username: userModal.username.trim(),
                      pinCode: userModal.pinCode.trim(),
                      role: userModal.role,
                    });
                    toast.success('Nouvel utilisateur créé !');
                  }
                  setUserModal({ open: false, isEdit: false, user: null, name: '', username: '', pinCode: '', role: 'user' });
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div className="form-group">
                  <label className="form-label">Nom d'affichage</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Ex: Amine, Ahmed, Caisse 1..."
                    value={userModal.name}
                    onChange={(e) => setUserModal({ ...userModal, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rôle & Permissions</label>
                  <select
                    className="form-select"
                    value={userModal.role}
                    onChange={(e) => setUserModal({ ...userModal, role: e.target.value })}
                  >
                    <option value="user">👤 Vendeur / Caissier (Accès Caisse & Ventes)</option>
                    <option value="admin">🛡️ Administrateur (Accès Total & Paramètres)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Code PIN (4 chiffres)</label>
                  <input
                    type="password"
                    maxLength={6}
                    className="form-input"
                    required
                    placeholder="Ex: 1234"
                    value={userModal.pinCode}
                    onChange={(e) => setUserModal({ ...userModal, pinCode: e.target.value.replace(/\D/g, '') })}
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    Ce code sert à ouvrir la session sur la caisse.
                  </small>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setUserModal({ open: false, isEdit: false, user: null, name: '', username: '', pinCode: '', role: 'user' })}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <CheckCircle size={15} />
                    {userModal.isEdit ? 'Enregistrer' : 'Créer le profil'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Styled Confirmation Modal for Reset Actions */}
      {resetModal.open && (
        <ConfirmDeleteModal
          title={resetModal.mode === 'prod' ? t('resetProdModeTitle') : t('resetDemoDataTitle')}
          message={resetModal.mode === 'prod' ? t('resetProdConfirm') : t('resetConfirm')}
          itemDetails={
            resetModal.mode === 'prod'
              ? {
                  title: 'Passage en Exploitation Réelle (Mode Production)',
                  subtitle: `${sales.length} ventes, ${repairs.length} fiches réparation, ${categories.length} rayons conservés`,
                  value: wipeProductsChecked
                    ? 'Catalogue produits : 0 article (Vidé)'
                    : `Catalogue produits : ${products.length} articles (Conservés)`,
                  valueColor: wipeProductsChecked ? '#f87171' : '#34d399',
                }
              : {
                  title: 'Réinitialisation Démo d’Usine',
                  subtitle: 'Écrasement complet de toutes les données actuelles',
                  value: 'Restitution du catalogue et exemples d’usine',
                  valueColor: '#f87171',
                }
          }
          checkboxOption={
            resetModal.mode === 'prod'
              ? {
                  label: t('wipeProductsCheckboxLabel'),
                  helpText: t('wipeProductsHelp'),
                  checked: wipeProductsChecked,
                  onChange: setWipeProductsChecked,
                }
              : null
          }
          onConfirm={handleConfirmResetAction}
          onClose={() => {
            setResetModal({ open: false, mode: null });
            setWipeProductsChecked(false);
          }}
          confirmButtonText={resetModal.mode === 'prod' ? t('resetProdBtn') : t('resetDemoBtn')}
          confirmButtonClass={resetModal.mode === 'prod' ? 'btn btn-success' : 'btn btn-danger'}
          iconBgColor={resetModal.mode === 'prod' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}
          iconColor={resetModal.mode === 'prod' ? '#34d399' : '#f87171'}
        />
      )}
    </div>
  );
}
