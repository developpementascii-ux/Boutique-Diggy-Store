import React from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function ConfirmDeleteModal({
  title,
  message,
  itemDetails,
  onConfirm,
  onClose,
  confirmButtonText,
  confirmButtonClass = 'btn btn-danger',
  icon: IconComponent = Trash2,
  iconBgColor = 'rgba(239, 68, 68, 0.15)',
  iconColor = '#f87171',
  warningText,
  checkboxOption = null, // { label, checked, onChange, helpText }
}) {
  const { t } = useApp();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '460px', width: '95%', border: '1px solid rgba(239, 68, 68, 0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: iconBgColor,
                color: iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconComponent size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {title || t('delete')}
              </h3>
            </div>
          </div>
          <button type="button" className="btn-icon btn-outline" onClick={onClose} aria-label={t('close')}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem 0' }}>
          {message && (
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {message}
            </p>
          )}

          {itemDetails && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              {itemDetails.title && (
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {itemDetails.title}
                </div>
              )}
              {itemDetails.subtitle && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {itemDetails.subtitle}
                </div>
              )}
              {itemDetails.value && (
                <div
                  className="privacy-blur"
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: itemDetails.valueColor || '#f87171',
                    marginTop: '0.25rem',
                  }}
                >
                  {itemDetails.value}
                </div>
              )}
            </div>
          )}

          {/* Optional Checkbox Option (e.g. Wipe Products Catalog) */}
          {checkboxOption && (
            <div
              style={{
                background: checkboxOption.checked ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-input)',
                border: `1px solid ${checkboxOption.checked ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)'}`,
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => checkboxOption.onChange(!checkboxOption.checked)}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  cursor: 'pointer',
                  margin: 0,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={checkboxOption.checked}
                  onChange={(e) => checkboxOption.onChange(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: 'var(--accent-primary)',
                    marginTop: '2px',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {checkboxOption.label}
                  </div>
                  {checkboxOption.helpText && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                      {checkboxOption.helpText}
                    </div>
                  )}
                </div>
              </label>
            </div>
          )}

          {warningText && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.78rem',
                color: '#f87171',
                background: 'rgba(239, 68, 68, 0.08)',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
              }}
            >
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>{warningText}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className={confirmButtonClass}
            onClick={onConfirm}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <IconComponent size={16} />
            {confirmButtonText || t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
