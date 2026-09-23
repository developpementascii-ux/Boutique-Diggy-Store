import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  AlertTriangle,
  History,
  Calculator,
  Coins,
  Receipt,
  FileText,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  Search,
  HandCoins,
  ChevronRight,
  Eye,
  Edit2,
  Printer,
  ChevronDown,
  ShoppingBag,
  Wrench,
  Package,
} from 'lucide-react';

export default function CashSessions() {
  const {
    currentSession,
    cashSessions,
    openingCash,
    setOpeningCash,
    todayCashInflow,
    todayCreditPaymentsAmount,
    todayCashExpensesAmount,
    netCashRegisterBalance,
    theoreticalCashInDrawer,
    yesterdayClosingBalance,
    formatMoney,
    setActiveReceipt,
    sales,
    repairs,
    expenses,
    clients,
    settings,
    lang,
    t,
    isRTL,
  } = useApp();

  // Period filter: 'today', 'yesterday', '7days', '30days', 'custom', 'all'
  const [period, setPeriod] = useState(() => {
    try {
      return localStorage.getItem('cash_sessions_period') || '7days';
    } catch {
      return '7days';
    }
  });
  const [customDate, setCustomDate] = useState(() => {
    try {
      return localStorage.getItem('cash_sessions_custom_date') || new Date().toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  });
  const [activeTab, setActiveTab] = useState('daily_journal'); // 'daily_journal' | 'calendar_profit' | 'live_movements'
  const [selectedDayDetails, setSelectedDayDetails] = useState(null); // Date string 'YYYY-MM-DD'
  const [editOpeningModalOpen, setEditOpeningModalOpen] = useState(false);
  const [tempOpeningVal, setTempOpeningVal] = useState(openingCash || 0);
  const [searchDayQuery, setSearchDayQuery] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('all');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const localeCode = lang === 'ar' ? 'ar-TN' : lang === 'en' ? 'en-US' : 'fr-FR';

  useEffect(() => {
    try {
      localStorage.setItem('cash_sessions_period', period);
      localStorage.setItem('cash_sessions_custom_date', customDate);
    } catch (e) {
      console.error(e);
    }
  }, [period, customDate]);

  // Helper to extract clean local YYYY-MM-DD key without UTC timezone shifts
  const getLocalDateKey = (d) => {
    if (!d) return '';
    if (typeof d === 'string') {
      // If it's already a clean YYYY-MM-DD string, return directly
      if (/^\d{4}-\d{2}-\d{2}$/.test(d.trim())) {
        return d.trim();
      }
      // If it contains a date-time string, parse as Date to extract local day
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      const match = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    }
    if (d instanceof Date && !isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return '';
  };

  // Aggregate Day-by-Day Historical Cash & Profit Matrix
  const dailyRecords = useMemo(() => {
    const recordsMap = {};
    const now = new Date();
    const todayKey = getLocalDateKey(now);

    const createEmptyDayRecord = (dateOrKey, isToday = false) => {
      let dateKey = '';
      if (typeof dateOrKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateOrKey.trim())) {
        dateKey = dateOrKey.trim();
      } else {
        dateKey = getLocalDateKey(dateOrKey);
      }
      if (!dateKey) return null;

      const [yStr, mStr, dStr] = dateKey.split('-');
      const year = Number(yStr);
      const month = Number(mStr) - 1;
      const dayNum = Number(dStr);

      // Midday (12:00:00) avoids any DST or UTC midnight boundary day shifts
      const dMidday = new Date(year, month, dayNum, 12, 0, 0);

      const dayLabel = dMidday.toLocaleDateString(localeCode, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      const fullDateLabel = dMidday.toLocaleDateString(localeCode, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      let dayOpening = 0;
      if (isToday) {
        dayOpening = Number(openingCash) || 0;
      } else if (cashSessions && cashSessions.length > 0) {
        const pastSession = cashSessions.find(cs => cs.date?.startsWith(dateKey) || cs.closedAt?.startsWith(dateKey));
        if (pastSession && pastSession.openingCash !== undefined) {
          dayOpening = Number(pastSession.openingCash) || 0;
        }
      }

      return {
        dateKey,
        dayNumber: dayNum,
        dayLabel,
        fullDateLabel,
        isToday,
        openingCash: dayOpening,
        cashSales: 0,
        cardSales: 0,
        otherSales: 0,
        creditCollected: 0,
        totalRevenue: 0,
        totalCost: 0,
        grossProfit: 0,
        expensesCash: 0,
        expensesOther: 0,
        totalExpenses: 0,
        netCashInDrawer: 0,
        netProfit: 0, // grossProfit - totalExpenses
        marginRate: 0,
        salesCount: 0,
        expensesCount: 0,
        repairsCount: 0,
        creditsCount: 0,
        salesList: [],
        expensesList: [],
        repairsList: [],
        creditsList: [],
      };
    };

    if (period === 'today') {
      recordsMap[todayKey] = createEmptyDayRecord(todayKey, true);
    } else if (period === 'yesterday') {
      const yDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0);
      const dateKey = getLocalDateKey(yDate);
      recordsMap[dateKey] = createEmptyDayRecord(dateKey, false);
    } else if (period === 'custom') {
      const dateKey = getLocalDateKey(customDate) || todayKey;
      recordsMap[dateKey] = createEmptyDayRecord(dateKey, dateKey === todayKey);
    } else if (period === '7days' || period === '30days' || period === 'month') {
      const count = period === '7days' ? 7 : 30;
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 12, 0, 0);
        const dateKey = getLocalDateKey(d);
        recordsMap[dateKey] = createEmptyDayRecord(dateKey, dateKey === todayKey);
      }
    }

    // Process all sales
    (sales || []).forEach((s) => {
      if (!s.date) return;
      const dateKey = getLocalDateKey(s.date);
      if (!dateKey) return;
      if (!recordsMap[dateKey]) {
        if (period === 'all') {
          recordsMap[dateKey] = createEmptyDayRecord(dateKey, dateKey === todayKey);
        } else {
          return;
        }
      }

      const rec = recordsMap[dateKey];
      if (rec.salesList.some((item) => item.id === s.id)) return;

      const amount = Number(s.amountPaid) || Number(s.totalAmount) || 0;
      const profit = Number(s.totalProfit) || 0;
      const cost = Number(s.totalCost) || (amount - profit);

      rec.totalRevenue += amount;
      rec.totalCost += cost;
      rec.grossProfit += profit;
      rec.salesCount += 1;
      rec.salesList.push(s);

      if (s.paymentMethod === 'cash' || !s.paymentMethod) {
        rec.cashSales += amount;
      } else if (s.paymentMethod === 'card') {
        rec.cardSales += amount;
      } else {
        rec.otherSales += amount;
      }
    });

    // Process expenses
    (expenses || []).forEach((e) => {
      if (!e.date) return;
      const dateKey = getLocalDateKey(e.date);
      if (!dateKey) return;
      if (!recordsMap[dateKey]) {
        if (period === 'all') {
          recordsMap[dateKey] = createEmptyDayRecord(dateKey, dateKey === todayKey);
        } else {
          return;
        }
      }

      const rec = recordsMap[dateKey];
      if (rec.expensesList.some((item) => item.id === e.id)) return;

      const amount = Number(e.amount) || 0;
      rec.totalExpenses += amount;
      rec.expensesCount += 1;
      rec.expensesList.push(e);

      if (e.paymentMethod === 'cash' || !e.paymentMethod) {
        rec.expensesCash += amount;
      } else {
        rec.expensesOther += amount;
      }
    });

    // Process credit payments (collected client debts)
    (clients || []).forEach((c) => {
      (c.history || []).forEach((trx) => {
        const isPayment = Number(trx.amount) < 0 || trx.type === 'payment' || trx.type === 'repair_payment' || trx.type === 'settlement';
        if (isPayment && trx.date) {
          const dateKey = getLocalDateKey(trx.date);
          if (!dateKey) return;
          if (!recordsMap[dateKey]) {
            if (period === 'all') {
              recordsMap[dateKey] = createEmptyDayRecord(dateKey, dateKey === todayKey);
            } else {
              return;
            }
          }

          const rec = recordsMap[dateKey];
          const trxKey = trx.id || `${c.id || c.name}-${trx.date}-${trx.amount}`;
          if (rec.creditsList.some((item) => (item.id && item.id === trx.id) || item._trxKey === trxKey)) return;

          const amount = Math.abs(Number(trx.amount) || 0);
          rec.creditCollected += amount;
          rec.cashSales += amount;
          rec.totalRevenue += amount;
          rec.creditsCount += 1;
          rec.creditsList.push({
            ...trx,
            _trxKey: trxKey,
            clientName: c.name,
            clientPhone: c.phone,
          });
        }
      });
    });

    // Process repairs
    (repairs || []).forEach((rep) => {
      const isDelivered = rep.status === 'delivered';
      const initialAdv = rep.initialAdvance !== undefined
        ? Number(rep.initialAdvance)
        : (isDelivered ? Math.max(0, (Number(rep.totalPrice) || 0) - (Number(rep.remainingPaid) || 0)) : (Number(rep.advancePaid) || 0));

      const remainingSettled = rep.remainingPaid !== undefined
        ? Number(rep.remainingPaid)
        : Math.max(0, (Number(rep.totalPrice) || 0) - initialAdv);

      const laborProfit = Number(rep.laborCost) > 0
        ? Number(rep.laborCost)
        : Math.max(0, (Number(rep.totalPrice) || 0) - (Number(rep.pieceCost) || 0));

      // 1. Initial Advance paid or ticket registered on createdAt
      if (rep.createdAt) {
        const createDateKey = getLocalDateKey(rep.createdAt);
        if (createDateKey) {
          if (!recordsMap[createDateKey]) {
            if (period === 'all') {
              recordsMap[createDateKey] = createEmptyDayRecord(createDateKey, createDateKey === todayKey);
            }
          }
          if (recordsMap[createDateKey]) {
            const rec = recordsMap[createDateKey];
            if (!rec.repairsList.some((item) => item.id === rep.id && item.flowType === 'advance')) {
              if (initialAdv > 0) {
                rec.totalRevenue += initialAdv;
                rec.cashSales += initialAdv;
              }
              rec.repairsCount += 1;
              const advProfit = isDelivered
                ? (laborProfit > 0 ? Math.min(laborProfit, initialAdv) : initialAdv)
                : (initialAdv > 0 ? initialAdv : 0);
              rec.grossProfit += advProfit;
              rec.repairsList.push({
                ...rep,
                flowType: 'advance',
                flowAmount: initialAdv,
                flowProfit: advProfit,
                flowLabel: initialAdv > 0 ? 'Acompte' : 'Dépôt SAV',
              });
            }
          }
        }
      }

      // 2. Final settlement paid on deliveredAt
      if (isDelivered && rep.deliveredAt) {
        const delivDateKey = getLocalDateKey(rep.deliveredAt);
        if (delivDateKey) {
          if (!recordsMap[delivDateKey]) {
            if (period === 'all') {
              recordsMap[delivDateKey] = createEmptyDayRecord(delivDateKey, delivDateKey === todayKey);
            }
          }
          if (recordsMap[delivDateKey]) {
            const rec = recordsMap[delivDateKey];
            if (!rec.repairsList.some((item) => item.id === rep.id && item.flowType === 'delivery')) {
              const createdSameDay = getLocalDateKey(rep.createdAt) === delivDateKey;
              const remProfit = Math.max(0, (laborProfit > 0 ? laborProfit : Number(rep.totalPrice) || 0) - (createdSameDay ? Math.min(laborProfit, initialAdv) : 0));
              rec.grossProfit += remProfit;

              // If the remaining balance wasn't already registered via client credit collection:
              const hasClientCreditPayment = rep.clientName && (clients || []).some((c) =>
                (c.name?.toLowerCase() === rep.clientName.toLowerCase() || (c.phone && c.phone === rep.clientPhone)) &&
                (c.history || []).some((t) => t.date && getLocalDateKey(t.date) === delivDateKey && (t.referenceId === rep.id || t.type === 'repair_payment'))
              );

              if (!hasClientCreditPayment && remainingSettled > 0) {
                rec.totalRevenue += remainingSettled;
                rec.cashSales += remainingSettled;
              }

              rec.repairsCount += 1;
              rec.repairsList.push({
                ...rep,
                flowType: 'delivery',
                flowAmount: remainingSettled,
                flowProfit: remProfit,
                flowLabel: 'Règlement solde',
              });
            }
          }
        }
      }
    });

    // Compute Net Profit & Drawer Cash for each day
    const list = Object.values(recordsMap).filter(Boolean).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    list.forEach((rec) => {
      rec.netCashInDrawer = rec.cashSales - rec.expensesCash;
      rec.netProfit = rec.grossProfit - rec.totalExpenses;
      rec.marginRate = rec.totalRevenue > 0 ? Math.min(100, Math.max(0, Math.round((rec.grossProfit / rec.totalRevenue) * 100))) : 0;
    });

    return list;
  }, [sales, expenses, clients, repairs, openingCash, cashSessions, period, customDate, localeCode]);

  // Overall Aggregated KPI for the selected period
  const periodSummary = useMemo(() => {
    let totalRevenue = 0;
    let totalGrossProfit = 0;
    let totalExpenses = 0;
    let totalExpensesCount = 0;
    let totalCashInflow = 0;
    let totalCashExpenses = 0;
    let totalSalesCount = 0;
    let totalCreditCollected = 0;
    let totalCreditsCount = 0;
    let profitableDaysCount = 0;
    let lossDaysCount = 0;

    dailyRecords.forEach((r) => {
      totalRevenue += r.totalRevenue;
      totalGrossProfit += r.grossProfit;
      totalExpenses += r.totalExpenses;
      totalExpensesCount += (r.expensesCount || 0);
      totalCashInflow += r.cashSales;
      totalCashExpenses += r.expensesCash;
      totalSalesCount += (r.salesCount + r.repairsCount + (r.creditsCount || 0));
      totalCreditCollected += (r.creditCollected || 0);
      totalCreditsCount += (r.creditsCount || 0);

      if (r.netProfit > 0) profitableDaysCount++;
      else if (r.netProfit < 0) lossDaysCount++;
    });

    // Granted credits in active period (matching Dashboard)
    const activeDateKeys = new Set(dailyRecords.map((r) => r.dateKey));
    let totalGrantedCredit = 0;
    let grantedCreditCount = 0;
    const seenRefIds = new Set();
    const seenTrxKeys = new Set();

    // 1. Sales in period with remaining credit
    (sales || []).forEach((s) => {
      if (s.date && activeDateKeys.has(getLocalDateKey(s.date))) {
        const debt = Number(s.remainingCredit || s.remainingDebt || 0);
        if (debt > 0) {
          totalGrantedCredit += debt;
          grantedCreditCount += 1;
          if (s.id) seenRefIds.add(String(s.id));
          if (s.invoiceNumber) seenRefIds.add(String(s.invoiceNumber));
        }
      }
    });

    // 2. Repairs in period with remaining due
    (repairs || []).forEach((r) => {
      const effKey = getLocalDateKey(r.deliveredAt || r.createdAt);
      if (effKey && activeDateKeys.has(effKey)) {
        const debt = Number(r.remainingDue || 0);
        if (debt > 0) {
          totalGrantedCredit += debt;
          grantedCreditCount += 1;
          if (r.id) seenRefIds.add(String(r.id));
          if (r.ticketNumber) seenRefIds.add(String(r.ticketNumber));
        }
      }
    });

    // 3. Client account history transactions (standalone manual debts not tied to sales/repairs)
    (clients || []).forEach((c) => {
      (c.history || []).forEach((trx) => {
        const isDebt = Number(trx.amount) > 0 || trx.type === 'sale_credit' || trx.type === 'repair_credit' || trx.type === 'manual_debt' || trx.type === 'credit';
        if (isDebt && trx.date && activeDateKeys.has(getLocalDateKey(trx.date))) {
          const amt = Number(trx.amount) || 0;
          const ref = trx.referenceId ? String(trx.referenceId) : null;
          const isTiedToSalesOrRepairs = ref && (
            seenRefIds.has(ref) ||
            (repairs || []).some((r) => r.id === ref || r.ticketNumber === ref) ||
            (sales || []).some((s) => s.id === ref || s.invoiceNumber === ref)
          );

          if (!isTiedToSalesOrRepairs && amt > 0) {
            const uniqueKey = ref || trx.id || `${c.id}-${trx.date}-${amt}`;
            if (!seenTrxKeys.has(uniqueKey)) {
              seenTrxKeys.add(uniqueKey);
              totalGrantedCredit += amt;
              grantedCreditCount += 1;
            }
          }
        }
      });
    });

    const totalCost = dailyRecords.reduce((acc, r) => acc + (r.totalCost || 0), 0);
    const grossProfitMargin = totalRevenue > 0 ? Math.min(100, Math.max(0, Math.round((totalGrossProfit / totalRevenue) * 100))) : 0;
    const netProfit = totalGrossProfit - totalExpenses;
    const netProfitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
    const avgTicket = totalSalesCount > 0 ? (totalRevenue / totalSalesCount) : 0;

    return {
      totalRevenue,
      totalCost,
      totalGrossProfit,
      grossProfitMargin,
      totalExpenses,
      totalExpensesCount,
      totalCreditCollected,
      totalCreditsCount,
      totalGrantedCredit,
      grantedCreditCount,
      totalCashInflow,
      totalCashExpenses,
      netProfit,
      netProfitMargin,
      totalSalesCount,
      avgTicket,
      profitableDaysCount,
      lossDaysCount,
      daysCount: dailyRecords.length,
    };
  }, [dailyRecords, sales, repairs]);

  // All Live Movements across period for the movements tab
  const allMovements = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    dailyRecords.forEach((rec) => {
      rec.salesList.forEach((s) => {
        const id = `sale-${s.id}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          list.push({
            id,
            date: s.date,
            type: 'sale',
            direction: 'in',
            title: `Vente ${s.invoiceNumber || ''}`,
            subtitle: `${s.clientName || 'Client Comptoir'} (${s.items?.length || 1} articles)`,
            amount: Number(s.amountPaid) || Number(s.totalAmount) || 0,
            profit: Number(s.totalProfit) || 0,
            paymentMethod: s.paymentMethod || 'cash',
          });
        }
      });

      rec.expensesList.forEach((e) => {
        const id = `exp-${e.id}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          list.push({
            id,
            date: e.date,
            type: 'expense',
            direction: 'out',
            title: e.category || 'Dépense',
            subtitle: e.description || e.note || 'Frais général',
            amount: Number(e.amount) || 0,
            profit: -(Number(e.amount) || 0),
            paymentMethod: e.paymentMethod || 'cash',
          });
        }
      });

      (rec.creditsList || []).forEach((c, idx) => {
        const id = `credit-${c.id || c._trxKey || idx}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          list.push({
            id,
            date: c.date,
            type: 'credit',
            direction: 'in',
            title: `Règlement Crédit`,
            subtitle: `${c.clientName || 'Client'} (${c.note || 'Espèces'})`,
            amount: Math.abs(Number(c.amount) || 0),
            profit: 0,
            paymentMethod: 'cash',
          });
        }
      });

      (rec.repairsList || []).forEach((r) => {
        const id = `repair-${r.id}-${r.flowType || 'item'}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          const flowAmt = Number(r.flowAmount) || Number(r.advancePaid) || Number(r.totalPrice) || 0;
          const laborProfit = r.flowProfit !== undefined
            ? Number(r.flowProfit)
            : (r.flowType === 'delivery'
              ? (Number(r.laborCost) > 0 ? Number(r.laborCost) : Math.max(0, (Number(r.totalPrice) || 0) - (Number(r.pieceCost) || 0)))
              : (Number(r.advancePaid) || 0));
          list.push({
            id,
            date: r.flowType === 'delivery' ? (r.deliveredAt || r.createdAt) : r.createdAt,
            type: 'repair',
            direction: 'in',
            title: `Réparation ${r.ticketNumber || ''} (${r.flowLabel || 'SAV'})`,
            subtitle: `${r.clientName || 'Client'} (${r.deviceModel})`,
            amount: flowAmt,
            profit: laborProfit,
            paymentMethod: 'cash',
          });
        }
      });
    });

    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [dailyRecords]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return allMovements.filter((m) => {
      if (movementTypeFilter === 'in') return m.direction === 'in';
      if (movementTypeFilter === 'out') return m.direction === 'out';
      if (movementTypeFilter === 'cash') return m.paymentMethod === 'cash';
      return true;
    });
  }, [allMovements, movementTypeFilter]);

  // SVG Chart Data (Profit Trend & Revenue vs Expenses)
  const chartData = useMemo(() => {
    const list = [...dailyRecords].reverse(); // Chronological for graph
    if (list.length === 0) return null;

    const width = 720;
    const height = 180;
    const paddingX = 40;
    const paddingY = 25;
    const chartW = width - paddingX * 2;
    const chartH = height - paddingY * 2;

    const maxVal = Math.max(
      ...list.map((d) => Math.max(d.totalRevenue, d.totalExpenses, Math.abs(d.netProfit))),
      50
    );

    const stepX = list.length > 1 ? chartW / (list.length - 1) : chartW;

    const points = list.map((d, i) => {
      const x = paddingX + i * stepX;
      // Net profit Y centered around mid-line
      const zeroY = paddingY + chartH / 2;
      const profitY = zeroY - (d.netProfit / maxVal) * (chartH / 2);
      const revY = paddingY + chartH - (d.totalRevenue / maxVal) * chartH;
      const expY = paddingY + chartH - (d.totalExpenses / maxVal) * chartH;

      return {
        ...d,
        x,
        zeroY,
        profitY: Math.max(paddingY, Math.min(height - paddingY, profitY)),
        revY: Math.max(paddingY, Math.min(height - paddingY, revY)),
        expY: Math.max(paddingY, Math.min(height - paddingY, expY)),
      };
    });

    return {
      points,
      zeroY: paddingY + chartH / 2,
      maxVal,
      width,
      height,
    };
  }, [dailyRecords]);

  // Calendar Days calculation for the selected month
  const calendarData = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1, 12, 0, 0);
    const lastDay = new Date(year, month + 1, 0, 12, 0, 0);
    const totalDays = lastDay.getDate();

    // Monday as 0, Sunday as 6
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];
    // Preceding empty slots
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ isPadding: true, key: `pad-${i}` });
    }

    const todayDateKey = getLocalDateKey(new Date());

    let monthTotalProfit = 0;
    let monthProfitableDays = 0;
    let monthLossDays = 0;

    for (let d = 1; d <= totalDays; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayRec = dailyRecords.find((r) => r.dateKey === dateKey) || null;

      let profit = 0;
      let revenue = 0;
      let hasData = false;

      if (dayRec) {
        profit = dayRec.netProfit;
        revenue = dayRec.totalRevenue;
        hasData = dayRec.salesCount > 0 || dayRec.expensesCount > 0 || dayRec.repairsCount > 0 || dayRec.creditsCount > 0;
      } else {
        (sales || []).forEach((s) => {
          if (s.date && getLocalDateKey(s.date) === dateKey) {
            hasData = true;
            profit += Number(s.totalProfit) || 0;
            revenue += Number(s.amountPaid) || Number(s.totalAmount) || 0;
          }
        });
        (expenses || []).forEach((e) => {
          if (e.date && getLocalDateKey(e.date) === dateKey) {
            hasData = true;
            profit -= Number(e.amount) || 0;
          }
        });
        (clients || []).forEach((c) => {
          (c.history || []).forEach((trx) => {
            const isPayment = Number(trx.amount) < 0 || trx.type === 'payment' || trx.type === 'repair_payment' || trx.type === 'settlement';
            if (isPayment && trx.date && getLocalDateKey(trx.date) === dateKey) {
              hasData = true;
              revenue += Math.abs(Number(trx.amount) || 0);
            }
          });
        });
        (repairs || []).forEach((r) => {
          const isDelivered = r.status === 'delivered';
          const initialAdv = Number(r.initialAdvance) || Number(r.advancePaid) || 0;
          const labor = Number(r.laborCost) > 0 ? Number(r.laborCost) : Math.max(0, (Number(r.totalPrice) || 0) - (Number(r.pieceCost) || 0));
          if (r.createdAt && getLocalDateKey(r.createdAt) === dateKey && initialAdv > 0) {
            hasData = true;
            const advProf = isDelivered ? Math.min(labor, initialAdv) : initialAdv;
            profit += advProf;
            revenue += initialAdv;
          }
          if (isDelivered && r.deliveredAt && getLocalDateKey(r.deliveredAt) === dateKey) {
            hasData = true;
            const createdSameDay = getLocalDateKey(r.createdAt) === dateKey;
            const remProfit = Math.max(0, labor - (createdSameDay ? Math.min(labor, initialAdv) : 0));
            profit += remProfit;
          }
        });
      }

      if (profit > 0) monthProfitableDays++;
      else if (profit < 0) monthLossDays++;
      monthTotalProfit += profit;

      days.push({
        isPadding: false,
        key: dateKey,
        dayNumber: d,
        dateKey,
        isToday: dateKey === todayDateKey,
        profit,
        revenue,
        hasData,
      });
    }

    const monthLabel = firstDay.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' });

    return {
      days,
      monthLabel,
      monthTotalProfit,
      monthProfitableDays,
      monthLossDays,
    };
  }, [calendarMonth, dailyRecords, sales, expenses, repairs, localeCode]);

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });
  };

  // Save updated opening cash
  const handleSaveOpeningCash = () => {
    const val = Math.max(0, Number(tempOpeningVal) || 0);
    setOpeningCash(val);
    setEditOpeningModalOpen(false);
    toast.success(
      lang === 'ar'
        ? `تم تحديث رصيد بداية الصندوق: ${formatMoney(val)}`
        : `Fond de caisse initial mis à jour : ${formatMoney(val)}`
    );
  };

  // Selected Day Object for Drawer
  const activeDayRecord = useMemo(() => {
    if (!selectedDayDetails) return null;
    return dailyRecords.find((r) => r.dateKey === selectedDayDetails);
  }, [dailyRecords, selectedDayDetails]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. HEADER SECTION */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Wallet size={26} className="text-primary" />
            <span>{t('headerSessionsTitle') || 'Journal de Caisse & Bénéfices'}</span>
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {t('headerSessionsSub') || 'Ce qu’il y a dans la caisse chaque jour et suivi de vos bénéfices réels (+ / -)'}
          </p>
        </div>

        {/* Action Buttons & Period Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          
          {/* Period Selector Pills */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '0.25rem',
              display: 'flex',
              gap: '0.25rem',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${period === 'all' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', border: 'none' }}
              onClick={() => setPeriod('all')}
            >
              {t('allDates') || t('all') || 'Tout'}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${period === 'today' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', border: 'none' }}
              onClick={() => setPeriod('today')}
            >
              {t('periodToday') || "Aujourd'hui"}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${period === 'yesterday' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', border: 'none' }}
              onClick={() => setPeriod('yesterday')}
            >
              {t('periodYesterday') || 'Hier'}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${period === '7days' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', border: 'none' }}
              onClick={() => setPeriod('7days')}
            >
              {t('period7d') || '7 Jours'}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${period === '30days' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', border: 'none' }}
              onClick={() => setPeriod('30days')}
            >
              {t('period30d') || '30 Jours'}
            </button>

            {/* Custom Date Button & Date Picker */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${period === 'custom' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', border: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                onClick={() => setPeriod('custom')}
              >
                <Calendar size={12} />
                {t('periodCustom') || 'Date Précise'}
              </button>
              {period === 'custom' && (
                <input
                  type="date"
                  className="input"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', width: 'auto' }}
                />
              )}
            </div>
          </div>

          {/* Edit Opening Float Button */}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={() => {
              setTempOpeningVal(openingCash || 0);
              setEditOpeningModalOpen(true);
            }}
            title="Ajuster le fond de caisse le matin"
          >
            <Coins size={15} style={{ color: 'var(--accent-warning)' }} />
            <span>Fond: <strong>{formatMoney(openingCash)}</strong></span>
            <Edit2 size={12} style={{ opacity: 0.7 }} />
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE 4 GLASS KPI METRIC CARDS (MATCHING DASHBOARD) */}
      <div className="glass-kpi-grid">
        
        {/* KPI 1: Chiffre d'Affaires */}
        <div className="glass-kpi-card">
          <div className="glass-kpi-glow" style={{ background: '#6366f1' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('totalRevenue') || "Chiffre d'Affaires"}
              </span>
            </div>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={16} />
            </div>
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            {/* Chiffre d'Affaires */}
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '0.35rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.18)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', display: 'inline-block' }}></span>
                {t('totalRevenue') || "Chiffre d'Affaires"}
              </div>
              <div className="privacy-blur" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#818cf8', marginTop: '0.15rem' }}>
                {formatMoney(periodSummary.totalRevenue)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>{periodSummary.totalSalesCount} {t('operationsCount') || 'opérations'} • {t('avgTicket') || 'Panier'}: <span className="privacy-blur">{formatMoney(periodSummary.avgTicket)}</span></span>
            <span style={{ color: 'var(--text-muted)' }}>Période</span>
          </div>
        </div>

        {/* KPI 2: Dépenses de la Période */}
        <div className="glass-kpi-card">
          <div className="glass-kpi-glow" style={{ background: '#f43f5e' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('periodExpenses') || 'Dépenses Période'}
              </span>
            </div>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.15)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowDownRight size={16} />
            </div>
          </div>

          <div style={{ background: 'rgba(244, 63, 94, 0.08)', padding: '0.35rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.18)', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f87171', display: 'inline-block' }}></span>
              {t('totalExpenses') || 'Total Dépenses'}
            </div>
            <div className="privacy-blur" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f87171', marginTop: '0.15rem' }}>
              -{formatMoney(periodSummary.totalExpenses)}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>{periodSummary.totalExpensesCount} {t('expensesCount') || 'dépenses'}</span>
            <span style={{ color: 'var(--text-muted)' }}>Frais généraux déduits</span>
          </div>
        </div>

        {/* KPI 3: Crédits Collectés & Accordés */}
        <div className="glass-kpi-card">
          <div className="glass-kpi-glow" style={{ background: '#0ea5e9' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('creditsAndDebts') || 'Crédits & Dettes Clients'}
              </span>
            </div>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(14, 165, 233, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HandCoins size={16} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', marginBottom: '0.5rem' }}>
            <div style={{ background: 'rgba(14, 165, 233, 0.08)', padding: '0.35rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.18)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }}></span>
                {t('collectedCredit') || 'Collectés'}
              </div>
              <div className="privacy-blur" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.15rem' }}>
                +{formatMoney(periodSummary.totalCreditCollected)}
              </div>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '0.35rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.18)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f87171', display: 'inline-block' }}></span>
                {t('grantedCredit') || 'Accordés'}
              </div>
              <div className="privacy-blur" style={{ fontSize: '1.05rem', fontWeight: 800, color: periodSummary.totalGrantedCredit > 0 ? '#f87171' : 'var(--text-primary)', marginTop: '0.15rem' }}>
                {formatMoney(periodSummary.totalGrantedCredit)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>{periodSummary.totalCreditsCount} règl. • {periodSummary.grantedCreditCount} dette{periodSummary.grantedCreditCount > 1 ? 's' : ''}</span>
            <span style={{ color: 'var(--text-muted)' }}>Dettes période</span>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE PROFIT OVER TIME CHART (+ / -) */}
      <div
        className="ui-card"
        style={{
          padding: '1.25rem',
          background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-secondary) 100%)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} className="text-primary" />
              <span>{t('dailyProfitsTitle') || 'Évolution des Bénéfices au Fil du Temps (+ / -)'}</span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t('dailyProfitsSub') || 'Visualisez vos gains nets chaque jour après déduction des coûts d’achat et dépenses'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#34d399' }} />
              <span style={{ color: '#34d399', fontWeight: 600 }}>Bénéfice Net (+)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#f87171' }} />
              <span style={{ color: '#f87171', fontWeight: 600 }}>Perte / Dépense (-)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: '12px', height: '2px', background: '#818cf8' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Recettes CA</span>
            </div>
          </div>
        </div>

        {/* Visual Bar / Curve Chart */}
        {chartData && (
          <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} style={{ width: '100%', height: 'auto', minHeight: '160px' }}>
              {/* Zero baseline */}
              <line
                x1="30"
                y1={chartData.height / 2}
                x2={chartData.width - 30}
                y2={chartData.height / 2}
                stroke="var(--border-color)"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <text x="32" y={chartData.height / 2 - 4} fontSize="9" fill="var(--text-muted)">0.00 DT (Équilibre)</text>

              {/* Bars per day */}
              {chartData.points.map((pt, idx) => {
                const isPositive = pt.netProfit >= 0;
                const barH = Math.max(3, (Math.abs(pt.netProfit) / chartData.maxVal) * (chartData.height / 2 - 25));
                const barY = isPositive ? (chartData.height / 2 - barH) : (chartData.height / 2);
                const barColor = isPositive ? '#34d399' : '#f87171';

                return (
                  <g key={idx} style={{ cursor: 'pointer' }} onClick={() => setSelectedDayDetails(pt.dateKey)}>
                    {/* Background hover hit area */}
                    <rect
                      x={pt.x - 14}
                      y={10}
                      width={28}
                      height={chartData.height - 20}
                      fill="transparent"
                      className="chart-bar-hover"
                    />

                    {/* Revenue subtle line pill */}
                    {pt.totalRevenue > 0 && (
                      <circle
                        cx={pt.x}
                        cy={pt.revY}
                        r="3"
                        fill="#818cf8"
                        opacity="0.75"
                      />
                    )}

                    {/* Net Profit Bar */}
                    <rect
                      x={pt.x - 8}
                      y={barY}
                      width={16}
                      height={barH}
                      rx="3"
                      fill={barColor}
                      opacity={pt.netProfit === 0 ? 0.3 : 0.85}
                    />

                    {/* Day label */}
                    <text
                      x={pt.x}
                      y={chartData.height - 5}
                      textAnchor="middle"
                      fontSize="9.5"
                      fill="var(--text-secondary)"
                      fontWeight={pt.isToday ? '800' : '500'}
                    >
                      {pt.dayLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* 4. MAIN NAVIGATION TABS (Journalier vs Mouvements Directs) */}
      <div className="ui-card" style={{ padding: '0', overflow: 'hidden' }}>
        
        {/* Sub-Header Tabs Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1.25rem',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'daily_journal' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
              onClick={() => setActiveTab('daily_journal')}
            >
              <FileText size={14} />
              <span>{t('dailyTableTitle') || 'Journalier : Caisse & Bénéfices'}</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', fontSize: '0.68rem' }}>
                {dailyRecords.length}j
              </span>
            </button>

            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'calendar_profit' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
              onClick={() => setActiveTab('calendar_profit')}
            >
              <Calendar size={14} />
              <span>{t('tabCalendarProfit') || 'Vue Calendrier (+/-)'}</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'live_movements' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
              onClick={() => setActiveTab('live_movements')}
            >
              <History size={14} />
              <span>{t('tabRegisterDenomination') || 'Mouvements & Flux Directs'}</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', fontSize: '0.68rem' }}>
                {allMovements.length}
              </span>
            </button>
          </div>

          {/* Quick Search */}
          {activeTab === 'daily_journal' && (
            <div className="input-with-icon" style={{ minWidth: '220px' }}>
              <Search size={14} />
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.3rem 0.5rem 0.3rem 2rem', fontSize: '0.78rem' }}
                placeholder="Rechercher une date ou montant..."
                value={searchDayQuery}
                onChange={(e) => setSearchDayQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* TAB 1: DAILY CASH & PROFIT JOURNAL (TABLE VIEW) */}
        {activeTab === 'daily_journal' && (
          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>{t('dayCol') || 'Jour & Date'}</th>
                  <th>{t('dayCashIn') || 'Entrées Espèces (+)'}</th>
                  <th>{t('dayExpenses') || 'Dépenses (-)'}</th>
                  <th>{t('dayCashInDrawer') || 'En Caisse Soir'}</th>
                  <th>{t('dayTotalRevenue') || 'Chiffre Ventes'}</th>
                  <th>{t('dayCost') || "Prix Achat Fournisseur (-)"}</th>
                  <th>{t('dayGrossProfit') || 'Marge Brute (+)'}</th>
                  <th>{t('dayNetProfit') || 'Bénéfice Net (+/-)'}</th>
                  <th style={{ textAlign: 'end' }}>{t('actions') || 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {dailyRecords
                  .filter((rec) => !searchDayQuery.trim() || rec.fullDateLabel.toLowerCase().includes(searchDayQuery.toLowerCase()) || rec.dateKey.includes(searchDayQuery))
                  .map((rec) => {
                    const isProfit = rec.netProfit >= 0;
                    return (
                      <tr
                        key={rec.dateKey}
                        style={{
                          background: rec.isToday ? 'rgba(99, 102, 241, 0.04)' : undefined,
                          fontWeight: rec.isToday ? 600 : 400,
                        }}
                      >
                        {/* 1. Date */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: rec.isToday ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-input)',
                                color: rec.isToday ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                              }}
                            >
                              {rec.dateKey.split('-')[2]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                {rec.fullDateLabel}
                              </div>
                              {rec.isToday && (
                                <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                                  Aujourd'hui
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Cash Inflow */}
                        <td>
                          <span className="privacy-blur" style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.88rem' }}>
                            +{formatMoney(rec.cashSales)}
                          </span>
                        </td>

                        {/* 3. Cash Expenses */}
                        <td>
                          {rec.expensesCash > 0 ? (
                            <span className="privacy-blur" style={{ color: '#f87171', fontWeight: 700, fontSize: '0.88rem' }}>
                              -{formatMoney(rec.expensesCash)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>

                        {/* 4. Closing Cash in Drawer */}
                        <td>
                          <div className="privacy-blur" style={{ fontWeight: 800, color: 'var(--accent-info)', fontSize: '0.92rem' }}>
                            {formatMoney(rec.netCashInDrawer)}
                          </div>
                        </td>

                        {/* 5. Total Revenue (Sales & Repairs & Credits) */}
                        <td>
                          <span className="privacy-blur" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {formatMoney(rec.totalRevenue)}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                            {rec.salesCount + rec.repairsCount + (rec.creditsCount || 0)} {t('operationsCount') || 'opérations'}
                          </span>
                        </td>

                        {/* 6. Supplier Purchase Cost (-) */}
                        <td>
                          {rec.totalCost > 0 ? (
                            <>
                              <span className="privacy-blur" style={{ color: '#fb923c', fontWeight: 600, fontSize: '0.88rem' }}>
                                -{formatMoney(rec.totalCost)}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                                {t('dayCostSub') || 'Fournisseur'}
                              </span>
                            </>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>

                        {/* 7. Gross Profit (+ Gain sur ventes) */}
                        <td>
                          <div
                            className="profit-blur"
                            style={{
                              fontWeight: 700,
                              color: rec.grossProfit >= 0 ? '#10b981' : '#f87171',
                              fontSize: '0.88rem',
                            }}
                          >
                            {rec.grossProfit >= 0 ? '+' : ''}{formatMoney(rec.grossProfit)}
                          </div>
                          {rec.totalRevenue > 0 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                              Marge: {rec.marginRate}%
                            </span>
                          )}
                        </td>

                        {/* 8. Real Net Profit (+ / -) */}
                        <td>
                          <div
                            className="profit-blur"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              background: isProfit ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: isProfit ? '#34d399' : '#f87171',
                              fontWeight: 800,
                              fontSize: '0.88rem',
                            }}
                          >
                            {isProfit ? '+' : ''}{formatMoney(rec.netProfit)}
                          </div>
                        </td>

                        {/* 9. Action */}
                        <td style={{ textAlign: 'end' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            onClick={() => setSelectedDayDetails(rec.dateKey)}
                          >
                            <Eye size={13} />
                            <span>Détails</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: INTERACTIVE CALENDAR NET PROFIT GRID (+ / -) */}
        {activeTab === 'calendar_profit' && (
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Calendar Month Navigation Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--bg-card)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handlePrevMonth}
                  style={{ padding: '0.3rem 0.6rem' }}
                  title="Mois Précédent"
                >
                  ◀
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleNextMonth}
                  style={{ padding: '0.3rem 0.6rem' }}
                  title="Mois Suivant"
                >
                  ▶
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleCurrentMonth}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                >
                  Aujourd'hui
                </button>
                <h3 style={{ margin: '0 0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800, textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                  {calendarData.monthLabel}
                </h3>
              </div>

              {/* Monthly Profit Summary Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Total Mois :
                </span>
                <span
                  className="profit-blur"
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '8px',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    background: calendarData.monthTotalProfit >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: calendarData.monthTotalProfit >= 0 ? '#34d399' : '#f87171',
                    border: `1px solid ${calendarData.monthTotalProfit >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  }}
                >
                  {calendarData.monthTotalProfit >= 0 ? '+' : ''}{formatMoney(calendarData.monthTotalProfit)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  ({calendarData.monthProfitableDays}j gains • {calendarData.monthLossDays}j pertes)
                </span>
              </div>
            </div>

            {/* Weekday Column Headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.5rem',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                padding: '0 0.25rem',
              }}
            >
              <div>{lang === 'ar' ? 'الإثنين' : lang === 'en' ? 'Mon' : 'Lun'}</div>
              <div>{lang === 'ar' ? 'الثلاثاء' : lang === 'en' ? 'Tue' : 'Mar'}</div>
              <div>{lang === 'ar' ? 'الأربعاء' : lang === 'en' ? 'Wed' : 'Mer'}</div>
              <div>{lang === 'ar' ? 'الخميس' : lang === 'en' ? 'Thu' : 'Jeu'}</div>
              <div>{lang === 'ar' ? 'الجمعة' : lang === 'en' ? 'Fri' : 'Ven'}</div>
              <div>{lang === 'ar' ? 'السبت' : lang === 'en' ? 'Sat' : 'Sam'}</div>
              <div>{lang === 'ar' ? 'الأحد' : lang === 'en' ? 'Sun' : 'Dim'}</div>
            </div>

            {/* Calendar Days Matrix */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.5rem',
              }}
            >
              {calendarData.days.map((d, index) => {
                if (d.isPadding) {
                  return (
                    <div
                      key={d.key || index}
                      style={{
                        minHeight: '85px',
                        background: 'transparent',
                        borderRadius: '10px',
                        opacity: 0.2,
                      }}
                    />
                  );
                }

                const isPositive = d.profit > 0;
                const isNegative = d.profit < 0;
                const hasActivity = d.hasData || d.profit !== 0;

                return (
                  <div
                    key={d.key}
                    onClick={() => setSelectedDayDetails(d.dateKey)}
                    style={{
                      minHeight: '85px',
                      padding: '0.6rem',
                      borderRadius: '10px',
                      background: d.isToday
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, var(--bg-card) 100%)'
                        : hasActivity
                        ? 'var(--bg-card)'
                        : 'var(--bg-input)',
                      border: d.isToday
                        ? '2px solid var(--accent-primary)'
                        : hasActivity
                        ? '1px solid var(--border-color)'
                        : '1px dashed var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                    className="calendar-day-box"
                    title={`Cliquez pour voir les détails du ${d.dateKey}`}
                  >
                    {/* Top Row: Day Number & Today Indicator */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: d.isToday ? 900 : 700,
                          color: d.isToday ? 'var(--accent-primary)' : 'var(--text-primary)',
                        }}
                      >
                        {d.dayNumber}
                      </span>
                      {d.isToday && (
                        <span
                          className="badge badge-blue"
                          style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem', fontWeight: 800 }}
                        >
                          Aujourd'hui
                        </span>
                      )}
                    </div>

                    {/* Middle: Prominent Real Net Profit Badge (+ / -) */}
                    <div style={{ textAlign: 'center', margin: '0.35rem 0' }}>
                      {hasActivity ? (
                        <div
                          className="profit-blur"
                          style={{
                            padding: '0.3rem 0.4rem',
                            borderRadius: '6px',
                            fontWeight: 900,
                            fontSize: '0.88rem',
                            background: isPositive
                              ? 'rgba(16, 185, 129, 0.15)'
                              : isNegative
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'var(--bg-input)',
                            color: isPositive
                              ? '#34d399'
                              : isNegative
                              ? '#f87171'
                              : 'var(--text-muted)',
                            border: `1px solid ${
                              isPositive
                                ? 'rgba(16, 185, 129, 0.3)'
                                : isNegative
                                ? 'rgba(239, 68, 68, 0.3)'
                                : 'var(--border-color)'
                            }`,
                          }}
                        >
                          {isPositive ? '+' : ''}{formatMoney(d.profit)}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.6 }}>
                          —
                        </span>
                      )}
                    </div>

                    {/* Bottom: Subtle mini indicator */}
                    <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {hasActivity ? 'Détails ➔' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE MOVEMENTS LIST */}
        {activeTab === 'live_movements' && (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            
            {/* Filter chips */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${movementTypeFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem' }}
                onClick={() => setMovementTypeFilter('all')}
              >
                Tous les flux
              </button>
              <button
                type="button"
                className={`btn btn-sm ${movementTypeFilter === 'in' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem' }}
                onClick={() => setMovementTypeFilter('in')}
              >
                Entrées (+)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${movementTypeFilter === 'out' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem' }}
                onClick={() => setMovementTypeFilter('out')}
              >
                Dépenses (-)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${movementTypeFilter === 'cash' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem' }}
                onClick={() => setMovementTypeFilter('cash')}
              >
                Espèces Uniquement
              </button>
            </div>

            {filteredMovements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                <History size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.3 }} />
                <p>Aucun mouvement enregistré pour cette période.</p>
              </div>
            ) : (
              filteredMovements.map((mov) => {
                const isIncoming = mov.direction === 'in';
                return (
                  <div
                    key={mov.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isIncoming ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isIncoming ? '#34d399' : '#f87171',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isIncoming ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{mov.title}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {mov.subtitle} • {new Date(mov.date).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })} • {new Date(mov.date).toLocaleDateString(localeCode)}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="privacy-blur" style={{ fontWeight: 800, fontSize: '0.95rem', color: isIncoming ? '#34d399' : '#f87171' }}>
                        {isIncoming ? '+' : '-'}{formatMoney(mov.amount)}
                      </div>
                      <span className="profit-blur" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {isIncoming ? `Bénéfice : +${formatMoney(mov.profit)}` : 'Dépense'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 5. MODAL: AJUSTER LE FOND DE CAISSE DU MATIN */}
      {editOpeningModalOpen && (
        <div className="modal-backdrop" onClick={() => setEditOpeningModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Coins size={20} className="text-primary" />
                <span>Fond de Caisse Initial</span>
              </h3>
              <button type="button" className="btn-icon btn-sm" onClick={() => setEditOpeningModalOpen(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Saisissez le montant en espèces disponible dans le tiroir ce matin au démarrage de la boutique :
              </p>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Montant du Fond de Caisse (DT) :</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="form-input"
                  style={{ fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', color: 'var(--accent-primary)' }}
                  value={tempOpeningVal}
                  onChange={(e) => setTempOpeningVal(e.target.value)}
                  autoFocus
                />
              </div>

              {yesterdayClosingBalance > 0 && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => setTempOpeningVal(yesterdayClosingBalance)}
                >
                  Reprendre la clôture d'hier ({formatMoney(yesterdayClosingBalance)})
                </button>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setEditOpeningModalOpen(false)}>
                Annuler
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveOpeningCash}>
                Enregistrer le Fond
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: DÉTAIL COMPLET DE LA JOURNÉE SÉLECTIONNÉE */}
      {selectedDayDetails && activeDayRecord && (
        <div className="modal-backdrop" onClick={() => setSelectedDayDetails(null)}>
          <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} className="text-primary" />
                  <span>Détail du {activeDayRecord.fullDateLabel}</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Synthèse complète des flux et marge de cette journée
                </span>
              </div>
              <button type="button" className="btn-icon btn-sm" onClick={() => setSelectedDayDetails(null)}>✕</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Daily Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
                <div style={{ background: 'var(--bg-input)', padding: '0.65rem 0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Caisse Soir</span>
                  <div className="privacy-blur" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-info)' }}>
                    {formatMoney(activeDayRecord.netCashInDrawer)}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '0.65rem 0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Ventes (CA)</span>
                  <div className="privacy-blur" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {formatMoney(activeDayRecord.totalRevenue)}
                  </div>
                </div>

                <div style={{ background: 'rgba(251, 146, 60, 0.08)', border: '1px solid rgba(251, 146, 60, 0.2)', padding: '0.65rem 0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: '#fb923c', fontWeight: 700 }}>Prix Achat Fournisseur (-)</span>
                  <div className="privacy-blur" style={{ fontSize: '1rem', fontWeight: 800, color: '#fb923c' }}>
                    {activeDayRecord.totalCost > 0 ? `-${formatMoney(activeDayRecord.totalCost)}` : '0.00 DT'}
                  </div>
                </div>

                <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '0.65rem 0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: '#8b5cf6', fontWeight: 700 }}>Marge Brute (+)</span>
                  <div className="profit-blur" style={{ fontSize: '1rem', fontWeight: 800, color: '#8b5cf6' }}>
                    +{formatMoney(activeDayRecord.grossProfit)}
                  </div>
                </div>

                {activeDayRecord.creditCollected > 0 && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.65rem 0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>Crédits Réglés</span>
                    <div className="privacy-blur" style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
                      +{formatMoney(activeDayRecord.creditCollected)}
                    </div>
                  </div>
                )}

                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.65rem 0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 600 }}>Dépenses</span>
                  <div className="privacy-blur" style={{ fontSize: '1rem', fontWeight: 800, color: '#f87171' }}>
                    -{formatMoney(activeDayRecord.totalExpenses)}
                  </div>
                </div>

                <div style={{ background: activeDayRecord.netProfit >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', padding: '0.65rem 0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: activeDayRecord.netProfit >= 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>Bénéfice Net</span>
                  <div className="profit-blur" style={{ fontSize: '1.05rem', fontWeight: 900, color: activeDayRecord.netProfit >= 0 ? '#34d399' : '#f87171' }}>
                    {activeDayRecord.netProfit >= 0 ? '+' : ''}{formatMoney(activeDayRecord.netProfit)}
                  </div>
                </div>
              </div>

              {/* Sales List for this Day */}
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShoppingBag size={15} className="text-primary" />
                  <span>Ventes au comptoir ({activeDayRecord.salesList.length})</span>
                </h4>
                {activeDayRecord.salesList.length === 0 ? (
                  <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-input)', borderRadius: '6px' }}>
                    Aucune vente comptoir ce jour-là.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                    {activeDayRecord.salesList.map((s) => {
                      const saleCost = Number(s.totalCost) || ((Number(s.amountPaid) || Number(s.totalAmount) || 0) - (Number(s.totalProfit) || 0));
                      return (
                        <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '0.65rem 0.75rem', background: 'var(--bg-input)', borderRadius: '6px', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>{s.invoiceNumber || 'Ticket'}</strong> • <span style={{ color: 'var(--text-secondary)' }}>{s.clientName || 'Client'}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span className="privacy-blur" style={{ fontWeight: 800, fontSize: '0.9rem' }}>{formatMoney(s.totalAmount)}</span>
                            </div>
                          </div>

                          {/* Itemized Articles with Supplier Purchase Cost & Selling Price */}
                          {s.items && s.items.length > 0 && (
                            <div style={{ background: 'var(--bg-card)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {s.items.map((it, itIdx) => {
                                const qty = Number(it.quantity) || 1;
                                const sellPrice = Number(it.price) || 0;
                                const costPrice = Number(it.costPrice ?? it.purchasePrice) || 0;
                                const itemMargin = (sellPrice - costPrice) * qty;
                                return (
                                  <div key={itIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)', flexWrap: 'wrap', gap: '0.35rem' }}>
                                    <span>• <strong>{it.name}</strong> (x{qty})</span>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                      <span>Vente: <strong>{formatMoney(sellPrice * qty)}</strong></span>
                                      {costPrice > 0 && (
                                        <span style={{ color: '#fb923c' }}>
                                          Achat Fournisseur: <strong>{formatMoney(costPrice * qty)}</strong>
                                        </span>
                                      )}
                                      <span style={{ color: '#34d399', fontWeight: 600 }}>
                                        Gain: +{formatMoney(itemMargin)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Ticket Total Summary: Prix Achat Fournisseur & Marge Brute */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', alignItems: 'center', fontSize: '0.74rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.25rem' }}>
                            {saleCost > 0 && (
                              <span style={{ color: '#fb923c', fontWeight: 600 }}>
                                Prix Achat Fournisseur: -{formatMoney(saleCost)}
                              </span>
                            )}
                            <span className="profit-blur" style={{ color: '#34d399', fontWeight: 700 }}>
                              Marge Brute: +{formatMoney(s.totalProfit)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Collected Client Credits for this Day */}
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <HandCoins size={15} style={{ color: '#10b981' }} />
                  <span>Crédits Clients Collectés ({activeDayRecord.creditsList?.length || 0})</span>
                </h4>
                {(!activeDayRecord.creditsList || activeDayRecord.creditsList.length === 0) ? (
                  <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-input)', borderRadius: '6px' }}>
                    Aucun règlement de crédit encaissé ce jour-là.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {activeDayRecord.creditsList.map((c, idx) => (
                      <div key={c.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: '6px', fontSize: '0.8rem' }}>
                        <div>
                          <strong>{c.clientName || 'Client'}</strong> • <span style={{ color: 'var(--text-secondary)' }}>{c.note || 'Règlement dette'}</span>
                          {c.clientPhone && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.clientPhone}</div>}
                        </div>
                        <span className="privacy-blur" style={{ color: '#10b981', fontWeight: 800 }}>
                          +{formatMoney(Math.abs(c.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Repairs List for this Day */}
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Wrench size={15} style={{ color: 'var(--accent-info)' }} />
                  <span>Atelier SAV & Réparations ({activeDayRecord.repairsList?.length || 0})</span>
                </h4>
                {(!activeDayRecord.repairsList || activeDayRecord.repairsList.length === 0) ? (
                  <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-input)', borderRadius: '6px' }}>
                    Aucune fiche de réparation enregistrée ce jour-là.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {activeDayRecord.repairsList.map((r, rIdx) => {
                      const laborProfit = r.flowType === 'delivery'
                        ? (Number(r.laborCost) > 0 ? Number(r.laborCost) : Math.max(0, (Number(r.totalPrice) || 0) - (Number(r.pieceCost) || 0)))
                        : 0;
                      const flowAmt = r.flowAmount !== undefined ? Number(r.flowAmount) : (Number(r.advancePaid) || Number(r.totalPrice) || 0);
                      return (
                        <div key={`${r.id}-${r.flowType || rIdx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: '6px', fontSize: '0.8rem' }}>
                          <div>
                            <strong>{r.ticketNumber}</strong> • <span style={{ color: 'var(--text-secondary)' }}>{r.deviceModel} ({r.clientName || 'Client'})</span>
                            <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                              {r.flowLabel ? `${r.flowLabel} : ${formatMoney(flowAmt)}` : (r.issueDescription || '')}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className="privacy-blur" style={{ fontWeight: 700 }}>{formatMoney(flowAmt)}</span>
                            {laborProfit > 0 && (
                              <span className="profit-blur" style={{ display: 'block', fontSize: '0.7rem', color: '#34d399' }}>
                                +{formatMoney(laborProfit)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Expenses List for this Day */}
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ArrowDownRight size={15} style={{ color: '#f87171' }} />
                  <span>Dépenses & Sorties de caisse ({activeDayRecord.expensesList.length})</span>
                </h4>
                {activeDayRecord.expensesList.length === 0 ? (
                  <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-input)', borderRadius: '6px' }}>
                    Aucune dépense enregistrée ce jour-là.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {activeDayRecord.expensesList.map((e) => (
                      <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: '6px', fontSize: '0.8rem' }}>
                        <div>
                          <strong>{e.category}</strong> • <span style={{ color: 'var(--text-secondary)' }}>{e.description || e.note}</span>
                        </div>
                        <span className="privacy-blur" style={{ color: '#f87171', fontWeight: 700 }}>
                          -{formatMoney(e.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setActiveReceipt({
                    type: 'z_report',
                    data: {
                      date: activeDayRecord.dateKey,
                      openingCash: activeDayRecord.openingCash,
                      cashSales: activeDayRecord.cashSales,
                      cashExpenses: activeDayRecord.expensesCash,
                      countedCash: activeDayRecord.netCashInDrawer,
                      discrepancy: 0,
                      totalSales: activeDayRecord.totalRevenue,
                      salesCount: activeDayRecord.salesCount,
                      netProfit: activeDayRecord.netProfit,
                      closedBy: settings.shopName || 'Gérant',
                    },
                  });
                }}
              >
                <Printer size={14} />
                <span>Imprimer Récap Journalier</span>
              </button>

              <button type="button" className="btn btn-secondary" onClick={() => setSelectedDayDetails(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
