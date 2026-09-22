import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Sparkles,
  Info,
} from 'lucide-react';

export default function DailyCashChart() {
  const { sales, expenses, cashSessions, formatMoney, t, isRTL } = useApp();
  const [periodDays, setPeriodDays] = useState(7); // 7, 14, 30
  const [hoveredData, setHoveredData] = useState(null);

  // Helper for local YYYY-MM-DD
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

  // Generate historical data array for each day in the selected period
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();

    for (let i = periodDays - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateKey = getLocalDateKey(targetDate);

      // Format short label (e.g. "Lun 15" or "15/09")
      const dayLabel = targetDate.toLocaleDateString(undefined, {
        weekday: periodDays <= 7 ? 'short' : undefined,
        day: '2-digit',
        month: '2-digit',
      });

      // Match sales for this day
      const daySales = sales.filter((s) => {
        if (!s.date) return false;
        const d = getLocalDateKey(s.date);
        return d === dateKey;
      });
      const salesTotal = daySales.reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0);

      // Match expenses for this day
      const dayExpenses = expenses.filter((e) => {
        if (!e.date) return false;
        const d = getLocalDateKey(e.date);
        return d === dateKey;
      });
      const expensesTotal = dayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      // If we have a closed cash session for this day, we can also factor session data if needed
      const session = cashSessions.find((s) => s.date === dateKey);
      const finalSales = salesTotal > 0 ? salesTotal : (session ? Number(session.cashSales) : 0);
      const finalExpenses = expensesTotal > 0 ? expensesTotal : (session ? Number(session.cashExpenses) : 0);
      const net = finalSales - finalExpenses;

      data.push({
        date: dateKey,
        dayLabel,
        sales: finalSales,
        expenses: finalExpenses,
        net,
        hasClosedSession: !!session,
      });
    }

    return data;
  }, [sales, expenses, cashSessions, periodDays]);

  // Aggregate statistics for the period
  const stats = useMemo(() => {
    const totalSales = chartData.reduce((sum, d) => sum + d.sales, 0);
    const totalExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0);
    const totalNet = totalSales - totalExpenses;
    const avgDailySales = totalSales / (chartData.length || 1);
    const avgDailyExpenses = totalExpenses / (chartData.length || 1);
    const maxSalesDay = [...chartData].sort((a, b) => b.sales - a.sales)[0];

    return {
      totalSales,
      totalExpenses,
      totalNet,
      avgDailySales,
      avgDailyExpenses,
      maxSalesDay,
    };
  }, [chartData]);

  // Max value for scaling SVG chart bars
  const maxVal = useMemo(() => {
    const peak = Math.max(
      ...chartData.map((d) => Math.max(d.sales, d.expenses, Math.abs(d.net))),
      100
    );
    return Math.ceil(peak * 1.15);
  }, [chartData]);

  const chartHeight = 220;

  return (
    <div className="ui-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header & Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              {t('chartTitle')}
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {t('chartSub')}
            </p>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${periodDays === 7 ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setPeriodDays(7)}
          >
            {t('chartPeriod7')}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${periodDays === 14 ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setPeriodDays(14)}
          >
            {t('chartPeriod14')}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${periodDays === 30 ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setPeriodDays(30)}
          >
            {t('chartPeriod30')}
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          padding: '0.85rem 1rem',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {t('chartInflow')} ({periodDays}j)
          </div>
          <div className="privacy-blur" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>
            {formatMoney(stats.totalSales)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {t('chartOutflow')} ({periodDays}j)
          </div>
          <div className="privacy-blur" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f87171' }}>
            {formatMoney(stats.totalExpenses)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {t('chartNet')} ({periodDays}j)
          </div>
          <div
            className="privacy-blur"
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: stats.totalNet >= 0 ? '#34d399' : '#f87171',
            }}
          >
            {formatMoney(stats.totalNet)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {t('chartAvgDailyRevenue')}
          </div>
          <div className="privacy-blur" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            ~{formatMoney(stats.avgDailySales)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#38bdf8' }} />
          <span>{t('chartInflow')} (Espèces)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f87171' }} />
          <span>{t('chartOutflow')} (Dépenses)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '12px', height: '4px', borderRadius: '2px', background: '#34d399' }} />
          <span>{t('chartNet')} (Solde Net)</span>
        </div>
      </div>

      {/* SVG Interactive Chart Area */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: `${chartHeight + 40}px`,
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          padding: '1rem 0.5rem 0.5rem 0.5rem',
          boxSizing: 'border-box',
        }}
      >
        <svg
          width="100%"
          height={chartHeight}
          style={{ overflow: 'visible' }}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = chartHeight - ratio * (chartHeight - 30) - 20;
            const val = Math.round(ratio * maxVal);
            return (
              <g key={ratio}>
                <line
                  x1="0"
                  y1={y}
                  x2="100%"
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="3 3"
                />
                <text
                  x="6"
                  y={y - 4}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="sans-serif"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Render Bars & Net Dot for each day */}
          {chartData.map((item, idx) => {
            const count = chartData.length;
            const stepPercent = 100 / count;
            const leftCenter = (idx + 0.5) * stepPercent;
            const barWidth = Math.min(18, 280 / count);

            const salesHeight = Math.max(2, (item.sales / maxVal) * (chartHeight - 35));
            const expHeight = Math.max(2, (item.expenses / maxVal) * (chartHeight - 35));
            const netY = chartHeight - 20 - (Math.max(0, item.net) / maxVal) * (chartHeight - 35);

            const isHovered = hoveredData?.date === item.date;

            return (
              <g
                key={item.date}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredData(item)}
                onMouseLeave={() => setHoveredData(null)}
              >
                {/* Hover backdrop column */}
                <rect
                  x={`${idx * stepPercent}%`}
                  y="0"
                  width={`${stepPercent}%`}
                  height={chartHeight}
                  fill={isHovered ? 'rgba(99, 102, 241, 0.08)' : 'transparent'}
                />

                {/* Sales Bar (Blue) */}
                <rect
                  x={`calc(${leftCenter}% - ${barWidth + 2}px)`}
                  y={chartHeight - 20 - salesHeight}
                  width={barWidth}
                  height={salesHeight}
                  rx="3"
                  fill="#38bdf8"
                  opacity={isHovered ? 1 : 0.85}
                />

                {/* Expenses Bar (Red) */}
                <rect
                  x={`calc(${leftCenter}% + 2px)`}
                  y={chartHeight - 20 - expHeight}
                  width={barWidth}
                  height={expHeight}
                  rx="3"
                  fill="#f87171"
                  opacity={isHovered ? 1 : 0.85}
                />

                {/* Net indicator dot */}
                <circle
                  cx={`${leftCenter}%`}
                  cy={netY}
                  r={isHovered ? 5 : 3.5}
                  fill={item.net >= 0 ? '#34d399' : '#fbbf24'}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />

                {/* Date Label beneath bottom */}
                <text
                  x={`${leftCenter}%`}
                  y={chartHeight + 14}
                  textAnchor="middle"
                  fill={isHovered ? 'var(--text-primary)' : '#94a3b8'}
                  fontSize={periodDays <= 7 ? '11' : '9.5'}
                  fontWeight={isHovered ? '700' : '500'}
                >
                  {item.dayLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Popup */}
        {hoveredData && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              [isRTL ? 'left' : 'right']: '12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.6rem 0.85rem',
              boxShadow: 'var(--shadow-md)',
              fontSize: '0.8rem',
              zIndex: 10,
              pointerEvents: 'none',
              animation: 'fadeIn 0.1s ease',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
              📅 {hoveredData.date} ({hoveredData.dayLabel})
            </div>
            <div style={{ color: '#38bdf8' }}>
              + {t('chartInflow')} : <strong className="privacy-blur">{formatMoney(hoveredData.sales)}</strong>
            </div>
            <div style={{ color: '#f87171' }}>
              - {t('chartOutflow')} : <strong className="privacy-blur">{formatMoney(hoveredData.expenses)}</strong>
            </div>
            <div style={{ color: hoveredData.net >= 0 ? '#34d399' : '#fbbf24', marginTop: '0.2rem', fontWeight: 700 }}>
              = {t('chartNet')} : <strong className="privacy-blur">{formatMoney(hoveredData.net)}</strong>
            </div>
            {hoveredData.hasClosedSession && (
              <div style={{ fontSize: '0.7rem', color: '#a855f7', marginTop: '0.2rem' }}>
                ✓ {t('sessionStatusClosed')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
