import React, { useState, useEffect, useMemo } from 'react';
import { useApp, isGenericClientName } from '../context/AppContext';
import { toast } from 'sonner';
import {
  X,
  User,
  Phone,
  Calendar,
  CreditCard,
  Banknote,
  FileText,
  Check,
  Tag,
  ShoppingCart,
  Sparkles,
  Package,
  UserPlus,
  Search,
  ChevronDown,
} from 'lucide-react';

export default function EditSaleModal({ sale, onClose }) {
  const { clients, getClientStats, updateSale, formatMoney, settings, t, lang } = useApp();

  const [selectedClientId, setSelectedClientId] = useState(sale?.clientId || '');
  const [clientName, setClientName] = useState(sale?.clientName || '');
  const [clientPhone, setClientPhone] = useState(sale?.clientPhone || '');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const [paymentType, setPaymentType] = useState(sale?.paymentType || 'cash');
  const [notes, setNotes] = useState(sale?.notes || '');
  const [saleDate, setSaleDate] = useState(() => {
    if (sale?.date) {
      try {
        const d = new Date(sale.date);
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d - tzOffset).toISOString().slice(0, 16);
      } catch {
        return new Date().toISOString().slice(0, 16);
      }
    }
    return new Date().toISOString().slice(0, 16);
  });

  // Sorted list of declared loyalty clients (Alphabetical A-Z)
  const sortedLoyaltyClients = useMemo(() => {
    return (clients || [])
      .filter((c) => c && (c.isLoyaltyClient || c.id === selectedClientId))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
  }, [clients, selectedClientId]);

  // Filtered list based on search query (name or phone)
  const filteredLoyaltyClients = useMemo(() => {
    const q = clientSearchQuery.toLowerCase().trim();
    if (!q) return sortedLoyaltyClients;
    return sortedLoyaltyClients.filter((c) => {
      const matchName = c.name && c.name.toLowerCase().includes(q);
      const matchPhone = c.phone && c.phone.toLowerCase().includes(q);
      return matchName || matchPhone;
    });
  }, [sortedLoyaltyClients, clientSearchQuery]);

  useEffect(() => {
    if (sale) {
      if (sale.clientId) {
        setSelectedClientId(sale.clientId);
      } else {
        const found = clients.find(
          (c) => (sale.clientName && c.name.toLowerCase() === sale.clientName.toLowerCase().trim()) ||
                 (sale.clientPhone && c.phone === sale.clientPhone.trim())
        );
        if (found) {
          setSelectedClientId(found.id);
        }
      }
      setClientName(sale.clientName || '');
      setClientPhone(sale.clientPhone || '');
      setPaymentType(sale.paymentType || 'cash');
      setNotes(sale.notes || '');
    }
  }, [sale, clients]);

  const handleSelectClient = (clientId) => {
    setSelectedClientId(clientId);
    if (!clientId) {
      setClientName('');
      setClientPhone('');
      return;
    }
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setClientName(found.name || '');
      setClientPhone(found.phone || '');
    }
  };

  const handleNameChange = (val) => {
    setClientName(val);
    const trimmed = val.trim();
    if (!trimmed || isGenericClientName(trimmed)) {
      setSelectedClientId('');
      return;
    }
    // Check if matches existing client
    const found = clients.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (found) {
      setSelectedClientId(found.id);
      if (found.phone && !clientPhone) {
        setClientPhone(found.phone);
      }
    } else {
      setSelectedClientId('');
    }
  };

  const clientStats = selectedClientId ? getClientStats(selectedClientId) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sale) return;

    const defaultClientName = lang === 'ar' ? 'زبون عابر' : lang === 'en' ? 'Walk-in Client' : 'Client Comptoir';

    updateSale(sale.id, {
      clientId: selectedClientId || null,
      clientName: selectedClientId ? clientName : (clientName.trim() || defaultClientName),
      clientPhone: clientPhone.trim(),
      paymentType,
      notes: notes.trim(),
      date: new Date(saleDate).toISOString(),
    });

    toast.success(
      lang === 'ar'
        ? `تم تحديث عملية البيع (${sale.invoiceNumber}) بنجاح`
        : lang === 'en'
        ? `Sale (${sale.invoiceNumber}) updated successfully`
        : `Vente (${sale.invoiceNumber}) modifiée avec succès !`
    );

    onClose();
  };

  if (!sale) return null;

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
              <ShoppingCart size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {t('editSaleTitle') || 'Modifier la Vente'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {sale.invoiceNumber} • {formatMoney(sale.totalAmount)}
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon btn-outline" onClick={onClose} aria-label={t('close')}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '75vh', overflowY: 'auto' }}>
            
            {/* Items Recap Box */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Articles vendus (x{(sale.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0)}) :</span>
                <strong style={{ color: 'var(--accent-primary)' }}>{formatMoney(sale.totalAmount)}</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', color: 'var(--text-secondary)' }}>
                {(sale.items || []).map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• {it.name} <span style={{ color: 'var(--text-muted)' }}>(x{it.quantity})</span></span>
                    <span>{formatMoney(it.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Assignment Box */}
            <div
              style={{
                background: 'var(--bg-input)',
                padding: '0.85rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={15} className="text-primary" />
                  <span>{t('clientColName')}</span>
                </label>

                {clientStats && (
                  <span
                    className="badge"
                    style={{
                      background: clientStats.loyaltyTier === 'platinum'
                        ? 'linear-gradient(135deg, rgba(229, 231, 235, 0.25), rgba(168, 85, 247, 0.25))'
                        : clientStats.loyaltyTier === 'gold'
                        ? 'rgba(245, 158, 11, 0.2)'
                        : clientStats.loyaltyTier === 'silver'
                        ? 'rgba(148, 163, 184, 0.2)'
                        : 'rgba(205, 127, 50, 0.15)',
                      color: clientStats.loyaltyTier === 'platinum'
                        ? '#c084fc'
                        : clientStats.loyaltyTier === 'gold'
                        ? '#fbbf24'
                        : clientStats.loyaltyTier === 'silver'
                        ? '#94a3b8'
                        : '#d97706',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                    }}
                  >
                    {clientStats.loyaltyTier.toUpperCase()} ({clientStats.points} {t('points')})
                  </span>
                )}
              </div>

              {/* Searchable Client Selector & Free Ticket Name */}
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'grid', gridTemplateColumns: selectedClientId ? '1fr' : '1.3fr 1fr', gap: '0.5rem' }}>
                  {/* Searchable Input Container */}
                  <div style={{ position: 'relative' }}>
                    <div className="input-with-icon" style={{ position: 'relative' }}>
                      <Search size={15} style={{ color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        className="form-input"
                        placeholder={
                          selectedClientId
                            ? `⭐ ${clientName}`
                            : (lang === 'ar' ? '🔍 ابحث بالاسم أو الهاتف (مرتبة أ-ي)...' : '🔍 Rechercher client (A-Z ou Téléphone)...')
                        }
                        value={isClientSearchOpen ? clientSearchQuery : (selectedClientId ? `⭐ ${clientName}` : '')}
                        onFocus={() => {
                          setIsClientSearchOpen(true);
                          setClientSearchQuery('');
                        }}
                        onChange={(e) => {
                          setClientSearchQuery(e.target.value);
                          setIsClientSearchOpen(true);
                        }}
                        style={{
                          fontWeight: selectedClientId ? 600 : 400,
                          paddingRight: '2rem',
                          borderColor: selectedClientId ? 'var(--accent-primary)' : undefined,
                        }}
                      />
                      {selectedClientId ? (
                        <button
                          type="button"
                          className="btn-icon"
                          style={{
                            position: 'absolute',
                            right: lang === 'ar' ? 'unset' : '8px',
                            left: lang === 'ar' ? '8px' : 'unset',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                          title={lang === 'ar' ? 'إلغاء التعيين / زبون عابر' : 'Désélectionner (Passager)'}
                          onClick={() => {
                            handleSelectClient('');
                            setClientSearchQuery('');
                            setIsClientSearchOpen(false);
                          }}
                        >
                          <X size={14} />
                        </button>
                      ) : (
                        <ChevronDown
                          size={14}
                          style={{
                            position: 'absolute',
                            right: lang === 'ar' ? 'unset' : '10px',
                            left: lang === 'ar' ? '10px' : 'unset',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                    </div>

                    {/* Search Dropdown Popup */}
                    {isClientSearchOpen && (
                      <>
                        <div
                          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                          onClick={() => setIsClientSearchOpen(false)}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '4px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
                            zIndex: 100,
                            maxHeight: '220px',
                            overflowY: 'auto',
                          }}
                        >
                          {/* Option: Walk-in / Passager */}
                          <div
                            style={{
                              padding: '0.6rem 0.85rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: !selectedClientId ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                              fontWeight: !selectedClientId ? 700 : 400,
                              fontSize: '0.82rem',
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectClient('');
                              setIsClientSearchOpen(false);
                            }}
                          >
                            <span style={{ color: 'var(--text-primary)' }}>
                              👤 {lang === 'ar' ? 'زبون عابر (بدون حساب)' : 'Client Comptoir / Passager'}
                            </span>
                            {!selectedClientId && <Check size={14} className="text-primary" />}
                          </div>

                          {/* Filtered & Sorted Clients List */}
                          {filteredLoyaltyClients.length === 0 ? (
                            <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {lang === 'ar' ? 'لا يوجد زبون بهذا الاسم' : 'Aucun client fidélité trouvé'}
                            </div>
                          ) : (
                            filteredLoyaltyClients.map((c) => {
                              const isSelected = selectedClientId === c.id;
                              const stats = getClientStats(c.id);
                              return (
                                <div
                                  key={c.id}
                                  style={{
                                    padding: '0.55rem 0.85rem',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                    fontSize: '0.82rem',
                                  }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectClient(c.id);
                                    setIsClientSearchOpen(false);
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                      ⭐ {c.name}
                                    </div>
                                    {c.phone && (
                                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                        📞 {c.phone}
                                      </div>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {stats && (
                                      <span
                                        className="badge"
                                        style={{
                                          fontSize: '0.68rem',
                                          padding: '0.15rem 0.4rem',
                                          background: stats.loyaltyTier === 'platinum'
                                            ? 'rgba(168, 85, 247, 0.2)'
                                            : stats.loyaltyTier === 'gold'
                                            ? 'rgba(245, 158, 11, 0.2)'
                                            : 'rgba(148, 163, 184, 0.2)',
                                          color: stats.loyaltyTier === 'gold' ? '#fbbf24' : stats.loyaltyTier === 'platinum' ? '#c084fc' : '#94a3b8',
                                        }}
                                      >
                                        {stats.loyaltyTier.toUpperCase()}
                                      </span>
                                    )}
                                    {Number(c.totalDebt) > 0 && (
                                      <span className="badge badge-red" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>
                                        🔴 Dette: {formatMoney(c.totalDebt)}
                                      </span>
                                    )}
                                    {isSelected && <Check size={14} className="text-primary" />}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Free ticket name if not selected or to customize */}
                  {!selectedClientId && (
                    <input
                      type="text"
                      className="form-input"
                      placeholder={lang === 'ar' ? 'اسم حر للوصل...' : 'Nom libre sur ticket...'}
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  )}
                </div>

                {/* Phone field */}
                <div className="form-group" style={{ margin: '0.5rem 0 0 0' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
                    <Phone size={13} className="text-primary" />
                    <span>{t('contactCol')}</span>
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Ex: 98 123 456"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Date & Payment Mode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} className="text-primary" />
                  <span>{t('colDateTime')}</span>
                </label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Banknote size={14} className="text-primary" />
                  <span>{t('paymentTypeCol')}</span>
                </label>
                <select
                  className="form-select"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                >
                  <option value="cash">💵 {t('cash')}</option>
                  <option value="credit">🔴 {t('credit')}</option>
                  <option value="partial">🟡 {t('partial')}</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={14} className="text-primary" />
                <span>{t('notes')}</span>
              </label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Remarques sur la vente, accord commercial..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
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
