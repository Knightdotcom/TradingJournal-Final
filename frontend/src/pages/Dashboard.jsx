import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTheme, colors } from '../context/ThemeContext';
import api from '../services/api';

export default function Dashboard() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();
  const c = colors(isDark);

  useEffect(() => {
    api.get('/trades').then(res => {
      setTrades(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const closedTrades = trades.filter(t => t.profitLoss !== null);
  const totalPnL = closedTrades.reduce((sum, t) => sum + t.profitLoss, 0);
  const winners = closedTrades.filter(t => t.profitLoss > 0).length;
  const winRate = closedTrades.length > 0
    ? ((winners / closedTrades.length) * 100).toFixed(1)
    : 0;

  const chartData = closedTrades
    .sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate))
    .reduce((acc, trade, i) => {
      const prev = i === 0 ? 0 : acc[i - 1].ackumulerad;
      acc.push({
        datum: new Date(trade.entryDate).toLocaleDateString('sv-SE'),
        ackumulerad: parseFloat((prev + trade.profitLoss).toFixed(2)),
      });
      return acc;
    }, []);

  return (
    <div>
      {/* Sidhuvud */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: c.textFaint, fontSize: '0.78rem', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          Översikt
        </p>
        <h1 style={{ color: c.text, fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
          Dashboard
        </h1>
      </div>

      {loading ? (
        <p style={{ color: c.textMuted }}>Laddar...</p>
      ) : (
        <>
          {/* Statistikkort */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}>
            <StatCard
              label="Totalt P&L"
              value={`${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)} kr`}
              color={totalPnL >= 0 ? c.green : c.red}
              bg={totalPnL >= 0 ? c.greenBg : c.redBg}
              c={c}
            />
            <StatCard label="Antal trades" value={trades.length}       color={c.accent}  bg={c.accentBg} c={c} />
            <StatCard label="Win rate"     value={`${winRate}%`}       color={c.purple}  bg={c.accentBg} c={c} />
            <StatCard label="Vinnare"      value={winners}             color={c.green}   bg={c.greenBg}  c={c} />
          </div>

          {/* P&L-diagram */}
          <div style={{
            background: c.surface,
            borderRadius: '14px',
            padding: '1.75rem',
            border: `1px solid ${c.border}`,
            boxShadow: c.cardShadow,
          }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ color: c.text, fontSize: '1rem', fontWeight: '600', letterSpacing: '-0.01em' }}>
                Ackumulerad P&L
              </h2>
              <p style={{ color: c.textMuted, fontSize: '0.8rem', marginTop: '0.2rem' }}>
                Vinst/förlust över tid
              </p>
            </div>

            {chartData.length === 0 ? (
              <div style={{
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: c.textFaint,
                fontSize: '0.9rem',
                border: `1px dashed ${c.border}`,
                borderRadius: '8px',
              }}>
                Inga avslutade trades ännu.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
                  <XAxis dataKey="datum" stroke={c.textFaint} tick={{ fontSize: 11, fill: c.textMuted }} />
                  <YAxis stroke={c.textFaint} tick={{ fontSize: 11, fill: c.textMuted }} />
                  <Tooltip
                    contentStyle={{
                      background: c.surface2,
                      border: `1px solid ${c.border}`,
                      color: c.text,
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ackumulerad"
                    stroke={c.accent}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: c.accent }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color, bg, c }) {
  return (
    <div style={{
      background: c.surface,
      borderRadius: '14px',
      padding: '1.5rem',
      border: `1px solid ${c.border}`,
      boxShadow: c.cardShadow,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtil färgaccent i hörnet */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '60px',
        height: '60px',
        background: bg,
        borderRadius: '0 14px 0 60px',
        opacity: 0.6,
      }} />

      <p style={{
        color: c.textMuted,
        fontSize: '0.78rem',
        fontWeight: '500',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        marginBottom: '0.75rem',
      }}>
        {label}
      </p>
      <p style={{
        color: color,
        fontSize: '2rem',
        fontWeight: '700',
        letterSpacing: '-0.03em',
        lineHeight: 1,
      }}>
        {value}
      </p>
    </div>
  );
}
