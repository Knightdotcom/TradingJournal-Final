import { useState } from 'react';

// Visar tydlig status efter en CSV-import
// Löser problemet som användare klagar på hos konkurrenterna:
// "trades försvinner utan förklaring"
export default function SyncStatus({ result, onDismiss }) {
  if (!result) return null;

  const hasWarnings = result.warnings?.length > 0;
  const hasErrors   = result.errors?.length > 0;
  const allFailed   = result.imported === 0 && result.failed > 0;

  const [showDetails, setShowDetails] = useState(false);

  return (
    <div style={{ ...s.box, borderColor: allFailed ? '#f87171' : '#4ade80' }}>
      {/* Huvudrad */}
      <div style={s.header}>
        <span style={{ fontSize: '1.25rem' }}>
          {allFailed ? '❌' : '✅'}
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#fff', fontWeight: '600', margin: 0 }}>
            {allFailed
              ? 'Import misslyckades'
              : `${result.imported} trades importerades från ${result.brokerDetected}`}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
            {result.skipped > 0 && `${result.skipped} ignorerade (redan importerade) · `}
            {result.failed  > 0 && `${result.failed} misslyckades · `}
            Broker: {result.brokerDetected}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(hasWarnings || hasErrors) && (
            <button style={s.detailBtn} onClick={() => setShowDetails(d => !d)}>
              {showDetails ? 'Dölj detaljer' : 'Visa detaljer'}
            </button>
          )}
          <button style={s.closeBtn} onClick={onDismiss}>✕</button>
        </div>
      </div>

      {/* Detaljsektion för varningar/fel */}
      {showDetails && (
        <div style={s.details}>
          {hasWarnings && (
            <div style={s.section}>
              <p style={{ color: '#fbbf24', fontWeight: '600', marginBottom: '0.4rem' }}>
                ⚠️ Varningar ({result.warnings.length})
              </p>
              {result.warnings.slice(0, 10).map((w, i) => (
                <p key={i} style={{ color: '#d97706', fontSize: '0.82rem', margin: '0.15rem 0' }}>{w}</p>
              ))}
              {result.warnings.length > 10 && (
                <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                  ...och {result.warnings.length - 10} fler
                </p>
              )}
            </div>
          )}

          {hasErrors && (
            <div style={s.section}>
              <p style={{ color: '#f87171', fontWeight: '600', marginBottom: '0.4rem' }}>
                ❌ Fel ({result.errors.length})
              </p>
              {result.errors.slice(0, 10).map((e, i) => (
                <p key={i} style={{ color: '#ef4444', fontSize: '0.82rem', margin: '0.15rem 0' }}>{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  box:       { background: '#1e293b', border: '1px solid', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem' },
  header:    { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  detailBtn: { padding: '0.3rem 0.75rem', background: '#334155', border: 'none', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' },
  closeBtn:  { padding: '0.3rem 0.6rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem' },
  details:   { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #334155' },
  section:   { marginBottom: '0.75rem' },
};
