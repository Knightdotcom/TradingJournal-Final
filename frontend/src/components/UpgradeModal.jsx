import { useState, useEffect } from 'react';
import api from '../services/api';

// Visas automatiskt när en användare försöker göra något
// som kräver uppgradering (t.ex. lägga till fler trades)
export default function UpgradeModal({ onClose, reason = '' }) {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    api.get('/plan/pricing').then(r => setPlans(r.data)).catch(() => {});
  }, []);

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.lockIcon}>🔒</div>
          <h2 style={s.title}>Uppgradera din plan</h2>
          {reason && <p style={s.reason}>{reason}</p>}
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Pristabell */}
        <div style={s.plans}>
          {plans.map(plan => (
            <div key={plan.name} style={{ ...s.planCard, ...(plan.highlighted ? s.planHighlighted : {}) }}>
              {plan.highlighted && <div style={s.badge}>⭐ Rekommenderas</div>}
              <h3 style={s.planName}>{plan.name}</h3>
              <div style={s.planPrice}>
                {plan.price === 0
                  ? <span style={s.free}>Gratis</span>
                  : <><span style={s.priceNum}>{plan.price}</span><span style={s.pricePer}> kr/{plan.period.replace('per ', '')}</span></>
                }
              </div>
              <ul style={s.featureList}>
                {plan.features.map((f, i) => (
                  <li key={i} style={s.featureItem}>
                    <span style={s.check}>✓</span> {f}
                  </li>
                ))}
              </ul>
              {plan.price > 0 && (
                <button
                  style={{ ...s.upgradeBtn, ...(plan.highlighted ? s.upgradeBtnHighlighted : {}) }}
                  onClick={() => alert('Betalning kommer snart — Stripe-integration planeras!')}
                >
                  Välj {plan.name}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Fotnot — export alltid gratis */}
        <p style={s.footnote}>
          💡 Export av din data är alltid gratis på alla planer. Din data tillhör dig.
        </p>
      </div>
    </div>
  );
}

const s = {
  overlay:            { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  modal:              { background: '#1e293b', borderRadius: '16px', padding: '2rem', maxWidth: '860px', width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto' },
  header:             { textAlign: 'center', marginBottom: '1.5rem' },
  lockIcon:           { fontSize: '2.5rem', marginBottom: '0.5rem' },
  title:              { color: '#fff', fontSize: '1.5rem', marginBottom: '0.5rem' },
  reason:             { color: '#f87171', fontSize: '0.9rem', background: '#2a0000', border: '1px solid #f87171', borderRadius: '8px', padding: '0.5rem 1rem', display: 'inline-block' },
  closeBtn:           { position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' },
  plans:              { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  planCard:           { background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '1.25rem', position: 'relative' },
  planHighlighted:    { border: '2px solid #38bdf8', background: '#0a1929' },
  badge:              { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#38bdf8', color: '#0f172a', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.75rem', borderRadius: '999px', whiteSpace: 'nowrap' },
  planName:           { color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' },
  planPrice:          { marginBottom: '1rem' },
  free:               { color: '#4ade80', fontSize: '1.3rem', fontWeight: 'bold' },
  priceNum:           { color: '#38bdf8', fontSize: '1.5rem', fontWeight: 'bold' },
  pricePer:           { color: '#94a3b8', fontSize: '0.85rem' },
  featureList:        { listStyle: 'none', padding: 0, margin: '0 0 1rem 0' },
  featureItem:        { color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' },
  check:              { color: '#4ade80', flexShrink: 0 },
  upgradeBtn:         { width: '100%', padding: '0.65rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  upgradeBtnHighlighted: { background: '#38bdf8', color: '#0f172a' },
  footnote:           { color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem' },
};
