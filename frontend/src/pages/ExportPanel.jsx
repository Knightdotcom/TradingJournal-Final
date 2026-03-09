import { useState } from 'react';
import api from '../services/api';

// Export-panel som alltid är tillgänglig — på ALLA planer
// Detta är vår starkaste edge mot TradeZella som låser in data
export default function ExportPanel() {
  const [loading, setLoading] = useState(null); // vilken export som körs just nu

  const download = async (endpoint, filename) => {
    setLoading(endpoint);
    try {
      // Vi ber om filen som en blob (binärdata) för att kunna spara den
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Export misslyckades. Försök igen.');
    } finally {
      setLoading(null);
    }
  };

  const exports = [
    {
      id:       'trades',
      icon:     '📊',
      title:    'Exportera alla trades',
      desc:     'Alla dina trades i CSV-format. Öppnas direkt i Excel.',
      endpoint: '/export/trades/csv',
      filename: `TradingJournal_Trades_${today()}.csv`,
    },
    {
      id:       'rules',
      icon:     '📋',
      title:    'Exportera regler',
      desc:     'Dina tradingregler exporterade som CSV.',
      endpoint: '/export/rules/csv',
      filename: `TradingJournal_Regler_${today()}.csv`,
    },
    {
      id:       'summary',
      icon:     '📈',
      title:    'Exportera komplett rapport',
      desc:     'Statistik + alla trades i ett dokument. Perfekt för analys.',
      endpoint: '/export/summary/csv',
      filename: `TradingJournal_Rapport_${today()}.csv`,
    },
  ];

  return (
    <div style={s.wrap}>
      <h2 style={s.heading}>📤 Exportera din data</h2>

      {/* Frihet-banner — detta skiljer oss från konkurrenter */}
      <div style={s.freeBanner}>
        <span style={s.freeIcon}>🔓</span>
        <div>
          <p style={s.freeTitle}>Export är alltid gratis — på alla planer</p>
          <p style={s.freeDesc}>Din data tillhör dig. Vi låser aldrig in den.</p>
        </div>
      </div>

      {/* Export-knappar */}
      <div style={s.grid}>
        {exports.map(exp => (
          <div key={exp.id} style={s.card}>
            <div style={s.cardIcon}>{exp.icon}</div>
            <div style={s.cardInfo}>
              <h3 style={s.cardTitle}>{exp.title}</h3>
              <p style={s.cardDesc}>{exp.desc}</p>
            </div>
            <button
              style={{ ...s.btn, ...(loading === exp.endpoint ? s.btnLoading : {}) }}
              onClick={() => download(exp.endpoint, exp.filename)}
              disabled={!!loading}
            >
              {loading === exp.endpoint ? '⏳ Laddar ner...' : '⬇️ Ladda ner'}
            </button>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div style={s.tip}>
        <p style={s.tipText}>
          💡 <strong>Tips:</strong> Öppna CSV-filen i Excel och välj <em>Data → Text till kolumner</em> om kolumnerna inte separeras automatiskt.
        </p>
      </div>
    </div>
  );
}

const today = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');

const s = {
  wrap:        { maxWidth: '700px' },
  heading:     { color: '#fff', marginBottom: '1rem' },
  freeBanner:  { display: 'flex', gap: '1rem', alignItems: 'center', background: '#0f2a1a', border: '1px solid #4ade80', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem' },
  freeIcon:    { fontSize: '1.75rem' },
  freeTitle:   { color: '#4ade80', fontWeight: '700', marginBottom: '0.15rem', fontSize: '0.95rem' },
  freeDesc:    { color: '#86efac', fontSize: '0.82rem' },
  grid:        { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' },
  card:        { display: 'flex', alignItems: 'center', gap: '1rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '1rem 1.25rem' },
  cardIcon:    { fontSize: '1.75rem', flexShrink: 0 },
  cardInfo:    { flex: 1 },
  cardTitle:   { color: '#fff', fontWeight: '600', marginBottom: '0.2rem', fontSize: '0.95rem' },
  cardDesc:    { color: '#94a3b8', fontSize: '0.82rem' },
  btn:         { padding: '0.55rem 1rem', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' },
  btnLoading:  { background: '#334155', color: '#94a3b8', cursor: 'not-allowed' },
  tip:         { background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.85rem 1rem' },
  tipText:     { color: '#94a3b8', fontSize: '0.82rem' },
};
