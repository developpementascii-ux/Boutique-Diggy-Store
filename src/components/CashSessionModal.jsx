import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import {
  X,
  Wallet,
  DollarSign,
  Check,
  AlertCircle,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function CashSessionModal({ mode = 'open', onClose }) {
  const {
    currentSession,
    setOpeningCash,
    closeCashSession,
    yesterdayClosingBalance,
    todayCashInflow,
    todayCashExpensesAmount,
    formatMoney,
    setActiveReceipt,
    settings,
    lang,
    t,
    isRTL,
  } = useApp();

  const isClosingMode = mode === 'close';

  // Opening float state
  const [openingAmount, setOpeningAmount] = useState(() => {
    return currentSession?.openingCash !== undefined && currentSession?.openingCash !== null
      ? String(currentSession.openingCash)
      : (yesterdayClosingBalance > 0 ? String(yesterdayClosingBalance) : '0');
  });

  // Closing counted cash state
  const openingNum = Number(currentSession?.openingCash) || 0;
  const theoreticalTotal = openingNum + todayCashInflow - todayCashExpensesAmount;
  const [countedCash, setCountedCash] = useState(() => String(theoreticalTotal));
  const [closingNotes, setClosingNotes] = useState('');
  const [autoPrint, setAutoPrint] = useState(true);

  const countedNum = Number(countedCash) || 0;
  const discrepancy = countedNum - theoreticalTotal;

  const handleApplyYesterdayClosing = () => {
    setOpeningAmount(String(yesterdayClosingBalance));
  };

  const handleSaveOpening = (e) => {
    e.preventDefault();
    const amount = Number(openingAmount) || 0;
    setOpeningCash(amount);
    toast.success(
      lang === 'ar'
        ? 'تم تسجيل رصيد افتتاح الصندوق بنجاح'
        : lang === 'en'
        ? 'Opening cash balance recorded successfully'
        : "Fond de caisse d'ouverture enregistré avec succès !"
    );
    onClose();
  };

  const handleConfirmClosing = (e) => {
    e.preventDefault();
    const closedSession = closeCashSession(countedNum, closingNotes, settings.shopName || 'Gérant');
    
    toast.success(
      lang === 'ar'
        ? 'تمت عملية إغلاق الصندوق اليومي بنجاح'
        : lang === 'en'
        ? 'Daily cash register closed successfully'
        : 'Clôture de caisse quotidienne effectuée avec succès !'
    );

    if (autoPrint) {
      setActiveReceipt({
        type: 'z_report',
        data: closedSession,
      });
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
                background: isClosingMode ? 'rgba(168, 85, 247, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: isClosingMode ? '#c084fc' : '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wallet size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {isClosingMode ? t('closeShiftModalTitle') : t('openShiftModalTitle')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {isClosingMode ? t('expensesSubtitle') : t('openingCashHelp')}
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon btn-outline" onClick={onClose} aria-label={t('close')}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        {!isClosingMode ? (
          /* --- MODE 1: OUVERTURE DE CAISSE --- */
          <form onSubmit={handleSaveOpening}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Quick suggestion banner with yesterday's closing */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: yesterdayClosingBalance > 0 ? 'rgba(99, 102, 241, 0.08)' : 'rgba(148, 163, 184, 0.06)',
                  border: `1px solid ${yesterdayClosingBalance > 0 ? 'rgba(99, 102, 241, 0.25)' : 'var(--border-color)'}`,
                  borderRadius: '10px',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {t('yesterdayClosingBalance')}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: yesterdayClosingBalance > 0 ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                    {formatMoney(yesterdayClosingBalance)}
                  </div>
                </div>

                {yesterdayClosingBalance > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={handleApplyYesterdayClosing}
                  >
                    <RotateCcw size={14} />
                    {t('useYesterdayClosing')}
                  </button>
                )}
              </div>

              {/* Opening Amount Input */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <DollarSign size={15} style={{ color: '#34d399' }} />
                  <span>{t('openingCash')} *</span>
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="0.00"
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: '#34d399',
                    }}
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    required
                    autoFocus
                  />
                  <div className="input-group-addon">{settings.currency || 'DT'}</div>
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                ℹ️ {t('openingCashHelp')}
              </p>
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {t('cancel')}
              </button>
              <button type="submit" className="btn btn-primary" style={{ minWidth: '140px' }}>
                <Check size={16} />
                {t('save')}
              </button>
            </div>
          </form>
        ) : (
          /* --- MODE 2: CLÔTURE DE CAISSE (RAPPORT Z) --- */
          <form onSubmit={handleConfirmClosing}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* Shift Summary Breakdown */}
              <div
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>+ {t('openingCash')} :</span>
                  <strong>{formatMoney(openingNum)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#38bdf8' }}>+ {t('totalCashIn')} :</span>
                  <strong style={{ color: '#38bdf8' }}>+{formatMoney(todayCashInflow)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#f87171' }}>- {t('totalCashOut')} :</span>
                  <strong style={{ color: '#f87171' }}>-{formatMoney(todayCashExpensesAmount)}</strong>
                </div>

                <div
                  style={{
                    borderTop: '1px dashed var(--border-color)',
                    paddingTop: '0.65rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                    = {t('theoreticalCash')} :
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--accent-primary)' }}>
                    {formatMoney(theoreticalTotal)}
                  </span>
                </div>
              </div>

              {/* Actual Counted Cash Input */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <DollarSign size={15} style={{ color: '#c084fc' }} />
                  <span>{t('countedCash')} *</span>
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="0.00"
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                    }}
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    required
                    autoFocus
                  />
                  <div className="input-group-addon">{settings.currency || 'DT'}</div>
                </div>
              </div>

              {/* Discrepancy Live Alert */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background:
                    discrepancy === 0
                      ? 'rgba(16, 185, 129, 0.12)'
                      : discrepancy > 0
                      ? 'rgba(56, 189, 248, 0.12)'
                      : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${
                    discrepancy === 0
                      ? 'rgba(16, 185, 129, 0.3)'
                      : discrepancy > 0
                      ? 'rgba(56, 189, 248, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)'
                  }`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {discrepancy === 0 ? (
                    <CheckCircle2 size={18} style={{ color: '#34d399' }} />
                  ) : (
                    <AlertTriangle
                      size={18}
                      style={{ color: discrepancy > 0 ? '#38bdf8' : '#f87171' }}
                    />
                  )}
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    {discrepancy === 0
                      ? t('cashBalanced')
                      : discrepancy > 0
                      ? t('cashSurplus')
                      : t('cashShortage')}
                  </span>
                </div>

                <strong
                  style={{
                    fontSize: '1.05rem',
                    color:
                      discrepancy === 0
                        ? '#34d399'
                        : discrepancy > 0
                        ? '#38bdf8'
                        : '#f87171',
                  }}
                >
                  {discrepancy > 0 ? `+${formatMoney(discrepancy)}` : formatMoney(discrepancy)}
                </strong>
              </div>

              {/* Notes */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('notes')}</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder={t('closingNotesPlaceholder')}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                />
              </div>

              {/* Checkbox auto print */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={autoPrint}
                  onChange={(e) => setAutoPrint(e.target.checked)}
                />
                <span>🖨️ {t('printZReport')}</span>
              </label>
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ background: '#a855f7', borderColor: '#a855f7', minWidth: '180px' }}
              >
                <Check size={16} />
                {t('confirmCloseSession')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
