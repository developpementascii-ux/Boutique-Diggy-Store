import React from 'react';
import { useApp } from '../context/AppContext';
import { Printer, X, CheckCircle } from 'lucide-react';

export default function PrintReceipt({ receiptData, onClose }) {
  const { settings, formatMoney, t, lang } = useApp();

  if (!receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  const isSale = receiptData.type === 'sale';
  const isRepair = receiptData.type === 'repair';
  const isZReport = receiptData.type === 'z_report';
  const data = receiptData.data;

  const getLocale = () => {
    if (lang === 'ar') return 'ar-SA';
    if (lang === 'en') return 'en-US';
    return 'fr-FR';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header no-print">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Printer size={20} className="text-primary" />
            {isZReport ? t('receiptZReportTitle') : isSale ? t('saleReceipt') : t('repairReceipt')}
          </h3>
          <button className="btn-icon btn-outline" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Printable Section */}
        <div className="modal-body print-area" style={{ background: '#fff', color: '#000', padding: '1.5rem', borderRadius: '8px' }}>
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #666', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#000' }}>
              {settings.shopName}
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#444' }}>{settings.shopAddress}</p>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#000' }}>
              {lang === 'ar' ? 'هاتف: ' : lang === 'en' ? 'Tel: ' : 'Tél : '}
              {settings.shopPhone}
            </p>
            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>
              {new Date(data.date || data.createdAt || Date.now()).toLocaleString(getLocale())}
            </p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', fontWeight: 700, color: '#000' }}>
              {lang === 'ar' ? 'رقم ' : 'N° '}
              {isSale ? data.invoiceNumber : data.ticketNumber}
            </p>
          </div>

          {/* Client info if available */}
          {(data.clientName || data.clientPhone) && (
            <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', borderBottom: '1px dashed #ccc', paddingBottom: '0.5rem' }}>
              <div>
                <strong>{t('colClient')} : </strong>
                {data.clientName || (lang === 'ar' ? 'زبون كاش' : lang === 'en' ? 'Counter' : 'Comptoir')}
              </div>
              {data.clientPhone && <div><strong>{t('clientPhone')} : </strong>{data.clientPhone}</div>}
            </div>
          )}

          {/* Sale details */}
          {isSale && (
            <div>
              <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse', marginBottom: '0.75rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                    <th style={{ padding: '4px 0' }}>{t('productName')}</th>
                    <th style={{ padding: '4px 0', textAlign: 'center' }}>{t('qty')}</th>
                    <th style={{ padding: '4px 0', textAlign: lang === 'ar' ? 'left' : 'right' }}>{t('colTotalAmount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items?.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dotted #ddd' }}>
                      <td style={{ padding: '4px 0' }}>{item.name}</td>
                      <td style={{ padding: '4px 0', textAlign: 'center' }}>x{item.quantity}</td>
                      <td style={{ padding: '4px 0', textAlign: lang === 'ar' ? 'left' : 'right', fontWeight: 600 }}>
                        {formatMoney(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed #000', paddingTop: '0.5rem', fontSize: '0.9rem' }}>
                {data.discount > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#555' }}>
                      <span>{t('initialTotal')} :</span>
                      <span>{formatMoney(data.initialAmount || (data.totalAmount + data.discount))}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#047857' }}>
                      <span>{t('discount')} :</span>
                      <span>-{formatMoney(data.discount)}</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span>{t('netToPay')} :</span>
                  <strong>{formatMoney(data.totalAmount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span>{t('paidAmount')} :</span>
                  <span>{formatMoney(data.amountPaid)}</span>
                </div>
                {data.cashGiven > data.totalAmount && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#555' }}>
                      <span>{t('receivedCash')} :</span>
                      <span>{formatMoney(data.cashGiven)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontWeight: 600 }}>
                      <span>{t('changeToReturn')} :</span>
                      <span>{formatMoney(data.changeReturned)}</span>
                    </div>
                  </>
                )}
                {data.remainingCredit > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c00', fontWeight: 700 }}>
                    <span>{t('remainingCredit')} :</span>
                    <span>{formatMoney(data.remainingCredit)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Repair details */}
          {isRepair && (
            <div style={{ fontSize: '0.85rem' }}>
              <div style={{ background: '#f4f4f5', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.75rem' }}>
                <div><strong>{t('deviceModel')} : </strong>{data.deviceModel}</div>
                <div><strong>{t('issueDescription')} : </strong>{data.issueDescription}</div>
                {data.pieceName && (
                  <div>
                    <strong>{t('externalPieceName')} : </strong>{data.pieceName}
                    {Number(data.pieceCost) > 0 && ` (${formatMoney(data.pieceCost)})`}
                  </div>
                )}
                {Number(data.laborCost) > 0 && (
                  <div>
                    <strong>{t('laborCost')} : </strong>{formatMoney(data.laborCost)}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px dashed #000', paddingTop: '0.5rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span>{t('totalPriceQuoted')} :</span>
                  <strong>{formatMoney(data.totalPrice)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span>{t('advancePaid')} :</span>
                  <span>{formatMoney(data.advancePaid)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: data.remainingDue > 0 ? '#b91c1c' : '#047857' }}>
                  <span>{t('remainingDebt')} :</span>
                  <span>{formatMoney(data.remainingDue)}</span>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  <strong>{t('statusLabel')} : </strong>
                  {data.status === 'received' && t('statusReceived')}
                  {data.status === 'in_progress' && t('statusInProgress')}
                  {data.status === 'ready' && t('statusReady')}
                  {data.status === 'delivered' && t('statusDelivered')}
                  {data.status === 'cancelled' && t('statusCancelled')}
                </div>
              </div>
            </div>
          )}

          {/* Daily Cash Closing Z-Report */}
          {isZReport && (
            <div style={{ fontSize: '0.88rem' }}>
              <div style={{ background: '#f4f4f5', padding: '0.55rem', borderRadius: '6px', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('date')} :</span>
                  <strong>{data.date}</strong>
                </div>
                {data.closedAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#555' }}>
                    <span>{t('receiptClosedAt')}</span>
                    <span>{new Date(data.closedAt).toLocaleTimeString(getLocale())}</span>
                  </div>
                )}
                {data.closedBy && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#555' }}>
                    <span>{t('receiptClosedBy')}</span>
                    <span>{data.closedBy}</span>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px dashed #000', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('receiptOpeningCash')}</span>
                  <strong>{formatMoney(data.openingCash)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                  <span>+ {t('receiptCashSales')}</span>
                  <strong>+{formatMoney(data.cashSales)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c' }}>
                  <span>- {t('receiptCashExpenses')}</span>
                  <strong>-{formatMoney(data.cashExpenses)}</strong>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #000',
                    borderBottom: '1px solid #000',
                    padding: '0.4rem 0',
                    margin: '0.3rem 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 700,
                  }}
                >
                  <span>{t('receiptTheoreticalCash')}</span>
                  <span>{formatMoney(data.theoreticalCash)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem' }}>
                  <span>{t('receiptCountedCash')}</span>
                  <span>{formatMoney(data.countedCash)}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 700,
                    color: (data.discrepancy || 0) === 0 ? '#047857' : (data.discrepancy || 0) > 0 ? '#0284c7' : '#b91c1c',
                    background: '#fafafa',
                    padding: '0.35rem',
                    borderRadius: '4px',
                  }}
                >
                  <span>{t('receiptDiscrepancy')}</span>
                  <span>
                    {(data.discrepancy || 0) > 0 ? `+${formatMoney(data.discrepancy)}` : formatMoney(data.discrepancy || 0)}
                  </span>
                </div>

                {data.notes && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontStyle: 'italic', color: '#555' }}>
                    <strong>{t('notes')} :</strong> {data.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed #666', fontSize: '0.75rem', color: '#555' }}>
            <p style={{ margin: 0 }}>{settings.ticketFooter}</p>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="modal-footer no-print">
          <button className="btn btn-secondary" onClick={onClose}>
            {t('close')}
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            {t('printTicketBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
