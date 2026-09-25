import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Archive,
  RotateCcw,
  Search,
  ShoppingCart,
  Wrench,
  CreditCard,
  Wallet,
  Calendar,
  DollarSign,
  Printer,
  ChevronRight,
  TrendingUp,
  Clock,
  User,
  Phone,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Download,
  Filter,
  Eye,
  Trash2,
  Info,
  Tag,
  Receipt,
  FileSpreadsheet,
  CheckSquare,
  Square,
  ArrowRight,
} from 'lucide-react';

export default function Archives({ onSelectRepair }) {
  const {
    sales,
    repairs,
    clients,
    expenses,
    archiveSale,
    unarchiveSale,
    archiveSalesBeforeDate,
    archiveRepair,
    unarchiveRepair,
    archiveAllDeliveredRepairs,
    archiveCreditTransaction,
    unarchiveCreditTransaction,
    archiveAllSettledCredits,
    archiveExpense,
    unarchiveExpense,
    archiveExpensesBeforeDate,
    archivedSales,
    archivedRepairs,
    archivedCreditTransactions,
    archivedExpenses,
    archivedSalesCount,
    archivedRepairsCount,
    archivedCreditsCount,
    archivedExpensesCount,
    totalArchivedCount,
    formatMoney,
    setActiveReceipt,
    shopInfo,
    t,
    lang,
    isRTL,
    isAdmin,
  } = useApp();

  const [activeTab, setActiveTab] = useState('sales'); // 'sales', 'repairs', 'credits', 'expenses'
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', '7d', '30d', 'custom'
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Batch Archive Modal State
  const [batchModal, setBatchModal] = useState({ open: false, type: null });
  const [batchCutoffDate, setBatchCutoffDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });

  // Export to Excel Modal State
  const [exportModal, setExportModal] = useState({
    open: false,
    mode: 'all', // 'all', 'custom'
    startDate: () => {
      const d = new Date();
      d.setDate(1); // 1st day of current month
      return d.toISOString().split('T')[0];
    },
    endDate: () => new Date().toISOString().split('T')[0],
    sheets: {
      summary: true,
      sales: true,
      repairs: true,
      credits: true,
      expenses: true,
    },
  });

  // Details Modal State
  const [viewDetailModal, setViewDetailModal] = useState({ open: false, item: null, type: null });

  // Count unarchived eligible repairs and settled credits
  const eligibleUnarchivedRepairsCount = useMemo(() => {
    return (repairs || []).filter(
      (r) => !r.archived && r.status === 'delivered' && (Number(r.remainingDue) || 0) <= 0
    ).length;
  }, [repairs]);

  const eligibleUnarchivedSettledCreditsCount = useMemo(() => {
    return (clients || []).reduce((count, c) => {
      const payments = (c.history || []).filter(
        (t) => !t.archived && (Number(t.amount) < 0 || t.type === 'payment' || t.type === 'repair_payment' || t.type === 'settlement')
      );
      return count + payments.length;
    }, 0);
  }, [clients]);

  // Date boundary check for active screen filters
  const isInDatePeriod = (dateStr) => {
    if (!dateStr || dateFilter === 'all') return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    const now = new Date();

    if (dateFilter === 'today') {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }
    if (dateFilter === '7d') {
      const limit = new Date();
      limit.setDate(now.getDate() - 7);
      return d >= limit;
    }
    if (dateFilter === '30d') {
      const limit = new Date();
      limit.setDate(now.getDate() - 30);
      return d >= limit;
    }
    if (dateFilter === 'custom' && customDate) {
      const target = new Date(customDate);
      return (
        d.getDate() === target.getDate() &&
        d.getMonth() === target.getMonth() &&
        d.getFullYear() === target.getFullYear()
      );
    }
    return true;
  };

  // Filtered Archived Sales
  const filteredSales = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (archivedSales || [])
      .filter((s) => {
        if (!isInDatePeriod(s.date)) return false;
        if (!q) return true;
        const matchInvoice = s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(q);
        const matchClient = s.clientName && s.clientName.toLowerCase().includes(q);
        const matchPhone = s.clientPhone && s.clientPhone.toLowerCase().includes(q);
        const matchItems = (s.items || []).some((it) => it.name && it.name.toLowerCase().includes(q));
        return matchInvoice || matchClient || matchPhone || matchItems;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [archivedSales, searchQuery, dateFilter, customDate]);

  // Filtered Archived Repairs
  const filteredRepairs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (archivedRepairs || [])
      .filter((r) => {
        const effectiveDate = r.deliveredAt || r.createdAt;
        if (!isInDatePeriod(effectiveDate)) return false;
        if (!q) return true;
        const matchTicket = r.ticketNumber && r.ticketNumber.toLowerCase().includes(q);
        const matchModel = r.deviceModel && r.deviceModel.toLowerCase().includes(q);
        const matchClient = r.clientName && r.clientName.toLowerCase().includes(q);
        const matchPhone = r.clientPhone && r.clientPhone.toLowerCase().includes(q);
        const matchIssue = (r.issueDescription || r.problemDescription || '').toLowerCase().includes(q);
        return matchTicket || matchModel || matchClient || matchPhone || matchIssue;
      })
      .sort((a, b) => new Date(b.deliveredAt || b.createdAt).getTime() - new Date(a.deliveredAt || a.createdAt).getTime());
  }, [archivedRepairs, searchQuery, dateFilter, customDate]);

  // Filtered Archived Credit Payments
  const filteredCredits = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (archivedCreditTransactions || [])
      .filter((t) => {
        if (!isInDatePeriod(t.date)) return false;
        if (!q) return true;
        const matchClient = t.clientName && t.clientName.toLowerCase().includes(q);
        const matchPhone = t.clientPhone && t.clientPhone.toLowerCase().includes(q);
        const matchNote = t.note && t.note.toLowerCase().includes(q);
        return matchClient || matchPhone || matchNote;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [archivedCreditTransactions, searchQuery, dateFilter, customDate]);

  // Filtered Archived Expenses
  const filteredExpenses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (archivedExpenses || [])
      .filter((exp) => {
        if (!isInDatePeriod(exp.date)) return false;
        if (!q) return true;
        const matchTitle = (exp.title || '').toLowerCase().includes(q);
        const matchNotes = (exp.notes || '').toLowerCase().includes(q);
        const matchCat = (exp.category || '').toLowerCase().includes(q);
        return matchTitle || matchNotes || matchCat;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [archivedExpenses, searchQuery, dateFilter, customDate]);

  // Totals for Archived Data
  const archivedSalesTotalAmount = useMemo(() => {
    return (archivedSales || []).reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  }, [archivedSales]);

  const archivedRepairsTotalAmount = useMemo(() => {
    return (archivedRepairs || []).reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);
  }, [archivedRepairs]);

  const archivedCreditsTotalAmount = useMemo(() => {
    return (archivedCreditTransactions || []).reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
  }, [archivedCreditTransactions]);

  const archivedExpensesTotalAmount = useMemo(() => {
    return (archivedExpenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [archivedExpenses]);

  // Unarchive Handlers
  const handleUnarchiveSale = (saleId) => {
    unarchiveSale(saleId);
    toast.success(lang === 'ar' ? 'تم استرجاع عملية البيع إلى السجل النشط' : 'Vente restaurée dans le journal actif avec succès !');
  };

  const handleUnarchiveRepair = (repairId) => {
    unarchiveRepair(repairId);
    toast.success(lang === 'ar' ? 'تم استرجاع بطاقة الصيانة إلى قائمة الورشة' : 'Fiche réparation restaurée dans l’atelier actif !');
  };

  const handleUnarchiveCredit = (clientId, trxId) => {
    unarchiveCreditTransaction(clientId, trxId);
    toast.success(lang === 'ar' ? 'تم استرجاع حركة السداد إلى حساب الزبون' : 'Règlement restauré dans l’historique client !');
  };

  const handleUnarchiveExpense = (expenseId) => {
    unarchiveExpense(expenseId);
    toast.success(lang === 'ar' ? 'تم استرجاع المصروف إلى القائمة النشطة' : 'Dépense restaurée dans le journal actif !');
  };

  // Batch Archive Handlers
  const handleExecuteBatchArchiveSales = () => {
    if (!batchCutoffDate) return;
    const count = archiveSalesBeforeDate(batchCutoffDate);
    setBatchModal({ open: false, type: null });
    toast.success(
      lang === 'ar'
        ? `تمت أرشفة ${count} عملية بيع سابقة بنجاح`
        : `${count} vente(s) antérieure(s) archivée(s) avec succès !`
    );
  };

  const handleExecuteBatchArchiveRepairs = () => {
    const count = archiveAllDeliveredRepairs();
    setBatchModal({ open: false, type: null });
    toast.success(
      lang === 'ar'
        ? `تمت أرشفة ${count} جهاز صيانة مسلّم وخالص 100% بنجاح`
        : `${count} fiche(s) réparation clôturée(s) et entièrement payée(s) archivée(s) !`
    );
  };

  const handleExecuteBatchArchiveCredits = () => {
    const count = archiveAllSettledCredits();
    setBatchModal({ open: false, type: null });
    toast.success(
      lang === 'ar'
        ? `تمت أرشفة ${count} عملية سداد بنجاح`
        : `${count} règlement(s) de crédit archivé(s) avec succès !`
    );
  };

  const handleExecuteBatchArchiveExpenses = () => {
    if (!batchCutoffDate) return;
    const count = archiveExpensesBeforeDate(batchCutoffDate);
    setBatchModal({ open: false, type: null });
    toast.success(
      lang === 'ar'
        ? `تمت أرشفة ${count} مصروف سابق بنجاح`
        : `${count} dépense(s) antérieure(s) archivée(s) avec succès !`
    );
  };

  // ==========================================
  // EXCEL MULTI-SHEET EXPORT FUNCTIONALITY
  // ==========================================
  const handleExportToExcel = () => {
    try {
      const isCustom = exportModal.mode === 'custom';
      const startDate = isCustom ? new Date(exportModal.startDate + 'T00:00:00') : null;
      const endDate = isCustom ? new Date(exportModal.endDate + 'T23:59:59') : null;

      const dateMatches = (dateStr) => {
        if (!isCustom || !startDate || !endDate) return true;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= startDate && d <= endDate;
      };

      // Filter data according to export range
      const salesToExport = (archivedSales || []).filter((s) => dateMatches(s.date));
      const repairsToExport = (archivedRepairs || []).filter((r) => dateMatches(r.deliveredAt || r.createdAt));
      const creditsToExport = (archivedCreditTransactions || []).filter((c) => dateMatches(c.date));
      const expensesToExport = (archivedExpenses || []).filter((e) => dateMatches(e.date));

      const totalSalesSum = salesToExport.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
      const totalRepairsSum = repairsToExport.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);
      const totalCreditsSum = creditsToExport.reduce((sum, c) => sum + Math.abs(Number(c.amount) || 0), 0);
      const totalExpensesSum = expensesToExport.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      // Create new workbook
      const wb = XLSX.utils.book_new();

      // Helper for auto-column widths
      const setAutoWidth = (aoa) => {
        const colWidths = [];
        aoa.forEach((row) => {
          row.forEach((val, colIdx) => {
            const str = val !== null && val !== undefined ? String(val) : '';
            const len = str.length + 3;
            colWidths[colIdx] = Math.max(colWidths[colIdx] || 10, len);
          });
        });
        return colWidths.map((w) => ({ wch: Math.min(Math.max(w, 12), 45) }));
      };

      // 1. SHEET: SYNTHÈSE GLOBALE
      if (exportModal.sheets.summary) {
        const summaryData = [
          ['RAPPORT DES ARCHIVES - SYNTHÈSE GLOBALE'],
          ['Établissement :', shopInfo?.name || 'Boutique Pro'],
          ['Téléphone :', shopInfo?.phone || '—'],
          ['Période exportée :', isCustom ? `Du ${exportModal.startDate} Au ${exportModal.endDate}` : 'Toutes les archives (Historique complet)'],
          ['Date de génération :', new Date().toLocaleString()],
          [],
          ['Module', "Nombre d'enregistrements", 'Total Montant (Devise locale)'],
          ['Ventes Archivées', salesToExport.length, totalSalesSum],
          ['Réparations Clôturées & Payées', repairsToExport.length, totalRepairsSum],
          ['Règlements de Crédits Encaissés', creditsToExport.length, totalCreditsSum],
          ['Dépenses & Sorties de Caisse', expensesToExport.length, totalExpensesSum],
          [],
          ['TOTAL REVENUS ARCHIVÉS (Ventes + Réparations)', salesToExport.length + repairsToExport.length, totalSalesSum + totalRepairsSum],
          ['TOTAL DÉPENSES ARCHIVÉES', expensesToExport.length, totalExpensesSum],
        ];

        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        wsSummary['!cols'] = setAutoWidth(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Synthèse');
      }

      // 2. SHEET: VENTES
      if (exportModal.sheets.sales) {
        const salesRows = [
          ['N° Facture', 'Date & Heure', 'Client', 'Téléphone', 'Articles & Quantités', 'Total Vente', 'Montant Payé (Encaissé)', 'Reste Crédit (Dette)', 'Mode Règlement', 'Archivé le'],
          ...salesToExport.map((s) => {
            const debt = Number(s.remainingCredit || s.remainingDebt || 0);
            const paid = Number(s.amountPaid) > 0 ? Number(s.amountPaid) : Math.max(0, (Number(s.totalAmount || 0) - debt));
            return [
              s.invoiceNumber || s.id,
              s.date ? new Date(s.date).toLocaleString() : '',
              s.clientName || 'Client standard',
              s.clientPhone || '',
              (s.items || []).map((it) => `${it.name} (x${it.quantity})`).join(', '),
              Number(s.totalAmount) || 0,
              paid,
              debt,
              s.paymentType === 'cash' ? 'Espèces' : s.paymentType === 'credit' ? 'Crédit' : 'Acompte',
              s.archivedAt ? new Date(s.archivedAt).toLocaleDateString() : '',
            ];
          }),
        ];

        const wsSales = XLSX.utils.aoa_to_sheet(salesRows);
        wsSales['!cols'] = setAutoWidth(salesRows);
        XLSX.utils.book_append_sheet(wb, wsSales, 'Ventes');
      }

      // 3. SHEET: RÉPARATIONS
      if (exportModal.sheets.repairs) {
        const repairRows = [
          ['N° Ticket', 'Date Dépôt', 'Date Livraison', 'Client', 'Téléphone', 'Appareil / Modèle', 'Code / Mot de passe', 'Panne / Réparation', 'Pièce Rechange', 'Coût Pièce', 'Main d’œuvre', 'Total Payé', 'Solde Restant', 'Archivé le'],
          ...repairsToExport.map((r) => [
            r.ticketNumber || r.id,
            r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '',
            r.deliveredAt ? new Date(r.deliveredAt).toLocaleDateString() : '',
            r.clientName || '',
            r.clientPhone || '',
            r.deviceModel || '',
            r.devicePassword || '',
            r.issueDescription || r.problemDescription || '',
            r.sparePartName || '',
            Number(r.sparePartCost) || 0,
            Number(r.laborCost) || 0,
            Number(r.totalPrice) || 0,
            Number(r.remainingDue) || 0,
            r.archivedAt ? new Date(r.archivedAt).toLocaleDateString() : '',
          ]),
        ];

        const wsRepairs = XLSX.utils.aoa_to_sheet(repairRows);
        wsRepairs['!cols'] = setAutoWidth(repairRows);
        XLSX.utils.book_append_sheet(wb, wsRepairs, 'Réparations');
      }

      // 4. SHEET: RÈGLEMENTS CRÉDITS
      if (exportModal.sheets.credits) {
        const creditsRows = [
          ['Date & Heure Règlement', 'Client', 'Téléphone', 'Libellé / Note', 'Montant Encaissé', 'Archivé le'],
          ...creditsToExport.map((c) => [
            c.date ? new Date(c.date).toLocaleString() : '',
            c.clientName || '',
            c.clientPhone || '',
            c.note || 'Règlement de dette',
            Math.abs(Number(c.amount) || 0),
            c.archivedAt ? new Date(c.archivedAt).toLocaleDateString() : '',
          ]),
        ];

        const wsCredits = XLSX.utils.aoa_to_sheet(creditsRows);
        wsCredits['!cols'] = setAutoWidth(creditsRows);
        XLSX.utils.book_append_sheet(wb, wsCredits, 'Règlements_Crédits');
      }

      // 5. SHEET: DÉPENSES
      if (exportModal.sheets.expenses) {
        const expenseRows = [
          ['Date & Heure', 'Titre / Motif Dépense', 'Catégorie', 'Mode de Paiement', 'Montant Dépense', 'Notes', 'Archivé le'],
          ...expensesToExport.map((e) => [
            e.date ? new Date(e.date).toLocaleString() : '',
            e.title || '',
            e.category || 'Autre',
            e.paymentMethod === 'cash' ? 'Espèces' : 'Banque',
            Number(e.amount) || 0,
            e.notes || '',
            e.archivedAt ? new Date(e.archivedAt).toLocaleDateString() : '',
          ]),
        ];

        const wsExpenses = XLSX.utils.aoa_to_sheet(expenseRows);
        wsExpenses['!cols'] = setAutoWidth(expenseRows);
        XLSX.utils.book_append_sheet(wb, wsExpenses, 'Dépenses');
      }

      // Check if at least one sheet was added
      if (wb.SheetNames.length === 0) {
        toast.error(lang === 'ar' ? 'يرجى تحديد صفحة واحدة على الأقل للتصدير' : 'Veuillez sélectionner au moins une feuille à exporter.');
        return;
      }

      // Generate filename
      const dateSuffix = isCustom
        ? `Du_${exportModal.startDate}_Au_${exportModal.endDate}`
        : `Global_${new Date().toISOString().split('T')[0]}`;
      const fileName = `Archives_Boutique_${dateSuffix}.xlsx`;

      // Download file
      XLSX.writeFile(wb, fileName);
      setExportModal((prev) => ({ ...prev, open: false }));
      toast.success(
        lang === 'ar'
          ? `تم تنزيل ملف الإكسيل (${fileName}) بنجاح !`
          : `Classeur Excel "${fileName}" exporté avec succès !`
      );
    } catch (err) {
      console.error('Export Excel Error:', err);
      toast.error(lang === 'ar' ? 'حدث خطأ أثناء تصدير ملف الإكسيل' : "Erreur lors de la génération du fichier Excel.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      
      {/* 1. HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1.5px solid #f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
              boxShadow: '0 0 14px rgba(245, 158, 11, 0.25)',
              flexShrink: 0,
            }}
          >
            <Archive size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {lang === 'ar' ? 'مركز الأرشيف والسجل التاريخي' : 'Centre d’Archives & Historique Légal'}
              </h2>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                }}
              >
                🔒 Données archivées isolées (exclues du calcul du CA & bénéfices)
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
              {lang === 'ar'
                ? 'استشارة وتصدير السجلات المؤرشفة دون التأثير على حسابات الصندوق والأرباح اليومية النشطة.'
                : 'Consultation et export Excel des fiches archivées sans impacter les caisses ou le chiffre d’affaires actif.'}
            </p>
          </div>
        </div>

        {/* Right Action Controls: Export Excel + Batch Archiving */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
          {/* EXCEL EXPORT BUTTON */}
          <button
            type="button"
            onClick={() => setExportModal((prev) => ({ ...prev, open: true }))}
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              borderRadius: '10px',
              padding: '0.6rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <FileSpreadsheet size={16} />
            <span>{lang === 'ar' ? 'تصدير إكسيل (Excel)' : 'Exporter en Excel'}</span>
          </button>

          {/* BATCH ARCHIVE BUTTONS */}
          {activeTab === 'sales' && (
            <button
              type="button"
              onClick={() => setBatchModal({ open: true, type: 'sales' })}
              style={{
                background: 'linear-gradient(135deg, #ffd05b 0%, #f6a619 100%)',
                color: '#000000',
                border: 'none',
                borderRadius: '10px',
                padding: '0.6rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              }}
            >
              <Archive size={15} strokeWidth={2.2} />
              <span>{t('archiveSalesBefore') || 'Archiver ventes antérieures...'}</span>
            </button>
          )}

          {activeTab === 'repairs' && (
            <button
              type="button"
              onClick={() => setBatchModal({ open: true, type: 'repairs' })}
              disabled={eligibleUnarchivedRepairsCount === 0}
              style={{
                background: eligibleUnarchivedRepairsCount > 0 ? 'linear-gradient(135deg, #ffd05b 0%, #f6a619 100%)' : 'var(--bg-input)',
                color: eligibleUnarchivedRepairsCount > 0 ? '#000000' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '10px',
                padding: '0.6rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: eligibleUnarchivedRepairsCount > 0 ? 'pointer' : 'not-allowed',
                boxShadow: eligibleUnarchivedRepairsCount > 0 ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
              }}
            >
              <Archive size={15} strokeWidth={2.2} />
              <span>{t('archiveAllEligibleRepairs') || 'Archiver fiches réglées'} ({eligibleUnarchivedRepairsCount})</span>
            </button>
          )}

          {activeTab === 'credits' && (
            <button
              type="button"
              onClick={() => setBatchModal({ open: true, type: 'credits' })}
              disabled={eligibleUnarchivedSettledCreditsCount === 0}
              style={{
                background: eligibleUnarchivedSettledCreditsCount > 0 ? 'linear-gradient(135deg, #ffd05b 0%, #f6a619 100%)' : 'var(--bg-input)',
                color: eligibleUnarchivedSettledCreditsCount > 0 ? '#000000' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '10px',
                padding: '0.6rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: eligibleUnarchivedSettledCreditsCount > 0 ? 'pointer' : 'not-allowed',
                boxShadow: eligibleUnarchivedSettledCreditsCount > 0 ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
              }}
            >
              <Archive size={15} strokeWidth={2.2} />
              <span>{t('archiveAllSettledCredits') || 'Archiver règlements'} ({eligibleUnarchivedSettledCreditsCount})</span>
            </button>
          )}

          {activeTab === 'expenses' && (
            <button
              type="button"
              onClick={() => setBatchModal({ open: true, type: 'expenses' })}
              style={{
                background: 'linear-gradient(135deg, #ffd05b 0%, #f6a619 100%)',
                color: '#000000',
                border: 'none',
                borderRadius: '10px',
                padding: '0.6rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              }}
            >
              <Archive size={15} strokeWidth={2.2} />
              <span>{t('archiveExpensesBefore') || 'Archiver dépenses antérieures...'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TOP 4 KPI CARDS */}
      <div className="sales-kpi-grid-4">
        {/* CARD 1: VENTES ARCHIVÉES */}
        <div
          className="dash-kpi-card"
          style={{
            cursor: 'pointer',
            borderColor: activeTab === 'sales' ? '#818cf8' : 'var(--border-color)',
            background: activeTab === 'sales' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
          }}
          onClick={() => setActiveTab('sales')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <ShoppingCart size={18} />
            </div>
            <div className="dash-kpi-sparkbars" style={{ color: '#818cf8' }}>
              <div className="dash-kpi-sparkbar" style={{ height: '8px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '14px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '11px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '20px' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('archivesTabSales') || 'Ventes Archivées'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {formatMoney(archivedSalesTotalAmount)}
              </div>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              📦 {archivedSalesCount} {lang === 'ar' ? 'فاتورة' : 'factures archivées'}
            </div>
          </div>
        </div>

        {/* CARD 2: RÉPARATIONS 100% CLÔTURÉES & PAYÉES */}
        <div
          className="dash-kpi-card"
          style={{
            cursor: 'pointer',
            borderColor: activeTab === 'repairs' ? '#f59e0b' : 'var(--border-color)',
            background: activeTab === 'repairs' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-card)',
          }}
          onClick={() => setActiveTab('repairs')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <Wrench size={18} />
            </div>
            <div className="dash-kpi-sparkbars" style={{ color: '#f59e0b' }}>
              <div className="dash-kpi-sparkbar" style={{ height: '14px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '10px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '18px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '12px' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('archivesTabRepairs') || 'Réparations (100% Payées)'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.02em' }}>
                {formatMoney(archivedRepairsTotalAmount)}
              </div>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              🔧 {archivedRepairsCount} {lang === 'ar' ? 'جهاز مسلّم' : 'fiches 100% réglées'}
            </div>
          </div>
        </div>

        {/* CARD 3: CRÉDITS RÉGLÉS ENCAISSÉS */}
        <div
          className="dash-kpi-card"
          style={{
            cursor: 'pointer',
            borderColor: activeTab === 'credits' ? '#10b981' : 'var(--border-color)',
            background: activeTab === 'credits' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)',
          }}
          onClick={() => setActiveTab('credits')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <CreditCard size={18} />
            </div>
            <div className="dash-kpi-sparkbars" style={{ color: '#10b981' }}>
              <div className="dash-kpi-sparkbar" style={{ height: '10px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '14px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '16px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '22px' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('archivesTabCredits') || 'Crédits Réglés'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em' }}>
                +{formatMoney(archivedCreditsTotalAmount)}
              </div>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              💳 {archivedCreditsCount} {lang === 'ar' ? 'سداد مؤرشف' : 'règlements archivés'}
            </div>
          </div>
        </div>

        {/* CARD 4: DÉPENSES & SORTIES */}
        <div
          className="dash-kpi-card"
          style={{
            cursor: 'pointer',
            borderColor: activeTab === 'expenses' ? '#ef4444' : 'var(--border-color)',
            background: activeTab === 'expenses' ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-card)',
          }}
          onClick={() => setActiveTab('expenses')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <Wallet size={18} />
            </div>
            <div className="dash-kpi-sparkbars" style={{ color: '#ef4444' }}>
              <div className="dash-kpi-sparkbar" style={{ height: '6px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '12px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '18px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '14px' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('archivesTabExpenses') || 'Dépenses & Sorties'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ef4444', letterSpacing: '-0.02em' }}>
                -{formatMoney(archivedExpensesTotalAmount)}
              </div>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              👛 {archivedExpensesCount} {lang === 'ar' ? 'مصروف مؤرشف' : 'dépenses archivées'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR: TABS PILL SELECTOR + SEARCH + DATE FILTER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        
        {/* Module Tabs Pill Selector */}
        <div className="dash-period-pill-group">
          <button
            type="button"
            className={`dash-period-btn ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ShoppingCart size={14} />
            <span>{t('archivesTabSales') || 'Ventes'} ({archivedSalesCount})</span>
          </button>

          <button
            type="button"
            className={`dash-period-btn ${activeTab === 'repairs' ? 'active' : ''}`}
            onClick={() => setActiveTab('repairs')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Wrench size={14} />
            <span>{t('archivesTabRepairs') || 'Réparations'} ({archivedRepairsCount})</span>
          </button>

          <button
            type="button"
            className={`dash-period-btn ${activeTab === 'credits' ? 'active' : ''}`}
            onClick={() => setActiveTab('credits')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <CreditCard size={14} />
            <span>{t('archivesTabCredits') || 'Crédits Réglés'} ({archivedCreditsCount})</span>
          </button>

          <button
            type="button"
            className={`dash-period-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Wallet size={14} />
            <span>{t('archivesTabExpenses') || 'Dépenses'} ({archivedExpensesCount})</span>
          </button>
        </div>

        {/* Right Side: Search + Period Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
          {/* Search Bar Input */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              maxWidth: '320px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '0.45rem 0.85rem',
              gap: '0.6rem',
            }}
          >
            <Search size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={
                activeTab === 'sales'
                  ? (lang === 'ar' ? 'بحث برقم الفاتورة، الحريف...' : 'Rechercher facture, client...')
                  : activeTab === 'repairs'
                  ? (lang === 'ar' ? 'بحث بالفيشة، الجهاز، الحريف...' : 'Rechercher ticket, modèle, client...')
                  : activeTab === 'credits'
                  ? (lang === 'ar' ? 'بحث بالحريف، الهاتف...' : 'Rechercher client, téléphone...')
                  : (lang === 'ar' ? 'بحث بعنوان المصروف...' : 'Rechercher titre dépense...')
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Date Period Filter Pills */}
          <div className="dash-period-pill-group">
            {[
              { id: 'all', label: lang === 'ar' ? 'الكل' : 'Tous' },
              { id: 'today', label: lang === 'ar' ? 'اليوم' : "Aujourd'hui" },
              { id: '7d', label: lang === 'ar' ? '7 jours' : '7 jours' },
              { id: '30d', label: lang === 'ar' ? '30 jours' : '30 jours' },
              { id: 'custom', label: lang === 'ar' ? 'تاريخ' : 'Date' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                className={`dash-period-btn ${dateFilter === p.id ? 'active' : ''}`}
                onClick={() => setDateFilter(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {dateFilter === 'custom' && (
            <input
              type="date"
              className="dash-date-picker-wrap"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.35rem 0.6rem',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                outline: 'none',
              }}
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
            />
          )}
        </div>
      </div>

      {/* 4. SECURITY INFO NOTE */}
      <div
        style={{
          background: 'rgba(245, 158, 11, 0.06)',
          border: '1px solid rgba(245, 158, 11, 0.22)',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
        }}
      >
        <Info size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
        <span>
          {activeTab === 'sales' && (lang === 'ar' ? 'المبيعات المؤرشفة محفوظة بأمان وبإمكانك استرجاعها في أي لحظة دون المساس بإحصائيات اليومية.' : 'Les ventes archivées conservent leurs détails complets et peuvent être consultées, réimprimées ou restaurées à tout moment sans modifier la caisse active.')}
          {activeTab === 'repairs' && (lang === 'ar' ? 'قاعدة الأمان المعتمدة: يتم أرشفة بطاقات الصيانة المسلّمة والخالصة بنسبة 100% فقط دون لمس أي حساب عليه دين.' : 'Règle de sécurité : Seules les fiches 100% clôturées et entièrement payées sans crédit sont archivées. Vos créances restent protégées.')}
          {activeTab === 'credits' && (lang === 'ar' ? 'يتم أرشفة حركات السداد المستلمة فقط. الديون النشطة تظل دائماً محمية في دفتر الديون.' : 'Seuls les règlements encaissés peuvent être archivés. Les dettes actives des clients restent toujours protégées dans le carnet.')}
          {activeTab === 'expenses' && (lang === 'ar' ? 'المصاريف وسحوبات الصندوق المؤرشفة تبقى مسجلة لأغراض المراجعة والمحاسبة.' : 'Les dépenses et sorties de caisse archivées restent consultables et restaurables sans impacter les opérations courantes.')}
        </span>
      </div>

      {/* 5. MAIN CONTENT: ARCHIVED TABLES */}

      {/* TAB 1: ARCHIVED SALES */}
      {activeTab === 'sales' && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {filteredSales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <Archive size={42} style={{ opacity: 0.35, marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {lang === 'ar' ? 'لا توجد مبيعات مؤرشفة' : 'Aucune vente archivée'}
              </div>
              <p style={{ fontSize: '0.82rem', marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
                {lang === 'ar'
                  ? 'يمكنك أرشفة المبيعات القديمة باستخدام زر "Archiver ventes antérieures..."'
                  : 'Vous pouvez archiver des ventes depuis le Journal des Ventes ou via le bouton ci-dessus.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <th style={{ padding: '0.85rem 1rem' }}>{t('invoiceCol') || 'N° VENTE / FACTURE'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{t('colDateTime') || 'DATE & HEURE'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{t('client') || 'CLIENT'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{t('products') || 'ARTICLES & DÉTAILS'}</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>{t('colTotal') || 'TOTAL VENTE'}</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>{t('paymentTypeCol') || 'RÈGLEMENT'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>ARCHIVÉ LE</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', background: 'var(--bg-input)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                          {sale.invoiceNumber || sale.id}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {new Date(sale.date).toLocaleString(lang === 'ar' ? 'ar-TN' : 'fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sale.clientName}</div>
                        {sale.clientPhone && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            📞 {sale.clientPhone}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', maxWidth: '260px' }}>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {(sale.items || []).map((it) => `${it.name} (x${it.quantity})`).join(', ') || 'Vente directe'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div>
                          <strong style={{ color: '#10b981', fontSize: '0.92rem' }}>
                            {formatMoney(sale.totalAmount)}
                          </strong>
                          {Number(sale.remainingCredit || 0) > 0 && (
                            <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '2px' }}>
                              Dette: {formatMoney(sale.remainingCredit)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background:
                              sale.paymentType === 'cash'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : sale.paymentType === 'credit'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            color:
                              sale.paymentType === 'cash'
                                ? '#10b981'
                                : sale.paymentType === 'credit'
                                ? '#ef4444'
                                : '#f59e0b',
                          }}
                        >
                          {sale.paymentType === 'cash'
                            ? (lang === 'ar' ? 'نقداً' : 'Espèces')
                            : sale.paymentType === 'credit'
                            ? (lang === 'ar' ? 'دين' : 'Crédit')
                            : (lang === 'ar' ? 'تسبيق' : 'Acompte')}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {sale.archivedAt ? new Date(sale.archivedAt).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="dash-action-btn"
                            title={t('unarchiveItem') || 'Désarchiver (Restaurer dans le journal actif)'}
                            onClick={() => handleUnarchiveSale(sale.id)}
                          >
                            <RotateCcw size={14} style={{ color: '#38bdf8' }} />
                          </button>
                          <button
                            type="button"
                            className="dash-action-btn"
                            title={t('printReceipt') || 'Imprimer Ticket'}
                            onClick={() => setActiveReceipt({ type: 'sale', data: sale })}
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            type="button"
                            className="dash-action-btn"
                            title="Voir détails"
                            onClick={() => setViewDetailModal({ open: true, item: sale, type: 'sale' })}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ARCHIVED REPAIRS */}
      {activeTab === 'repairs' && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {filteredRepairs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <Wrench size={42} style={{ opacity: 0.35, marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {lang === 'ar' ? 'لا توجد بطاقات صيانة مؤرشفة' : 'Aucune réparation archivée'}
              </div>
              <p style={{ fontSize: '0.82rem', marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
                {lang === 'ar'
                  ? 'فقط الأجهزة المسلّمة والخالصة بنسبة 100% تقبل الأرشفة'
                  : 'Seules les fiches clôturées et entièrement payées sans dette peuvent être archivées.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <th style={{ padding: '0.85rem 1rem' }}>{t('ticketCol') || 'N° TICKET'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{t('deviceModel') || 'APPAREIL'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{t('client') || 'CLIENT'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{t('issueDiagnostic') || 'PANNE / RÉPARATION'}</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>{t('totalQuote') || 'MONTANT PAYÉ'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{t('deliveredAtCol') || 'LIVRÉ LE'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>ARCHIVÉ LE</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepairs.map((rep) => (
                    <tr
                      key={rep.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <span style={{ fontWeight: 700, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.12)', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          {rep.ticketNumber || rep.id}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rep.deviceModel}</div>
                        {rep.devicePassword && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Code: {rep.devicePassword}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rep.clientName}</div>
                        {rep.clientPhone && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            📞 {rep.clientPhone}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', maxWidth: '240px' }}>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {rep.issueDescription || rep.problemDescription || 'Réparation effectuée'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div>
                          <strong style={{ color: '#10b981', fontSize: '0.92rem' }}>
                            {formatMoney(rep.totalPrice)}
                          </strong>
                          <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
                            ✓ 100% Réglé
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {rep.deliveredAt
                          ? new Date(rep.deliveredAt).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR')
                          : '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {rep.archivedAt ? new Date(rep.archivedAt).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="dash-action-btn"
                            title={t('unarchiveItem') || 'Désarchiver (Restaurer dans l’atelier actif)'}
                            onClick={() => handleUnarchiveRepair(rep.id)}
                          >
                            <RotateCcw size={14} style={{ color: '#38bdf8' }} />
                          </button>
                          <button
                            type="button"
                            className="dash-action-btn"
                            title={t('printReceipt') || 'Imprimer Ticket'}
                            onClick={() => setActiveReceipt({ type: 'repair', data: rep })}
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            type="button"
                            className="dash-action-btn"
                            title="Voir détails"
                            onClick={() => {
                              if (onSelectRepair) onSelectRepair(rep);
                              else setViewDetailModal({ open: true, item: rep, type: 'repair' });
                            }}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ARCHIVED CREDIT PAYMENTS */}
      {activeTab === 'credits' && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {filteredCredits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <CreditCard size={42} style={{ opacity: 0.35, marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {lang === 'ar' ? 'لا توجد حركات سداد ديون مؤرشفة' : 'Aucun règlement de crédit archivé'}
              </div>
              <p style={{ fontSize: '0.82rem', marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
                {lang === 'ar'
                  ? 'يمكن أرشفة عمليات سداد الديون السابقة دون التأثير على أرصدة الحسابات'
                  : 'Vous pouvez archiver l’historique des paiements encaissés pour nettoyer les fiches clients.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <th style={{ padding: '0.85rem 1rem' }}>{t('colDateTime') || 'DATE & HEURE'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{t('client') || 'CLIENT'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{t('notesCol') || 'LIBELLÉ DU RÈGLEMENT'}</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>{t('amountPaidCol') || 'MONTANT ENCAISSÉ'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>ARCHIVÉ LE</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCredits.map((trx) => (
                    <tr
                      key={trx.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {new Date(trx.date).toLocaleString(lang === 'ar' ? 'ar-TN' : 'fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{trx.clientName}</div>
                        {trx.clientPhone && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            📞 {trx.clientPhone}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                          {trx.note || 'Règlement espèces'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <strong style={{ color: '#10b981', fontSize: '0.92rem' }}>
                          +{formatMoney(Math.abs(Number(trx.amount) || 0))}
                        </strong>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {trx.archivedAt ? new Date(trx.archivedAt).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="dash-action-btn"
                            title={t('unarchiveItem') || 'Désarchiver (Restaurer dans l’historique client)'}
                            onClick={() => handleUnarchiveCredit(trx.clientId, trx.id)}
                          >
                            <RotateCcw size={14} style={{ color: '#38bdf8' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ARCHIVED EXPENSES */}
      {activeTab === 'expenses' && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {filteredExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <Wallet size={42} style={{ opacity: 0.35, marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {lang === 'ar' ? 'لا توجد مصاريف مؤرشفة' : 'Aucune dépense archivée'}
              </div>
              <p style={{ fontSize: '0.82rem', marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
                {lang === 'ar'
                  ? 'يمكنك أرشفة المصاريف السابقة لتنظيف جدول المصاريف اليومية'
                  : 'Vous pouvez archiver des dépenses passées depuis la vue Dépenses ou via le bouton ci-dessus.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <th style={{ padding: '0.85rem 1rem' }}>{t('colDateTime') || 'DATE & HEURE'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{t('expenseTitleLabel') || 'TITRE DÉPENSE'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{t('expenseCategoryLabel') || 'CATÉGORIE'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{t('expensePaymentMethod') || 'MODE PAIEMENT'}</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>{t('expenseAmountLabel') || 'MONTANT'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{t('notes') || 'NOTES'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>ARCHIVÉ LE</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => (
                    <tr
                      key={exp.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {new Date(exp.date).toLocaleString(lang === 'ar' ? 'ar-TN' : 'fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {exp.title}
                        </strong>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>
                          {exp.category || 'other'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, background: exp.paymentMethod === 'cash' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.12)', color: exp.paymentMethod === 'cash' ? '#f87171' : '#38bdf8' }}>
                          {exp.paymentMethod === 'cash' ? (t('paymentCash') || 'Espèces') : (t('paymentBank') || 'Banque')}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <strong style={{ color: '#ef4444', fontSize: '0.92rem' }}>
                          -{formatMoney(exp.amount)}
                        </strong>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', maxWidth: '200px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {exp.notes || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {exp.archivedAt ? new Date(exp.archivedAt).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="dash-action-btn"
                            title={t('unarchiveItem') || 'Désarchiver (Restaurer)'}
                            onClick={() => handleUnarchiveExpense(exp.id)}
                          >
                            <RotateCcw size={14} style={{ color: '#38bdf8' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* EXPORT TO EXCEL MODAL (DU - AU OU TOUT) */}
      {/* ======================================================== */}
      {exportModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setExportModal((prev) => ({ ...prev, open: false }))}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              maxWidth: '540px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.15rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet size={18} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {lang === 'ar' ? 'تصدير الأرشيف إلى إكسيل (Excel .xlsx)' : 'Exporter les Archives vers Excel (.xlsx)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExportModal((prev) => ({ ...prev, open: false }))}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Option 1: Choose Period Scope (Tout vs Du - Au) */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                  {lang === 'ar' ? '1. نطاق وتاريخ التصدير :' : '1. Période à exporter :'}
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`dash-period-btn ${exportModal.mode === 'all' ? 'active' : ''}`}
                    style={{ borderRadius: '10px', padding: '0.65rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                    onClick={() => setExportModal((prev) => ({ ...prev, mode: 'all' }))}
                  >
                    <Archive size={15} />
                    <span>{lang === 'ar' ? 'جميع الأرشيف (الكل)' : 'Toutes les archives (Tout)'}</span>
                  </button>

                  <button
                    type="button"
                    className={`dash-period-btn ${exportModal.mode === 'custom' ? 'active' : ''}`}
                    style={{ borderRadius: '10px', padding: '0.65rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                    onClick={() => setExportModal((prev) => ({ ...prev, mode: 'custom' }))}
                  >
                    <Calendar size={15} />
                    <span>{lang === 'ar' ? 'فترة محددة (من - إلى)' : 'Période (Du ... Au ...)'}</span>
                  </button>
                </div>
              </div>

              {/* Date pickers when custom mode is chosen */}
              {exportModal.mode === 'custom' && (
                <div
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.85rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      {lang === 'ar' ? 'من تاريخ (Du) :' : 'Du (Date début) :'}
                    </label>
                    <input
                      type="date"
                      value={exportModal.startDate}
                      onChange={(e) => setExportModal((prev) => ({ ...prev, startDate: e.target.value }))}
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '0.45rem 0.6rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      {lang === 'ar' ? 'إلى تاريخ (Au) :' : 'Au (Date fin) :'}
                    </label>
                    <input
                      type="date"
                      value={exportModal.endDate}
                      onChange={(e) => setExportModal((prev) => ({ ...prev, endDate: e.target.value }))}
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '0.45rem 0.6rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Option 2: Select Sheets to Include */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                  {lang === 'ar' ? '2. الأوراق المراد تضمينها في الملف (Sheets) :' : '2. Feuilles Excel à inclure :'}
                </label>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.75rem',
                  }}
                >
                  {[
                    { id: 'summary', label: '📊 Feuille 1 : Synthèse & Totaux Généraux', color: '#818cf8' },
                    { id: 'sales', label: `🛒 Feuille 2 : Ventes Archivées (${archivedSalesCount})`, color: '#6366f1' },
                    { id: 'repairs', label: `🔧 Feuille 3 : Réparations Clôturées & Payées (${archivedRepairsCount})`, color: '#f59e0b' },
                    { id: 'credits', label: `💳 Feuille 4 : Règlements de Crédits (${archivedCreditsCount})`, color: '#10b981' },
                    { id: 'expenses', label: `👛 Feuille 5 : Dépenses & Sorties de Caisse (${archivedExpensesCount})`, color: '#ef4444' },
                  ].map((sheet) => (
                    <div
                      key={sheet.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        cursor: 'pointer',
                        fontSize: '0.84rem',
                        padding: '0.4rem 0.55rem',
                        borderRadius: '8px',
                        background: exportModal.sheets[sheet.id] ? 'rgba(255,255,255,0.05)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                      onClick={() =>
                        setExportModal((prev) => ({
                          ...prev,
                          sheets: { ...prev.sheets, [sheet.id]: !prev.sheets[sheet.id] },
                        }))
                      }
                    >
                      <input
                        type="checkbox"
                        checked={!!exportModal.sheets[sheet.id]}
                        onChange={() => {}}
                        style={{ cursor: 'pointer', accentColor: '#10b981' }}
                      />
                      <span style={{ fontWeight: 600, color: sheet.color }}>{sheet.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem', padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
              <button
                type="button"
                className="dash-period-btn"
                onClick={() => setExportModal((prev) => ({ ...prev, open: false }))}
                style={{ padding: '0.55rem 1rem', borderRadius: '10px' }}
              >
                {t('cancel') || 'Annuler'}
              </button>
              <button
                type="button"
                onClick={handleExportToExcel}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.55rem 1.15rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                <Download size={16} />
                <span>{lang === 'ar' ? 'تنزيل ملف الإكسيل' : 'Télécharger le classeur Excel'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BATCH ARCHIVE MODAL */}
      {/* ======================================================== */}
      {batchModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setBatchModal({ open: false, type: null })}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.15rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Archive size={18} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {batchModal.type === 'sales' && (t('archiveSalesBefore') || 'Archivage des Ventes Antérieures')}
                  {batchModal.type === 'repairs' && (t('archiveAllEligibleRepairs') || 'Archivage des Réparations Clôturées')}
                  {batchModal.type === 'credits' && (t('archiveAllSettledCredits') || 'Archivage des Règlements')}
                  {batchModal.type === 'expenses' && (t('archiveExpensesBefore') || 'Archivage des Dépenses Antérieures')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBatchModal({ open: false, type: null })}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {batchModal.type === 'sales' && (
                <div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                    Toutes les ventes enregistrées avant ou jusqu’à cette date seront déplacées vers les archives. Elles resteront consultables et imprimables à tout moment.
                  </p>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                      Archiver toutes les ventes antérieures au :
                    </label>
                    <input
                      type="date"
                      value={batchCutoffDate}
                      onChange={(e) => setBatchCutoffDate(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '0.55rem 0.75rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.84rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              )}

              {batchModal.type === 'repairs' && (
                <div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                    Archiver automatiquement toutes les fiches de réparations <strong>100% livrées et 100% payées</strong> ({eligibleUnarchivedRepairsCount} prêtes).
                  </p>
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    🔒 <strong>Sécurité absolue :</strong> Les fiches ayant un solde impayé (crédit) ne seront JAMAIS archivées pour éviter toute perte de créance.
                  </div>
                </div>
              )}

              {batchModal.type === 'credits' && (
                <div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                    Archiver l'historique des règlements encaissés ({eligibleUnarchivedSettledCreditsCount} paiements) pour alléger l’affichage des fiches clients.
                  </p>
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    ✓ Les dettes actives restent intactes et visibles dans le carnet de crédit.
                  </div>
                </div>
              )}

              {batchModal.type === 'expenses' && (
                <div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                    Toutes les dépenses enregistrées avant ou jusqu’à cette date seront archivées pour alléger le tableau des dépenses actives.
                  </p>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                      Archiver toutes les dépenses antérieures au :
                    </label>
                    <input
                      type="date"
                      value={batchCutoffDate}
                      onChange={(e) => setBatchCutoffDate(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '0.55rem 0.75rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.84rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem', padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
              <button
                type="button"
                className="dash-period-btn"
                onClick={() => setBatchModal({ open: false, type: null })}
                style={{ padding: '0.55rem 1rem', borderRadius: '10px' }}
              >
                {t('cancel') || 'Annuler'}
              </button>
              <button
                type="button"
                style={{
                  background: 'linear-gradient(135deg, #ffd05b 0%, #f6a619 100%)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.55rem 1.15rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                }}
                onClick={() => {
                  if (batchModal.type === 'sales') handleExecuteBatchArchiveSales();
                  else if (batchModal.type === 'repairs') handleExecuteBatchArchiveRepairs();
                  else if (batchModal.type === 'credits') handleExecuteBatchArchiveCredits();
                  else if (batchModal.type === 'expenses') handleExecuteBatchArchiveExpenses();
                }}
              >
                <Archive size={16} />
                <span>Confirmer l'archivage</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DETAIL PREVIEW MODAL */}
      {/* ======================================================== */}
      {viewDetailModal.open && viewDetailModal.item && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setViewDetailModal({ open: false, item: null, type: null })}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.15rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {viewDetailModal.type === 'sale'
                  ? `Détail Vente Archivée (${viewDetailModal.item.invoiceNumber || viewDetailModal.item.id})`
                  : `Détail Réparation Archivée (${viewDetailModal.item.ticketNumber || viewDetailModal.item.id})`}
              </h3>
              <button
                type="button"
                onClick={() => setViewDetailModal({ open: false, item: null, type: null })}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '1.25rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {viewDetailModal.type === 'sale' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--bg-input)', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Client :</span>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{viewDetailModal.item.clientName}</div>
                      {viewDetailModal.item.clientPhone && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📞 {viewDetailModal.item.clientPhone}</div>
                      )}
                    </div>
                    <div style={{ background: 'var(--bg-input)', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Date & Heure :</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{new Date(viewDetailModal.item.date).toLocaleString()}</div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      Articles vendus :
                    </label>
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-input)', padding: '0.65rem 0.85rem' }}>
                      {(viewDetailModal.item.items || []).map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: idx < viewDetailModal.item.items.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                          <span>{it.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>x{it.quantity}</span></span>
                          <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(it.unitPrice * it.quantity)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Vente :</span>
                    <span style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 800 }}>{formatMoney(viewDetailModal.item.totalAmount)}</span>
                  </div>
                </div>
              )}

              {viewDetailModal.type === 'repair' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--bg-input)', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Modèle :</span>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{viewDetailModal.item.deviceModel}</div>
                    </div>
                    <div style={{ background: 'var(--bg-input)', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Client :</span>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{viewDetailModal.item.clientName}</div>
                      {viewDetailModal.item.clientPhone && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📞 {viewDetailModal.item.clientPhone}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      Diagnostic / Panne :
                    </label>
                    <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-input)', borderRadius: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {viewDetailModal.item.issueDescription || viewDetailModal.item.problemDescription || 'Aucune description'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Montant Réglé :</span>
                    <span style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 800 }}>{formatMoney(viewDetailModal.item.totalPrice)}</span>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
              <button
                type="button"
                className="dash-period-btn"
                onClick={() => setViewDetailModal({ open: false, item: null, type: null })}
                style={{ padding: '0.55rem 1.2rem', borderRadius: '10px' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
