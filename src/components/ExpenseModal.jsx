import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import {
  X,
  Wallet,
  DollarSign,
  Calendar,
  Tag,
  CreditCard,
  FileText,
  Check,
  AlertCircle,
  Building2,
  Receipt,
  Utensils,
  Truck,
  Zap,
  Users,
  Layers,
} from 'lucide-react';

export default function ExpenseModal({ expense, onClose }) {
  const { addExpense, updateExpense, settings, t, isRTL, lang } = useApp();

  const isEdit = !!expense;

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('supplies');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [date, setDate] = useState(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now - tzOffset).toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (expense) {
      setTitle(expense.title || '');
      setAmount(expense.amount !== undefined ? String(expense.amount) : '');
      setCategory(expense.category || 'other');
      setPaymentMethod(expense.paymentMethod || 'cash');
      if (expense.date) {
        try {
          const d = new Date(expense.date);
          const tzOffset = d.getTimezoneOffset() * 60000;
          setDate(new Date(d - tzOffset).toISOString().slice(0, 16));
        } catch {
          setDate(new Date().toISOString().slice(0, 16));
        }
      }
      setNotes(expense.notes || '');
    }
  }, [expense]);

  const categories = [
    { id: 'supplies', label: t('catSupplies'), icon: Layers, color: '#38bdf8' },
    { id: 'food', label: t('catFood'), icon: Utensils, color: '#f59e0b' },
    { id: 'bills', label: t('catBills'), icon: Zap, color: '#818cf8' },
    { id: 'transport', label: t('catTransport'), icon: Truck, color: '#ec4899' },
    { id: 'salary', label: t('catSalary'), icon: Users, color: '#a855f7' },
    { id: 'rent', label: t('catRent'), icon: Building2, color: '#ef4444' },
    { id: 'other', label: t('catOther'), icon: Receipt, color: '#94a3b8' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) {
      toast.error(t('required'));
      return;
    }

    const payload = {
      title: title.trim(),
      amount: Number(amount),
      category,
      paymentMethod,
      date: new Date(date).toISOString(),
      notes: notes.trim(),
    };

    if (isEdit) {
      updateExpense(expense.id, payload);
      toast.success(
        lang === 'ar'
          ? 'تم تعديل بيانات المصروف بنجاح'
          : lang === 'en'
          ? 'Expense updated successfully'
          : 'Dépense modifiée avec succès !'
      );
    } else {
      addExpense(payload);
      toast.success(
        lang === 'ar'
          ? 'تم تسجيل المصروف بنجاح'
          : lang === 'en'
          ? 'Expense recorded successfully'
          : 'Dépense enregistrée avec succès !'
      );
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '560px', width: '95%' }}
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
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wallet size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {isEdit ? t('editExpenseBtn') : t('newExpenseBtn')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {t('expensesSubtitle')}
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon btn-outline" onClick={onClose} aria-label={t('close')}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Title / Motif */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={15} className="text-primary" />
                <span>{t('expenseTitleLabel')}</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Facture électricité, achat fournitures, repas midi..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Montant & Date (2 colonnes) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <DollarSign size={15} style={{ color: '#f87171' }} />
                  <span>{t('expenseAmountLabel')}</span>
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    placeholder="0.00"
                    style={{
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      color: '#f87171',
                    }}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <div className="input-group-addon">{settings.currency || 'DT'}</div>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={15} className="text-primary" />
                  <span>{t('expenseDateLabel')}</span>
                </label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Catégorie & Mode de paiement (2 colonnes) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Tag size={15} className="text-primary" />
                  <span>{t('expenseCategoryLabel')}</span>
                </label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CreditCard size={15} className="text-primary" />
                  <span>{t('expensePaymentMethod')}</span>
                </label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">{t('paymentCash')}</option>
                  <option value="bank">{t('paymentBank')}</option>
                </select>
              </div>
            </div>

            {/* Note contextuelle pour sortie espèces de caisse */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.8rem',
                padding: '0.7rem 0.9rem',
                background: paymentMethod === 'cash' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(56, 189, 248, 0.08)',
                border: `1px solid ${paymentMethod === 'cash' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.25)'}`,
                borderRadius: '8px',
                color: paymentMethod === 'cash' ? '#f87171' : '#38bdf8',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>
                {paymentMethod === 'cash'
                  ? t('cashBudgetWarning')
                  : t('paymentBank')}
              </span>
            </div>

            {/* Remarques / Reçu */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t('expenseNotesLabel')}</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Ex: Facture N° 8492, Payé au fournisseur, Reçu joint..."
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
            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: '130px' }}
            >
              <Check size={16} />
              {isEdit ? t('save') : t('confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
