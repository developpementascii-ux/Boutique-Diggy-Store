import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import {
  TrendingUp,
  Banknote,
  Wrench,
  AlertTriangle,
  CreditCard,
  Clock,
  CheckCircle2,
  ChevronRight,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Wallet,
  Activity,
  PieChart,
  Award,
  Calendar,
  HandCoins,
  DollarSign,
} from 'lucide-react';

export default function Dashboard({ onNewSale, onNewRepair, onNewExpense, onSelectRepair }) {
  const {
    products = [],
    sales = [],
    repairs = [],
    expenses = [],
    categories = [],
    clients = [],
    todaySalesAmount,
    todayProfit,
    todaySalesList,
    todayExpensesAmount,
    netCashRegisterBalance,
    activeRepairs,
    urgentRepairs,
    readyRepairs,
    lowStockProducts,
    totalClientsDebt,
    clientsWithDebt,
    formatMoney,
    setCurrentTab,
    updateRepairStatus,
    setActiveReceipt,
    currentSession,
    t,
    lang,
    isRTL,
    isAdmin,
  } = useApp();

  // Period filter: 'today' | 'yesterday' | '7d' | '30d' | 'custom' (persisted across sessions/visits)
  const [period, setPeriod] = useState(() => {
    try {
      const saved = localStorage.getItem('boutique_dashboard_period_v1');
      return saved && ['today', 'yesterday', '7d', '30d', 'custom'].includes(saved) ? saved : '7d';
    } catch {
      return '7d';
    }
  });

  // Custom date picker state (YYYY-MM-DD)
  const [customDate, setCustomDate] = useState(() => {
    try {
      const saved = localStorage.getItem('boutique_dashboard_custom_date');
      return saved || new Date().toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  });

  // Auto-persist period filter on change
  useEffect(() => {
    try {
      localStorage.setItem('boutique_dashboard_period_v1', period);
      localStorage.setItem('boutique_dashboard_custom_date', customDate);
    } catch (e) {
      console.error('Error saving dashboard period:', e);
    }
  }, [period, customDate]);

  // Hub Tab: 'repairs' | 'stock' | 'timeline' (persisted across visits)
  const [activeHubTab, setActiveHubTab] = useState(() => {
    try {
      const saved = localStorage.getItem('boutique_dashboard_hub_tab');
      return saved && ['repairs', 'stock', 'timeline'].includes(saved) ? saved : 'repairs';
    } catch {
      return 'repairs';
    }
  });

  // Auto-persist hub tab on change
  useEffect(() => {
    try {
      localStorage.setItem('boutique_dashboard_hub_tab', activeHubTab);
    } catch (e) {
      console.error('Error saving dashboard hub tab:', e);
    }
  }, [activeHubTab]);

  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [visibleCurves, setVisibleCurves] = useState({ sales: true, profit: true, expenses: true });

  const isSessionClosed = Boolean(currentSession?.isClosed);

  // Status changer for repairs in dashboard
  const handleDashboardStatusChange = (rep, newStatus) => {
    updateRepairStatus(rep.id, newStatus);
    if (newStatus === 'delivered') {
      const remainingPaid = Number(rep.remainingDue) || 0;
      toast.success(
        lang === 'ar'
          ? `تم تسليم الجهاز وإغلاق تذكرة الصيانة (${rep.ticketNumber}) بنجاح`
          : lang === 'en'
          ? `Device delivered and ticket (${rep.ticketNumber}) closed successfully`
          : `Dossier de réparation (${rep.ticketNumber}) clôturé et livré avec succès !`,
        {
          description:
            remainingPaid > 0
              ? lang === 'ar'
                ? `المبلغ المستخلص: ${formatMoney(remainingPaid)}`
                : `Montant restant encaissé : ${formatMoney(remainingPaid)}`
              : undefined,
          action: {
            label: lang === 'ar' ? '🖨️ طباعة الوصل' : '🖨️ Imprimer Reçu',
            onClick: () =>
              setActiveReceipt({
                type: 'repair',
                data: { ...rep, status: 'delivered', remainingDue: 0 },
              }),
          },
        }
      );
    } else {
      toast.info(
        lang === 'ar'
          ? `تم تغيير حالة التذكرة (${rep.ticketNumber}) بنجاح`
          : `Statut du ticket (${rep.ticketNumber}) mis à jour avec succès.`
      );
    }
  };

  // Filter items according to period
  const periodData = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let daysCount = 7;
    let periodLabel = '';

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      daysCount = 1;
      periodLabel = t('periodToday') || "Aujourd'hui";
    } else if (period === 'yesterday') {
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      daysCount = 1;
      periodLabel = t('periodYesterday') || 'Hier';
    } else if (period === 'custom') {
      const targetDate = customDate ? new Date(customDate + 'T00:00:00') : new Date();
      startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
      daysCount = 1;
      periodLabel = targetDate.toLocaleDateString(lang === 'ar' ? 'ar-TN' : lang === 'en' ? 'en-US' : 'fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } else if (period === '7d') {
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      daysCount = 7;
      periodLabel = t('period7d') || '7 Derniers Jours';
    } else if (period === '30d') {
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      daysCount = 30;
      periodLabel = t('period30d') || '30 Derniers Jours';
    }

    const isInPeriod = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= startDate && d <= endDate;
    };

    const periodSales = sales.filter((s) => isInPeriod(s.date));
    const periodExpenses = expenses.filter((e) => isInPeriod(e.date));
    const periodDeliveredRepairs = repairs.filter((r) => r.status === 'delivered' && isInPeriod(r.deliveredAt || r.createdAt));

    // Calculate collected credits (client debt payments made in this period)
    let collectedCredit = 0;
    let collectedCreditCount = 0;
    clients.forEach((c) => {
      if (Array.isArray(c.history)) {
        c.history.forEach((trx) => {
          const isPayment = Number(trx.amount) < 0 || trx.type === 'payment' || trx.type === 'repair_payment' || trx.type === 'settlement';
          if (isPayment && isInPeriod(trx.date)) {
            collectedCredit += Math.abs(Number(trx.amount) || 0);
            collectedCreditCount += 1;
          }
        });
      }
    });

    // Calculate workshop repair revenue and profit for the period
    let repairsRev = 0;
    let repairsProf = 0;
    let periodRepairOperationsCount = 0;

    repairs.forEach((rep) => {
      const isDelivered = rep.status === 'delivered';
      const effectiveDate = rep.deliveredAt || rep.createdAt;
      const createdInPeriod = isInPeriod(rep.createdAt);
      const deliveredInPeriod = isDelivered && isInPeriod(rep.deliveredAt);

      const totalAmount = Number(rep.totalPrice) || 0;
      const advance = Number(rep.advancePaid) || 0;
      const initialAdv = rep.initialAdvance !== undefined
        ? Number(rep.initialAdvance)
        : (isDelivered ? Math.max(0, totalAmount - (Number(rep.remainingPaid) || 0)) : advance);

      const remainingSettled = rep.remainingPaid !== undefined
        ? Number(rep.remainingPaid)
        : Math.max(0, totalAmount - initialAdv);

      const baseLabor = Number(rep.laborCost) > 0
        ? Number(rep.laborCost)
        : Math.max(0, totalAmount - (Number(rep.pieceCost) || 0));

      const profit = isDelivered
        ? (baseLabor > 0 ? baseLabor : totalAmount)
        : (advance > 0 ? advance : (baseLabor > 0 ? baseLabor : 0));

      if (isInPeriod(effectiveDate) || createdInPeriod || deliveredInPeriod) {
        let rRev = 0;
        let rProf = 0;

        if (createdInPeriod && deliveredInPeriod) {
          rRev = totalAmount > 0 ? totalAmount : (initialAdv + remainingSettled);
          rProf = profit;
        } else if (deliveredInPeriod) {
          rRev = remainingSettled > 0 ? remainingSettled : totalAmount;
          rProf = Math.max(0, profit - (initialAdv > 0 ? Math.min(profit, initialAdv) : 0));
        } else if (createdInPeriod) {
          rRev = initialAdv > 0 ? initialAdv : totalAmount;
          rProf = isDelivered ? Math.min(profit, initialAdv) : (initialAdv > 0 ? initialAdv : 0);
        } else if (isInPeriod(effectiveDate)) {
          rRev = totalAmount > 0 ? totalAmount : (initialAdv + remainingSettled);
          rProf = profit;
        }

        if (rRev > 0 || rProf > 0 || isInPeriod(effectiveDate)) {
          repairsRev += rRev;
          repairsProf += rProf;
          periodRepairOperationsCount += 1;
        }
      }
    });

    // Calculate totals including counter sales, workshop repairs, and recovered customer debts
    const salesRev = periodSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const totalRev = salesRev + repairsRev + collectedCredit;

    const salesProf = periodSales.reduce((sum, s) => sum + (Number(s.totalProfit) || 0), 0);
    const totalProf = salesProf + repairsProf;

    const totalExp = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const salesCount = periodSales.length + periodRepairOperationsCount + collectedCreditCount;
    const avgTicket = salesCount > 0 ? totalRev / salesCount : 0;
    const marginRate = totalRev > 0 ? Math.min(100, Math.max(0, Math.round((totalProf / totalRev) * 100))) : 0;

    // Daily aggregated buckets for Chart
    const getLocalDateKey = (d) => {
      if (!d) return '';
      if (typeof d === 'string') {
        if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.substring(0, 10);
        const parsed = new Date(d);
        if (!isNaN(parsed.getTime())) {
          return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
        }
      }
      if (d instanceof Date && !isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      return '';
    };

    const dailyMap = {};
    if (daysCount === 1) {
      // 1-day view: show yesterday vs selected day or single point
      const dateKey = getLocalDateKey(startDate);
      const dayName = startDate.toLocaleDateString(lang === 'ar' ? 'ar-TN' : lang === 'en' ? 'en-US' : 'fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      dailyMap[dateKey] = {
        dateKey,
        label: dayName,
        sales: 0,
        profit: 0,
        expenses: 0,
      };
    } else {
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateKey = getLocalDateKey(d);
        const dayName = d.toLocaleDateString(lang === 'ar' ? 'ar-TN' : lang === 'en' ? 'en-US' : 'fr-FR', {
          weekday: daysCount <= 7 ? 'short' : undefined,
          day: 'numeric',
          month: daysCount > 7 ? 'short' : undefined,
        });
        dailyMap[dateKey] = {
          dateKey,
          label: dayName,
          sales: 0,
          profit: 0,
          expenses: 0,
        };
      }
    }

    periodSales.forEach((s) => {
      if (!s.date) return;
      const k = getLocalDateKey(s.date);
      if (dailyMap[k]) {
        dailyMap[k].sales += Number(s.totalAmount) || 0;
        dailyMap[k].profit += Number(s.totalProfit) || 0;
      }
    });

    periodExpenses.forEach((e) => {
      if (!e.date) return;
      const k = getLocalDateKey(e.date);
      if (dailyMap[k]) {
        dailyMap[k].expenses += Number(e.amount) || 0;
      }
    });

    // Populate repair inflow & profit onto chart days
    repairs.forEach((rep) => {
      const isDelivered = rep.status === 'delivered';
      const initialAdv = rep.initialAdvance !== undefined
        ? Number(rep.initialAdvance)
        : (isDelivered ? Math.max(0, (Number(rep.totalPrice) || 0) - (Number(rep.remainingPaid) || 0)) : (Number(rep.advancePaid) || 0));

      const remainingSettled = rep.remainingPaid !== undefined
        ? Number(rep.remainingPaid)
        : Math.max(0, (Number(rep.totalPrice) || 0) - initialAdv);

      const baseLabor = Number(rep.laborCost) > 0
        ? Number(rep.laborCost)
        : Math.max(0, (Number(rep.totalPrice) || 0) - (Number(rep.pieceCost) || 0));

      // Advance on createdAt
      if (rep.createdAt && initialAdv > 0) {
        const kCreate = getLocalDateKey(rep.createdAt);
        if (dailyMap[kCreate]) {
          dailyMap[kCreate].sales += initialAdv;
          const advProfit = isDelivered
            ? (baseLabor > 0 ? Math.min(baseLabor, initialAdv) : initialAdv)
            : (initialAdv > 0 ? initialAdv : 0);
          dailyMap[kCreate].profit += advProfit;
        }
      }

      // Final settlement on deliveredAt
      if (isDelivered && rep.deliveredAt) {
        const kDeliv = getLocalDateKey(rep.deliveredAt);
        if (dailyMap[kDeliv]) {
          if (remainingSettled > 0) {
            dailyMap[kDeliv].sales += remainingSettled;
          }
          const createdSameDay = getLocalDateKey(rep.createdAt) === kDeliv;
          const remProfit = Math.max(0, (baseLabor > 0 ? baseLabor : Number(rep.totalPrice) || 0) - (createdSameDay ? Math.min(baseLabor, initialAdv) : 0));
          dailyMap[kDeliv].profit += remProfit;
        }
      }
    });

    // Populate client credit settlements onto chart days
    clients.forEach((c) => {
      if (Array.isArray(c.history)) {
        c.history.forEach((trx) => {
          const isPayment = Number(trx.amount) < 0 || trx.type === 'payment' || trx.type === 'repair_payment' || trx.type === 'settlement';
          if (isPayment && trx.date) {
            const kTrx = getLocalDateKey(trx.date);
            if (dailyMap[kTrx]) {
              dailyMap[kTrx].sales += Math.abs(Number(trx.amount) || 0);
            }
          }
        });
      }
    });

    // Calculate granted credits in this period (unpaid customer balances)
    const salesRemainingCredit = periodSales.reduce((sum, s) => sum + (Number(s.remainingCredit) || 0), 0);
    const repairsRemainingCredit = repairs
      .filter((r) => isInPeriod(r.createdAt) && r.status !== 'delivered')
      .reduce((sum, r) => sum + (Number(r.remainingDue) || 0), 0);
    const totalGrantedCredit = salesRemainingCredit + repairsRemainingCredit;
    const grantedCreditCount =
      periodSales.filter((s) => Number(s.remainingCredit) > 0).length +
      repairs.filter((r) => isInPeriod(r.createdAt) && r.status !== 'delivered' && Number(r.remainingDue) > 0).length;

    const chartPoints = Object.values(dailyMap);

    return {
      totalRev,
      totalProf,
      totalExp,
      realNetProfit: totalProf - totalExp,
      collectedCredit,
      collectedCreditCount,
      totalGrantedCredit,
      grantedCreditCount,
      salesCount,
      avgTicket,
      marginRate,
      chartPoints,
      periodSales,
      periodExpenses,
      periodLabel,
      startDate,
      endDate,
    };
  }, [sales, expenses, clients, repairs, period, customDate, lang]);

  // Top Selling Products ranking
  const topSellingProducts = useMemo(() => {
    const prodMap = {};
    const salesToProcess = (periodData.periodSales && periodData.periodSales.length > 0)
      ? periodData.periodSales
      : sales;

    salesToProcess.forEach((s) => {
      if (Array.isArray(s.items)) {
        s.items.forEach((item) => {
          const id = item.productId || item.id || item.name;
          const matchedProduct = products.find((p) => p.id === (item.productId || item.id) || p.name === item.name);
          const image = item.image || matchedProduct?.image || null;
          const qty = Number(item.quantity || item.qty) || 1;
          const unitPrice = Number(item.unitPrice ?? item.price ?? item.sellingPrice ?? (item.total ? Number(item.total) / qty : 0)) || Number(matchedProduct?.sellingPrice) || 0;
          const revenue = Number(item.total) > 0 ? Number(item.total) : (unitPrice * qty);

          if (!prodMap[id]) {
            prodMap[id] = {
              id,
              name: item.name || matchedProduct?.name || 'Produit',
              category: item.category || matchedProduct?.category,
              image,
              unitPrice,
              qty: 0,
              revenue: 0,
            };
          }
          prodMap[id].qty += qty;
          prodMap[id].revenue += revenue;
          if (unitPrice > prodMap[id].unitPrice) {
            prodMap[id].unitPrice = unitPrice;
          }
        });
      }
    });

    const list = Object.values(prodMap)
      .sort((a, b) => (b.revenue - a.revenue) || (b.unitPrice - a.unitPrice) || (b.qty - a.qty))
      .slice(0, 5);
    const maxRev = list.length > 0 ? list[0].revenue : 1;
    return list.map((p, idx) => ({
      ...p,
      rank: idx + 1,
      percentOfTop: maxRev > 0 ? Math.round((p.revenue / maxRev) * 100) : 100,
    }));
  }, [periodData.periodSales, sales, products]);

  // Sales by Category Donut distribution
  const categoryDistribution = useMemo(() => {
    const catMap = {};
    let total = 0;
    const salesToProcess = (periodData.periodSales && periodData.periodSales.length > 0)
      ? periodData.periodSales
      : sales;

    salesToProcess.forEach((s) => {
      if (Array.isArray(s.items)) {
        s.items.forEach((item) => {
          const matchedProduct = products.find((p) => p.id === (item.productId || item.id) || p.name === item.name);
          const catName = item.category || matchedProduct?.category || (lang === 'ar' ? 'عام' : 'Divers');
          const qty = Number(item.quantity || item.qty) || 1;
          const unitPrice = Number(item.unitPrice ?? item.price ?? item.sellingPrice ?? (item.total ? Number(item.total) / qty : 0)) || Number(matchedProduct?.sellingPrice) || 0;
          const amount = Number(item.total) > 0 ? Number(item.total) : (unitPrice * qty);
          catMap[catName] = (catMap[catName] || 0) + amount;
          total += amount;
        });
      }
    });

    const palette = ['#6366f1', '#10b981', '#f59e0b', '#38bdf8', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];
    let offsetAccumulator = 0;

    const list = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, amount], index) => {
        const catObj = categories.find((c) => c.id === name || c.name === name);
        const percent = total > 0 ? Math.round((amount / total) * 100) : 0;
        const color = catObj?.color || palette[index % palette.length];
        const strokeDash = (percent * 283) / 100; // 2 * PI * 45 ≈ 283
        const offset = offsetAccumulator;
        offsetAccumulator += strokeDash;

        return {
          name: catObj ? (t(catObj.nameKey) || catObj.name) : name,
          amount,
          percent,
          color,
          strokeDash,
          offset,
        };
      });

    return {
      list,
      total,
    };
  }, [periodData.periodSales, sales, categories, products, lang, t]);

  // SVG Line/Area Chart Calculations
  const chartSvgData = useMemo(() => {
    const pts = periodData.chartPoints;
    if (!pts || pts.length === 0) return null;

    const maxVal = Math.max(
      ...pts.map((p) => Math.max(p.sales, p.profit, p.expenses)),
      100
    );

    const width = 640;
    const height = 180;
    const padX = 20;
    const padY = 20;

    const getX = (index) => padX + (index / Math.max(pts.length - 1, 1)) * (width - 2 * padX);
    const getY = (val) => height - padY - (val / maxVal) * (height - 2 * padY);

    const makeSmoothPath = (key) => {
      if (pts.length === 1) {
        return `M ${getX(0)} ${getY(pts[0][key])} L ${width - padX} ${getY(pts[0][key])}`;
      }
      return pts.reduce((acc, curr, i, arr) => {
        const x = getX(i);
        const y = getY(curr[key]);
        if (i === 0) return `M ${x},${y}`;
        const prevX = getX(i - 1);
        const prevY = getY(arr[i - 1][key]);
        const cp1x = prevX + (x - prevX) / 2;
        const cp2x = prevX + (x - prevX) / 2;
        return `${acc} C ${cp1x},${prevY} ${cp2x},${y} ${x},${y}`;
      }, '');
    };

    const salesPath = makeSmoothPath('sales');
    const profitPath = makeSmoothPath('profit');
    const expPath = makeSmoothPath('expenses');

    const salesArea = `${salesPath} L ${getX(pts.length - 1)},${height - padY} L ${getX(0)},${height - padY} Z`;
    const profitArea = `${profitPath} L ${getX(pts.length - 1)},${height - padY} L ${getX(0)},${height - padY} Z`;

    const pointCoords = pts.map((p, i) => ({
      ...p,
      x: getX(i),
      salesY: getY(p.sales),
      profitY: getY(p.profit),
      expensesY: getY(p.expenses),
    }));

    return {
      width,
      height,
      salesPath,
      profitPath,
      expPath,
      salesArea,
      profitArea,
      pointCoords,
      maxVal,
    };
  }, [periodData.chartPoints]);

  // Realtime chronological timeline (Today's activities)
  const recentTimeline = useMemo(() => {
    const list = [];
    sales.slice(0, 10).forEach((s) => {
      list.push({
        id: `s-${s.id}`,
        type: 'sale',
        title: `${t('newSale') || 'Vente'} ${s.invoiceNumber || ''}`,
        desc: s.clientName || (lang === 'ar' ? 'زبون مباشر' : 'Client Comptoir'),
        amount: Number(s.totalAmount) || 0,
        date: s.date,
        direction: 'in',
      });
    });
    repairs.slice(0, 5).forEach((r) => {
      const isDelivered = r.status === 'delivered';
      const amt = isDelivered ? (Number(r.totalPrice) || 0) : (Number(r.advancePaid) || Number(r.totalPrice) || 0);
      list.push({
        id: `r-${r.id}`,
        type: 'repair',
        title: `${lang === 'ar' ? 'صيانة' : 'SAV'} ${r.ticketNumber} — ${r.deviceModel}`,
        desc: `${r.clientName || 'Client'}${!isDelivered && Number(r.advancePaid) > 0 ? ` (Acompte: ${formatMoney(r.advancePaid)})` : ''}`,
        amount: amt,
        date: r.deliveredAt || r.createdAt,
        direction: 'in',
      });
    });
    expenses.slice(0, 5).forEach((e) => {
      list.push({
        id: `e-${e.id}`,
        type: 'expense',
        title: `${t('newExpense') || 'Dépense'} : ${e.title}`,
        desc: e.category,
        amount: Number(e.amount) || 0,
        date: e.date,
        direction: 'out',
      });
    });
    (clients || []).forEach((c) => {
      (c.history || [])
        .filter((t) => Number(t.amount) < 0 || t.type === 'payment' || t.type === 'repair_payment' || t.type === 'settlement')
        .slice(0, 5)
        .forEach((t) => {
          const collected = Math.abs(Number(t.amount) || 0);
          if (collected > 0) {
            list.push({
              id: `cp-${t.id || Math.random()}`,
              type: 'credit_payment',
              title: `${lang === 'ar' ? 'سداد دين' : lang === 'en' ? 'Debt Settlement' : 'Règlement Crédit'}`,
              desc: `${c.name} (${t.note || (lang === 'ar' ? 'نقداً' : 'Espèces')})`,
              amount: collected,
              date: t.date,
              direction: 'in',
            });
          }
        });
    });

    return list.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);
  }, [sales, repairs, expenses, clients, lang, t]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. FUTURISTIC GLASS COMMAND HEADER */}
      <div className="glass-command-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {t('executiveDashboard') || 'Centre de Contrôle & Performance'}
              </h2>
              <div className="pulsing-live-badge">
                <div className="pulsing-dot" />
                <span>{t('systemLive') || 'En Direct'}</span>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
              {t('headerDashboardSub') || 'Synthèse analytique et supervision de la boutique'}
            </p>
          </div>
        </div>

        {/* Period Pills & Quick Action Triggers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="period-pill-group">
            <button
              type="button"
              className={`period-pill-btn ${period === 'today' ? 'active' : ''}`}
              onClick={() => setPeriod('today')}
            >
              {t('periodToday') || "Aujourd'hui"}
            </button>
            <button
              type="button"
              className={`period-pill-btn ${period === 'yesterday' ? 'active' : ''}`}
              onClick={() => setPeriod('yesterday')}
            >
              {t('periodYesterday') || 'Hier'}
            </button>
            <button
              type="button"
              className={`period-pill-btn ${period === '7d' ? 'active' : ''}`}
              onClick={() => setPeriod('7d')}
            >
              {t('period7d') || '7 Jours'}
            </button>
            <button
              type="button"
              className={`period-pill-btn ${period === '30d' ? 'active' : ''}`}
              onClick={() => setPeriod('30d')}
            >
              {t('period30d') || '30 Jours'}
            </button>

            {/* Custom Specific Date Picker */}
            <div
              className={`period-date-input-wrap ${period === 'custom' ? 'active' : ''}`}
              title={lang === 'ar' ? 'اختيار تاريخ محدد' : 'Choisir une date précise'}
            >
              <Calendar
                size={14}
                style={{
                  color: period === 'custom' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  flexShrink: 0,
                }}
              />
              <input
                type="date"
                className="period-date-native-input"
                value={customDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setCustomDate(e.target.value);
                    setPeriod('custom');
                  }
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <button
              className="btn btn-primary btn-sm"
              style={{ borderRadius: '8px', padding: '0.4rem 0.85rem' }}
              onClick={onNewSale}
              title={t('newSale')}
            >
              <ShoppingBag size={14} />
              <span>+ {t('newSale')}</span>
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: '8px', padding: '0.4rem 0.85rem' }}
              onClick={onNewRepair}
              title={t('newRepair')}
            >
              <Wrench size={14} />
              <span>+ {t('newRepair')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE 4 GLASS KPI METRIC CARDS */}
      <div className="glass-kpi-grid">
        
        {/* KPI 1: CA & Bénéfice Brut */}
        <div className="glass-kpi-card">
          <div className="glass-kpi-glow" style={{ background: '#6366f1' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'block', lineHeight: 1.2 }}>
                {isAdmin ? (t('revenueAndProfit') || "CA & Bénéfice Brut") : (t('totalRevenue') || "Chiffre d'Affaires")}
              </span>
            </div>
            <div
              style={{
                width: '30px',
                height: '30px',
                flexShrink: 0,
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={15} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr', gap: '0.45rem', marginBottom: '0.5rem' }}>
            {/* Chiffre d'Affaires */}
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '0.35rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.18)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', display: 'inline-block' }}></span>
                {t('totalRevenue') || "Chiffre d'Affaires"}
              </div>
              <div className="privacy-blur" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#818cf8', marginTop: '0.15rem' }}>
                {formatMoney(periodData.totalRev)}
              </div>
            </div>

            {/* Bénéfice Brut (Admin Only) */}
            {isAdmin && (
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.35rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.18)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }}></span>
                  {t('grossProfit') || 'Bénéfice Net'}
                </div>
                <div className="profit-blur" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399', marginTop: '0.15rem' }}>
                  +{formatMoney(periodData.totalProf)}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>{periodData.salesCount} {t('operationsCount') || 'ventes'} • {t('avgTicket') || 'Panier'}: <span className="privacy-blur">{formatMoney(periodData.avgTicket)}</span></span>
            {isAdmin && <span className="profit-blur" style={{ color: '#34d399', fontWeight: 700 }}>{t('marginRate') || 'Marge'}: {periodData.marginRate}%</span>}
          </div>
        </div>

        {/* KPI 2: Dépenses de la Période */}
        <div
          className="glass-kpi-card"
          style={{ cursor: isAdmin ? 'pointer' : 'default' }}
          onClick={() => { if (isAdmin) setCurrentTab('expenses'); }}
          title={isAdmin ? (t('headerExpensesTitle') || "Consulter les dépenses & sorties de caisse") : ''}
        >
          <div className="glass-kpi-glow" style={{ background: '#f43f5e' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'block', lineHeight: 1.2 }}>
                {t('periodExpenses') || 'Dépenses Période'}
              </span>
            </div>
            <div
              style={{
                width: '30px',
                height: '30px',
                flexShrink: 0,
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.15)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowDownRight size={15} />
            </div>
          </div>

          <div style={{ background: 'rgba(244, 63, 94, 0.08)', padding: '0.35rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.18)', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f87171', display: 'inline-block' }}></span>
              {t('totalExpenses') || 'Total Dépenses'}
            </div>
            <div className="privacy-blur" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f87171', marginTop: '0.15rem' }}>
              -{formatMoney(periodData.totalExp)}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>{periodData.periodExpenses.length} {t('expensesCount') || 'dépenses'}</span>
            <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* KPI 3: Crédits Collectés & Accordés */}
        <div
          className="glass-kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => setCurrentTab('credits')}
          title={t('headerCreditsTitle') || "Consulter les crédits & dettes clients"}
        >
          <div className="glass-kpi-glow" style={{ background: '#0ea5e9' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'block', lineHeight: 1.2 }}>
                {t('creditsAndDebts') || 'Crédits & Dettes Clients'}
              </span>
            </div>
            <div
              style={{
                width: '30px',
                height: '30px',
                flexShrink: 0,
                borderRadius: '8px',
                background: 'rgba(14, 165, 233, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HandCoins size={15} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', marginBottom: '0.5rem' }}>
            <div style={{ background: 'rgba(14, 165, 233, 0.08)', padding: '0.35rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.18)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }}></span>
                {t('collectedCredit') || 'Collectés'}
              </div>
              <div className="privacy-blur" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.15rem' }}>
                +{formatMoney(periodData.collectedCredit)}
              </div>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '0.35rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.18)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f87171', display: 'inline-block' }}></span>
                {t('grantedCredit') || 'Accordés'}
              </div>
              <div className="privacy-blur" style={{ fontSize: '1.05rem', fontWeight: 800, color: periodData.totalGrantedCredit > 0 ? '#f87171' : 'var(--text-primary)', marginTop: '0.15rem' }}>
                {formatMoney(periodData.totalGrantedCredit)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>{periodData.collectedCreditCount} règl. • {periodData.grantedCreditCount} compte{periodData.grantedCreditCount > 1 ? 's' : ''}</span>
            <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* KPI 4: Bénéfice Net Réel (+/-) - Admin Only */}
        {isAdmin && (
          <div
            className="glass-kpi-card"
            style={{
              borderColor: periodData.realNetProfit >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            }}
          >
            <div
              className="glass-kpi-glow"
              style={{ background: periodData.realNetProfit >= 0 ? '#10b981' : '#ef4444' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    color: periodData.realNetProfit >= 0 ? '#10b981' : '#ef4444',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    display: 'block',
                    lineHeight: 1.2,
                  }}
                >
                  {t('periodNetProfit') || 'Bénéfice Net Réel (+/-)'}
                </span>
              </div>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  flexShrink: 0,
                  borderRadius: '8px',
                  background: periodData.realNetProfit >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: periodData.realNetProfit >= 0 ? '#34d399' : '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DollarSign size={15} />
              </div>
            </div>

            <div
              style={{
                background: periodData.realNetProfit >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                padding: '0.35rem 0.5rem',
                borderRadius: '8px',
                border: `1px solid ${periodData.realNetProfit >= 0 ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)'}`,
                marginBottom: '0.5rem',
              }}
            >
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: periodData.realNetProfit >= 0 ? '#34d399' : '#f87171',
                    display: 'inline-block',
                  }}
                />
                Bénéfice Brut - Dépenses
              </div>
              <div
                className="profit-blur"
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 900,
                  color: periodData.realNetProfit >= 0 ? '#34d399' : '#f87171',
                  marginTop: '0.15rem',
                }}
              >
                {periodData.realNetProfit >= 0 ? '+' : ''}{formatMoney(periodData.realNetProfit)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>Gain net après dépenses</span>
              <span style={{ color: periodData.realNetProfit >= 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>
                {periodData.realNetProfit >= 0 ? '✓ Positif' : '⚠ Négatif'}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* 3. INTERACTIVE SVG WAVE CHART SECTION */}
      <div
        className="ui-card"
        style={{
          padding: '1.25rem 1.5rem',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-secondary) 100%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Activity size={18} className="text-primary" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('chartTitle') || 'Évolution & Tendance des Performances'}
            </h3>
          </div>

          {/* Curve Toggles */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div
              className={`chart-legend-chip ${visibleCurves.sales ? '' : 'inactive'}`}
              style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}
              onClick={() => setVisibleCurves((prev) => ({ ...prev, sales: !prev.sales }))}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
              <span>{t('totalRevenue') || "Chiffre d'Affaires"}</span>
            </div>

            {isAdmin && (
              <div
                className={`chart-legend-chip ${visibleCurves.profit ? '' : 'inactive'}`}
                style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                onClick={() => setVisibleCurves((prev) => ({ ...prev, profit: !prev.profit }))}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span>{t('grossProfit') || 'Bénéfice Net'}</span>
              </div>
            )}

            <div
              className={`chart-legend-chip ${visibleCurves.expenses ? '' : 'inactive'}`}
              style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              onClick={() => setVisibleCurves((prev) => ({ ...prev, expenses: !prev.expenses }))}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              <span>{t('todayExpenses') || 'Dépenses'}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Responsive SVG Graph */}
        {chartSvgData ? (
          <div style={{ position: 'relative', width: '100%', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            <svg
              viewBox={`0 0 ${chartSvgData.width} ${chartSvgData.height}`}
              style={{ width: '100%', height: 'auto', minHeight: '160px', overflow: 'visible' }}
            >
              <defs>
                {/* Sales Gradient Fill */}
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
                {/* Profit Gradient Fill */}
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="20" x2="620" y2="20" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.5" />
              <line x1="20" y1="90" x2="620" y2="90" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.5" />
              <line x1="20" y1="160" x2="620" y2="160" stroke="var(--border-color)" opacity="0.7" />

              {/* Area Fills */}
              {visibleCurves.sales && (
                <path d={chartSvgData.salesArea} fill="url(#salesGrad)" />
              )}
              {isAdmin && visibleCurves.profit && (
                <path d={chartSvgData.profitArea} fill="url(#profitGrad)" />
              )}

              {/* Curves */}
              {visibleCurves.sales && (
                <path
                  d={chartSvgData.salesPath}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {isAdmin && visibleCurves.profit && (
                <path
                  d={chartSvgData.profitPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {visibleCurves.expenses && (
                <path
                  d={chartSvgData.expPath}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1.8"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
              )}

              {/* Interactive Points */}
              {chartSvgData.pointCoords.map((pt, idx) => (
                <g key={idx} onMouseEnter={() => setHoveredPoint(pt)} onMouseLeave={() => setHoveredPoint(null)}>
                  {/* Invisible Hitbox */}
                  <rect
                    x={pt.x - 15}
                    y={0}
                    width={30}
                    height={chartSvgData.height}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                  />

                  {visibleCurves.sales && (
                    <circle
                      cx={pt.x}
                      cy={pt.salesY}
                      r={hoveredPoint?.dateKey === pt.dateKey ? 5 : 3.5}
                      fill="#6366f1"
                      stroke="var(--bg-card)"
                      strokeWidth="2"
                      style={{ transition: 'all 0.15s ease' }}
                    />
                  )}

                  {isAdmin && visibleCurves.profit && (
                    <circle
                      cx={pt.x}
                      cy={pt.profitY}
                      r={hoveredPoint?.dateKey === pt.dateKey ? 4.5 : 3}
                      fill="#10b981"
                      stroke="var(--bg-card)"
                      strokeWidth="2"
                    />
                  )}

                  {/* Date labels below */}
                  <text
                    x={pt.x}
                    y={chartSvgData.height}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--text-muted)"
                    fontWeight={hoveredPoint?.dateKey === pt.dateKey ? '700' : '500'}
                  >
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div
                className="chart-svg-tooltip"
                style={{
                  position: 'absolute',
                  top: '15px',
                  left: isRTL ? undefined : `${(hoveredPoint.x / chartSvgData.width) * 100}%`,
                  right: isRTL ? `${100 - (hoveredPoint.x / chartSvgData.width) * 100}%` : undefined,
                  transform: 'translateX(-50%)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                  fontSize: '0.75rem',
                  zIndex: 30,
                  minWidth: '150px',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.2rem' }}>
                  {hoveredPoint.label}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#818cf8', fontWeight: 600 }}>
                  <span>{t('totalRevenue') || 'CA'}:</span>
                  <span className="privacy-blur">{formatMoney(hoveredPoint.sales)}</span>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399', fontWeight: 600 }}>
                    <span>{t('grossProfit') || 'Marge'}:</span>
                    <span className="profit-blur">+{formatMoney(hoveredPoint.profit)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171', fontWeight: 600 }}>
                  <span>{t('todayExpenses') || 'Dépenses'}:</span>
                  <span className="privacy-blur">-{formatMoney(hoveredPoint.expenses)}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            {t('noDataPeriod') || 'Aucune donnée sur cette période.'}
          </div>
        )}
      </div>

      {/* 4. MAIN 2-COLUMN LOWER SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        
        {/* BLOCK A: Donut Distribution & Top Selling Products */}
        <div className="ui-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={18} className="text-primary" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('salesByCategory') || 'Répartition des Ventes'}
              </h3>
            </div>
            <span className="badge badge-purple privacy-blur" style={{ fontSize: '0.72rem' }}>
              {formatMoney(categoryDistribution.total)}
            </span>
          </div>

          {/* Donut Chart & Category Breakdown */}
          {categoryDistribution.list.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
              <Package size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '0.82rem' }}>{t('noDataPeriod') || 'Aucune vente enregistrée sur cette période.'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              {/* SVG Donut */}
              <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0, margin: '0 auto' }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  {categoryDistribution.list.map((c, i) => (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      stroke={c.color}
                      strokeWidth="14"
                      strokeDasharray={`${c.strokeDash} 283`}
                      strokeDashoffset={-c.offset}
                      style={{ transition: 'all 0.3s ease' }}
                    />
                  ))}
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Total</span>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {categoryDistribution.list.length} cats
                  </strong>
                </div>
              </div>

              {/* Category Chips List */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '180px' }}>
                {categoryDistribution.list.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color }} />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{c.percent}%</span>
                      <strong className="privacy-blur" style={{ color: 'var(--text-primary)' }}>{formatMoney(c.amount)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Selling Products List */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Award size={16} style={{ color: '#fbbf24' }} />
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t('topSellingProducts') || 'Top Produits & Ventes'}
                </h4>
              </div>
              <button className="btn btn-outline btn-sm" style={{ fontSize: '0.72rem' }} onClick={() => setCurrentTab('inventory')}>
                {t('viewInventory')}
                <ChevronRight size={12} />
              </button>
            </div>

            {topSellingProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {t('noDataPeriod')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {topSellingProducts.map((p) => (
                  <div key={p.id} className="top-prod-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: p.rank === 1 ? '#fbbf24' : p.rank === 2 ? '#94a3b8' : p.rank === 3 ? '#b45309' : 'var(--border-color)',
                          color: p.rank === 1 ? '#000000' : '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        #{p.rank}
                      </div>

                      {/* Product Image Thumbnail */}
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package size={16} style={{ color: 'var(--text-muted)' }} />
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {p.qty} {t('unitsSold') || 'unités vendues'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <strong className="privacy-blur" style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', display: 'block' }}>
                        {formatMoney(p.revenue)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BLOCK B: Operations Hub & Interactive Workshop Feed */}
        <div className="ui-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Tabs Navigation Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${activeHubTab === 'repairs' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                onClick={() => setActiveHubTab('repairs')}
              >
                <Wrench size={13} />
                <span>{t('workshopHub') || 'Atelier SAV'}</span>
                <span style={{ opacity: 0.85, fontSize: '0.7rem' }}>({activeRepairs.length})</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm ${activeHubTab === 'stock' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                onClick={() => setActiveHubTab('stock')}
              >
                <AlertTriangle size={13} />
                <span>{t('stockAlerts') || 'Alertes Stock'}</span>
                {lowStockProducts.length > 0 && (
                  <span className="badge badge-red" style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}>
                    {lowStockProducts.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                className={`btn btn-sm ${activeHubTab === 'timeline' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                onClick={() => setActiveHubTab('timeline')}
              >
                <Clock size={13} />
                <span>{t('liveTimeline') || 'Flux Direct'}</span>
              </button>
            </div>

            <button
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.72rem' }}
              onClick={() => setCurrentTab(activeHubTab === 'repairs' ? 'repairs' : activeHubTab === 'stock' ? 'inventory' : 'sales_history')}
            >
              {t('viewAll')}
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Sub-View 1: Workshop Repairs Fast Action */}
          {activeHubTab === 'repairs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {activeRepairs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={36} style={{ color: '#34d399', margin: '0 auto 0.5rem auto' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{t('noRepairsFound') || 'Aucune réparation en attente.'}</p>
                </div>
              ) : (
                activeRepairs.slice(0, 5).map((rep) => (
                  <div key={rep.id} className="workshop-task-card">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.15rem' }}>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{rep.deviceModel}</strong>
                        <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                          {rep.ticketNumber}
                        </span>
                        {rep.priority === 'urgent' && (
                          <span className="badge badge-red" style={{ fontSize: '0.68rem' }}>
                            🔴 {t('priorityUrgent')}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {rep.clientName?.trim() ? rep.clientName : (lang === 'ar' ? 'زبون عابر' : lang === 'en' ? 'Walk-in Client' : 'Client comptoir')} • <span style={{ color: 'var(--text-muted)' }}>{rep.issueDescription}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <span className="privacy-blur" style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {formatMoney(rep.totalPrice)}
                      </span>

                      {rep.status === 'received' && (
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', color: '#38bdf8', borderColor: '#38bdf8' }}
                          onClick={() => handleDashboardStatusChange(rep, 'in_progress')}
                        >
                          {t('passInProgress')} →
                        </button>
                      )}
                      {rep.status === 'in_progress' && (
                        <button
                          className="btn btn-sm btn-success"
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                          onClick={() => handleDashboardStatusChange(rep, 'ready')}
                        >
                          {t('markReady')} ✓
                        </button>
                      )}
                      {rep.status === 'ready' && (
                        <button
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                          onClick={() => handleDashboardStatusChange(rep, 'delivered')}
                        >
                          {t('deliverAndClose')}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sub-View 2: Low Stock Alerts */}
          {activeHubTab === 'stock' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {lowStockProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={36} style={{ color: '#34d399', margin: '0 auto 0.5rem auto' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{t('noAlerts')}</p>
                </div>
              ) : (
                lowStockProducts.slice(0, 5).map((prod) => (
                  <div
                    key={prod.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(245, 158, 11, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: '8px',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {prod.image ? (
                          <img
                            src={prod.image}
                            alt={prod.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package size={16} style={{ color: 'var(--text-muted)' }} />
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {isAdmin && (
                            <>
                              {t('buyPriceCol')}: <span className="profit-blur">{formatMoney(prod.purchasePrice)}</span> |{' '}
                            </>
                          )}
                          {t('salePriceCol')}: <span className="privacy-blur">{formatMoney(prod.sellingPrice)}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className="badge"
                      style={{
                        background: Number(prod.stock) === 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: Number(prod.stock) === 0 ? '#f87171' : '#fbbf24',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      {prod.stock === 0 ? t('outOfStock') : `${t('inStock')}: ${prod.stock} ${prod.unit || ''}`}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sub-View 3: Realtime Timeline */}
          {activeHubTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentTimeline.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                  <Clock size={36} style={{ opacity: 0.3, margin: '0 auto 0.5rem auto' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{t('noDataPeriod')}</p>
                </div>
              ) : (
                recentTimeline.map((item) => {
                  const isIncoming = item.direction === 'in';
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: isIncoming ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isIncoming ? '#34d399' : '#f87171',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {isIncoming ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {item.desc} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <strong
                        className="privacy-blur"
                        style={{
                          color: isIncoming ? '#34d399' : '#f87171',
                          fontWeight: 700,
                        }}
                      >
                        {isIncoming ? '+' : '-'} {formatMoney(item.amount)}
                      </strong>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
