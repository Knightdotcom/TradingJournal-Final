import { useEffect, useState } from 'react';
import api from '../services/api';

const emptyForm = {
  symbol: '', direction: 'Long', entryPrice: '', exitPrice: '',
  quantity: '', entryDate: '', exitDate: '', notes: '', strategy: '',
};

export default function Trades() {
  const [trades, setTrades] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTrades = () => {
    api.get('/trades').then(res => {
      setTrades(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchTrades(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/trades', {
      ...form,
      entryPrice: parseFloat(form.entryPrice),
      exitPrice: form.exitPrice ? parseFloat(form.exitPrice) : null,
      quantity: parseInt(form.quantity),
      exitDate: form.exitDate || null,
    });
    setForm(emptyForm);
    setShowForm(false);
    fetchTrades(); // Ladda om listan
  };

  const deleteTrade = async (id) => {
    if (window.confirm('Ta bort denna trade?')) {
      await api.delete(`/trades/${id}`);
      fetchTrades();
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.heading}>Trades</h1>
          <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Avbryt' : '+ Ny trade'}
          </button>
        </div>

        {/* Formulär för ny trade */}
        {showForm && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <input style={styles.input} placeholder="Symbol (t.ex. AAPL)" value={form.symbol}
                onChange={e => setForm({ ...form, symbol: e.target.value })} required />
              <select style={styles.input} value={form.direction}
                onChange={e => setForm({ ...form, direction: e.target.value })}>
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
              <input style={styles.input} type="number" placeholder="Inköpspris" value={form.entryPrice}
                onChange={e => setForm({ ...form, entryPrice: e.target.value })} required />
              <input style={styles.input} type="number" placeholder="Säljpris (valfritt)" value={form.exitPrice}
                onChange={e => setForm({ ...form, exitPrice: e.target.value })} />
              <input style={styles.input} type="number" placeholder="Antal" value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })} required />
              <input style={styles.input} type="datetime-local" value={form.entryDate}
                onChange={e => setForm({ ...form, entryDate: e.target.value })} required />
              <input style={styles.input} type="datetime-local" value={form.exitDate}
                onChange={e => setForm({ ...form, exitDate: e.target.value })} />
              <input style={styles.input} placeholder="Strategi (valfritt)" value={form.strategy}
                onChange={e => setForm({ ...form, strategy: e.target.value })} />
            </div>
            <textarea style={styles.textarea} placeholder="Anteckningar (valfritt)"
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <button style={styles.addBtn} type="submit">Spara trade</button>
          </form>
        )}

        {/* Tradeslista */}
        {loading ? <p style={styles.muted}>Laddar...</p> : trades.length === 0
          ? <p style={styles.muted}>Inga trades ännu. Lägg till din första!</p>
          : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Symbol', 'Riktning', 'Inköp', 'Sälj', 'Antal', 'P&L', 'Datum', ''].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trades.map(t => (
                    <tr key={t.id} style={styles.tr}>
                      <td style={styles.td}><strong style={{ color: '#38bdf8' }}>{t.symbol}</strong></td>
                      <td style={styles.td}>
                        <span style={{ color: t.direction === 'Long' ? '#4ade80' : '#f87171' }}>
                          {t.direction}
                        </span>
                      </td>
                      <td style={styles.td}>{t.entryPrice} kr</td>
                      <td style={styles.td}>{t.exitPrice ? `${t.exitPrice} kr` : '—'}</td>
                      <td style={styles.td}>{t.quantity}</td>
                      <td style={styles.td}>
                        {t.profitLoss !== null
                          ? <span style={{ color: t.profitLoss >= 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                              {t.profitLoss >= 0 ? '+' : ''}{t.profitLoss.toFixed(2)} kr
                            </span>
                          : '—'}
                      </td>
                      <td style={styles.td}>{new Date(t.entryDate).toLocaleDateString('sv-SE')}</td>
                      <td style={styles.td}>
                        <button onClick={() => deleteTrade(t.id)} style={styles.deleteBtn}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a' },
  content: { padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  heading: { color: '#fff', margin: 0 },
  muted: { color: '#94a3b8' },
  addBtn: { background: '#38bdf8', color: '#0f172a', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  form: { background: '#1e293b', padding: '1.5rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid #334155' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' },
  input: { padding: '0.65rem', borderRadius: '7px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.65rem', borderRadius: '7px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.9rem', marginBottom: '0.75rem', boxSizing: 'border-box', minHeight: '80px' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { color: '#94a3b8', textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #334155', fontSize: '0.85rem' },
  tr: { borderBottom: '1px solid #1e293b' },
  td: { color: '#e2e8f0', padding: '0.75rem', fontSize: '0.9rem' },
  deleteBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' },
};
