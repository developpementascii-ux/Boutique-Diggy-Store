import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import {
  X,
  CheckCircle,
  CreditCard,
  Banknote,
  Calendar,
  User,
  Tag,
  AlertTriangle,
  Percent,
  Award,
  Crown,
  Sparkles,
  Phone,
  Search,
  ChevronDown,
  Check,
} from 'lucide-react';

export default function PaymentModal({ cart, totalAmount: initialTotal, totalProfit: initialProfit, onComplete, onClose }) {
  const { clients, getClientStats, processSale, formatMoney, setActiveReceipt, settings, t, lang, isAdmin } = useApp();

  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash', 'partial', 'credit'
  const [discount, setDiscount] = useState(0); // Remise commerciale accordée
  const [cashGiven, setCashGiven] = useState('');
  const [amountPaidPartial, setAmountPaidPartial] = useState(String(Math.floor(initialTotal / 2)));
  const [isDiscountAgreement, setIsDiscountAgreement] = useState(false); // When true: underpayment is treated as agreed discounted price, NOT debt!
  
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const [creditDueDate, setCreditDueDate] = useState(
    new Date(Date.now() + 3600000 * 24 * 7).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

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

  // Selected client loyalty stats
  const clientStats = useMemo(() => {
    if (!selectedClientId) return null;
    return getClientStats(selectedClientId);
  }, [selectedClientId, getClientStats]);

  // When a client is picked from dropdown
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

  const handleApplyLoyaltyDiscount = () => {
    if (!clientStats || clientStats.effectiveDiscountPercent <= 0) return;
    const discountVal = Math.round(((initialTotal * clientStats.effectiveDiscountPercent) / 100) * 100) / 100;
    setDiscount(discountVal);
    toast.success(
      lang === 'ar'
        ? `تم تطبيق خصم الولاء (${clientStats.effectiveDiscountPercent}%) بقيمة ${formatMoney(discountVal)}`
        : `Remise fidélité (${clientStats.effectiveDiscountPercent}%) appliquée : -${formatMoney(discountVal)} !`
    );
  };

  const numDiscount = parseFloat(String(discount).replace(',', '.')) || 0;
  const totalAfterDiscount = Math.max(0, initialTotal - numDiscount);
  const effectiveProfit = Math.max(0, initialProfit - numDiscount);

  // Normalize user input numbers
  const numCashGiven = parseFloat(String(cashGiven).replace(',', '.')) || 0;
  const numPartialPaid = parseFloat(String(amountPaidPartial).replace(',', '.')) || 0;

  // Compute effective paid, change to return and remaining credit
  let effectiveAmountPaid = totalAfterDiscount;
  let changeToReturn = 0;
  let remainingCredit = 0;
  let missingDiff = 0;

  if (paymentMode === 'credit') {
    effectiveAmountPaid = 0;
    remainingCredit = totalAfterDiscount;
  } else if (paymentMode === 'partial') {
    effectiveAmountPaid = Math.min(totalAfterDiscount, Math.max(0, numPartialPaid));
    remainingCredit = Math.max(0, totalAfterDiscount - effectiveAmountPaid);
  } else {
    // Cash mode
    if (numCashGiven > 0) {
      if (numCashGiven >= totalAfterDiscount) {
        effectiveAmountPaid = totalAfterDiscount;
        changeToReturn = numCashGiven - totalAfterDiscount;
        remainingCredit = 0;
      } else {
        // Customer paid LESS than total (e.g. Total 110, Customer gave 100)
        missingDiff = totalAfterDiscount - numCashGiven;
        if (isDiscountAgreement) {
          // Accord commercial / Prix négocié : pas de crédit !
          effectiveAmountPaid = numCashGiven;
          changeToReturn = 0;
          remainingCredit = 0;
        } else {
          // Acompte & Reste à crédit (dette)
          effectiveAmountPaid = numCashGiven;
          changeToReturn = 0;
          remainingCredit = missingDiff;
        }
      }
    } else {
      effectiveAmountPaid = totalAfterDiscount;
      changeToReturn = 0;
      remainingCredit = 0;
    }
  }

  // Effective final sale total
  const finalSaleTotal = isDiscountAgreement && missingDiff > 0
    ? numCashGiven
    : totalAfterDiscount;

  const handleApplyDiscountFromDiff = () => {
    setIsDiscountAgreement(true);
  };

  const handleApplyCreditFromDiff = () => {
    setIsDiscountAgreement(false);
  };

  const handleModeChange = (mode) => {
    setPaymentMode(mode);
    setIsDiscountAgreement(false);
    if (mode === 'cash') {
      setCashGiven('');
    } else if (mode === 'partial') {
      setAmountPaidPartial(String(Math.floor(totalAfterDiscount / 2)));
    }
  };

  const handleFinalize = (e) => {
    e.preventDefault();

    // Verification for credit
    if (remainingCredit > 0 && !clientName.trim()) {
      toast.error(lang === 'ar' ? 'يرجى إدخال اسم الزبون لتسجيل الدين' : 'Le nom du client est obligatoire pour enregistrer un crédit !');
      return;
    }

    const defaultClientName = lang === 'ar' ? 'زبون عابر' : lang === 'en' ? 'Counter Client' : 'Client Comptoir';

    const saleRecord = {
      clientId: selectedClientId || null,
      items: cart,
      initialAmount: initialTotal,
      discount: isDiscountAgreement && missingDiff > 0 ? numDiscount + missingDiff : numDiscount,
      totalAmount: finalSaleTotal,
      totalProfit: effectiveProfit,
      paymentType: paymentMode,
      amountPaid: effectiveAmountPaid,
      cashGiven: paymentMode === 'cash' ? (numCashGiven > 0 ? numCashGiven : effectiveAmountPaid) : effectiveAmountPaid,
      changeReturned: changeToReturn,
      clientName: clientName.trim() || defaultClientName,
      clientPhone: clientPhone.trim(),
      creditDueDate: remainingCredit > 0 ? creditDueDate : null,
      isAgreedPrice: isDiscountAgreement,
      notes: notes.trim(),
    };

    const createdSale = processSale(saleRecord);
    toast.success(
      lang === 'ar'
        ? `تم تسجيل عملية البيع بنجاح (${createdSale.invoiceNumber})`
        : lang === 'en'
        ? `Sale recorded successfully (${createdSale.invoiceNumber})`
        : `Vente enregistrée avec succès (${createdSale.invoiceNumber})`
    );
    onComplete();

    // Open Printable Receipt
    setActiveReceipt({ type: 'sale', data: createdSale });
  };

  // Quick preset pills
  const round10 = Math.ceil(totalAfterDiscount / 10) * 10;
  const round20 = Math.ceil(totalAfterDiscount / 20) * 20;
  const round50 = Math.ceil(totalAfterDiscount / 50) * 50;
  const exactLabel = lang === 'ar' ? `المبلغ بالضبط (${totalAfterDiscount})` : `Exact (${totalAfterDiscount})`;
  const quickPills = [
    { label: exactLabel, val: totalAfterDiscount },
    ...(round10 > totalAfterDiscount ? [{ label: `${round10}`, val: round10 }] : []),
    ...(round20 > totalAfterDiscount && round20 !== round10 ? [{ label: `${round20}`, val: round20 }] : []),
    ...(round50 > totalAfterDiscount && round50 !== round20 ? [{ label: `${round50}`, val: round50 }] : []),
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Banknote size={20} className="text-primary" />
            {t('paymentModalTitle') || 'Encaissement de la Vente'}
          </h3>
          <button className="btn-icon btn-outline" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleFinalize}>
          <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            {/* Total Banner */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.25rem',
                textAlign: 'center',
                marginBottom: '1rem',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                {t('amountDue')}
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0' }}>
                {formatMoney(finalSaleTotal)}
              </div>
              
              {numDiscount > 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-warning)', marginBottom: '0.2rem', fontWeight: 600 }}>
                  Remise accordée : -{formatMoney(numDiscount)} (Total initial: {formatMoney(initialTotal)})
                </div>
              )}

              {isAdmin && (
                <span className="profit-blur" style={{ fontSize: '0.82rem', color: 'var(--accent-success)', fontWeight: 700 }}>
                  {t('estimatedProfit')} +{formatMoney(effectiveProfit)}
                </span>
              )}
            </div>

            {/* Client & Loyalty Selection Box */}
            <div
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                  <User size={15} className="text-primary" />
                  <span>{lang === 'ar' ? 'الحريف & برنامج الوفاء' : 'Client & Programme Fidélité'}</span>
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Crown size={12} />
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
                              👤 {lang === 'ar' ? 'زبون عابر (افتراضي - بدون حساب)' : 'Client Comptoir / Passager (Sans compte)'}
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
                      placeholder={lang === 'ar' ? 'اسم حر للوصل (اختياري)...' : lang === 'en' ? 'Receipt name (optional)...' : 'Nom libre sur ticket (optionnel)...'}
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  )}
                </div>

                {/* Phone field displayed if client selected or entered */}
                {(selectedClientId || clientName) && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="tel"
                      className="form-input"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                      placeholder={lang === 'ar' ? 'رقم هاتف الحريف (اختياري)...' : 'Numéro de téléphone (optionnel)...'}
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Loyalty Reward Notification Banner */}
              {clientStats && clientStats.effectiveDiscountPercent > 0 && numDiscount === 0 && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(245, 158, 11, 0.15))',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-warning)' }}>
                      <Sparkles size={14} /> {t('loyaltyRewardBanner')} ({clientStats.effectiveDiscountPercent}%)
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {t('suggestedDiscount')}: -{formatMoney((initialTotal * clientStats.effectiveDiscountPercent) / 100)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap' }}
                    onClick={handleApplyLoyaltyDiscount}
                  >
                    {t('applyLoyaltyDiscount')}
                  </button>
                </div>
              )}
            </div>

            {/* Payment Mode Selector */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">{t('paymentMethod')}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${paymentMode === 'cash' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleModeChange('cash')}
                >
                  <Banknote size={16} />
                  {t('cash')}
                </button>
                <button
                  type="button"
                  className={`btn ${paymentMode === 'partial' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleModeChange('partial')}
                >
                  <CreditCard size={16} />
                  {t('partial')}
                </button>
                <button
                  type="button"
                  className={`btn ${paymentMode === 'credit' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleModeChange('credit')}
                >
                  <User size={16} />
                  {t('creditClient')}
                </button>
              </div>
            </div>

            {/* Cash Mode */}
            {paymentMode === 'cash' && (
              <div
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Espèces Reçues ({settings.currency || 'DT'})</span>
                      {numCashGiven > 0 && (
                        <span style={{ color: '#818cf8', fontWeight: 700 }}>
                          {formatMoney(numCashGiven)}
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      style={{ fontSize: '1.3rem', fontWeight: 700, padding: '0.75rem 1rem' }}
                      placeholder={`Ex: ${totalAfterDiscount}`}
                      value={cashGiven}
                      onChange={(e) => {
                        setCashGiven(e.target.value);
                        setIsDiscountAgreement(false);
                      }}
                      autoFocus
                    />
                  </div>

                  {/* Quick Shortcut Buttons */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {quickPills.map((pill, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                        onClick={() => {
                          setCashGiven(String(pill.val));
                          setIsDiscountAgreement(false);
                        }}
                      >
                        {pill.label} {settings.currency || 'DT'}
                      </button>
                    ))}
                  </div>

                  {/* Choice when Given < Total */}
                  {numCashGiven > 0 && numCashGiven < totalAfterDiscount && (
                    <div
                      style={{
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        borderRadius: '10px',
                        padding: '0.85rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fbbf24', marginBottom: '0.4rem' }}>
                        Différence constatée ({formatMoney(missingDiff)}) :
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className={`btn btn-sm ${isDiscountAgreement ? 'btn-success' : 'btn-outline'}`}
                          style={{ fontSize: '0.78rem', padding: '0.5rem' }}
                          onClick={handleApplyDiscountFromDiff}
                        >
                          <Tag size={13} />
                          {t('discountAccord') || 'Accord Prix / Remise (0 dette)'}
                        </button>

                        <button
                          type="button"
                          className={`btn btn-sm ${!isDiscountAgreement ? 'btn-danger' : 'btn-outline'}`}
                          style={{ fontSize: '0.78rem', padding: '0.5rem' }}
                          onClick={handleApplyCreditFromDiff}
                        >
                          <CreditCard size={13} />
                          {t('creditClient')} ({formatMoney(missingDiff)})
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Summary Breakdown Box */}
                  <div
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.85rem',
                      borderRadius: '10px',
                      background:
                        remainingCredit > 0
                          ? 'rgba(239, 68, 68, 0.12)'
                          : isDiscountAgreement
                          ? 'rgba(16, 185, 129, 0.12)'
                          : changeToReturn > 0
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${
                        remainingCredit > 0
                          ? 'rgba(239, 68, 68, 0.35)'
                          : isDiscountAgreement
                          ? 'rgba(16, 185, 129, 0.35)'
                          : changeToReturn > 0
                          ? 'rgba(16, 185, 129, 0.35)'
                          : 'rgba(255, 255, 255, 0.08)'
                      }`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.88rem' }}>
                      <span>{t('totalCollected') || 'Encaissé'}:</span>
                      <strong style={{ color: 'var(--accent-success)' }}>{formatMoney(effectiveAmountPaid)}</strong>
                    </div>

                    {isDiscountAgreement && missingDiff > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: 'var(--accent-success)', fontWeight: 800 }}>
                        <span>Remise accordée :</span>
                        <span>-{formatMoney(missingDiff)} ✓</span>
                      </div>
                    )}

                    {changeToReturn > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.98rem', color: 'var(--accent-success)', fontWeight: 800 }}>
                        <span>Monnaie à rendre :</span>
                        <span>{formatMoney(changeToReturn)}</span>
                      </div>
                    )}

                    {remainingCredit > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.98rem', color: 'var(--accent-danger)', fontWeight: 800 }}>
                        <span>Reste dû à crédit :</span>
                        <span>{formatMoney(remainingCredit)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Partial Mode */}
            {paymentMode === 'partial' && (
              <div
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label">Acompte Versé</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      style={{ fontSize: '1.2rem', fontWeight: 700 }}
                      value={amountPaidPartial}
                      onChange={(e) => setAmountPaidPartial(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Reste à Crédit</label>
                    <div
                      style={{
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '8px',
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: 'var(--accent-danger)',
                      }}
                    >
                      {formatMoney(remainingCredit)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* If there is credit -> Client phone & Due Date */}
            {remainingCredit > 0 && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-danger)' }}>
                  <AlertTriangle size={16} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    Enregistrement du Crédit Client ({formatMoney(remainingCredit)}):
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{t('contactCol')}</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Ex: 98 123 456"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Échéance prévue</label>
                    <input
                      type="date"
                      className="form-input"
                      value={creditDueDate}
                      onChange={(e) => setCreditDueDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-primary" style={{ minWidth: '170px' }}>
              <CheckCircle size={16} />
              {t('checkout') || 'Encaisser & Imprimer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
