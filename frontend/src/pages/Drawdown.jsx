import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import api from '../services/api';
import { useTheme, colors } from '../context/ThemeContext';

export default function Drawdown() {
  const { isDark } = useTheme();
  const c          = colors(isDark);
  const [data, setData]   = useState(null);
  const [view, setView]   = useState('pnl'); // 'pnl' | 'drawdown'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/drawdown')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: c.textMuted }}>Laddar drawdown-data...</p>;
  if (!data || data.message) return (
    <div style={{ textAlign:'center', padding:'4rem', color: c.textFaint }}>
      <p style={{ fontSize:'2rem' }}>📉</p>
      <p>Ingen data ännu.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 860 }}>
      <h2 style={{ color: c.text, marginBottom:'0.4rem' }}>📉 Drawdown-tracker</h2>
      <p style={{ color: c.textMuted, fontSize:'0.9rem', marginBottom:'1.5rem' }}>
        Spårar hur långt du är ner från din topp-P&L. Kritiskt för riskhantering.
      </p>

      {/* KPI-kort */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'0.75rem', marginBottom:'1.5rem' }}>
        <KpiCard label="Nuvarande P&L"    value={`${data.currentPnl>=0?'+':''}${data.currentPnl}`} color={data.currentPnl>=0?c.green:c.red} c={c} />
        <KpiCard label="Topp P&L (peak)"  value={`+${data.currentPeak}`} color={c.accent} c={c} />
        <KpiCard label="Nuv. drawdown"    value={`${data.currentDrawdown}%`} color={data.currentDrawdown>10?c.red:data.currentDrawdown>5?c.yellow:c.green} c={c} />
        <KpiCard label="Max drawdown"     value={`${data.maxDrawdown}%`} color={data.maxDrawdown>20?c.red:c.yellow} c={c} />
        <KpiCard label="Kr från peak"     value={`-${data.drawdownFromPeak}`} color={data.isInDrawdown?c.red:c.green} c={c} />
      </div>

      {/* Status */}
      {data.isInDrawdown && (
        <div style={{ background: c.redBg, border:`1px solid ${c.red}`, borderRadius:10, padding:'0.9rem 1.25rem', marginBottom:'1.5rem', display:'flex', gap:'0.75rem', alignItems:'center' }}>
          <span style={{ fontSize:'1.3rem' }}>⚠️</span>
          <p style={{ color: c.red, margin:0, fontWeight:600 }}>
            Du är för närvarande i drawdown — {data.currentDrawdown}% under din topp.
            Var extra disciplinerad med positionsstorlek.
          </p>
        </div>
      )}

      {/* Tab-välj diagram */}
      <div style={{ display:'flex', gap:'0.4rem', marginBottom:'1rem' }}>
        {[['pnl','📈 Kumulativ P&L'], ['drawdown','📉 Drawdown %']].map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} style={{
            padding:'0.4rem 0.9rem', borderRadius:7, border:`1px solid ${view===id?c.accent:c.border}`,
            background: view===id ? c.accentBg : c.surface, color: view===id ? c.accent : c.textMuted,
            cursor:'pointer', fontSize:'0.875rem'
          }}>{label}</button>
        ))}
      </div>

      {/* Diagram */}
      <div style={{ background: c.surface, border:`1px solid ${c.border}`, borderRadius:12, padding:'1.25rem' }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.curve} margin={{ top:5, right:20, bottom:5, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
            <XAxis dataKey="date" stroke={c.textMuted} tick={{ fontSize:10 }}
              tickFormatter={d => d.slice(5)} // Visa bara MM-DD
            />
            <YAxis stroke={c.textMuted} tick={{ fontSize:11 }} />
            <Tooltip
              contentStyle={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:8 }}
              labelStyle={{ color:c.text }}
              formatter={(v, n) => [
                view==='drawdown' ? `${v}%` : `${v>=0?'+':''}${v}`,
                view==='drawdown' ? 'Drawdown' : 'Kumulativ P&L'
              ]}
            />
            {view === 'drawdown' && <ReferenceLine y={0} stroke={c.border2} />}
            <Line
              type="monotone"
              dataKey={view==='pnl' ? 'cumPnl' : 'drawdown'}
              stroke={view==='pnl' ? c.green : c.red}
              dot={false} strokeWidth={2}
            />
            {view === 'pnl' && (
              <Line type="monotone" dataKey="peak" stroke={c.accent}
                dot={false} strokeWidth={1} strokeDasharray="4 4" />
            )}
          </LineChart>
        </ResponsiveContainer>
        {view === 'pnl' && (
          <p style={{ color: c.textFaint, fontSize:'0.75rem', marginTop:'0.5rem', textAlign:'center' }}>
            Streckad linje = din topp P&L (peak)
          </p>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, color, c }) {
  return (
    <div style={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:9, padding:'0.9rem', textAlign:'center' }}>
      <div style={{ color, fontSize:'1.2rem', fontWeight:'bold' }}>{value}</div>
      <div style={{ color:c.textFaint, fontSize:'0.75rem', marginTop:'0.2rem' }}>{label}</div>
    </div>
  );
}
