import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Wallet,
  Coins,
  Users,
  TrendingUp,
  PieChart,
  Crown,
  Wrench,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Plus,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  Layers,
} from 'lucide-react';

export default function Dashboard({ onNewSale, onNewRepair, onNewExpense, onSelectRepair }) {
  const {
    products = [],
    sales = [],
    repairs = [],
    expenses = [],
    categories = [],
    clients = [],
    totalClientsDebt = 0,
    clientsWithDebt = [],
    lowStockProducts = [],
    formatMoney,
    setCurrentTab,
    privacyMode,
    t,
    lang,
    isRTL,
    isAdmin,
  } = useApp();

  // Period filter: 'today' | '7d' | '30d' | 'custom'
  const [period, setPeriod] = useState(() => {
    try {
      const saved = localStorage.getItem('boutique_dashboard_period_v2');
      return saved && ['today', '7d', '30d', 'custom'].includes(saved) ? saved : 'today';
    } catch {
      return 'today';
    }
  });

  // Custom date state (YYYY-MM-DD)
  const [customDate, setCustomDate] = useState(() => {
    try {
      const saved = localStorage.getItem('boutique_dashboard_custom_date');
      return saved || new Date().toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  });

  // Chart Metric Mode: 'ca' | 'sales' | 'profit'
  const [chartMetric, setChartMetric] = useState('ca');
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);

  // Auto-persist period
  useEffect(() => {
    try {
      localStorage.setItem('boutique_dashboard_period_v2', period);
      localStorage.setItem('boutique_dashboard_custom_date', customDate);
    } catch (e) {
      console.error(e);
    }
  }, [period, customDate]);

  // Main Period Calculations
  const periodData = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let daysCount = 7;
    let periodLabel = "Aujourd'hui";

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      daysCount = 7; // Show past 7 days on chart ending today
      periodLabel = t('periodToday') || "Aujourd'hui";
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
    } else if (period === 'custom') {
      const targetDate = customDate ? new Date(customDate + 'T00:00:00') : new Date();
      startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
      daysCount = 7;
      periodLabel = targetDate.toLocaleDateString(lang === 'ar' ? 'ar-TN' : lang === 'en' ? 'en-US' : 'fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }

    const isInPeriod = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= startDate && d <= endDate;
    };

    // Filter unarchived items for KPI totals
    const periodSales = sales.filter((s) => !s.archived && isInPeriod(s.date));
    const periodExpenses = expenses.filter((e) => !e.archived && isInPeriod(e.date));

    // Collected credit payments in this period
    let collectedCredit = 0;
    let collectedCreditCount = 0;
    clients.forEach((c) => {
      if (Array.isArray(c.history)) {
        c.history.forEach((trx) => {
          const isPayment = !trx.archived && (Number(trx.amount) < 0 || trx.type === 'payment' || trx.type === 'repair_payment' || trx.type === 'settlement');
          if (isPayment && isInPeriod(trx.date)) {
            collectedCredit += Math.abs(Number(trx.amount) || 0);
            collectedCreditCount += 1;
          }
        });
      }
    });

    // Workshop repairs in this period
    let repairsRev = 0;
    let repairsProf = 0;
    let repairOperationsCount = 0;
    repairs.filter((r) => !r.archived).forEach((rep) => {
      const isDelivered = rep.status === 'delivered';
      const effectiveDate = rep.deliveredAt || rep.createdAt;
      if (!isInPeriod(effectiveDate)) return;

      const remainingDue = Number(rep.remainingDue || 0);
      const advance = Number(rep.advancePaid || rep.initialAdvance || rep.deposit || 0);
      const totalAmount = Math.max(Number(rep.totalPrice || rep.finalCost || rep.estimatedCost || 0), advance + remainingDue);
      const paidRepairAmount = isDelivered
        ? Math.max(0, totalAmount - remainingDue)
        : (advance > 0 ? advance : Math.max(0, totalAmount - remainingDue));

      const baseLabor = Number(rep.laborCost) > 0
        ? Number(rep.laborCost)
        : Math.max(0, totalAmount - (Number(rep.pieceCost) || 0));

      const profit = isDelivered
        ? (baseLabor > 0 ? baseLabor : totalAmount)
        : (advance > 0 ? advance : (baseLabor > 0 ? baseLabor : 0));

      repairsRev += paidRepairAmount;
      repairsProf += profit;
      repairOperationsCount += 1;
    });

    // Total CA (Ventes payées + Réparations encaissées + Crédits récupérés)
    const salesRev = periodSales.reduce((sum, s) => {
      const debt = Number(s.remainingCredit || s.remainingDebt || 0);
      const paid = Number(s.amountPaid) > 0
        ? Number(s.amountPaid)
        : Math.max(0, (Number(s.totalAmount || s.total || 0) - debt));
      return sum + (paid || 0);
    }, 0);

    const totalRev = salesRev + repairsRev + collectedCredit;
    const salesProf = periodSales.reduce((sum, s) => sum + (Number(s.totalProfit) || 0), 0);
    const totalProf = salesProf + repairsProf;
    const totalExp = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const realNetProfit = totalProf - totalExp;

    const totalOperationsCount = periodSales.length + repairOperationsCount + collectedCreditCount;
    const marginRate = totalRev > 0 ? ((realNetProfit / totalRev) * 100).toFixed(1) : '0.0';

    // Daily/Hourly buckets for line chart strictly following period filter
    const getLocalDateKey = (d) => {
      if (!d) return '';
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return '';
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const isSingleDay = period === 'today' || period === 'custom';
    const chartPointsMap = {};

    if (isSingleDay) {
      // Hourly slots across the business day: 08h, 10h, 12h, 14h, 16h, 18h, 20h, 22h
      const timeSlots = [8, 10, 12, 14, 16, 18, 20, 22];
      timeSlots.forEach((h) => {
        const slotKey = `${String(h).padStart(2, '0')}:00`;
        const label = `${String(h).padStart(2, '0')}h`;
        chartPointsMap[slotKey] = {
          key: slotKey,
          label,
          fullLabel: `${String(h).padStart(2, '0')}:00 - ${String(h + 2).padStart(2, '0')}:00`,
          ca: 0,
          sales: 0,
          profit: 0,
          expenses: 0,
        };
      });
    } else {
      // Multi-day slots (7d or 30d)
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - i);
        const dateKey = getLocalDateKey(d);
        const dayLabel = d.toLocaleDateString(lang === 'ar' ? 'ar-TN' : lang === 'en' ? 'en-US' : 'fr-FR', {
          day: 'numeric',
          month: 'short',
        });
        chartPointsMap[dateKey] = {
          key: dateKey,
          label: dayLabel,
          fullLabel: dayLabel,
          ca: 0,
          sales: 0,
          profit: 0,
          expenses: 0,
        };
      }
    }

    const getBucketKey = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;

      if (isSingleDay) {
        const hour = d.getHours();
        const slotHour = Math.min(22, Math.max(8, Math.floor(hour / 2) * 2));
        return `${String(slotHour).padStart(2, '0')}:00`;
      } else {
        return getLocalDateKey(d);
      }
    };

    // 1. Populate chart points from unarchived sales in period
    periodSales.forEach((s) => {
      const k = getBucketKey(s.date);
      if (k && chartPointsMap[k]) {
        const debt = Number(s.remainingCredit || s.remainingDebt || 0);
        const paid = Number(s.amountPaid) > 0 ? Number(s.amountPaid) : Math.max(0, Number(s.totalAmount || s.total || 0) - debt);
        chartPointsMap[k].ca += paid || 0;
        chartPointsMap[k].sales += 1;
        chartPointsMap[k].profit += Number(s.totalProfit) || 0;
      }
    });

    // 2. Populate repairs on chart in period (consistent with CA and Profit logic)
    repairs.filter((r) => !r.archived).forEach((r) => {
      const effectiveDate = r.deliveredAt || r.createdAt;
      if (!isInPeriod(effectiveDate)) return;
      const k = getBucketKey(effectiveDate);
      if (k && chartPointsMap[k]) {
        const isDelivered = r.status === 'delivered';
        const remainingDue = Number(r.remainingDue || 0);
        const advance = Number(r.advancePaid || r.initialAdvance || r.deposit || 0);
        const totalAmount = Math.max(Number(r.totalPrice || r.finalCost || r.estimatedCost || 0), advance + remainingDue);
        const paidRepair = isDelivered
          ? Math.max(0, totalAmount - remainingDue)
          : (advance > 0 ? advance : Math.max(0, totalAmount - remainingDue));

        const baseLabor = Number(r.laborCost) > 0
          ? Number(r.laborCost)
          : Math.max(0, totalAmount - (Number(r.pieceCost) || 0));

        const profit = isDelivered
          ? (baseLabor > 0 ? baseLabor : totalAmount)
          : (advance > 0 ? advance : (baseLabor > 0 ? baseLabor : 0));

        chartPointsMap[k].ca += paidRepair || 0;
        chartPointsMap[k].sales += 1;
        chartPointsMap[k].profit += profit || 0;
      }
    });

    // 3. Populate collected client credits on chart in period
    clients.forEach((c) => {
      if (Array.isArray(c.history)) {
        c.history.forEach((trx) => {
          const isPayment = !trx.archived && (Number(trx.amount) < 0 || trx.type === 'payment' || trx.type === 'repair_payment' || trx.type === 'settlement');
          if (isPayment && trx.date && isInPeriod(trx.date)) {
            const k = getBucketKey(trx.date);
            if (k && chartPointsMap[k]) {
              const amt = Math.abs(Number(trx.amount) || 0);
              chartPointsMap[k].ca += amt;
              chartPointsMap[k].sales += 1;
            }
          }
        });
      }
    });

    // 4. Populate expenses on chart in period (so net profit toggle is accurate)
    periodExpenses.forEach((e) => {
      const k = getBucketKey(e.date);
      if (k && chartPointsMap[k]) {
        const expAmt = Number(e.amount) || 0;
        chartPointsMap[k].expenses += expAmt;
        chartPointsMap[k].profit -= expAmt;
      }
    });

    const chartPoints = Object.values(chartPointsMap);

    return {
      totalRev,
      salesRev,
      repairsRev,
      collectedCredit,
      salesProf,
      repairsProf,
      totalProf,
      totalExp,
      realNetProfit,
      marginRate,
      salesCount: totalOperationsCount,
      counterSalesCount: periodSales.length,
      repairsCount: repairOperationsCount,
      collectedCreditCount,
      expensesCount: periodExpenses.length,
      clientDebtAmount: totalClientsDebt || 0,
      clientDebtCount: clientsWithDebt.length || 0,
      chartPoints,
      periodLabel,
      periodSales,
      isSingleDay,
    };
  }, [sales, repairs, expenses, clients, period, customDate, totalClientsDebt, clientsWithDebt, lang, t]);

  // Top Selling Products (Strictly unarchived)
  const topSellingProducts = useMemo(() => {
    const map = {};
    const salesList = (periodData.periodSales || []).filter((s) => !s.archived && !s.archivedAt);

    salesList.forEach((s) => {
      if (Array.isArray(s.items)) {
        s.items.forEach((item) => {
          if (item.archived) return;
          const id = item.productId || item.id || item.name;
          const matched = products.find((p) => p.id === id || p.name === item.name);
          const name = item.name || matched?.name || 'Produit';
          const qty = Number(item.quantity || item.qty) || 1;
          const price = Number(item.unitPrice || item.price || matched?.sellingPrice || 0);
          const total = Number(item.total) > 0 ? Number(item.total) : price * qty;
          const image = item.image || matched?.image || null;

          if (!map[id]) {
            map[id] = { id, name, qty: 0, revenue: 0, image };
          }
          map[id].qty += qty;
          map[id].revenue += total;
        });
      }
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [periodData.periodSales, products]);

  // Category Distribution for Donut Chart (Strictly unarchived)
  const categoryDistribution = useMemo(() => {
    const catMap = {};
    let total = 0;
    const salesList = (periodData.periodSales || []).filter((s) => !s.archived && !s.archivedAt);

    salesList.forEach((s) => {
      if (Array.isArray(s.items)) {
        s.items.forEach((item) => {
          if (item.archived) return;
          const matched = products.find((p) => p.id === (item.productId || item.id) || p.name === item.name);
          const cat = item.category || matched?.category || 'Divers';
          const qty = Number(item.quantity || item.qty) || 1;
          const price = Number(item.unitPrice || item.price || matched?.sellingPrice || 0);
          const amount = Number(item.total) > 0 ? Number(item.total) : price * qty;
          catMap[cat] = (catMap[cat] || 0) + amount;
          total += amount;
        });
      }
    });

    const palette = ['#38bdf8', '#f59e0b', '#10b981', '#a855f7', '#cbd5e1'];
    const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
      return [];
    }

    return entries.slice(0, 5).map(([name, amount], i) => ({
      name,
      amount,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      color: palette[i % palette.length],
    }));
  }, [periodData.periodSales, products]);

  // Recent Repair Tickets (Strictly unarchived)
  const recentRepairs = useMemo(() => {
    return repairs
      .filter((r) => !r.archived && !r.archivedAt)
      .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
      .slice(0, 5);
  }, [repairs]);

  // Low Stock Items
  const stockAlerts = useMemo(() => {
    return lowStockProducts.slice(0, 5);
  }, [lowStockProducts]);

  // SVG Line/Area Chart Geometry
  const chartSvg = useMemo(() => {
    const pts = periodData.chartPoints;
    if (!pts || pts.length === 0) return null;

    const values = pts.map((p) => {
      if (chartMetric === 'sales') return p.sales;
      if (chartMetric === 'profit') return p.profit;
      return p.ca;
    });

    const maxVal = Math.max(...values, 100);
    const width = 800;
    const height = 190;
    const padX = 42;
    const padY = 24;

    const getX = (i) => padX + (i / Math.max(pts.length - 1, 1)) * (width - 2 * padX);
    const getY = (val) => height - padY - (val / maxVal) * (height - 2 * padY);

    const pathData = pts.reduce((acc, curr, i, arr) => {
      const val = chartMetric === 'sales' ? curr.sales : chartMetric === 'profit' ? curr.profit : curr.ca;
      const x = getX(i);
      const y = getY(val);
      if (i === 0) return `M ${x},${y}`;
      const prevX = getX(i - 1);
      const prevVal = chartMetric === 'sales' ? arr[i - 1].sales : chartMetric === 'profit' ? arr[i - 1].profit : arr[i - 1].ca;
      const prevY = getY(prevVal);
      const cp1x = prevX + (x - prevX) / 2;
      const cp2x = prevX + (x - prevX) / 2;
      return `${acc} C ${cp1x},${prevY} ${cp2x},${y} ${x},${y}`;
    }, '');

    const areaData = `${pathData} L ${getX(pts.length - 1)},${height - padY} L ${getX(0)},${height - padY} Z`;

    const points = pts.map((p, i) => {
      const val = chartMetric === 'sales' ? p.sales : chartMetric === 'profit' ? p.profit : p.ca;
      return {
        ...p,
        val,
        x: getX(i),
        y: getY(val),
      };
    });

    return { width, height, pathData, areaData, points, maxVal };
  }, [periodData.chartPoints, chartMetric]);

  // Donut SVG Slices Geometry
  const donutGeometry = useMemo(() => {
    let currentAngle = -90;
    const radius = 42;
    const circumference = 2 * Math.PI * radius; // ~263.89

    return categoryDistribution.map((item) => {
      const strokeDash = (item.percent / 100) * circumference;
      const strokeDashoffset = -((currentAngle + 90) / 360) * circumference;
      currentAngle += (item.percent / 100) * 360;

      return {
        ...item,
        strokeDash: `${strokeDash} ${circumference}`,
        strokeDashoffset,
      };
    });
  }, [categoryDistribution]);

  // Format date display for date picker pill
  const formattedCustomDate = useMemo(() => {
    if (!customDate) return '22/09/2026';
    const parts = customDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return customDate;
  }, [customDate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
      
      {/* 1. TOP COMMAND HEADER */}
      <div className="dash-command-header">
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {t('executiveDashboard') || 'Centre de Contrôle & Performance'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.15rem 0 0 0' }}>
            {t('headerDashboardSub') || "Vue d'ensemble de votre activité en temps réel"}
          </p>
        </div>

        {/* Period Pills + Custom Date + Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div className="dash-period-pill-group">
            <button
              type="button"
              className={`dash-period-btn ${period === 'today' ? 'active' : ''}`}
              onClick={() => setPeriod('today')}
            >
              {t('periodToday') || "Aujourd'hui"}
            </button>
            <button
              type="button"
              className={`dash-period-btn ${period === '7d' ? 'active' : ''}`}
              onClick={() => setPeriod('7d')}
            >
              {t('period7d') || '7 Derniers Jours'}
            </button>
            <button
              type="button"
              className={`dash-period-btn ${period === '30d' ? 'active' : ''}`}
              onClick={() => setPeriod('30d')}
            >
              {t('period30d') || '30 Derniers Jours'}
            </button>
          </div>

          {/* Date Picker Pill */}
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
                  setPeriod('custom');
                }
              }}
            />
          </div>

          {/* Action Buttons */}
          <button type="button" className="dash-btn-gold" onClick={onNewSale}>
            <Plus size={15} strokeWidth={2.5} />
            <span>{t('newSale') || 'Nouvelle Vente'}</span>
          </button>

          <button type="button" className="dash-btn-dark" onClick={onNewRepair}>
            <Plus size={15} strokeWidth={2.5} />
            <span>{t('newRepair') || 'Ticket Réparation'}</span>
          </button>
        </div>
      </div>

      {/* 2. FOUR TOP KPI METRIC CARDS */}
      <div className="dash-kpi-grid-4">
        
        {/* KPI 1: Chiffre d'Affaires */}
        <div className="dash-kpi-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <ShoppingCart size={18} />
              </div>
              <div className="dash-kpi-sparkbars" style={{ color: '#f59e0b' }}>
                <div className="dash-kpi-sparkbar" style={{ height: '8px' }} />
                <div className="dash-kpi-sparkbar" style={{ height: '14px' }} />
                <div className="dash-kpi-sparkbar" style={{ height: '11px' }} />
                <div className="dash-kpi-sparkbar" style={{ height: '20px' }} />
              </div>
            </div>

            <div style={{ marginTop: '0.35rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t('metricRevenue') || "Chiffre d'Affaires"}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.15rem' }}>
                <div style={{ fontSize: '1.28rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {privacyMode ? '••••••' : formatMoney(periodData.totalRev)}
                </div>
              </div>
            </div>
          </div>

          {/* 3 Breakdown Lines: Ventes au Comptoir, Fiches Réparation & SAV, Crédits Collectés */}
          <div
            style={{
              marginTop: '0.55rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.28rem',
              fontSize: '0.71rem',
            }}
          >
            {/* 1. Ventes au Comptoir */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block', flexShrink: 0 }} />
                <span>{lang === 'ar' ? 'مبيعات المحل' : 'Ventes au Comptoir'}</span>
              </span>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }} className="privacy-blur">
                {privacyMode ? '••••' : formatMoney(periodData.salesRev)}
              </strong>
            </div>

            {/* 2. Fiches Réparation & SAV */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block', flexShrink: 0 }} />
                <span>{lang === 'ar' ? 'الصيانة و SAV' : 'Fiches Réparation & SAV'}</span>
              </span>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }} className="privacy-blur">
                {privacyMode ? '••••' : formatMoney(periodData.repairsRev)}
              </strong>
            </div>

            {/* 3. Crédits Collectés */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />
                <span>{lang === 'ar' ? 'ديون مستخلصة' : 'Crédits Collectés'}</span>
              </span>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }} className="privacy-blur">
                {privacyMode ? '••••' : formatMoney(periodData.collectedCredit)}
              </strong>
            </div>
          </div>
        </div>

        {/* KPI 2: Dépenses */}
        <div className="dash-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <Wallet size={18} />
            </div>
            <div className="dash-kpi-sparkbars" style={{ color: '#ef4444' }}>
              <div className="dash-kpi-sparkbar" style={{ height: '16px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '12px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '18px' }} />
              <div className="dash-kpi-sparkbar" style={{ height: '9px' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('metricExpenses') || 'Dépenses'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
              <div style={{ fontSize: '1.28rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {privacyMode ? '••••••' : formatMoney(periodData.totalExp)}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                ↘ -8%
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {periodData.expensesCount} {lang === 'ar' ? 'مصاريف' : 'dépenses'}
            </div>
          </div>
        </div>

        {/* KPI 3: Bénéfice Net */}
        <div className="dash-kpi-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
                <Coins size={18} />
              </div>
              <div className="dash-kpi-sparkbars" style={{ color: '#10b981' }}>
                <div className="dash-kpi-sparkbar" style={{ height: '10px' }} />
                <div className="dash-kpi-sparkbar" style={{ height: '14px' }} />
                <div className="dash-kpi-sparkbar" style={{ height: '16px' }} />
                <div className="dash-kpi-sparkbar" style={{ height: '22px' }} />
              </div>
            </div>

            <div style={{ marginTop: '0.35rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{t('metricNetProfit') || 'Bénéfice Net'}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {lang === 'ar' ? 'هامش:' : 'Marge:'} {periodData.marginRate}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.15rem' }}>
                <div style={{ fontSize: '1.28rem', fontWeight: 800, color: Number(periodData.realNetProfit) >= 0 ? '#10b981' : '#ef4444', letterSpacing: '-0.02em' }}>
                  {privacyMode ? '••••••' : formatMoney(periodData.realNetProfit)}
                </div>
              </div>
            </div>
          </div>

          {/* 3 Breakdown Lines: Marge Ventes, Marge Réparations & SAV, Dépenses Déduites */}
          <div
            style={{
              marginTop: '0.55rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.28rem',
              fontSize: '0.71rem',
            }}
          >
            {/* 1. Marge Ventes */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block', flexShrink: 0 }} />
                <span>{lang === 'ar' ? 'أرباح المبيعات' : 'Marge Ventes'}</span>
              </span>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }} className="privacy-blur">
                {privacyMode ? '••••' : formatMoney(periodData.salesProf)}
              </strong>
            </div>

            {/* 2. Marge Réparations & SAV */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block', flexShrink: 0 }} />
                <span>{lang === 'ar' ? 'أرباح الصيانة' : 'Marge Réparations'}</span>
              </span>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }} className="privacy-blur">
                {privacyMode ? '••••' : formatMoney(periodData.repairsProf)}
              </strong>
            </div>

            {/* 3. Dépenses Déduites */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 }} />
                <span>{lang === 'ar' ? 'المصاريف المخصومة' : 'Dépenses Déduites'}</span>
              </span>
              <strong style={{ color: '#ef4444', fontWeight: 700 }} className="privacy-blur">
                {privacyMode ? '••••' : `- ${formatMoney(periodData.totalExp)}`}
              </strong>
            </div>
          </div>
        </div>

        {/* KPI 4: Crédits Clients */}
        <div className="dash-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Users size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('metricClientCredit') || 'Crédits Clients'}
            </div>
            <div style={{ fontSize: '1.28rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem', letterSpacing: '-0.02em' }}>
              {privacyMode ? '••••••' : formatMoney(periodData.clientDebtAmount)}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {periodData.clientDebtCount} {lang === 'ar' ? 'حرفاء' : 'clients'}
            </div>
          </div>
        </div>

      </div>

      {/* 3. MIDDLE CHARTS ROW (2/3 + 1/3) */}
      <div className="dash-mid-grid">
        
        {/* Left: Évolution du Chiffre d'Affaires */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {t('chartSalesEvolution') || "Évolution du Chiffre d'Affaires"}
              </h3>
            </div>

            {/* Toggle Switchers [ CA ] [ Ventes ] [ Bénéfice ] */}
            <div className="dash-chart-toggle-group">
              <button
                type="button"
                className={`dash-chart-toggle-btn ${chartMetric === 'ca' ? 'active' : ''}`}
                onClick={() => setChartMetric('ca')}
              >
                CA
              </button>
              <button
                type="button"
                className={`dash-chart-toggle-btn ${chartMetric === 'sales' ? 'active' : ''}`}
                onClick={() => setChartMetric('sales')}
              >
                {t('navSales') || 'Ventes'}
              </button>
              <button
                type="button"
                className={`dash-chart-toggle-btn ${chartMetric === 'profit' ? 'active' : ''}`}
                onClick={() => setChartMetric('profit')}
              >
                {t('metricNetProfit') || 'Bénéfice'}
              </button>
            </div>
          </div>

          {/* Interactive SVG Golden Line Chart */}
          <div style={{ position: 'relative', width: '100%', height: '220px', marginTop: '0.5rem' }}>
            {chartSvg && (
              <svg
                viewBox={`0 0 ${chartSvg.width} ${chartSvg.height}`}
                preserveAspectRatio="none"
                style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="goldAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines & Y-Axis Labels */}
                {[0.8, 0.55, 0.3, 0.05].map((factor, idx) => {
                  const y = chartSvg.height - 24 - factor * (chartSvg.height - 48);
                  const val = Math.round(chartSvg.maxVal * factor);
                  return (
                    <g key={idx}>
                      <line
                        x1="24"
                        y1={y}
                        x2={chartSvg.width - 24}
                        y2={y}
                        stroke="var(--border-color)"
                        strokeDasharray="4 4"
                        strokeOpacity="0.6"
                      />
                      <text
                        x="18"
                        y={y + 3}
                        fill="var(--text-muted)"
                        fontSize="9"
                        textAnchor="end"
                        fontWeight="500"
                      >
                        {chartMetric === 'sales'
                          ? val
                          : val >= 1000 ? `${(val / 1000).toFixed(1)}K DT` : `${val} DT`}
                      </text>
                    </g>
                  );
                })}

                {/* Area Gradient Fill */}
                <path d={chartSvg.areaData} fill="url(#goldAreaGrad)" />

                {/* Golden Line Path */}
                <path
                  d={chartSvg.pathData}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points and Hover Tooltip */}
                {chartSvg.points.map((pt, i) => {
                  const isHovered = hoveredPointIndex === i || (hoveredPointIndex === null && i === chartSvg.points.length - 1);
                  const isDense = chartSvg.points.length > 12;
                  const showLabel = !isDense || i === 0 || i === chartSvg.points.length - 1 || i % 4 === 0;

                  return (
                    <g key={i} style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredPointIndex(i)}>
                      {/* X-axis date label */}
                      {showLabel && (
                        <text
                          x={pt.x}
                          y={chartSvg.height - 6}
                          fill="var(--text-muted)"
                          fontSize="9"
                          textAnchor="middle"
                        >
                          {pt.label}
                        </text>
                      )}

                      {/* Point Circle */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 5 : (isDense ? 2.5 : 3.5)}
                        fill={isHovered ? '#fff' : '#f59e0b'}
                        stroke="#f59e0b"
                        strokeWidth={isHovered ? 3 : 1.5}
                      />

                      {/* Floating Tooltip for Active Point */}
                      {isHovered && (
                        <g transform={`translate(${Math.min(Math.max(pt.x, 60), chartSvg.width - 60)}, ${Math.max(pt.y - 38, 10)})`}>
                          <rect
                            x="-50"
                            y="-18"
                            width="100"
                            height="32"
                            rx="6"
                            fill="#1e2433"
                            stroke="var(--border-color)"
                            strokeWidth="1"
                            filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))"
                          />
                          <text x="0" y="-7" fill="var(--text-muted)" fontSize="8" textAnchor="middle">
                            {pt.fullLabel || pt.label}
                          </text>
                          <text x="0" y="7" fill="#f59e0b" fontSize="10" fontWeight="700" textAnchor="middle">
                            {privacyMode
                              ? '••••'
                              : chartMetric === 'sales'
                                ? `${pt.val} ${lang === 'ar' ? 'عمليات' : 'ventes'}`
                                : formatMoney(pt.val)}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Right: Répartition par Catégorie */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <PieChart size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {t('chartSalesDistribution') || 'Répartition par Catégorie'}
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {period === 'today' ? "Aujourd'hui ▾" : periodData.periodLabel}
            </span>
          </div>

          {/* Donut Chart + Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.5rem' }}>
            
            {/* Donut SVG with Center Label */}
            <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke="var(--bg-input)"
                  strokeWidth="10"
                />
                {donutGeometry.map((slice, i) => (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth="10"
                    strokeDasharray={slice.strokeDash}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="round"
                  />
                ))}
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1.15,
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {periodData.salesCount} {lang === 'ar' ? 'مبيعات' : 'ventes'}
                </span>
              </div>
            </div>

            {/* Category Legend List */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {categoryDistribution.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                  {lang === 'ar' ? 'لا توجد بيانات للفترة' : 'Aucune donnée pour cette période'}
                </div>
              ) : (
                categoryDistribution.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: item.color }} />
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{item.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{item.percent}%</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {privacyMode ? '•••' : formatMoney(item.amount)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>

      {/* 4. THREE BOTTOM WIDGET CARDS */}
      <div className="dash-bottom-grid">
        
        {/* Bottom Card 1: Produits les Plus Vendus */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              onClick={() => setCurrentTab('sales_history')}
              title="Voir le Journal & Historique des Ventes"
            >
              <Crown size={16} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {t('topSellingProducts') || 'Top Produits & Ventes'}
              </h3>
            </div>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setCurrentTab('sales_history')}
              title="Voir le Journal des Ventes"
            >
              {t('viewAll') || 'Voir tout'}
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: '0.72rem' }}>
                <th style={{ paddingBottom: '0.5rem', width: '28px' }}>#</th>
                <th style={{ paddingBottom: '0.5rem' }}>{t('product') || 'Produit'}</th>
                <th style={{ paddingBottom: '0.5rem', textAlign: 'center' }}>{t('sales') || 'Ventes'}</th>
                <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>{t('CA') || 'CA'}</th>
              </tr>
            </thead>
            <tbody>
              {topSellingProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '1.2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {lang === 'ar' ? 'لا توجد مبيعات في هذه الفترة' : 'Aucune vente enregistrée pour cette période'}
                  </td>
                </tr>
              ) : (
                topSellingProducts.map((p, idx) => (
                  <tr
                    key={p.id || idx}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onClick={() => setCurrentTab('sales_history')}
                    title="Voir dans le Journal des Ventes"
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.6rem 0' }}>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: idx === 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                          color: idx === 0 ? '#f59e0b' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </div>
                    </td>
                    <td style={{ padding: '0.6rem 0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-secondary)',
                            flexShrink: 0,
                            overflow: 'hidden',
                          }}
                        >
                          {p.image ? (
                            <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Smartphone size={14} />
                          )}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.6rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {p.qty}
                    </td>
                    <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {privacyMode ? '•••' : formatMoney(p.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Card 2: Derniers Tickets de Réparation */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wrench size={16} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {t('recentRepairs') || 'Derniers Tickets de Réparation'}
              </h3>
            </div>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', color: 'var(--text-muted)' }}
              onClick={() => setCurrentTab('repairs')}
            >
              {t('viewAll') || 'Voir tout'}
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: '0.72rem' }}>
                <th style={{ paddingBottom: '0.5rem' }}>#</th>
                <th style={{ paddingBottom: '0.5rem' }}>{t('repairDevice') || 'Appareil'}</th>
                <th style={{ paddingBottom: '0.5rem' }}>{t('repairClient') || 'Client'}</th>
                <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>{t('status') || 'Statut'}</th>
              </tr>
            </thead>
            <tbody>
              {recentRepairs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '1.2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {lang === 'ar' ? 'لا توجد إصلاحات نشطة' : 'Aucun ticket de réparation actif'}
                  </td>
                </tr>
              ) : (
                recentRepairs.map((r, idx) => {
                  const isNew = r.status === 'pending' || r.status === 'new';
                  const isInProgress = r.status === 'in_progress';
                  const isDelivered = r.status === 'delivered' || r.status === 'completed';

                  return (
                    <tr
                      key={r.id || idx}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                      onClick={() => {
                        if (onSelectRepair && r.id) onSelectRepair(r);
                        else setCurrentTab('repairs');
                      }}
                    >
                      <td style={{ padding: '0.6rem 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {r.ticketNumber || `#${r.id}`}
                      </td>
                      <td style={{ padding: '0.6rem 0.3rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.deviceModel || 'Appareil'}
                      </td>
                      <td style={{ padding: '0.6rem 0.3rem', color: 'var(--text-secondary)' }}>
                        {r.clientName || 'Client'}
                      </td>
                      <td style={{ padding: '0.6rem 0', textAlign: 'right' }}>
                        {isNew && <span className="badge-repair-nouveau">{lang === 'ar' ? 'جديد' : 'Nouveau'}</span>}
                        {isInProgress && <span className="badge-repair-encours">{lang === 'ar' ? 'قيد العمل' : 'En cours'}</span>}
                        {isDelivered && <span className="badge-repair-termine">{lang === 'ar' ? 'تم التسليم' : 'Terminé'}</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Card 3: Alertes Stock Faible */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} style={{ color: 'var(--accent-warning)' }} />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {t('inventoryAlerts') || 'Alertes Stock Faible'}
              </h3>
            </div>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', color: 'var(--text-muted)' }}
              onClick={() => setCurrentTab('inventory')}
            >
              {t('viewAll') || 'Voir tout'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {stockAlerts.length === 0 ? (
              <div style={{ padding: '1.2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                {lang === 'ar' ? 'جميع المنتجات متوفرة بكميات كافية' : 'Tous les stocks sont à niveau optimal'}
              </div>
            ) : (
              stockAlerts.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.5rem',
                    borderRadius: '8px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onClick={() => setCurrentTab('inventory')}
                  title="Gérer le stock de ce produit"
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {item.image ? (
                        <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Package size={16} />
                      )}
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.name}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      color: item.stock <= 2 ? '#ef4444' : '#f59e0b',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    <span>
                      {lang === 'ar' ? `المخزون: ${item.stock} قطع` : `Stock: ${item.stock} pièces`}
                    </span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
