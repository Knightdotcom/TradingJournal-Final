import { usePlan } from '../context/PlanContext';

// Visar en liten statusrad i sidebaren/dashboarden
// "32 / 50 trades använda" med en progress-bar
// Ger användaren full transparens om sin plankonsumption
export default function PlanUsageBar() {
  const { planStatus } = usePlan();

  if (!planStatus || planStatus.plan !== 'Free') return null;

  const pct = planStatus.tradesMax
    ? Math.min((planStatus.tradesUsed / planStatus.tradesMax) * 100, 100)
    : 0;

  const color = pct >= 100 ? '#f87171' : pct >= 80 ? '#fbbf24' : '#4ade80';

  return (
    <div style={s.wrap}>
      <div style={s.row}>
        <span style={s.label}>Gratisplan</span>
        <span style={{ color, fontSize: '0.8rem', fontWeight: '600' }}>
          {planStatus.tradesUsed} / {planStatus.tradesMax} trades
        </span>
      </div>
      <div style={s.track}>
        <div style={{ ...s.fill, width: `${pct}%`, background: color }} />
      </div>
      {pct >= 80 && (
        <a href="/upgrade" style={s.upgradeLink}>Uppgradera för obegränsat →</a>
      )}
    </div>
  );
}

const s = {
  wrap:        { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem' },
  row:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' },
  label:       { color: '#64748b', fontSize: '0.8rem' },
  track:       { height: '4px', background: '#334155', borderRadius: '999px', overflow: 'hidden' },
  fill:        { height: '100%', borderRadius: '999px', transition: 'width 0.3s ease' },
  upgradeLink: { display: 'block', marginTop: '0.5rem', color: '#38bdf8', fontSize: '0.78rem', textDecoration: 'none' },
};
