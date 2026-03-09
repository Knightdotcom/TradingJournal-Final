import { useState, useEffect } from 'react';
import api from '../services/api';

const MONTHS = ['Januari','Februari','Mars','April','Maj','Juni',
                 'Juli','Augusti','September','Oktober','November','December'];
const WEEKDAYS = ['Mån','Tis','Ons','Tor','Fre','Lör','Sön'];

export default function TradingCalendar() {
  const now = new Date();
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth() + 1);
  const [data, setData]     = useState(null);
  const [selected, setSelected] = useState(null); // Vald dag
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/calendar?year=${year}&month=${month}`)
      .then(r => { setData(r.data); setSelected(null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Räkna ut vilket veckodagindex månadens första dag har (Mån=0)
  const firstDayOfWeek = () => {
    const d = new Date(year, month - 1, 1).getDay();
    return d === 0 ? 6 : d - 1; // Justera: söndag=0 → 6
  };

  if (loading) return <p style={{ color: '#94a3b8' }}>Laddar kalender...</p>;

  const { summary, days } = data || { summary: {}, days: [] };
  const blanks = firstDayOfWeek();

  return (
    <div style={s.wrap}>
      {/* ── Topprad ── */}
      <div style={s.topRow}>
        <h2 style={s.heading}>📅 Tradingkalender</h2>
        <div style={s.nav}>
          <button style={s.navBtn} onClick={prevMonth}>‹</button>
          <span style={s.navLabel}>{MONTHS[month - 1]} {year}</span>
          <button style={s.navBtn} onClick={nextMonth}>›</button>
        </div>
      </div>

      {/* ── Månadssammanfattning ── */}
      <div style={s.summaryRow}>
        <SummaryPill label="Total P&L"    value={`${summary.totalPnl >= 0 ? '+' : ''}${summary.totalPnl?.toFixed(2) ?? '0'}`} color={summary.totalPnl >= 0 ? '#4ade80' : '#f87171'} />
        <SummaryPill label="Handelsdagar" value={summary.tradingDays ?? 0}  color="#38bdf8" />
        <SummaryPill label="Gröna dagar"  value={summary.profitDays ?? 0}   color="#4ade80" />
        <SummaryPill label="Röda dagar"   value={summary.lossDays ?? 0}     color="#f87171" />
        <SummaryPill label="Win rate"     value={`${(summary.winRate ?? 0).toFixed(0)}%`} color="#a78bfa" />
        <SummaryPill label="Trades"       value={summary.totalTrades ?? 0}  color="#fbbf24" />
      </div>

      {/* ── Kalendergrid ── */}
      <div style={s.calWrap}>
        {/* Veckodags-header */}
        <div style={s.weekdayRow}>
          {WEEKDAYS.map(d => (
            <div key={d} style={s.weekday}>{d}</div>
          ))}
        </div>

        {/* Dagceller */}
        <div style={s.grid}>
          {/* Tomma celler för offset */}
          {Array(blanks).fill(null).map((_, i) => (
            <div key={`blank-${i}`} style={s.blankCell} />
          ))}

          {days.map(day => {
            const isToday = day.date === now.toISOString().split('T')[0];
            const isSelected = selected?.day === day.day;
            const pnlColor = day.pnl > 0 ? '#4ade80' : day.pnl < 0 ? '#f87171' : null;
            const bgColor  = day.pnl > 0 ? 'rgba(74,222,128,0.12)' :
                             day.pnl < 0 ? 'rgba(248,113,113,0.12)' : 'transparent';

            return (
              <div
                key={day.day}
                style={{
                  ...s.cell,
                  background: isSelected ? 'rgba(56,189,248,0.2)' : bgColor,
                  border: isSelected ? '1px solid #38bdf8' :
                          isToday    ? '1px solid #fbbf24' :
                          day.hasTrades ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                  cursor: day.hasTrades ? 'pointer' : 'default',
                }}
                onClick={() => day.hasTrades && setSelected(isSelected ? null : day)}
              >
                <span style={{ ...s.dayNum, color: isToday ? '#fbbf24' : '#94a3b8' }}>
                  {day.day}
                </span>
                {day.hasTrades && (
                  <>
                    <span style={{ ...s.pnl, color: pnlColor }}>
                      {day.pnl >= 0 ? '+' : ''}{day.pnl.toFixed(0)}
                    </span>
                    <span style={s.tradeCount}>{day.tradeCount} trade{day.tradeCount > 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Detaljpanel för vald dag ── */}
      {selected && (
        <div style={s.detailPanel}>
          <div style={s.detailHeader}>
            <h3 style={s.detailTitle}>
              {selected.weekday} {selected.day} {MONTHS[month - 1]}
            </h3>
            <span style={{ color: selected.pnl >= 0 ? '#4ade80' : '#f87171', fontSize: '1.2rem', fontWeight: 'bold' }}>
              {selected.pnl >= 0 ? '+' : ''}{selected.pnl.toFixed(2)}
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
            {selected.winners} vinnare · {selected.losers} förlorare · {selected.tradeCount} totalt
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {selected.trades.map(t => (
              <div key={t.id} style={s.tradeRow}>
                <span style={s.tradeSymbol}>{t.symbol}</span>
                <span style={{ color: t.direction === 'Long' ? '#4ade80' : '#a78bfa', fontSize: '0.8rem' }}>
                  {t.direction}
                </span>
                {t.strategy && <span style={s.strategy}>{t.strategy}</span>}
                <span style={{ ...s.tradePnl, color: t.profitLoss >= 0 ? '#4ade80' : '#f87171' }}>
                  {t.profitLoss >= 0 ? '+' : ''}{t.profitLoss?.toFixed(2) ?? '–'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Förklaringsrad ── */}
      <div style={s.legend}>
        <LegendDot color="rgba(74,222,128,0.3)" label="Lönsam dag" />
        <LegendDot color="rgba(248,113,113,0.3)" label="Förlustdag" />
        <LegendDot color="rgba(251,191,36,0.3)"  label="Idag" border="#fbbf24" />
      </div>
    </div>
  );
}

function SummaryPill({ label, value, color }) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 1rem', textAlign: 'center' }}>
      <div style={{ color, fontWeight: 'bold', fontSize: '1.1rem' }}>{value}</div>
      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{label}</div>
    </div>
  );
}

function LegendDot({ color, label, border }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{ width: 14, height: 14, borderRadius: 3, background: color, border: border ? `1px solid ${border}` : 'none' }} />
      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{label}</span>
    </div>
  );
}

const s = {
  wrap:        { maxWidth: '860px' },
  topRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' },
  heading:     { color: '#fff', margin: 0 },
  nav:         { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  navBtn:      { background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1.1rem' },
  navLabel:    { color: '#fff', fontWeight: '600', minWidth: '160px', textAlign: 'center' },
  summaryRow:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.6rem', marginBottom: '1.5rem' },
  calWrap:     { background: '#1e293b', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' },
  weekdayRow:  { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.4rem' },
  weekday:     { color: '#475569', fontSize: '0.75rem', textAlign: 'center', padding: '0.3rem 0', fontWeight: '600' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' },
  blankCell:   { borderRadius: '6px' },
  cell:        { borderRadius: '6px', padding: '0.4rem', minHeight: '60px', display: 'flex', flexDirection: 'column', gap: '2px', transition: 'all 0.15s' },
  dayNum:      { fontSize: '0.75rem', fontWeight: '600' },
  pnl:         { fontSize: '0.78rem', fontWeight: 'bold' },
  tradeCount:  { color: '#64748b', fontSize: '0.65rem' },
  detailPanel: { background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' },
  detailHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' },
  detailTitle: { color: '#fff', margin: 0 },
  tradeRow:    { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0f172a', borderRadius: '6px', padding: '0.5rem 0.75rem' },
  tradeSymbol: { color: '#fff', fontWeight: '600', fontSize: '0.875rem', minWidth: '60px' },
  strategy:    { color: '#64748b', fontSize: '0.78rem', flex: 1 },
  tradePnl:    { fontWeight: '600', fontSize: '0.875rem', marginLeft: 'auto' },
  legend:      { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
};
