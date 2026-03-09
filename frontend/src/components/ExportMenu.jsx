import { useState } from 'react';
import api from '../services/api';

// Knapp med dropdown för att exportera data
// Tillgänglig på ALLA planer — vår edge mot konkurrenterna
export default function ExportMenu() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState('');

  const download = async (endpoint, filename) => {
    setLoading(endpoint);
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export misslyckades. Försök igen.');
    } finally {
      setLoading('');
      setOpen(false);
    }
  };

  const exports = [
    { label: '📊 Alla trades (CSV)',      endpoint: '/export/trades/csv',  file: 'trades.csv' },
    { label: '📋 Regler (CSV)',           endpoint: '/export/rules/csv',   file: 'regler.csv' },
    { label: '📈 Full sammanfattning',    endpoint: '/export/summary/csv', file: 'sammanfattning.csv' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <button style={s.btn} onClick={() => setOpen(o => !o)}>
        ⬇ Exportera data ▾
      </button>

      {open && (
        <>
          {/* Osynligt lager som stänger menyn vid klick utanför */}
          <div style={s.overlay} onClick={() => setOpen(false)} />
          <div style={s.menu}>
            <p style={s.menuTitle}>Din data — alltid fri att exportera</p>
            {exports.map(e => (
              <button
                key={e.endpoint}
                style={s.menuItem}
                disabled={loading === e.endpoint}
                onClick={() => download(e.endpoint, e.file)}
              >
                {loading === e.endpoint ? '⏳ Laddar ner...' : e.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const s = {
  btn:       { padding: '0.5rem 1rem', background: '#334155', border: '1px solid #475569', borderRadius: '8px', color: '#e2e8f0', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' },
  overlay:   { position: 'fixed', inset: 0, zIndex: 10 },
  menu:      { position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20, background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem', minWidth: '240px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' },
  menuTitle: { color: '#64748b', fontSize: '0.75rem', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #334155' },
  menuItem:  { display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 0.75rem', background: 'none', border: 'none', borderRadius: '6px', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '0.25rem' },
};
