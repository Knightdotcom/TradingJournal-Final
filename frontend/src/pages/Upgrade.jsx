import { useEffect, useState } from 'react';
import api from '../services/api';
import { usePlan } from '../context/PlanContext';

export default function Upgrade() {
  const [plans, setPlans]   = useState([]);
  const { planStatus }      = usePlan();

  useEffect(() => {
    api.get('/plan/pricing').then(r => setPlans(r.data)).catch(() => {});
  }, []);

  return (
    <div style={s.wrap}>
      <h2 style={s.heading}>⚡ Välj din plan</h2>
      <p style={s.sub}>Export är alltid gratis oavsett plan — du äger alltid din data.</p>

      <div style={s.grid}>
        {plans.map(plan => (
          <div key={plan.name} style={{
            ...s.card,
            ...(plan.highlighted ? s.cardHighlighted : {}),
            ...(planStatus?.plan === plan.name ? s.cardCurrent : {})
          }}>
            {plan.highlighted && <div style={s.badge}>Rekommenderad</div>}
            {planStatus?.plan === plan.name && <div style={s.badgeCurrent}>Din plan</div>}

            <h3 style={s.planName}>{plan.name}</h3>
            <div style={s.price}>
              {plan.price === 0
                ? <span style={s.free}>Gratis</span>
                : <><span style={s.amount}>{plan.price}</span><span style={s.period}> {plan.currency}/{plan.period}</span></>
              }
            </div>

            <ul style={s.features}>
              {plan.features.map((f, i) => (
                <li key={i} style={s.feature}>
                  <span style={{color:'#4ade80', marginRight:'0.5rem'}}>✓</span>{f}
                </li>
              ))}
            </ul>

            {plan.name !== 'Free' && planStatus?.plan !== plan.name && (
              <button style={{...s.btn, ...(plan.highlighted ? s.btnPrimary : s.btnSecondary)}}>
                Uppgradera till {plan.name}
              </button>
            )}
            {planStatus?.plan === plan.name && (
              <div style={s.currentLabel}>✓ Aktiv plan</div>
            )}
          </div>
        ))}
      </div>

      <div style={s.note}>
        <span style={{color:'#38bdf8'}}>🔒</span>
        {' '}Din data exporteras alltid fritt — vi låser aldrig in dig. Det är vår garanti.
      </div>
    </div>
  );
}

const s = {
  wrap:            { padding: '0', maxWidth: '900px' },
  heading:         { color: '#fff', marginBottom: '0.4rem' },
  sub:             { color: '#94a3b8', marginBottom: '2rem' },
  grid:            { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  card:            { background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.75rem', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem' },
  cardHighlighted: { border: '2px solid #38bdf8', boxShadow: '0 0 20px rgba(56,189,248,0.15)' },
  cardCurrent:     { border: '2px solid #4ade80' },
  badge:           { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#38bdf8', color: '#0f172a', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.75rem', borderRadius: '999px' },
  badgeCurrent:    { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#4ade80', color: '#0f172a', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.75rem', borderRadius: '999px' },
  planName:        { color: '#fff', fontSize: '1.3rem', fontWeight: 'bold' },
  price:           { marginBottom: '0.5rem' },
  free:            { color: '#4ade80', fontSize: '1.5rem', fontWeight: 'bold' },
  amount:          { color: '#fff', fontSize: '2rem', fontWeight: 'bold' },
  period:          { color: '#94a3b8', fontSize: '0.9rem' },
  features:        { listStyle: 'none', padding: 0, margin: 0, flex: 1 },
  feature:         { color: '#cbd5e1', fontSize: '0.9rem', padding: '0.3rem 0', display: 'flex', alignItems: 'flex-start' },
  btn:             { width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem', marginTop: 'auto' },
  btnPrimary:      { background: '#38bdf8', color: '#0f172a' },
  btnSecondary:    { background: '#334155', color: '#e2e8f0' },
  currentLabel:    { textAlign: 'center', color: '#4ade80', fontSize: '0.9rem', fontWeight: '600' },
  note:            { background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '1rem 1.25rem', color: '#94a3b8', fontSize: '0.9rem' },
};
