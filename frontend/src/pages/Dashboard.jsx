import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../services/api';

export default function Dashboard() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hämtar alla trades när sidan laddas
    api.get('/trades').then(res => {
      setTrades(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Beräknar statistik från trades
  const closedTrades = trades.filter(t => t.profitLoss !== null);
  const totalPnL = closedTrades.reduce((sum, t) => sum + t.profitLoss, 0);
  const winners = closedTrades.filter(t => t.profitLoss > 0).length;
  const winRate = closedTrades.length > 0
    ? ((winners / closedTrades.length) * 100).toFixed(1)
    : 0;

  // Förbereder data till diagram — ackumulerad P&L över tid
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
    <div style={styles.page}>
      <div style={styles.content}>
        <h1 style={styles.heading}>Dashboard</h1>

        {loading ? <p style={styles.muted}>Laddar...</p> : (
          <>
            {/* Statistikkort */}
            <div style={styles.cards}>
              <StatCard label="Totalt P&L" value={`${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)} kr`}
                color={totalPnL >= 0 ? '#4ade80' : '#f87171'} />
              <StatCard label="Antal trades" value={trades.length} color="#38bdf8" />
              <StatCard label="Win rate" value={`${winRate}%`} color="#a78bfa" />
              <StatCard label="Vinnare" value={winners} color="#4ade80" />
            </div>

            {/* Diagram */}
            <div style={styles.chartBox}>
              <h2 style={styles.chartTitle}>Ackumulerad P&L</h2>
              {chartData.length === 0
                ? <p style={styles.muted}>Inga avslutade trades ännu.</p>
                : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="datum" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="ackumulerad" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Litet återanvändbart kort för statistik
function StatCard({ label, value, color }) {
  return (
    <div style={styles.card}>
      <p style={styles.cardLabel}>{label}</p>
      <p style={{ ...styles.cardValue, color }}>{value}</p>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a' },
  content: { padding: '2rem' },
  heading: { color: '#fff', marginBottom: '1.5rem' },
  muted: { color: '#94a3b8' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  card: { background: '#1e293b', borderRadius: '10px', padding: '1.25rem', border: '1px solid #334155' },
  cardLabel: { color: '#94a3b8', margin: 0, fontSize: '0.85rem' },
  cardValue: { fontSize: '1.75rem', fontWeight: 'bold', margin: '0.5rem 0 0' },
  chartBox: { background: '#1e293b', borderRadius: '10px', padding: '1.5rem', border: '1px solid #334155' },
  chartTitle: { color: '#fff', marginTop: 0, marginBottom: '1rem' },
};
