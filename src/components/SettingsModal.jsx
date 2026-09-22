import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import {
  X,
  Settings,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export default function SettingsModal({ onClose }) {
  const {
    settings,
    setSettings,
    exportBackup,
    importBackup,
    resetToDemoData,
    resetToProductionMode,
    products,
    sales,
    repairs,
    categories,
    lang,
    t,
  } = useApp();

  const [formData, setFormData] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetModal, setResetModal] = useState({ open: false, mode: null });
  const [wipeProductsChecked, setWipeProductsChecked] = useState(false);
  const fileInputRef = useRef(null);

  const handleSave = (e) => {
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
    setTimeout(() => setSaveSuccess(false), 2000);
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
        onClose();
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
    onClose();
  };

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '640px' }}>
          <div className="modal-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={20} className="text-primary" />
              {t('settingsTitle')}
            </h3>
            <button className="btn-icon btn-outline" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave}>
            <div className="modal-body">
              {/* Shop Info Form */}
              <div className="form-group">
                <label className="form-label">{t('shopNameLabel')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t('shopPhoneLabel')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('shopCurrencyLabel')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('shopAddressLabel')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('ticketFooterLabel')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.receiptFooter}
                  onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '1.5rem' }}
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle size={16} />
                    {t('shopInfoSavedSuccess')}
                  </>
                ) : (
                  t('saveShopInfoBtn')
                )}
              </button>

              {/* Data & Backup Section */}
              <div
                style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '0.95rem' }}>
                  <ShieldCheck size={18} className="text-primary" />
                  {t('tabBackup')}
                </h4>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={exportBackup}
                  >
                    <Download size={14} />
                    {t('exportBackupBtn')}
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".json"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    {t('importBackupBtn')}
                  </button>
                </div>

                {/* Reset Buttons Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {/* Mode Prod */}
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    style={{ justifyContent: 'center' }}
                    onClick={() => setResetModal({ open: true, mode: 'prod' })}
                  >
                    <Sparkles size={14} />
                    {t('resetProdBtn')}
                  </button>

                  {/* Mode Démo */}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ justifyContent: 'center', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    onClick={() => setResetModal({ open: true, mode: 'demo' })}
                  >
                    <RotateCcw size={14} />
                    {t('resetDemoBtn')}
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {t('close')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Styled Confirmation Modal for Reset Actions */}
      {resetModal.open && (
        <ConfirmDeleteModal
          title={resetModal.mode === 'prod' ? t('resetProdModeTitle') : t('resetDemoDataTitle')}
          message={resetModal.mode === 'prod' ? t('resetProdConfirm') : t('resetConfirm')}
          itemDetails={
            resetModal.mode === 'prod'
              ? {
                  title: 'Mode Production (Exploitation Réelle)',
                  subtitle: `${sales.length} ventes, ${repairs.length} réparations, ${categories.length} catégories conservées`,
                  value: wipeProductsChecked
                    ? 'Catalogue produits : 0 article (Vidé)'
                    : `Catalogue produits : ${products.length} articles (Conservés)`,
                  valueColor: wipeProductsChecked ? '#f87171' : '#34d399',
                }
              : {
                  title: 'Mode Démo d’Usine',
                  subtitle: 'Écrasement complet de toutes les données actuelles',
                  value: 'Restitution du catalogue de démonstration',
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
    </>
  );
}
