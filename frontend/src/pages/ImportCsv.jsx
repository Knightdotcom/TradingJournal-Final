import { useState, useRef } from 'react';
import api from '../services/api';

// Import-komponent med drag & drop, broker-info och detaljerat resultat
export default function ImportCsv() {
  const [dragging, setDragging]   = useState(false);
  const [file, setFile]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');
  const fileInputRef              = useRef();

  // ── Drag & Drop handlers ──────────────────────────────────────────────────
  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = ()  => setDragging(false);
  const handleDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSetFile(dropped);
  };

  const validateAndSetFile = (f) => {
    setResult(null);
    setError('');
    if (!f.name.endsWith('.csv') && !f.name.endsWith('.txt')) {
      setError('Endast .csv och .txt-filer accepteras.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Filen är för stor. Max 10MB.');
      return;
    }
    setFile(f);
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Import misslyckades. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrap}>
      <h2 style={s.heading}>📥 Importera trades från CSV</h2>
      <p style={s.sub}>Stöder Binance, Alpaca, MetaTrader 4/5, Nordnet och generiska CSV-format.</p>

      {/* ── Drag & Drop zon ─────────────────────────────────────────────── */}
      <div
        style={{ ...s.dropzone, ...(dragging ? s.dropzoneActive : {}), ...(file ? s.dropzoneHasFile : {}) }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files[0] && validateAndSetFile(e.target.files[0])}
        />
        {file ? (
          <>
            <div style={s.fileIcon}>📄</div>
            <p style={s.fileName}>{file.name}</p>
            <p style={s.fileSize}>{(file.size / 1024).toFixed(1)} KB</p>
          </>
        ) : (
          <>
            <div style={s.uploadIcon}>⬆️</div>
            <p style={s.dropText}>Dra och släpp din CSV här</p>
            <p style={s.dropSub}>eller klicka för att välja fil</p>
          </>
        )}
      </div>

      {error && <p style={s.error}>⚠️ {error}</p>}

      {/* ── Importknapp ─────────────────────────────────────────────────── */}
      {file && (
        <button style={s.importBtn} onClick={handleUpload} disabled={loading}>
          {loading ? '⏳ Importerar...' : '🚀 Importera trades'}
        </button>
      )}

      {/* ── Resultat ────────────────────────────────────────────────────── */}
      {result && (
        <div style={s.resultBox}>
          <h3 style={s.resultTitle}>✅ Import klar!</h3>
          <p style={s.brokerTag}>🔍 Detekterad broker: <strong>{result.brokerDetected}</strong></p>

          <div style={s.stats}>
            <StatPill label="Importerade" value={result.imported} color="#4ade80" />
            <StatPill label="Hoppade över" value={result.skipped}  color="#fbbf24" />
            <StatPill label="Misslyckades" value={result.failed}   color="#f87171" />
          </div>

          {result.warnings?.length > 0 && (
            <div style={s.warningBox}>
              <p style={s.warningTitle}>⚠️ Varningar ({result.warnings.length})</p>
              {result.warnings.slice(0, 5).map((w, i) => (
                <p key={i} style={s.warningItem}>{w}</p>
              ))}
              {result.warnings.length > 5 && (
                <p style={s.warningItem}>...och {result.warnings.length - 5} till</p>
              )}
            </div>
          )}

          {result.errors?.length > 0 && (
            <div style={s.errorBox}>
              <p style={s.errorTitle}>❌ Fel ({result.errors.length})</p>
              {result.errors.slice(0, 5).map((e, i) => (
                <p key={i} style={s.errorItem}>{e}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Broker-guide ────────────────────────────────────────────────── */}
      <div style={s.guideBox}>
        <h3 style={s.guideTitle}>📋 Hur exporterar du från din broker?</h3>
        {[
          { broker: 'Binance',        steps: 'Orders → Order History → Export → CSV' },
          { broker: 'Alpaca',         steps: 'Dashboard → Account → Activity → Export CSV' },
          { broker: 'MetaTrader 4/5', steps: 'Terminal → Account History → Högerklicka → Save as Report (CSV)' },
          { broker: 'Nordnet',        steps: 'Min ekonomi → Transaktioner → Exportera → CSV' },
        ].map(({ broker, steps }) => (
          <div key={broker} style={s.guideRow}>
            <span style={s.guideBroker}>{broker}</span>
            <span style={s.guideSteps}>{steps}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ ...s.pill, borderColor: color }}>
      <span style={{ color, fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</span>
      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{label}</span>
    </div>
  );
}

const s = {
  wrap:            { padding: '0', maxWidth: '680px' },
  heading:         { color: '#fff', marginBottom: '0.4rem' },
  sub:             { color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' },

  dropzone:        { border: '2px dashed #334155', borderRadius: '12px', padding: '2.5rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: '#0f172a', marginBottom: '1rem' },
  dropzoneActive:  { borderColor: '#38bdf8', background: '#0f2030' },
  dropzoneHasFile: { borderColor: '#4ade80', borderStyle: 'solid' },
  uploadIcon:      { fontSize: '2.5rem', marginBottom: '0.75rem' },
  fileIcon:        { fontSize: '2.5rem', marginBottom: '0.5rem' },
  dropText:        { color: '#fff', fontSize: '1rem', marginBottom: '0.3rem' },
  dropSub:         { color: '#94a3b8', fontSize: '0.85rem' },
  fileName:        { color: '#4ade80', fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' },
  fileSize:        { color: '#94a3b8', fontSize: '0.85rem' },

  error:           { color: '#f87171', fontSize: '0.9rem', marginBottom: '0.75rem' },

  importBtn:       { width: '100%', padding: '0.85rem', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginBottom: '1.5rem' },

  resultBox:       { background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' },
  resultTitle:     { color: '#4ade80', marginBottom: '0.5rem' },
  brokerTag:       { color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' },
  stats:           { display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' },
  pill:            { flex: 1, minWidth: '100px', background: '#0f172a', border: '1px solid', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' },

  warningBox:      { background: '#2a1f00', border: '1px solid #fbbf24', borderRadius: '8px', padding: '1rem', marginTop: '0.75rem' },
  warningTitle:    { color: '#fbbf24', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' },
  warningItem:     { color: '#d97706', fontSize: '0.82rem', marginBottom: '0.25rem' },

  errorBox:        { background: '#2a0000', border: '1px solid #f87171', borderRadius: '8px', padding: '1rem', marginTop: '0.75rem' },
  errorTitle:      { color: '#f87171', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' },
  errorItem:       { color: '#ef4444', fontSize: '0.82rem', marginBottom: '0.25rem' },

  guideBox:        { background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '1.25rem' },
  guideTitle:      { color: '#fff', marginBottom: '1rem', fontSize: '0.95rem' },
  guideRow:        { display: 'flex', gap: '1rem', marginBottom: '0.6rem', alignItems: 'flex-start' },
  guideBroker:     { color: '#38bdf8', fontWeight: '600', fontSize: '0.85rem', minWidth: '130px' },
  guideSteps:      { color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.4 },
};
