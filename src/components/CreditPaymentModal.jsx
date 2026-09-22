import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import { X, CheckCircle, HandCoins, Calendar } from 'lucide-react';

export default function CreditPaymentModal({ client, onClose }) {
  const { recordClientPayment, formatMoney, t, lang, settings } = useApp();

  const formatForInput = (d) => {
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const defaultNote = lang === 'ar' ? 'سداد نقداً' : lang === 'en' ? 'Cash settlement' : 'Règlement espèces';
  const [amount, setAmount] = useState(client.totalDebt);
  const [note, setNote] = useState(defaultNote);
  const [paymentDate, setPaymentDate] = useState(() => formatForInput(new Date()));

  const numAmount = Number(amount) || 0;
  const remainingAfter = Math.max(0, client.totalDebt - numAmount);

  const setQuickDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setPaymentDate(formatForInput(d));
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    recordClientPayment(client.id, numAmount, note, paymentDate);
    toast.success(
      lang === 'ar'
        ? `تم تسجيل سداد ${formatMoney(numAmount)} بنجاح`
        : lang === 'en'
        ? `Payment of ${formatMoney(numAmount)} recorded successfully`
        : `Règlement de ${formatMoney(numAmount)} enregistré avec succès !`
    );
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HandCoins size={20} className="text-primary" />
            {t('collectPayment')}
          </h3>
          <button className="btn-icon btn-outline" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handlePay}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Client Summary Box */}
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '12px',
                padding: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: '#94a3b8' }}>{t('colClient')} :</span>
                <strong>{client.name}</strong>
              </div>
              {client.phone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#94a3b8' }}>{t('clientPhone')} :</span>
                  <span>{client.phone}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '0.5rem',
                  borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                }}
              >
                <span>{t('currentTotalDebt')} :</span>
                <span style={{ color: '#f87171' }}>{formatMoney(client.totalDebt)}</span>
              </div>
            </div>

            {/* Payment Amount */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t('paymentAmountLabel')} *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                style={{ fontSize: '1.2rem', fontWeight: 700 }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
              />
            </div>

            {/* Quick Amount Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setAmount(client.totalDebt)}
                style={{ fontSize: '0.78rem' }}
              >
                {t('settleAll')} ({formatMoney(client.totalDebt)})
              </button>
              {client.totalDebt > 20 && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setAmount(Math.floor(client.totalDebt / 2))}
                  style={{ fontSize: '0.78rem' }}
                >
                  50% ({formatMoney(Math.floor(client.totalDebt / 2))})
                </button>
              )}
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setAmount(20)}
                style={{ fontSize: '0.78rem' }}
              >
                20 {settings.currency}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setAmount(50)}
                style={{ fontSize: '0.78rem' }}
              >
                50 {settings.currency}
              </button>
            </div>

            {/* Payment Date Field with Quick Selection */}
            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                  <Calendar size={14} className="text-primary" />
                  {t('paymentDateLabel')}
                </label>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', textDecoration: 'underline' }}
                    onClick={() => setQuickDate(0)}
                  >
                    {t('periodToday') || "Aujourd'hui"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', textDecoration: 'underline' }}
                    onClick={() => setQuickDate(1)}
                  >
                    {t('periodYesterday') || 'Hier'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', textDecoration: 'underline' }}
                    onClick={() => setQuickDate(2)}
                  >
                    -2j
                  </button>
                </div>
              </div>
              <input
                type="datetime-local"
                className="form-input"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            {/* Note */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t('paymentNoteLabel')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={lang === 'ar' ? 'مثال: نقداً، تحويل بنكي...' : lang === 'en' ? 'Ex: Cash, bank transfer...' : 'Ex: Espèces, virement, acompte...'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Remaining Preview */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: 'var(--bg-input)',
                borderRadius: '8px',
                fontSize: '0.9rem',
              }}
            >
              <span>{t('newBalanceAfter')} :</span>
              <strong style={{ color: remainingAfter > 0 ? '#f87171' : '#34d399' }}>
                {formatMoney(remainingAfter)}
              </strong>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-success">
              <CheckCircle size={16} />
              {t('savePayment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
