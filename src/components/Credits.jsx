import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import {
  CreditCard,
  Search,
  HandCoins,
  History,
  Phone,
  User,
  Plus,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Calendar,
  TrendingUp,
  ArrowDownRight,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Archive,
} from 'lucide-react';
import ClientModal from './ClientModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function Credits({ onOpenPaymentModal, onPayCredit }) {
  const {
    clients,
    totalClientsDebt,
    clientsWithDebt,
    formatMoney,
    deleteClient,
    deleteClientTransaction,
    archiveCreditTransaction,
    t,
    lang,
    isRTL,
    settings,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [filterMode, setFilterMode] = useState('with_debt'); // 'with_debt', 'all', 'settled'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'yesterday', '7d', '30d', 'custom'
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Format date display for date picker pill
  const formattedCustomDate = useMemo(() => {
    if (!customDate) return '';
    const parts = customDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return customDate;
  }, [customDate]);

  // Export State (Excel, CSV, TXT)
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState('current'); // 'current', 'date', 'all', 'client'
  const [exportSpecificDate, setExportSpecificDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [exportFormat, setExportFormat] = useState('excel'); // 'excel', 'csv', 'txt'

  // Modal State for Edit/Create client or transaction
  const [modalState, setModalState] = useState({
    open: false,
    client: null,
    transaction: null,
  });

  // Modal State for Delete Confirmation Modal (replacing window.confirm)
  const [deleteConfirmState, setDeleteConfirmState] = useState({
    open: false,
    type: null, // 'transaction' or 'client'
    client: null,
    transaction: null,
  });

  const localeCode = lang === 'ar' ? 'ar-TN' : lang === 'en' ? 'en-US' : 'fr-FR';

  // Date boundary calculation for period filtering
  const periodBounds = useMemo(() => {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    if (dateFilter === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (dateFilter === 'yesterday') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateFilter === '7d') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (dateFilter === '30d') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (dateFilter === 'custom') {
      const targetDate = customDate ? new Date(customDate + 'T00:00:00') : new Date();
      startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
    }

    const isInPeriod = (dateStr) => {
      if (!startDate || !endDate) return true;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= startDate && d <= endDate;
    };

    return { startDate, endDate, isInPeriod };
  }, [dateFilter, customDate]);

  const [showCollectedModal, setShowCollectedModal] = useState(false);
  const [collectedSearch, setCollectedSearch] = useState('');

  // Statistics for the selected date period
  const periodStats = useMemo(() => {
    let collectedAmount = 0;
    let collectedCount = 0;
    let newDebtAmount = 0;
    let newDebtCount = 0;
    const collectedList = [];
    const seenCollected = new Set();
    const seenDebt = new Set();

    clients.forEach((c) => {
      if (Array.isArray(c.history)) {
        c.history.forEach((trx, idx) => {
          if (periodBounds.isInPeriod(trx.date)) {
            const isPayment = !trx.archived && (Number(trx.amount) < 0 || trx.type === 'payment' || trx.type === 'repair_payment' || trx.type === 'settlement');
            const amt = Math.abs(Number(trx.amount) || 0);
            const dateMin = trx.date ? trx.date.substring(0, 16) : '';
            const refKey = trx.referenceId ? `ref:${trx.referenceId}:${trx.type}` : null;
            const noteKey = trx.note ? `note:${trx.note.trim().toLowerCase()}:${amt}:${dateMin}` : null;
            const dedupeKey = refKey || noteKey || `idx:${c.id || c.name}:${trx.id || idx}`;

            if (isPayment) {
              if (!seenCollected.has(dedupeKey)) {
                seenCollected.add(dedupeKey);
                collectedAmount += amt;
                collectedCount += 1;
                collectedList.push({
                  ...trx,
                  clientId: c.id,
                  clientName: c.name,
                  clientPhone: c.phone,
                  paidAmount: amt,
                });
              }
            } else if (!trx.archived) {
              if (!seenDebt.has(dedupeKey)) {
                seenDebt.add(dedupeKey);
                newDebtAmount += Number(trx.amount) || 0;
                newDebtCount += 1;
              }
            }
          }
        });
      }
    });

    collectedList.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      collectedAmount,
      collectedCount,
      newDebtAmount,
      newDebtCount,
      collectedList,
    };
  }, [clients, periodBounds]);

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  const filteredClients = useMemo(() => {
    const seen = new Set();
    return clients.filter((c) => {
      if (!c || !c.id) return false;
      const dedupeKey = c.id || `${c.name?.trim().toLowerCase()}-${c.phone || ''}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q));

      const hasDebt = Number(c.totalDebt) > 0;
      let matchFilterMode = true;
      if (filterMode === 'with_debt') matchFilterMode = hasDebt;
      if (filterMode === 'settled') matchFilterMode = !hasDebt;

      // When dateFilter !== 'all', also filter clients who had transactions in that period
      if (dateFilter !== 'all') {
        const hadTrxInPeriod = (c.history || []).some((trx) => periodBounds.isInPeriod(trx.date));
        return matchQuery && matchFilterMode && hadTrxInPeriod;
      }

      return matchQuery && matchFilterMode;
    });
  }, [clients, searchQuery, filterMode, dateFilter, periodBounds]);

  // Clean deduplicated transaction history for selected client
  const clientHistory = useMemo(() => {
    if (!selectedClient || !Array.isArray(selectedClient.history)) return [];
    const seenTrx = new Set();
    return selectedClient.history.filter((trx, idx) => {
      if (!trx) return false;
      const dateMin = trx.date ? trx.date.substring(0, 16) : '';
      const amt = Number(trx.amount) || 0;
      const refKey = trx.referenceId ? `ref:${trx.referenceId}:${trx.type}` : null;
      const noteKey = trx.note ? `note:${trx.note.trim().toLowerCase()}:${amt}:${dateMin}` : null;
      const key = refKey || noteKey || trx.id || `idx-${idx}`;
      if (seenTrx.has(key)) return false;
      seenTrx.add(key);
      return true;
    });
  }, [selectedClient]);

  // Filtered collected transactions for collected view & modal
  const filteredCollectedList = useMemo(() => {
    const q = (collectedSearch || searchQuery).toLowerCase().trim();
    if (!q) return periodStats.collectedList;
    return periodStats.collectedList.filter((item) =>
      item.clientName?.toLowerCase().includes(q) ||
      item.clientPhone?.toLowerCase().includes(q) ||
      item.note?.toLowerCase().includes(q)
    );
  }, [periodStats.collectedList, collectedSearch, searchQuery]);

  // Extract clean local date YYYY-MM-DD
  const getLocalDateKey = (d) => {
    if (!d) return '';
    if (typeof d === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(d.trim())) return d.trim();
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    }
    if (d instanceof Date && !isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return '';
  };

  // Helper to trigger browser download
  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Build export dataset according to chosen scope
  const getExportData = (scope, specificDate) => {
    const shopName = settings?.shopName || 'Boutique Diggy Store';
    const shopPhone = settings?.phone || '';
    const now = new Date();
    const dateStr = now.toLocaleDateString(localeCode);
    const timeStr = now.toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' });

    if (scope === 'client' && selectedClient) {
      const history = clientHistory || [];
      const chronoHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
      let running = 0;
      const ledgerRows = chronoHistory.map((trx) => {
        const isPayment = Number(trx.amount) < 0 || trx.type === 'payment' || trx.type === 'repair_payment' || trx.type === 'settlement';
        const amt = Math.abs(Number(trx.amount) || 0);
        const debit = isPayment ? 0 : amt;
        const credit = isPayment ? amt : 0;
        running += isPayment ? -amt : amt;
        return {
          date: trx.date ? new Date(trx.date).toLocaleString(localeCode) : '—',
          type: isPayment ? (t('opTypeCredit') || 'Règlement') : (t('opTypeSale') || 'Dette / Achat'),
          note: trx.note || (trx.referenceId ? `Réf: ${trx.referenceId}` : '—'),
          debit,
          credit,
          balance: running,
        };
      });

      return {
        type: 'client_statement',
        title: `RELEVÉ DE COMPTE CLIENT : ${selectedClient.name.toUpperCase()}`,
        subtitle: `Téléphone: ${selectedClient.phone || '—'} • Adresse: ${selectedClient.address || '—'} • Édité le ${dateStr} à ${timeStr}`,
        filenamePrefix: `releve_client_${selectedClient.name.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_')}_${getLocalDateKey(now)}`,
        shopName,
        shopPhone,
        client: selectedClient,
        ledgerRows,
        currentBalance: Number(selectedClient.totalDebt !== undefined ? selectedClient.totalDebt : (selectedClient.debt || 0)),
      };
    }

    if (scope === 'date') {
      const targetDate = specificDate || exportSpecificDate || getLocalDateKey(now);
      const targetDateLabel = new Date(targetDate + 'T12:00:00').toLocaleDateString(localeCode, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const movements = [];
      let totalNewDebt = 0;
      let totalCollected = 0;

      clients.forEach((c) => {
        (c.history || []).forEach((trx) => {
          if (!trx.archived && trx.date && getLocalDateKey(trx.date) === targetDate) {
            const isPayment = Number(trx.amount) < 0 || trx.type === 'payment' || trx.type === 'repair_payment' || trx.type === 'settlement';
            const amt = Math.abs(Number(trx.amount) || 0);
            if (isPayment) {
              totalCollected += amt;
            } else {
              totalNewDebt += amt;
            }
            movements.push({
              clientName: c.name,
              clientPhone: c.phone || '—',
              time: trx.date ? new Date(trx.date).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' }) : '—',
              fullDate: trx.date ? new Date(trx.date).toLocaleString(localeCode) : '—',
              type: isPayment ? (t('collectedCredit') || 'Règlement perçu') : (t('grantedCredit') || 'Crédit accordé'),
              isPayment,
              note: trx.note || trx.referenceId || 'Opération de caisse',
              amount: amt,
            });
          }
        });
      });

      return {
        type: 'date_report',
        title: `JOURNAL DES CRÉDITS & RÈGLEMENTS DU ${targetDateLabel.toUpperCase()}`,
        subtitle: `${shopName} • Date ciblée: ${targetDate} • Édité le ${dateStr} à ${timeStr}`,
        filenamePrefix: `credits_dettes_${targetDate}`,
        shopName,
        shopPhone,
        targetDate,
        targetDateLabel,
        movements,
        totalNewDebt,
        totalCollected,
        netChange: totalNewDebt - totalCollected,
      };
    }

    if (scope === 'all') {
      const clientRows = clients.map((c) => {
        const lastTrx = c.history && c.history[0];
        const debt = Number(c.totalDebt !== undefined ? c.totalDebt : (c.debt || 0));
        return {
          name: c.name,
          phone: c.phone || '—',
          address: c.address || '—',
          debt,
          lastTrxDate: lastTrx?.date ? new Date(lastTrx.date).toLocaleDateString(localeCode) : '—',
          lastTrxNote: lastTrx?.note || '—',
        };
      }).sort((a, b) => b.debt - a.debt);

      const totalDebt = clientRows.reduce((acc, c) => acc + c.debt, 0);
      const debtorCount = clientRows.filter((c) => c.debt > 0).length;

      return {
        type: 'all_clients',
        title: `ÉTAT COMPLET DES COMPTES CLIENTS & DETTES DÉBITRICES`,
        subtitle: `${shopName} • Date d'édition: ${dateStr} à ${timeStr} • ${debtorCount} débiteurs sur ${clientRows.length} clients`,
        filenamePrefix: `credits_dettes_complet_${getLocalDateKey(now)}`,
        shopName,
        shopPhone,
        clientRows,
        totalDebt,
        debtorCount,
        totalClientsCount: clientRows.length,
      };
    }

    // Default: 'current' (Filtre actuel)
    if (filterMode === 'collected') {
      const items = filteredCollectedList.map((trx) => ({
        clientName: trx.clientName,
        clientPhone: trx.clientPhone || '—',
        date: trx.date ? new Date(trx.date).toLocaleString(localeCode) : '—',
        note: trx.note || trx.referenceId || 'Règlement espèces',
        amount: Number(trx.paidAmount || trx.amount || 0),
      }));

      const totalAmount = items.reduce((acc, it) => acc + it.amount, 0);

      return {
        type: 'current_collected',
        title: `RÈGLEMENTS DE CRÉDITS COLLECTÉS (FILTRE ACTUEL)`,
        subtitle: `${shopName} • Période: ${dateFilter} ${searchQuery ? `• Recherche: "${searchQuery}"` : ''} • Édité le ${dateStr}`,
        filenamePrefix: `credits_collectes_${getLocalDateKey(now)}`,
        shopName,
        shopPhone,
        items,
        totalAmount,
      };
    } else {
      const clientRows = filteredClients.map((c) => {
        const lastTrx = c.history && c.history[0];
        const debt = Number(c.totalDebt !== undefined ? c.totalDebt : (c.debt || 0));
        return {
          name: c.name,
          phone: c.phone || '—',
          debt,
          lastTrxDate: lastTrx?.date ? new Date(lastTrx.date).toLocaleDateString(localeCode) : '—',
          lastTrxNote: lastTrx?.note || '—',
        };
      }).sort((a, b) => b.debt - a.debt);

      const totalDebt = clientRows.reduce((acc, c) => acc + c.debt, 0);

      return {
        type: 'current_filter',
        title: `CRÉDITS CLIENTS & DETTES DÉBITRICES (FILTRE ACTUEL)`,
        subtitle: `${shopName} • Mode: ${filterMode} • Période: ${dateFilter} ${searchQuery ? `• Recherche: "${searchQuery}"` : ''} • Édité le ${dateStr}`,
        filenamePrefix: `credits_dettes_filtre_${getLocalDateKey(now)}`,
        shopName,
        shopPhone,
        clientRows,
        totalDebt,
        clientCount: clientRows.length,
      };
    }
  };

  // Build CSV format string
  const buildCsvContent = (data) => {
    let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel
    if (data.type === 'client_statement') {
      csv += `"Date & Heure";"Type";"Motif / Référence";"Débit (Dette DT)";"Crédit (Règlement DT)";"Solde Restant (DT)"\r\n`;
      data.ledgerRows.forEach((r) => {
        csv += `"${r.date}";"${r.type}";"${r.note}";"${r.debit > 0 ? r.debit.toFixed(3) : ''}";"${r.credit > 0 ? r.credit.toFixed(3) : ''}";"${r.balance.toFixed(3)}"\r\n`;
      });
      csv += `\r\n"";"";"";"";"SOLDE DÛ ACTUEL :";"${data.currentBalance.toFixed(3)} DT"\r\n`;
    } else if (data.type === 'date_report') {
      csv += `"Heure";"Date";"Client";"Téléphone";"Type";"Motif / Référence";"Montant (DT)"\r\n`;
      data.movements.forEach((m) => {
        const sign = m.isPayment ? '-' : '+';
        csv += `"${m.time}";"${m.fullDate}";"${m.clientName}";"${m.clientPhone}";"${m.type}";"${m.note}";"${sign}${m.amount.toFixed(3)}"\r\n`;
      });
      csv += `\r\n"";"";"";"";"NOUVEAUX CRÉDITS ACCORDÉS :";"+${data.totalNewDebt.toFixed(3)} DT"\r\n`;
      csv += `"";"";"";"";"RÈGLEMENTS COLLECTÉS :";"-${data.totalCollected.toFixed(3)} DT"\r\n`;
      csv += `"";"";"";"";"VARIATION NETTE :";"${data.netChange >= 0 ? '+' : ''}${data.netChange.toFixed(3)} DT"\r\n`;
    } else if (data.type === 'current_collected') {
      csv += `"Date & Heure";"Client";"Téléphone";"Motif / Référence";"Montant Perçu (DT)"\r\n`;
      data.items.forEach((it) => {
        csv += `"${it.date}";"${it.clientName}";"${it.clientPhone}";"${it.note}";"${it.amount.toFixed(3)}"\r\n`;
      });
      csv += `\r\n"";"";"";"TOTAL RÈGLEMENTS COLLECTÉS :";"${data.totalAmount.toFixed(3)} DT"\r\n`;
    } else {
      csv += `"Client";"Téléphone";"Dernière Dette Date";"Dernière Dette Note";"Solde Dû (DT)"\r\n`;
      (data.clientRows || []).forEach((c) => {
        csv += `"${c.name}";"${c.phone}";"${c.lastTrxDate}";"${c.lastTrxNote}";"${c.debt.toFixed(3)}"\r\n`;
      });
      csv += `\r\n"";"";"";"TOTAL DETTES CUMULÉES :";"${data.totalDebt.toFixed(3)} DT"\r\n`;
    }
    return csv;
  };

  // Build Excel-ready HTML table
  const buildExcelHtml = (data) => {
    let tableHtml = '';
    if (data.type === 'client_statement') {
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th style="background-color:#4f46e5;color:#fff;">Date & Heure</th>
              <th style="background-color:#4f46e5;color:#fff;">Type d'Opération</th>
              <th style="background-color:#4f46e5;color:#fff;">Motif / Référence</th>
              <th style="background-color:#4f46e5;color:#fff;text-align:right;">Débit (Dette +)</th>
              <th style="background-color:#4f46e5;color:#fff;text-align:right;">Crédit (Paiement -)</th>
              <th style="background-color:#4f46e5;color:#fff;text-align:right;">Solde Restant</th>
            </tr>
          </thead>
          <tbody>
            ${data.ledgerRows.map((r) => `
              <tr>
                <td>${r.date}</td>
                <td>${r.type}</td>
                <td>${r.note}</td>
                <td style="text-align:right;color:#dc2626;">${r.debit > 0 ? formatMoney(r.debit) : '—'}</td>
                <td style="text-align:right;color:#16a34a;">${r.credit > 0 ? '-' + formatMoney(r.credit) : '—'}</td>
                <td style="text-align:right;font-weight:bold;color:${r.balance > 0 ? '#dc2626' : '#16a34a'};">${formatMoney(r.balance)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color:#f1f5f9;font-weight:bold;border-top:2px solid #4f46e5;">
              <td colspan="5" style="text-align:right;">SOLDE DÛ ACTUEL :</td>
              <td style="text-align:right;color:${data.currentBalance > 0 ? '#dc2626' : '#16a34a'};">${formatMoney(data.currentBalance)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (data.type === 'date_report') {
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th style="background-color:#2563eb;color:#fff;">Heure</th>
              <th style="background-color:#2563eb;color:#fff;">Client</th>
              <th style="background-color:#2563eb;color:#fff;">Téléphone</th>
              <th style="background-color:#2563eb;color:#fff;">Type</th>
              <th style="background-color:#2563eb;color:#fff;">Motif / Réf</th>
              <th style="background-color:#2563eb;color:#fff;text-align:right;">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${data.movements.length === 0 ? '<tr><td colspan="6" style="text-align:center;">Aucun mouvement ce jour-là</td></tr>' : data.movements.map((m) => `
              <tr>
                <td>${m.time}</td>
                <td style="font-weight:bold;">${m.clientName}</td>
                <td>${m.clientPhone}</td>
                <td>${m.type}</td>
                <td>${m.note}</td>
                <td style="text-align:right;font-weight:bold;color:${m.isPayment ? '#16a34a' : '#dc2626'};">
                  ${m.isPayment ? '-' : '+'}${formatMoney(m.amount)}
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color:#f1f5f9;font-weight:bold;">
              <td colspan="5" style="text-align:right;">NOUVEAUX CRÉDITS ACCORDÉS :</td>
              <td style="text-align:right;color:#dc2626;">+${formatMoney(data.totalNewDebt)}</td>
            </tr>
            <tr style="background-color:#f1f5f9;font-weight:bold;">
              <td colspan="5" style="text-align:right;">RÈGLEMENTS COLLECTÉS :</td>
              <td style="text-align:right;color:#16a34a;">-${formatMoney(data.totalCollected)}</td>
            </tr>
            <tr style="background-color:#e2e8f0;font-weight:bold;border-top:2px solid #2563eb;">
              <td colspan="5" style="text-align:right;">VARIATION NETTE DU JOUR :</td>
              <td style="text-align:right;color:${data.netChange > 0 ? '#dc2626' : '#16a34a'};">
                ${data.netChange >= 0 ? '+' : ''}${formatMoney(data.netChange)}
              </td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (data.type === 'current_collected') {
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th style="background-color:#10b981;color:#fff;">Date & Heure</th>
              <th style="background-color:#10b981;color:#fff;">Client</th>
              <th style="background-color:#10b981;color:#fff;">Téléphone</th>
              <th style="background-color:#10b981;color:#fff;">Motif / Référence</th>
              <th style="background-color:#10b981;color:#fff;text-align:right;">Montant Perçu</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((it) => `
              <tr>
                <td>${it.date}</td>
                <td style="font-weight:bold;">${it.clientName}</td>
                <td>${it.clientPhone}</td>
                <td>${it.note}</td>
                <td style="text-align:right;font-weight:bold;color:#16a34a;">+${formatMoney(it.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color:#f1f5f9;font-weight:bold;border-top:2px solid #10b981;">
              <td colspan="4" style="text-align:right;">TOTAL RÈGLEMENTS COLLECTÉS :</td>
              <td style="text-align:right;color:#16a34a;">+${formatMoney(data.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else {
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th style="background-color:#2563eb;color:#fff;">Client</th>
              <th style="background-color:#2563eb;color:#fff;">Téléphone</th>
              <th style="background-color:#2563eb;color:#fff;">Dernier Mouvement</th>
              <th style="background-color:#2563eb;color:#fff;text-align:right;">Solde Dû (DT)</th>
            </tr>
          </thead>
          <tbody>
            ${(data.clientRows || []).map((c) => `
              <tr>
                <td style="font-weight:bold;">${c.name}</td>
                <td>${c.phone}</td>
                <td>${c.lastTrxDate !== '—' ? `${c.lastTrxDate} (${c.lastTrxNote})` : '—'}</td>
                <td style="text-align:right;font-weight:bold;color:${c.debt > 0 ? '#dc2626' : '#16a34a'};">
                  ${formatMoney(c.debt)}
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color:#f1f5f9;font-weight:bold;border-top:2px solid #2563eb;">
              <td colspan="3" style="text-align:right;">TOTAL DETTES CUMULÉES :</td>
              <td style="text-align:right;color:#dc2626;">${formatMoney(data.totalDebt)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    return `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; padding: 10px; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th { border: 1px solid #94a3b8; padding: 8px 12px; font-weight: bold; }
          td { border: 1px solid #cbd5e1; padding: 6px 10px; }
          .header-title { font-size: 15pt; font-weight: bold; color: #1e293b; margin-bottom: 3px; }
          .header-sub { font-size: 9.5pt; color: #64748b; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="header-title">${data.title}</div>
        <div class="header-sub">${data.subtitle}</div>
        ${tableHtml}
      </body>
      </html>
    `;
  };

  // Build Text report
  const buildTxtReport = (data) => {
    let txt = '';
    txt += '================================================================================\n';
    txt += `  ${data.title.toUpperCase()}\n`;
    txt += `  ${data.subtitle}\n`;
    txt += '================================================================================\n\n';

    if (data.type === 'client_statement') {
      txt += String('DATE & HEURE').padEnd(20) + ' ' +
             String('TYPE').padEnd(16) + ' ' +
             String('MOTIF / RÉFÉRENCE').padEnd(22) + ' ' +
             String('DÉBIT (+)').padStart(10) + ' ' +
             String('CRÉDIT (-)').padStart(10) + '\n';
      txt += '-'.repeat(82) + '\n';
      data.ledgerRows.forEach((r) => {
        const dt = String(r.date).substring(0, 19).padEnd(20);
        const typ = String(r.type).substring(0, 15).padEnd(16);
        const not = String(r.note).substring(0, 21).padEnd(22);
        const deb = (r.debit > 0 ? formatMoney(r.debit) : '—').padStart(10);
        const crd = (r.credit > 0 ? '-' + formatMoney(r.credit) : '—').padStart(10);
        txt += `${dt} ${typ} ${not} ${deb} ${crd}\n`;
      });
      txt += '-'.repeat(82) + '\n';
      txt += `SOLDE DÛ ACTUEL DU CLIENT : ${formatMoney(data.currentBalance)}\n`;
    } else if (data.type === 'date_report') {
      txt += String('HEURE').padEnd(8) + ' ' +
             String('CLIENT').padEnd(22) + ' ' +
             String('CONTACT').padEnd(14) + ' ' +
             String('TYPE').padEnd(18) + ' ' +
             String('MONTANT').padStart(14) + '\n';
      txt += '-'.repeat(80) + '\n';
      if (data.movements.length === 0) {
        txt += '  Aucun mouvement enregistré à cette date.\n';
      } else {
        data.movements.forEach((m) => {
          const hr = String(m.time).padEnd(8);
          const cl = String(m.clientName).substring(0, 20).padEnd(22);
          const ph = String(m.clientPhone).substring(0, 12).padEnd(14);
          const tp = String(m.type).substring(0, 16).padEnd(18);
          const amt = ((m.isPayment ? '-' : '+') + formatMoney(m.amount)).padStart(14);
          txt += `${hr} ${cl} ${ph} ${tp} ${amt}\n`;
        });
      }
      txt += '-'.repeat(80) + '\n';
      txt += `NOUVEAUX CRÉDITS ACCORDÉS : +${formatMoney(data.totalNewDebt)}\n`;
      txt += `RÈGLEMENTS COLLECTÉS      : -${formatMoney(data.totalCollected)}\n`;
      txt += `VARIATION NETTE DU JOUR   : ${data.netChange >= 0 ? '+' : ''}${formatMoney(data.netChange)}\n`;
    } else if (data.type === 'current_collected') {
      txt += String('DATE & HEURE').padEnd(20) + ' ' +
             String('CLIENT').padEnd(24) + ' ' +
             String('CONTACT').padEnd(14) + ' ' +
             String('MONTANT PERÇU').padStart(18) + '\n';
      txt += '-'.repeat(80) + '\n';
      data.items.forEach((it) => {
        const dt = String(it.date).substring(0, 19).padEnd(20);
        const cl = String(it.clientName).substring(0, 22).padEnd(24);
        const ph = String(it.clientPhone).substring(0, 12).padEnd(14);
        const amt = ('+' + formatMoney(it.amount)).padStart(18);
        txt += `${dt} ${cl} ${ph} ${amt}\n`;
      });
      txt += '-'.repeat(80) + '\n';
      txt += `TOTAL RÈGLEMENTS COLLECTÉS: ${data.items.length}\n`;
      txt += `MONTANT TOTAL ENCAISSÉ    : +${formatMoney(data.totalAmount)}\n`;
    } else {
      txt += String('CLIENT').padEnd(32) + ' ' +
             String('CONTACT').padEnd(16) + ' ' +
             String('DERNIER MOUV.').padEnd(16) + ' ' +
             String('SOLDE DÛ (DT)').padStart(14) + '\n';
      txt += '-'.repeat(82) + '\n';
      (data.clientRows || []).forEach((c) => {
        const cl = String(c.name).substring(0, 30).padEnd(32);
        const ph = String(c.phone).substring(0, 14).padEnd(16);
        const dt = String(c.lastTrxDate).substring(0, 14).padEnd(16);
        const db = formatMoney(c.debt).padStart(14);
        txt += `${cl} ${ph} ${dt} ${db}\n`;
      });
      txt += '-'.repeat(82) + '\n';
      txt += `TOTAL CLIENTS LISTÉS : ${(data.clientRows || []).length}\n`;
      txt += `TOTAL DETTES CUMULÉES: ${formatMoney(data.totalDebt)}\n`;
    }

    txt += '================================================================================\n';
    return txt;
  };

  // Execute export trigger
  const executeExport = (format, scope, specificDate) => {
    const data = getExportData(scope, specificDate);

    if (format === 'excel') {
      const htmlContent = buildExcelHtml(data);
      downloadFile(htmlContent, `${data.filenamePrefix}.xls`, 'application/vnd.ms-excel;charset=utf-8');
    } else if (format === 'csv') {
      const csvContent = buildCsvContent(data);
      downloadFile(csvContent, `${data.filenamePrefix}.csv`, 'text/csv;charset=utf-8');
    } else {
      const txtContent = buildTxtReport(data);
      downloadFile(txtContent, `${data.filenamePrefix}.txt`, 'text/plain;charset=utf-8');
    }

    setExportModalOpen(false);
    toast.success(
      lang === 'ar'
        ? 'تم تصدير وتنزيل الملف بنجاح!'
        : 'Fichier exporté et téléchargé avec succès !'
    );
  };

  // Open modal to confirm client account deletion
  const requestDeleteClient = (client) => {
    setDeleteConfirmState({
      open: true,
      type: 'client',
      client,
      transaction: null,
    });
  };

  // Open modal to confirm transaction deletion
  const requestDeleteTransaction = (client, transaction) => {
    setDeleteConfirmState({
      open: true,
      type: 'transaction',
      client,
      transaction,
    });
  };

  // Execute deletion upon modal confirmation
  const handleConfirmDelete = () => {
    if (deleteConfirmState.type === 'transaction' && deleteConfirmState.client && deleteConfirmState.transaction) {
      deleteClientTransaction(deleteConfirmState.client.id, deleteConfirmState.transaction.id);
      toast.success(
        lang === 'ar'
          ? 'تم حذف المعاملة المالية وتحديث الرصيد'
          : lang === 'en'
          ? 'Transaction deleted and balance updated'
          : 'Ligne de transaction supprimée avec succès !'
      );
    } else if (deleteConfirmState.type === 'client' && deleteConfirmState.client) {
      deleteClient(deleteConfirmState.client.id);
      if (selectedClientId === deleteConfirmState.client.id) {
        setSelectedClientId(null);
      }
      toast.success(
        lang === 'ar'
          ? `تم حذف حساب الزبون "${deleteConfirmState.client.name}" بنجاح`
          : lang === 'en'
          ? `Customer account "${deleteConfirmState.client.name}" deleted`
          : `Compte client "${deleteConfirmState.client.name}" supprimé avec succès !`
      );
    }
    setDeleteConfirmState({ open: false, type: null, client: null, transaction: null });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            <div style={{ padding: '0.45rem', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e', display: 'flex' }}>
              <CreditCard size={24} />
            </div>
            {t('creditsTitle')}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
            {t('creditsSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Button to view collected credits */}
          <button
            className="btn btn-secondary"
            onClick={() => setShowCollectedModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.1rem',
              fontWeight: 700,
              borderColor: '#10b981',
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.08)',
            }}
            title="Afficher l'historique détaillé des crédits collectés"
          >
            <HandCoins size={18} />
            <span>{t('collectedCreditPeriod') || 'Crédits Collectés'}</span>
            <span className="badge badge-green" style={{ fontSize: '0.75rem', padding: '0.1rem 0.45rem', fontWeight: 800 }}>
              +{formatMoney(periodStats.collectedAmount)}
            </span>
          </button>

          {/* Button to Export (Excel / TXT) */}
          <button
            className="btn btn-outline"
            onClick={() => {
              setExportScope(selectedClient ? 'client' : 'current');
              setExportModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.05rem',
              fontWeight: 700,
              borderRadius: '8px',
            }}
            title="Exporter les crédits et dettes (Excel / TXT)"
          >
            <Download size={18} />
            <span>{t('exportCreditsBtn') || 'Exporter (Excel / TXT)'}</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setModalState({ open: true, client: null, transaction: null })}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', fontWeight: 700 }}
          >
            <Plus size={18} />
            {t('newClientCreditTitle')}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Total Current Debt */}
        <div className="ui-card" style={{ padding: '1.1rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('totalDebtAmount')}
              </span>
              <div className="privacy-blur" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f43f5e', marginTop: '0.25rem' }}>
                {formatMoney(totalClientsDebt)}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', display: 'block' }}>
                {clientsWithDebt.length} {t('totalDebtors')}
              </span>
            </div>
            <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e' }}>
              <CreditCard size={20} />
            </div>
          </div>
        </div>

        {/* Collected Credits in Period */}
        <div
          className="ui-card"
          onClick={() => setShowCollectedModal(true)}
          style={{
            padding: '1.1rem 1.25rem',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            background: 'linear-gradient(180deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.05) 100%)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          title="Cliquer pour afficher la liste des crédits collectés"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('collectedCreditPeriod')} ({dateFilter === 'all' ? t('allDates') : dateFilter === 'today' ? t('periodToday') : dateFilter === 'yesterday' ? t('periodYesterday') : dateFilter === '7d' ? t('period7d') : dateFilter === '30d' ? t('period30d') : customDate})
              </span>
              <div className="privacy-blur" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
                +{formatMoney(periodStats.collectedAmount)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {periodStats.collectedCount} {t('settlementsCount')}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>• Voir détails →</span>
              </div>
            </div>
            <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        {/* New Debt Created in Period */}
        <div className="ui-card" style={{ padding: '1.1rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('newCreditsGiven')}
              </span>
              <div className="privacy-blur" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>
                +{formatMoney(periodStats.newDebtAmount)}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', display: 'block' }}>
                {periodStats.newDebtCount} {t('operationsCount') || 'opérations'}
              </span>
            </div>
            <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <ArrowDownRight size={20} />
            </div>
          </div>
        </div>

        {/* Debtor Accounts filtered */}
        <div className="ui-card" style={{ padding: '1.1rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('totalDebtors')}
              </span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                {filteredClients.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', display: 'block' }}>
                {clients.length} {t('clientsTitle') || 'clients enregistrés'}
              </span>
            </div>
            <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)' }}>
              <User size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar: Row 1 (Modes & Dates) + Row 2 (Search & Counts) */}
      <div
        className="ui-card"
        style={{
          padding: '1rem 1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        {/* Row 1: Mode Filter Pills (Left) + Period Filter Pills with Date Picker (Right) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', flexWrap: 'wrap' }}>
          
          {/* Mode Switcher Pills */}
          <div className="dash-period-pill-group">
            <button
              type="button"
              className={`dash-period-btn ${filterMode === 'with_debt' ? 'active' : ''}`}
              onClick={() => setFilterMode('with_debt')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>{t('totalDebtors')}</span>
              <span className="badge badge-red" style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}>
                {clientsWithDebt.length}
              </span>
            </button>

            <button
              type="button"
              className={`dash-period-btn ${filterMode === 'collected' ? 'active' : ''}`}
              onClick={() => setFilterMode('collected')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <HandCoins size={13} style={{ color: filterMode === 'collected' ? '#000' : '#10b981' }} />
              <span>{t('collectedCreditPeriod') || 'Crédits Collectés'}</span>
              <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}>
                {periodStats.collectedList.length}
              </span>
            </button>

            <button
              type="button"
              className={`dash-period-btn ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>{t('all')}</span>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}>
                {clients.length}
              </span>
            </button>
          </div>

          {/* Date Filter Pills + Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
            <div className="dash-period-pill-group">
              <button
                type="button"
                className={`dash-period-btn ${dateFilter === 'all' ? 'active' : ''}`}
                onClick={() => setDateFilter('all')}
              >
                {t('allDates')}
              </button>
              <button
                type="button"
                className={`dash-period-btn ${dateFilter === 'today' ? 'active' : ''}`}
                onClick={() => setDateFilter('today')}
              >
                {t('periodToday')}
              </button>
              <button
                type="button"
                className={`dash-period-btn ${dateFilter === 'yesterday' ? 'active' : ''}`}
                onClick={() => setDateFilter('yesterday')}
              >
                {t('periodYesterday')}
              </button>
              <button
                type="button"
                className={`dash-period-btn ${dateFilter === '7d' ? 'active' : ''}`}
                onClick={() => setDateFilter('7d')}
              >
                {t('period7d')}
              </button>
              <button
                type="button"
                className={`dash-period-btn ${dateFilter === '30d' ? 'active' : ''}`}
                onClick={() => setDateFilter('30d')}
              >
                {t('period30d')}
              </button>
            </div>

            {/* Custom Date Picker Pill */}
            <div className="dash-date-picker-wrap">
              <Calendar size={14} style={{ color: 'var(--accent-primary)' }} />
              <span>{formattedCustomDate}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>▾</span>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setCustomDate(e.target.value);
                    setDateFilter('custom');
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Search Input + Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                [isRTL ? 'right' : 'left']: '12px',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={filterMode === 'collected' ? 'Rechercher par client, téléphone ou note...' : t('creditsSearchPlaceholder')}
              style={{
                [isRTL ? 'paddingRight' : 'paddingLeft']: '38px',
                width: '100%',
              }}
            />
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
            <span>Affichage :</span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {filterMode === 'collected' ? filteredCollectedList.length : filteredClients.length} résultat(s)
            </strong>
          </div>
        </div>
      </div>

      {/* Clients List & Detail Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedClient ? '1.2fr 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* Table View */}
        <div className="ui-card">
          <div className="table-responsive">
            {filterMode === 'collected' ? (
              /* COLLECTED CREDITS TABLE */
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>{t('clientNameCol')}</th>
                    <th>{t('contactCol')}</th>
                    <th>Date & Heure</th>
                    <th>Motif / Transaction</th>
                    <th>Montant Perçu</th>
                    <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollectedList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        Aucun crédit collecté pour cette période.
                      </td>
                    </tr>
                  ) : (
                    filteredCollectedList.map((trx, idx) => {
                      const client = clients.find((c) => c.id === trx.clientId);
                      return (
                        <tr
                          key={`${trx.id || idx}`}
                          style={{
                            background: selectedClient?.id === trx.clientId ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          }}
                        >
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{trx.clientName}</div>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              Solde restant : {formatMoney(client?.totalDebt || 0)}
                            </span>
                          </td>
                          <td>
                            {trx.clientPhone ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}>
                                <Phone size={13} />
                                <span>{trx.clientPhone}</span>
                              </div>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>-</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                              {new Date(trx.date).toLocaleDateString(localeCode)}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              {new Date(trx.date).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-purple" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {trx.note || 'Règlement solde'}
                            </span>
                          </td>
                          <td>
                            <strong className="profit-blur" style={{ fontSize: '1.05rem', color: '#34d399' }}>
                              +{formatMoney(trx.paidAmount)}
                            </strong>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => setSelectedClientId(trx.clientId)}
                                title="Voir historique complet"
                              >
                                <History size={13} />
                                {t('viewAll')}
                              </button>
                              {client && Number(client.totalDebt) > 0 && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => onPayCredit(client)}
                                  title={t('settleBtn')}
                                >
                                  <HandCoins size={13} />
                                  {t('settleBtn')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              /* STANDARD DEBTORS TABLE */
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>{t('clientNameCol')}</th>
                    <th>{t('contactCol')}</th>
                    <th>{t('lastDebtDateCol')}</th>
                    <th>{t('currentBalanceCol')}</th>
                    <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        {t('noDebts')}
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => {
                      const hasDebt = Number(client.totalDebt) > 0;
                      const lastTrx = client.history && client.history[0];

                      return (
                        <tr
                          key={client.id}
                          style={{
                            background: selectedClient?.id === client.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          }}
                        >
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{client.name}</div>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {client.history?.length || 0} {t('items')}
                            </span>
                          </td>
                          <td>
                            {client.phone ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}>
                                <Phone size={13} />
                                <span>{client.phone}</span>
                              </div>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>-</span>
                            )}
                          </td>
                          <td>
                            {lastTrx ? (
                              <div>
                                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{lastTrx.note}</div>
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                  {new Date(lastTrx.date).toLocaleDateString(localeCode)}
                                </span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>
                            <span
                              className="privacy-blur"
                              style={{
                                fontSize: '1.05rem',
                                fontWeight: 800,
                                color: hasDebt ? '#f87171' : '#34d399',
                              }}
                            >
                              {formatMoney(client.totalDebt)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                              {/* View History */}
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => setSelectedClientId(client.id)}
                                title={t('viewAll')}
                              >
                                <History size={13} />
                                {t('viewAll')}
                              </button>

                              {/* Edit Client */}
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setModalState({ open: true, client, transaction: null })}
                                title={t('edit')}
                                style={{ padding: '0.35rem 0.6rem' }}
                              >
                                <Edit2 size={13} />
                              </button>

                              {/* Settle Debt Button */}
                              {hasDebt && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => onPayCredit(client)}
                                  title={t('settleBtn')}
                                >
                                  <HandCoins size={13} />
                                  {t('settleBtn')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Client Detailed History Drawer */}
        {selectedClient && (
          <div className="ui-card" style={{ height: 'fit-content' }}>
            <div className="ui-card-header" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.2rem', fontWeight: 700 }}>{selectedClient.name}</h3>
                {selectedClient.phone && (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Phone size={12} /> {selectedClient.phone}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                {/* Export Client Statement */}
                <button
                  className="btn-icon btn-secondary btn-sm"
                  onClick={() => {
                    setExportScope('client');
                    setExportModalOpen(true);
                  }}
                  title="Exporter le relevé de ce client (Excel / TXT)"
                >
                  <Download size={15} />
                </button>

                {/* Edit Client */}
                <button
                  className="btn-icon btn-secondary btn-sm"
                  onClick={() => setModalState({ open: true, client: selectedClient, transaction: null })}
                  title={t('editClientModalTitle')}
                >
                  <Edit2 size={15} />
                </button>

                {/* Delete Client */}
                <button
                  className="btn-icon btn-danger btn-sm"
                  onClick={() => requestDeleteClient(selectedClient)}
                  title={t('delete')}
                >
                  <Trash2 size={15} />
                </button>

                {/* Close Drawer */}
                <button
                  className="btn-icon btn-outline btn-sm"
                  onClick={() => setSelectedClientId(null)}
                  title={t('close')}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Total Balance Card */}
            <div
              style={{
                background: selectedClient.totalDebt > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${selectedClient.totalDebt > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '1rem 0',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('currentBalanceCol')}
                </span>
                <div className="privacy-blur" style={{ fontSize: '1.4rem', fontWeight: 800, color: selectedClient.totalDebt > 0 ? '#f87171' : '#34d399' }}>
                  {formatMoney(selectedClient.totalDebt)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setModalState({ open: true, client: selectedClient, transaction: null })}
                  title={t('editClientModalTitle')}
                  style={{ fontSize: '0.78rem' }}
                >
                  <SlidersHorizontal size={13} />
                  {t('edit')}
                </button>

                {selectedClient.totalDebt > 0 && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => onPayCredit(selectedClient)}
                    style={{ fontSize: '0.78rem' }}
                  >
                    <HandCoins size={13} />
                    {t('settleBtn')}
                  </button>
                )}
              </div>
            </div>

            {/* History List Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <h4 style={{ fontSize: '0.85rem', margin: 0, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('creditHistoryTitle')} ({clientHistory.length})
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '2px' }}>
              {clientHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                  {t('noDebts')}
                </div>
              ) : (
                clientHistory.map((trx) => {
                  const isPayment = Number(trx.amount) < 0 || trx.type === 'payment' || trx.type === 'repair_payment' || trx.type === 'settlement';
                  return (
                    <div
                      key={trx.id}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {trx.note}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {new Date(trx.date).toLocaleString(localeCode)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div
                          className="privacy-blur"
                          style={{
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            color: isPayment ? '#34d399' : '#f87171',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isPayment ? `${formatMoney(Math.abs(trx.amount))}` : `+${formatMoney(trx.amount)}`}
                        </div>

                        {/* Inline Actions for Transaction */}
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {isPayment && !trx.archived && (
                            <button
                              className="btn-icon btn-secondary btn-xs"
                              title={t('archiveItem') || 'Archiver ce règlement'}
                              onClick={() => {
                                const res = archiveCreditTransaction(selectedClient.id, trx.id);
                                if (res.success) {
                                  toast.success(lang === 'ar' ? 'تمت أرشفة حركة السداد بنجاح' : 'Règlement archivé avec succès !');
                                } else {
                                  toast.error(res.error);
                                }
                              }}
                              style={{ padding: '4px', width: '24px', height: '24px' }}
                            >
                              <Archive size={12} />
                            </button>
                          )}

                          <button
                            className="btn-icon btn-secondary btn-xs"
                            onClick={() =>
                              setModalState({
                                open: true,
                                client: selectedClient,
                                transaction: trx,
                              })
                            }
                            title={t('editTransactionModalTitle')}
                            style={{ padding: '4px', width: '24px', height: '24px' }}
                          >
                            <Edit2 size={12} />
                          </button>

                          <button
                            className="btn-icon btn-danger btn-xs"
                            onClick={() => requestDeleteTransaction(selectedClient, trx)}
                            title={t('delete')}
                            style={{ padding: '4px', width: '24px', height: '24px' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modern Client / Transaction Edit Modal */}
      {modalState.open && (
        <ClientModal
          client={modalState.client}
          transaction={modalState.transaction}
          onClose={() => setModalState({ open: false, client: null, transaction: null })}
        />
      )}

      {/* Styled Delete Confirmation Modal */}
      {deleteConfirmState.open && (
        <ConfirmDeleteModal
          title={
            deleteConfirmState.type === 'transaction'
              ? (lang === 'ar' ? 'حذف معاملة مالية' : lang === 'en' ? 'Delete Transaction' : 'Supprimer la Transaction')
              : (lang === 'ar' ? 'حذف حساب الزبون' : lang === 'en' ? 'Delete Customer Account' : 'Supprimer le Compte Client')
          }
          message={
            deleteConfirmState.type === 'transaction'
              ? (lang === 'ar'
                  ? 'هل أنت متأكد من رغبتك في حذف هذه المعاملة من سجل الزبون؟'
                  : lang === 'en'
                  ? 'Are you sure you want to delete this transaction from customer history?'
                  : "Êtes-vous sûr de vouloir supprimer cette ligne de transaction de l'historique du client ?")
              : (lang === 'ar'
                  ? 'هل أنت متأكد من حذف هذا الحساب وكافة سجلاته نهائياً؟'
                  : lang === 'en'
                  ? 'Are you sure you want to permanently delete this customer account?'
                  : 'Êtes-vous sûr de vouloir supprimer définitivement ce compte client et toutes ses transactions ?')
          }
          itemDetails={
            deleteConfirmState.type === 'transaction'
              ? {
                  title: deleteConfirmState.transaction?.note || 'Transaction',
                  subtitle: new Date(deleteConfirmState.transaction?.date).toLocaleString(localeCode),
                  value:
                    Number(deleteConfirmState.transaction?.amount) < 0
                      ? formatMoney(Math.abs(deleteConfirmState.transaction?.amount))
                      : `+${formatMoney(deleteConfirmState.transaction?.amount)}`,
                  valueColor: Number(deleteConfirmState.transaction?.amount) < 0 ? '#34d399' : '#f87171',
                }
              : {
                  title: deleteConfirmState.client?.name,
                  subtitle: deleteConfirmState.client?.phone
                    ? `${t('clientPhone')}: ${deleteConfirmState.client?.phone}`
                    : `${deleteConfirmState.client?.history?.length || 0} opérations`,
                  value: `${t('currentBalanceCol')} : ${formatMoney(deleteConfirmState.client?.totalDebt || 0)}`,
                  valueColor: '#f87171',
                }
          }
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteConfirmState({ open: false, type: null, client: null, transaction: null })}
          confirmButtonText={lang === 'ar' ? 'تأكيد الحذف' : lang === 'en' ? 'Confirm Delete' : 'Confirmer la suppression'}
        />
      )}

      {/* Dedicated Collected Credits Modal */}
      {showCollectedModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.45rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex' }}>
                  <HandCoins size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {t('collectedCreditPeriod') || 'Journal des Crédits Collectés'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Période : {dateFilter === 'all' ? t('allDates') : dateFilter === 'today' ? t('periodToday') : dateFilter === 'yesterday' ? t('periodYesterday') : dateFilter === '7d' ? t('period7d') : dateFilter === '30d' ? t('period30d') : customDate}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  onClick={() => {
                    setExportScope('current');
                    setExportModalOpen(true);
                  }}
                  title="Exporter la liste des crédits collectés"
                >
                  <Download size={13} />
                  <span>{t('export') || 'Exporter'}</span>
                </button>
                <button className="btn-icon btn-outline btn-sm" onClick={() => setShowCollectedModal(false)}>
                  ✕
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Summary Banner */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Total Encaissé sur la Période
                  </span>
                  <div className="privacy-blur" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#34d399', marginTop: '0.2rem' }}>
                    +{formatMoney(periodStats.collectedAmount)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.85rem', padding: '0.25rem 0.65rem' }}>
                    {periodStats.collectedCount} règlements
                  </span>
                </div>
              </div>

              {/* Search Inside Modal */}
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="input"
                  value={collectedSearch}
                  onChange={(e) => setCollectedSearch(e.target.value)}
                  placeholder="Rechercher par client, téléphone ou motif..."
                  style={{ paddingLeft: '2.1rem', width: '100%' }}
                />
              </div>

              {/* List of Collected Transactions */}
              {filteredCollectedList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <HandCoins size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Aucun règlement ou crédit collecté trouvé pour cette sélection.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {filteredCollectedList.map((trx, idx) => {
                    const client = clients.find((c) => c.id === trx.clientId);
                    return (
                      <div
                        key={`${trx.id || idx}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem 1rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                            <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{trx.clientName}</strong>
                            {trx.clientPhone && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {trx.clientPhone}</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {trx.note || 'Règlement solde'}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {new Date(trx.date).toLocaleString(localeCode)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <strong className="profit-blur" style={{ fontSize: '1.15rem', color: '#34d399', display: 'block' }}>
                              +{formatMoney(trx.paidAmount)}
                            </strong>
                            {client && (
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                Reste : {formatMoney(client.totalDebt)}
                              </span>
                            )}
                          </div>

                          <button
                            className="btn btn-sm btn-outline"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                            onClick={() => {
                              setSelectedClientId(trx.clientId);
                              setShowCollectedModal(false);
                            }}
                            title="Ouvrir la fiche client"
                          >
                            <History size={13} />
                            <span>Compte</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowCollectedModal(false)}>
                {t('close') || 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Export Modal (Excel, CSV, TXT) */}
      {exportModalOpen && (
        <div className="modal-overlay" onClick={() => setExportModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.45rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)', display: 'flex' }}>
                  <Download size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {t('exportCreditsModalTitle') || 'Exporter les Crédits & Dettes'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Exportation des comptes débiteurs, historiques et règlements
                  </span>
                </div>
              </div>
              <button className="btn-icon btn-outline btn-sm" onClick={() => setExportModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
              {/* 1. Scope Selection */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block', fontSize: '0.85rem' }}>
                  {t('exportScopeLabel') || 'Périmètre des données :'}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {/* Scope: Current Filter */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '8px',
                      border: exportScope === 'current' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: exportScope === 'current' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === 'current'}
                      onChange={() => setExportScope('current')}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-primary)' }}>
                        {t('exportScopeCurrent') || 'Filtre actuel à l’écran'}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {filterMode === 'collected'
                          ? `${filteredCollectedList.length} règlements collectés`
                          : `${filteredClients.length} clients affichés`} • Période: {dateFilter} {searchQuery ? `• Recherche: "${searchQuery}"` : ''}
                      </span>
                    </div>
                  </label>

                  {/* Scope: Specific Date */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '8px',
                      border: exportScope === 'date' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: exportScope === 'date' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === 'date'}
                      onChange={() => setExportScope('date')}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-primary)' }}>
                        {t('exportScopeDate') || 'Date spécifique'}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Mouvements de dettes et règlements d'un jour précis
                      </span>
                      {exportScope === 'date' && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={15} style={{ color: 'var(--accent-primary)' }} />
                          <input
                            type="date"
                            className="input"
                            value={exportSpecificDate}
                            onChange={(e) => setExportSpecificDate(e.target.value)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem', width: 'auto' }}
                          />
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Scope: All */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '8px',
                      border: exportScope === 'all' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: exportScope === 'all' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === 'all'}
                      onChange={() => setExportScope('all')}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-primary)' }}>
                        {t('exportScopeAll') || 'Tous les comptes & dettes (Complet)'}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {clients.length} clients enregistrés • Total dettes boutique: {formatMoney(totalClientsDebt)}
                      </span>
                    </div>
                  </label>

                  {/* Scope: Selected Client */}
                  {selectedClient && (
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.65rem',
                        padding: '0.7rem 0.85rem',
                        borderRadius: '8px',
                        border: exportScope === 'client' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: exportScope === 'client' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="exportScope"
                        checked={exportScope === 'client'}
                        onChange={() => setExportScope('client')}
                        style={{ marginTop: '0.2rem' }}
                      />
                      <div>
                        <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-primary)' }}>
                          {t('exportScopeClient') || 'Relevé du client sélectionné'} : {selectedClient.name}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Solde dû : {formatMoney(selectedClient.totalDebt || 0)} • {clientHistory.length} opérations
                        </span>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* 2. Format Selection */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block', fontSize: '0.85rem' }}>
                  {t('exportFormatLabel') || 'Format d’exportation :'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
                  <div
                    onClick={() => setExportFormat('excel')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: exportFormat === 'excel' ? '2px solid #10b981' : '1px solid var(--border-color)',
                      background: exportFormat === 'excel' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <FileSpreadsheet size={22} style={{ color: '#10b981' }} />
                    <div>
                      <strong style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-primary)' }}>
                        Excel (.xls)
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Mise en forme & totaux
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setExportFormat('csv')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: exportFormat === 'csv' ? '2px solid #0ea5e9' : '1px solid var(--border-color)',
                      background: exportFormat === 'csv' ? 'rgba(14, 165, 233, 0.1)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <FileSpreadsheet size={22} style={{ color: '#0ea5e9' }} />
                    <div>
                      <strong style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-primary)' }}>
                        Tableur (.csv)
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Standard séparateur ;
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setExportFormat('txt')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: exportFormat === 'txt' ? '2px solid #8b5cf6' : '1px solid var(--border-color)',
                      background: exportFormat === 'txt' ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <FileText size={22} style={{ color: '#8b5cf6' }} />
                    <div>
                      <strong style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-primary)' }}>
                        Texte (.txt)
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Rapport texte imprimable
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button className="btn btn-outline" onClick={() => setExportModalOpen(false)}>
                {t('cancel') || 'Annuler'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => executeExport(exportFormat, exportScope, exportSpecificDate)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
              >
                <Download size={16} />
                <span>{t('exportActionDownload') || 'Télécharger le fichier'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
