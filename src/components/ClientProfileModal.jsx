import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  Crown,
  Percent,
  ShoppingCart,
  Wrench,
  CreditCard,
  Banknote,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ChevronRight,
  Edit2,
  Package,
} from 'lucide-react';

export default function ClientProfileModal({ clientId, onEditClient, onPayCredit, onClose }) {
  const { clients, getClientStats, formatMoney, setActiveReceipt, t, lang } = useApp();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sales' | 'repairs' | 'credits'

  const stats = useMemo(() => {
    return getClientStats(clientId);
  }, [clientId, clients, getClientStats]);

  if (!stats || !stats.client) return null;

  const {
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
    progressToNext,
    remainingToNext,
    lastVisit,
  } = stats;

  const getLocale = () => {
    if (lang === 'ar') return 'ar-SA';
    if (lang === 'en') return 'en-US';
    return 'fr-FR';
  };

  const getTierBadge = () => {
    if (loyaltyTier === 'platinum') {
      return (
        <span
          className="badge"
          style={{
            background: 'linear-gradient(135deg, rgba(229, 231, 235, 0.25), rgba(168, 85, 247, 0.25))',
            color: '#c084fc',
            border: '1px solid rgba(168, 85, 247, 0.5)',
            fontSize: '0.82rem',
            fontWeight: 800,
            padding: '0.3rem 0.75rem',
            gap: '0.35rem',
          }}
        >
          <Crown size={14} /> 💎 {t('clientTierPlatinum')} ({effectiveDiscountPercent}% {t('discountAccord') || 'Remise'})
        </span>
      );
    }
    if (loyaltyTier === 'gold') {
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            fontSize: '0.82rem',
            fontWeight: 800,
            padding: '0.3rem 0.75rem',
            gap: '0.35rem',
          }}
        >
          <Award size={14} /> 🥇 {t('clientTierGold')} ({effectiveDiscountPercent}% {t('discountAccord') || 'Remise'})
        </span>
      );
    }
    if (loyaltyTier === 'silver') {
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(148, 163, 184, 0.15)',
            color: '#94a3b8',
            border: '1px solid rgba(148, 163, 184, 0.4)',
            fontSize: '0.82rem',
            fontWeight: 700,
            padding: '0.3rem 0.75rem',
            gap: '0.35rem',
          }}
        >
          <Award size={14} /> 🥈 {t('clientTierSilver')} ({effectiveDiscountPercent}% {t('discountAccord') || 'Remise'})
        </span>
      );
    }
    return (
      <span
        className="badge"
        style={{
          background: 'rgba(205, 127, 50, 0.15)',
          color: '#d97706',
          border: '1px solid rgba(205, 127, 50, 0.3)',
          fontSize: '0.82rem',
          fontWeight: 700,
          padding: '0.3rem 0.75rem',
          gap: '0.35rem',
        }}
      >
        🥉 {t('clientTierBronze')}
      </span>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '820px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Profile Summary */}
        <div className="modal-header" style={{ alignItems: 'flex-start', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 800,
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              {client.name.charAt(0).toUpperCase()}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {client.name}
                </h3>
                {getTierBadge()}
              </div>

              {/* Contact meta row */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {client.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Phone size={13} className="text-primary" />
                    {client.phone}
                  </span>
                )}
                {client.email && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Mail size={13} className="text-primary" />
                    {client.email}
                  </span>
                )}
                {client.address && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={13} className="text-primary" />
                    {client.address}
                  </span>
                )}
                {lastVisit && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={13} />
                    {t('clientColLastVisit')}: {new Date(lastVisit).toLocaleDateString(getLocale())}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onEditClient(client)}
              title={t('editClient')}
            >
              <Edit2 size={14} />
              <span>{t('edit')}</span>
            </button>
            <button type="button" className="btn-icon btn-outline" onClick={onClose} aria-label={t('close')}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Loyalty Progress Banner */}
        <div
          style={{
            margin: '0 1.5rem',
            padding: '0.85rem 1rem',
            background: 'var(--bg-secondary)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Award size={15} style={{ color: 'var(--accent-warning)' }} />
              {t('loyaltyProgress')} : {points} {t('points')}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {nextTierName
                ? `${t('potentialProfit') || 'Reste'}: ${formatMoney(remainingToNext)} → ${nextTierName}`
                : `🏆 ${t('maxRewardReached')}`}
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressToNext}%`,
                height: '100%',
                background: loyaltyTier === 'platinum'
                  ? 'linear-gradient(90deg, #c084fc, #e5e7eb)'
                  : 'linear-gradient(90deg, var(--accent-primary), var(--accent-warning))',
                borderRadius: '999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Tabs Bar */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem 0',
            borderBottom: '1px solid var(--border-color)',
            marginTop: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('overview')}
          >
            <User size={14} />
            <span>{t('tabOverview')}</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'sales' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('sales')}
          >
            <ShoppingCart size={14} />
            <span>{t('tabSalesHistory')} ({clientSales.length})</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'repairs' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('repairs')}
          >
            <Wrench size={14} />
            <span>{t('tabRepairsHistory')} ({clientRepairs.length})</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'credits' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('credits')}
          >
            <CreditCard size={14} />
            <span>{t('tabCreditsHistory')} ({Number(client.totalDebt) > 0 ? formatMoney(client.totalDebt) : '0'})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Quick KPI stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
                <div className="ui-card" style={{ padding: '0.85rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t('totalRevenue')}</span>
                  {Number(totalLifetimeSpent) > 0 ? (
                    <strong className="privacy-blur" style={{ fontSize: '1.15rem', color: 'var(--accent-primary)', display: 'block', marginTop: '0.25rem' }}>
                      {formatMoney(totalLifetimeSpent)}
                    </strong>
                  ) : (
                    <span style={{ fontSize: '1.15rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem', fontWeight: 600 }}>
                      —
                    </span>
                  )}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {clientSales.length} 🛒 + {clientRepairs.length} 🔧
                  </span>
                </div>

                <div className="ui-card" style={{ padding: '0.85rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t('clientColPoints')}</span>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--accent-warning)', display: 'block', marginTop: '0.25rem' }}>
                    {points} {t('points')}
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    1 DT = 1 point
                  </span>
                </div>

                <div className="ui-card" style={{ padding: '0.85rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t('suggestedDiscount')}</span>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--accent-success)', display: 'block', marginTop: '0.25rem' }}>
                    {effectiveDiscountPercent}%
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {client.customDiscountPercent > 0 ? t('permanentDiscount') : `${loyaltyTier.toUpperCase()}`}
                  </span>
                </div>

                <div className="ui-card" style={{ padding: '0.85rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t('clientColDebt')}</span>
                  <strong className="privacy-blur" style={{ fontSize: '1.15rem', color: Number(client.totalDebt) > 0 ? 'var(--accent-danger)' : 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                    {formatMoney(client.totalDebt || 0)}
                  </strong>
                  {Number(client.totalDebt) > 0 && (
                    <button
                      className="btn btn-sm btn-outline"
                      style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', marginTop: '0.25rem', color: 'var(--accent-danger)' }}
                      onClick={() => onPayCredit(client)}
                    >
                      {t('payDebtBtn') || 'Régler'}
                    </button>
                  )}
                </div>
              </div>

              {/* Notes & Client Preferences */}
              <div className="ui-card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FileText size={15} className="text-primary" />
                  <span>{t('clientNotes')}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: client.notes ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: client.notes ? 'normal' : 'italic' }}>
                  {client.notes || 'Aucune note enregistrée pour ce client.'}
                </p>
              </div>

              {/* Quick Summary of Recent Activity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Last Sale */}
                <div className="ui-card" style={{ padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                    <ShoppingCart size={14} className="text-primary" />
                    <span>Dernier Achat en Caisse</span>
                  </div>
                  {clientSales.length > 0 ? (
                    <div style={{ fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{clientSales[0].invoiceNumber}</strong>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{formatMoney(clientSales[0].totalAmount)}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                        {new Date(clientSales[0].date).toLocaleString(getLocale())}
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('noSalesForClient')}</span>
                  )}
                </div>

                {/* Last Repair */}
                <div className="ui-card" style={{ padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                    <Wrench size={14} className="text-primary" />
                    <span>Dernière Fiche SAV</span>
                  </div>
                  {clientRepairs.length > 0 ? (
                    <div style={{ fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{clientRepairs[0].deviceModel}</strong>
                        <span style={{ color: 'var(--accent-info)', fontWeight: 700 }}>{formatMoney(clientRepairs[0].totalPrice)}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                        {clientRepairs[0].issueDescription}
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('noRepairsForClient')}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SALES HISTORY */}
          {activeTab === 'sales' && (
            <div>
              {clientSales.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <ShoppingCart size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                  <p>{t('noSalesForClient')}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {clientSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="ui-card"
                      style={{
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge badge-blue" style={{ fontWeight: 700 }}>
                            {sale.invoiceNumber}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(sale.date).toLocaleString(getLocale())}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {formatMoney(sale.totalAmount)}
                          </strong>
                          <button
                            className="btn-icon btn-outline btn-sm"
                            title={t('reprintBtn')}
                            onClick={() => setActiveReceipt({ type: 'sale', data: sale })}
                          >
                            <Printer size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Items List */}
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '0.5rem 0.65rem', borderRadius: '6px' }}>
                        {(sale.items || []).map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>• {it.name} <span style={{ color: 'var(--text-muted)' }}>(x{it.quantity})</span></span>
                            <span style={{ fontWeight: 600 }}>{formatMoney(it.total)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Discount & Payment footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>
                          {sale.discount > 0 && `🏷️ Remise: -${formatMoney(sale.discount)} • `}
                          {t('paid')}: <strong style={{ color: 'var(--accent-success)' }}>{formatMoney(sale.amountPaid)}</strong>
                        </span>
                        {sale.remainingCredit > 0 && (
                          <span style={{ color: 'var(--accent-danger)', fontWeight: 700 }}>
                            {t('credit')}: {formatMoney(sale.remainingCredit)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REPAIRS HISTORY */}
          {activeTab === 'repairs' && (
            <div>
              {clientRepairs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <Wrench size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                  <p>{t('noRepairsForClient')}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {clientRepairs.map((rep) => (
                    <div
                      key={rep.id}
                      className="ui-card"
                      style={{
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge badge-purple" style={{ fontWeight: 700 }}>
                            {rep.ticketNumber}
                          </span>
                          <strong>{rep.deviceModel}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge badge-green">
                            {rep.status === 'delivered' ? t('repairDeliveredSettled') : rep.status}
                          </span>
                          <button
                            className="btn-icon btn-outline btn-sm"
                            title={t('reprintBtn')}
                            onClick={() => setActiveReceipt({ type: 'repair', data: rep })}
                          >
                            <Printer size={13} />
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div><strong>Diagnostic:</strong> {rep.issueDescription}</div>
                        {rep.pieceName && (
                          <div style={{ color: 'var(--accent-info)', marginTop: '0.2rem' }}>
                            🔧 Pièce: {rep.pieceName}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.35rem', borderTop: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {new Date(rep.deliveredAt || rep.createdAt).toLocaleString(getLocale())}
                        </span>
                        <div>
                          <strong>{t('colTotalAmount')}: {formatMoney(rep.totalPrice)}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CREDITS & PAYMENTS */}
          {activeTab === 'credits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: Number(client.totalDebt) > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: `1px solid ${Number(client.totalDebt) > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Solde Débiteur Actuel :</span>
                  <div className="privacy-blur" style={{ fontSize: '1.4rem', fontWeight: 800, color: Number(client.totalDebt) > 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                    {formatMoney(client.totalDebt || 0)}
                  </div>
                </div>

                {Number(client.totalDebt) > 0 && (
                  <button className="btn btn-primary" onClick={() => onPayCredit(client)}>
                    <Banknote size={16} />
                    <span>{t('payDebtBtn') || 'Encaisser Règlement'}</span>
                  </button>
                )}
              </div>

              {/* Transactions Ledger */}
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Historique des Mouvements de Crédit
              </div>

              {(!client.history || client.history.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Aucun historique de crédit pour ce client.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {client.history.map((trx) => {
                    const isPayment = Number(trx.amount) < 0 || trx.type === 'payment';
                    return (
                      <div
                        key={trx.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.65rem 0.85rem',
                          background: 'var(--bg-input)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.82rem',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{trx.note}</div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {new Date(trx.date).toLocaleString(getLocale())}
                          </span>
                        </div>
                        <strong
                          style={{
                            fontSize: '0.92rem',
                            color: isPayment ? 'var(--accent-success)' : 'var(--accent-danger)',
                          }}
                        >
                          {isPayment ? `${formatMoney(Math.abs(trx.amount))}` : `+${formatMoney(trx.amount)}`}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            ID: {client.id}
          </span>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
