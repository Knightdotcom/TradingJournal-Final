import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import api from '../services/api';
import { useTheme, colors } from '../context/ThemeContext';

export default function Statistics() {
  const { isDark }  = useTheme();
  const c           = colors(isDark);

  const [overview,   setOverview]   = useState(null);
  const [bySymbol,   setBySymbol]   = useState([]);
  const [byHour,     setByHour]     = useState([]);
  const [byWeekday,  setByWeekday]  = useState([]);
  const [byStrategy, setByStrategy] = useState([]);
  const [byDir,      setByDir]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('overview');

  useEffect(() => {
    Promise.all([
      api.get('/stats/overview'),
      api.get('/stats/by-symbol'),
      api.get('/stats/by-hour'),
      api.get('/stats/by-weekday'),
      api.get('/stats/by-strategy'),
      api.get('/stats/by-direction'),
    ]).then(([ov, sym, hr, wd, strat, dir]) => {
      setOverview(ov.data);
      setBySymbol(sym.data);
      setByHour(hr.data);
      setByWeekday(wd.data);
      setByStrategy(strat.data);
      setByDir(dir.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const s = makeStyles(c);

  if (loading) return <p style={{ color: c.textMuted }}>Laddar statistik...</p>;

  if (!overview || overview.message) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: c.textFaint }}>
      <p style={{ fontSize: '2.5rem' }}>📊</p>
      <p>Ingen statistik ännu — logga dina första trades!</p>
    </div>
  );

  const tabs = [
    { id: 'overview',  label: '🏠 Översikt'  },
    { id: 'symbol',    label: '🏷️ Per symbol' },
    { id: 'time',      label: '⏰ Per tid'    },
    { id: 'strategy',  label: '🎯 Strategi'  },
  ];

  return (
    <div style={s.wrap}>
      <h2 style={s.heading}>📊 Statistik & Analys</h2>

      {/* Flikar */}
      <div style={s.tabRow}>
        {tabs.map(t => (
          <button key={t.id}
            style={{ ...s.tab, ...(activeTab === t.id ? s.tabActive : {}) }}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ÖVERSIKT ─────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div>
          {/* Nyckeltals-grid */}
          <div style={s.kpiGrid}>
            <KpiCard label="Total P&L"     value={`${overview.totalPnl >= 0 ? '+' : ''}${overview.totalPnl.toFixed(2)}`}
              color={overview.totalPnl >= 0 ? c.green : c.red} c={c} />
            <KpiCard label="Win rate"      value={`${overview.winRate.toFixed(1)}%`}
              color={overview.winRate >= 50 ? c.green : c.red} c={c} />
            <KpiCard label="Profit factor" value={overview.profitFactor}
              color={overview.profitFactor >= 1.5 ? c.green : overview.profitFactor >= 1 ? c.yellow : c.red} c={c} />
            <KpiCard label="Snitt vinst"   value={`+${overview.avgWin.toFixed(2)}`}  color={c.green} c={c} />
            <KpiCard label="Snitt förlust" value={overview.avgLoss.toFixed(2)}        color={c.red}   c={c} />
            <KpiCard label="Bästa trade"   value={`+${overview.largestWin.toFixed(2)}`} color={c.green} c={c} />
            <KpiCard label="Sämsta trade"  value={overview.largestLoss.toFixed(2)}    color={c.red}   c={c} />
            <KpiCard label="Trades totalt" value={overview.totalTrades}               color={c.accent} c={c} />
          </div>

          {/* Streak */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <StreakCard
              label="Nuvarande streak"
              value={overview.currentStreak}
              c={c}
            />
            <StreakCard
              label="Bästa vinn-streak"
              value={overview.bestStreak}
              forcePositive
              c={c}
            />
          </div>

          {/* Long vs Short */}
          {byDir.length > 0 && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>Long vs Short</h3>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                {byDir.map(d => (
                  <div key={d.direction} style={{ flex: 1, minWidth: '140px' }}>
                    <p style={{ color: d.direction === 'Long' ? c.green : c.purple, fontWeight: '700', fontSize: '1.1rem', margin: '0 0 0.25rem' }}>
                      {d.direction}
                    </p>
                    <p style={{ color: c.text, margin: '0 0 0.2rem', fontSize: '0.875rem' }}>{d.trades} trades</p>
                    <p style={{ color: d.winRate >= 50 ? c.green : c.red, margin: '0 0 0.2rem', fontSize: '0.875rem' }}>
                      Win rate: {d.winRate.toFixed(1)}%
                    </p>
                    <p style={{ color: d.totalPnl >= 0 ? c.green : c.red, margin: 0, fontSize: '0.875rem' }}>
                      P&L: {d.totalPnl >= 0 ? '+' : ''}{d.totalPnl.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PER SYMBOL ───────────────────────────────────────────── */}
      {activeTab === 'symbol' && (
        <div>
          {/* Win rate per symbol - stapeldiagram */}
          {bySymbol.length > 0 && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>Win rate per symbol</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bySymbol} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
                  <XAxis dataKey="symbol" stroke={c.textMuted} tick={{ fontSize: 12 }} />
                  <YAxis stroke={c.textMuted} tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 8 }}
                    labelStyle={{ color: c.text }}
                    formatter={(v) => [`${v.toFixed(1)}%`, 'Win rate']}
                  />
                  <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                    {bySymbol.map((entry, i) => (
                      <Cell key={i} fill={entry.winRate >= 50 ? c.green : c.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Symboltabell */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Detaljerad symbolanalys</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    {['Symbol', 'Trades', 'Win rate', 'Total P&L', 'Snitt P&L', 'Bästa', 'Sämsta'].map(h => (
                      <th key={h} style={{ ...s.th, color: c.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bySymbol.map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${c.border}` }}>
                      <td style={{ ...s.td, color: c.accent, fontWeight: '600' }}>{row.symbol}</td>
                      <td style={{ ...s.td, color: c.text }}>{row.trades}</td>
                      <td style={{ ...s.td, color: row.winRate >= 50 ? c.green : c.red }}>
                        {row.winRate.toFixed(1)}%
                      </td>
                      <td style={{ ...s.td, color: row.totalPnl >= 0 ? c.green : c.red }}>
                        {row.totalPnl >= 0 ? '+' : ''}{row.totalPnl.toFixed(2)}
                      </td>
                      <td style={{ ...s.td, color: row.avgPnl >= 0 ? c.green : c.red }}>
                        {row.avgPnl >= 0 ? '+' : ''}{row.avgPnl.toFixed(2)}
                      </td>
                      <td style={{ ...s.td, color: c.green }}>+{row.bestTrade.toFixed(2)}</td>
                      <td style={{ ...s.td, color: c.red }}>{row.worstTrade.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PER TID ──────────────────────────────────────────────── */}
      {activeTab === 'time' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Per timme */}
          {byHour.length > 0 && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>⏰ P&L per timme på dagen</h3>
              <p style={{ color: c.textMuted, fontSize: '0.82rem', marginBottom: '1rem' }}>
                Hitta din bästa och sämsta handelstid — ett av de mest värdefulla insikterna för en trader.
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byHour} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
                  <XAxis dataKey="label" stroke={c.textMuted} tick={{ fontSize: 11 }} />
                  <YAxis stroke={c.textMuted} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 8 }}
                    labelStyle={{ color: c.text }}
                    formatter={(v, n) => [
                      n === 'totalPnl' ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}` : `${v.toFixed(0)} trades`,
                      n === 'totalPnl' ? 'Total P&L' : 'Antal trades'
                    ]}
                  />
                  <Bar dataKey="totalPnl" radius={[4, 4, 0, 0]}>
                    {byHour.map((entry, i) => (
                      <Cell key={i} fill={entry.totalPnl >= 0 ? c.green : c.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Bästa/sämsta timme */}
              {byHour.length > 0 && (() => {
                const best  = [...byHour].sort((a, b) => b.totalPnl - a.totalPnl)[0];
                const worst = [...byHour].sort((a, b) => a.totalPnl - b.totalPnl)[0];
                return (
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <InsightBox emoji="🟢" label="Bästa handelstid" value={best.label}
                      sub={`+${best.totalPnl.toFixed(2)} · ${best.winRate.toFixed(0)}% win rate`} c={c} />
                    <InsightBox emoji="🔴" label="Sämsta handelstid" value={worst.label}
                      sub={`${worst.totalPnl.toFixed(2)} · ${worst.winRate.toFixed(0)}% win rate`} c={c} />
                  </div>
                );
              })()}
            </div>
          )}

          {/* Per veckodag */}
          {byWeekday.length > 0 && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>📅 P&L per veckodag</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byWeekday} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
                  <XAxis dataKey="day" stroke={c.textMuted} tick={{ fontSize: 12 }} />
                  <YAxis stroke={c.textMuted} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 8 }}
                    labelStyle={{ color: c.text }}
                    formatter={(v) => [`${v >= 0 ? '+' : ''}${v.toFixed(2)}`, 'Total P&L']}
                  />
                  <Bar dataKey="totalPnl" radius={[4, 4, 0, 0]}>
                    {byWeekday.map((entry, i) => (
                      <Cell key={i} fill={entry.totalPnl >= 0 ? c.green : c.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {byWeekday.length > 0 && (() => {
                const best  = [...byWeekday].sort((a, b) => b.totalPnl - a.totalPnl)[0];
                const worst = [...byWeekday].sort((a, b) => a.totalPnl - b.totalPnl)[0];
                return (
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <InsightBox emoji="🟢" label="Bästa dag" value={best.day}
                      sub={`+${best.totalPnl.toFixed(2)} · ${best.winRate.toFixed(0)}% win rate`} c={c} />
                    <InsightBox emoji="🔴" label="Sämsta dag" value={worst.day}
                      sub={`${worst.totalPnl.toFixed(2)} · ${worst.winRate.toFixed(0)}% win rate`} c={c} />
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── STRATEGI ─────────────────────────────────────────────── */}
      {activeTab === 'strategy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {byStrategy.length > 0 && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>🎯 P&L per strategi</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byStrategy} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
                  <XAxis type="number" stroke={c.textMuted} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="strategy" stroke={c.textMuted} tick={{ fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 8 }}
                    labelStyle={{ color: c.text }}
                    formatter={(v) => [`${v >= 0 ? '+' : ''}${v.toFixed(2)}`, 'Total P&L']}
                  />
                  <Bar dataKey="totalPnl" radius={[0, 4, 4, 0]}>
                    {byStrategy.map((entry, i) => (
                      <Cell key={i} fill={entry.totalPnl >= 0 ? c.green : c.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Strategitabell */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Strategianalys</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    {['Strategi', 'Trades', 'Vinster', 'Förluster', 'Win rate', 'Total P&L', 'Snitt P&L'].map(h => (
                      <th key={h} style={{ ...s.th, color: c.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byStrategy.map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${c.border}` }}>
                      <td style={{ ...s.td, color: c.accent, fontWeight: '600' }}>{row.strategy}</td>
                      <td style={{ ...s.td, color: c.text }}>{row.trades}</td>
                      <td style={{ ...s.td, color: c.green }}>{row.wins}</td>
                      <td style={{ ...s.td, color: c.red }}>{row.losses}</td>
                      <td style={{ ...s.td, color: row.winRate >= 50 ? c.green : c.red }}>
                        {row.winRate.toFixed(1)}%
                      </td>
                      <td style={{ ...s.td, color: row.totalPnl >= 0 ? c.green : c.red }}>
                        {row.totalPnl >= 0 ? '+' : ''}{row.totalPnl.toFixed(2)}
                      </td>
                      <td style={{ ...s.td, color: row.avgPnl >= 0 ? c.green : c.red }}>
                        {row.avgPnl >= 0 ? '+' : ''}{row.avgPnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Underkomponenter ─────────────────────────────────────────────────────────

function KpiCard({ label, value, color, c }) {
  return (
    <div style={{
      background: c.surface, border: `1px solid ${c.border}`,
      borderRadius: '10px', padding: '1rem', textAlign: 'center',
      boxShadow: c.cardShadow
    }}>
      <div style={{ color, fontSize: '1.4rem', fontWeight: 'bold' }}>{value}</div>
      <div style={{ color: c.textFaint, fontSize: '0.78rem', marginTop: '0.3rem' }}>{label}</div>
    </div>
  );
}

function StreakCard({ label, value, forcePositive, c }) {
  const isPositive = forcePositive ? true : value > 0;
  const display    = forcePositive ? value : Math.abs(value);
  const color      = isPositive ? c.green : c.red;
  const emoji      = isPositive ? '🔥' : '❄️';

  return (
    <div style={{
      background: c.surface, border: `1px solid ${c.border}`, borderRadius: '10px',
      padding: '1rem 1.5rem', flex: 1, minWidth: '180px', boxShadow: c.cardShadow
    }}>
      <p style={{ color: c.textMuted, fontSize: '0.8rem', margin: '0 0 0.3rem' }}>{label}</p>
      <p style={{ color, fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
        {emoji} {display} {display === 1 ? 'trade' : 'trades'}
      </p>
    </div>
  );
}

function InsightBox({ emoji, label, value, sub, c }) {
  return (
    <div style={{
      background: c.surface2, borderRadius: '8px',
      padding: '0.75rem 1rem', flex: 1, minWidth: '160px'
    }}>
      <p style={{ color: c.textMuted, fontSize: '0.75rem', margin: '0 0 0.2rem' }}>{emoji} {label}</p>
      <p style={{ color: c.text, fontWeight: '700', fontSize: '1rem', margin: '0 0 0.2rem' }}>{value}</p>
      <p style={{ color: c.textMuted, fontSize: '0.78rem', margin: 0 }}>{sub}</p>
    </div>
  );
}

function makeStyles(c) {
  return {
    wrap:     { maxWidth: '1000px' },
    heading:  { color: c.text, marginBottom: '1.25rem' },
    tabRow:   { display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
    tab:      { padding: '0.45rem 1rem', background: c.surface, border: `1px solid ${c.border}`, borderRadius: '7px', color: c.textMuted, cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.15s' },
    tabActive:{ borderColor: c.accent, color: c.accent, background: c.accentBg },
    kpiGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' },
    card:     { background: c.surface, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1.25rem', boxShadow: c.cardShadow },
    cardTitle:{ color: c.text, fontSize: '1rem', marginBottom: '1rem', fontWeight: '600' },
    th:       { padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: '600', borderBottom: `1px solid ${c.border}`, textTransform: 'uppercase', letterSpacing: '0.04em' },
    td:       { padding: '0.6rem 0.75rem' },
  };
}
