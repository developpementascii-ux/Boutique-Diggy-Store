import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Percent,
  Award,
  DollarSign,
  FileText,
  Check,
  Calendar,
  CreditCard,
  HeartHandshake,
} from 'lucide-react';

export default function ClientModal({ client, transaction, onClose }) {
  const {
    addClient,
    syncClientDebt,
    updateClient,
    updateClientTransaction,
    settings,
    formatMoney,
    t,
    lang,
  } = useApp();

  const isTrxEdit = Boolean(transaction);
  const isClientEdit = Boolean(client) && !isTrxEdit;
  const isNew = !client && !transaction;

  // Form states for Client Edit/Create
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [debtAmount, setDebtAmount] = useState('0');
  const [loyaltyPoints, setLoyaltyPoints] = useState('0');
  const [customDiscountPercent, setCustomDiscountPercent] = useState('0');
  const [isLoyaltyClient, setIsLoyaltyClient] = useState(false);
  const [notes, setNotes] = useState('');
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [createdAt, setCreatedAt] = useState(() => new Date().toISOString().split('T')[0]);

  // Form states for Transaction Edit
  const [trxDate, setTrxDate] = useState('');
  const [trxAmount, setTrxAmount] = useState('');
  const [trxNote, setTrxNote] = useState('');

  useEffect(() => {
    if (transaction) {
      setTrxAmount(transaction.amount !== undefined ? String(transaction.amount) : '0');
      setTrxNote(transaction.note || '');
      if (transaction.date) {
        try {
          const d = new Date(transaction.date);
          const tzOffset = d.getTimezoneOffset() * 60000;
          setTrxDate(new Date(d - tzOffset).toISOString().slice(0, 16));
        } catch {
          setTrxDate(new Date().toISOString().slice(0, 16));
        }
      }
    } else if (client) {
      setName(client.name || '');
      setPhone(client.phone || '');
      setEmail(client.email || '');
      setAddress(client.address || '');
      setDebtAmount(client.totalDebt !== undefined ? String(client.totalDebt) : '0');
      setLoyaltyPoints(client.loyaltyPoints !== undefined ? String(client.loyaltyPoints) : '0');
      setCustomDiscountPercent(client.customDiscountPercent !== undefined ? String(client.customDiscountPercent) : '0');
      const hasLoyaltyData = (Number(client.loyaltyPoints) > 0) || (Number(client.customDiscountPercent) > 0);
      setIsLoyaltyClient(Boolean(client.isLoyaltyClient && hasLoyaltyData));
      setNotes(client.notes || '');
      setAdjustmentNote('');
      setCreatedAt(client.createdAt ? client.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setDebtAmount('0');
      setLoyaltyPoints('0');
      setCustomDiscountPercent('0');
      setIsLoyaltyClient(false);
      setNotes('');
      setAdjustmentNote('');
      setCreatedAt(new Date().toISOString().split('T')[0]);
    }
  }, [client, transaction]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isTrxEdit) {
      if (!trxDate || isNaN(Number(trxAmount))) {
        toast.error(t('required'));
        return;
      }
      updateClientTransaction(client.id, transaction.id, {
        amount: Number(trxAmount),
        note: trxNote.trim(),
        date: new Date(trxDate).toISOString(),
      });
      toast.success(
        lang === 'ar'
          ? 'تم تعديل المعاملة المالية بنجاح'
          : lang === 'en'
          ? 'Transaction updated successfully'
          : 'Transaction modifiée avec succès !'
      );
      onClose();
      return;
    }

    if (!name.trim()) {
      toast.error(lang === 'ar' ? 'يرجى إدخال اسم الزبون' : 'Le nom du client est obligatoire');
      return;
    }

    const numDebt = Math.max(0, Number(debtAmount) || 0);
    const numPoints = Math.max(0, Number(loyaltyPoints) || 0);
    const numDiscount = Math.min(100, Math.max(0, Number(customDiscountPercent) || 0));

    if (isClientEdit) {
      updateClient(client.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
        totalDebt: numDebt,
        loyaltyPoints: numPoints,
        customDiscountPercent: numDiscount,
        isLoyaltyClient,
        createdAt: createdAt ? new Date(createdAt + 'T12:00:00').toISOString() : (client.createdAt || new Date().toISOString()),
        adjustmentNote: adjustmentNote.trim(),
      });
      toast.success(t('clientUpdatedSuccess'));
    } else {
      addClient({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
        totalDebt: numDebt,
        loyaltyPoints: numPoints,
        customDiscountPercent: numDiscount,
        isLoyaltyClient,
        createdAt: createdAt ? new Date(createdAt + 'T12:00:00').toISOString() : new Date().toISOString(),
      });
      toast.success(t('clientCreatedSuccess'));
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '540px', width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isTrxEdit ? <CreditCard size={22} /> : <User size={22} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {isTrxEdit
                  ? t('editTransactionModalTitle') || 'Modifier la Transaction'
                  : isClientEdit
                  ? t('editClient')
                  : t('newClient')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {isTrxEdit ? client?.name : t('clientsSubtitle')}
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon btn-outline" onClick={onClose} aria-label={t('close')}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '75vh', overflowY: 'auto' }}>
            
            {/* TRANSACTION EDIT MODE */}
            {isTrxEdit ? (
              <>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={15} className="text-primary" />
                    <span>{t('transactionDateLabel')}</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={trxDate}
                    onChange={(e) => setTrxDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <DollarSign size={15} style={{ color: Number(trxAmount) < 0 ? '#34d399' : '#f87171' }} />
                    <span>{t('transactionAmountLabel')} *</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="0.00"
                      style={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: Number(trxAmount) < 0 ? '#34d399' : '#f87171',
                      }}
                      value={trxAmount}
                      onChange={(e) => setTrxAmount(e.target.value)}
                      required
                    />
                    <div className="input-group-addon">{settings.currency || 'DT'}</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    💡 Montant positif (+) = Dette ajoutée | Montant négatif (-) = Paiement / Règlement
                  </span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('transactionNoteLabel')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Description de la transaction..."
                    value={trxNote}
                    onChange={(e) => setTrxNote(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Client Creation Date Summary Info Badge */}
                {isClientEdit && (
                  <div
                    style={{
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      borderRadius: '10px',
                      padding: '0.6rem 0.85rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={15} style={{ color: 'var(--accent-primary)' }} />
                      <span>{lang === 'ar' ? 'تاريخ تسجيل الحريف :' : "Date d'enregistrement de la fiche :"} <strong style={{ color: 'var(--text-primary)' }}>{client?.createdAt ? new Date(client.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</strong></span>
                    </span>
                    {client?.history && client.history.length > 0 && (
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        {client.history.length} {lang === 'ar' ? 'معاملة مسجلة' : 'opération(s)'}
                      </span>
                    )}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <User size={15} className="text-primary" />
                      <span>{t('clientColName')} *</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Anis Ben Ali, Sonia..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={15} className="text-primary" />
                      <span>{t('contactCol')}</span>
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Ex: 98 123 456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={15} className="text-primary" />
                      <span>{lang === 'ar' ? 'تاريخ الفيش / التسجيل' : "Date de la fiche client"}</span>
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={createdAt}
                      onChange={(e) => setCreatedAt(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mail size={15} className="text-primary" />
                      <span>{t('email')}</span>
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="client@domaine.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={15} className="text-primary" />
                    <span>{t('address')}</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Tunis, Centre-ville"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {/* Loyalty & Discount Settings */}
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Award size={16} style={{ color: 'var(--accent-warning)' }} />
                      <span>{t('clientsTitle')} & Remises</span>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: isLoyaltyClient ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                      <input
                        type="checkbox"
                        checked={isLoyaltyClient}
                        onChange={(e) => setIsLoyaltyClient(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>⭐ {lang === 'ar' ? 'زبون وفي (برنامج الوفاء)' : 'Client Fidélité Actif'}</span>
                    </label>
                  </div>

                  {isLoyaltyClient && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
                          <Percent size={13} className="text-primary" />
                          <span>{t('customDiscount')}</span>
                        </label>
                        <div className="input-group">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            className="form-input"
                            placeholder="0"
                            value={customDiscountPercent}
                            onChange={(e) => setCustomDiscountPercent(e.target.value)}
                          />
                          <div className="input-group-addon">%</div>
                        </div>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
                          <Award size={13} style={{ color: 'var(--accent-warning)' }} />
                          <span>{t('clientColPoints')}</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          placeholder="0"
                          value={loyaltyPoints}
                          onChange={(e) => setLoyaltyPoints(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Initial Debt & Notes */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <DollarSign size={15} style={{ color: Number(debtAmount) > 0 ? '#f87171' : '#34d399' }} />
                    <span>{t('clientDebtBalanceLabel')}</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      style={{
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        color: Number(debtAmount) > 0 ? '#f87171' : 'var(--text-primary)',
                      }}
                      value={debtAmount}
                      onChange={(e) => setDebtAmount(e.target.value)}
                    />
                    <div className="input-group-addon">{settings.currency || 'DT'}</div>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={15} className="text-primary" />
                    <span>{t('clientNotes')}</span>
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Préférences de vape, formules parfums sur mesure, codes schéma téléphone..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-primary" style={{ minWidth: '130px' }}>
              <Check size={16} />
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
