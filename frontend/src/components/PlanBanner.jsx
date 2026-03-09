import { useState } from 'react';
import { usePlan } from '../context/PlanContext';

export default function PlanBanner() {
  const { planStatus } = usePlan();
  const [dismissed, setDismissed] = useState(false);

  if (!planStatus || dismissed || planStatus.plan !== 'Free') return null;

  const tradePercent = planStatus.tradesMax
    ? (planStatus.tradesUsed / planStatus.tradesMax) * 100 : 0;

  const nearLimit = tradePercent >= 80 && tradePercent < 100;
  const atLimit   = tradePercent >= 100;

  if (!nearLimit && !atLimit) return null;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1.25rem',
      border:'1px solid', borderRadius:'8px', marginBottom:'1.5rem',
      background: atLimit ? '#2a0000' : '#2a1a00',
      borderColor: atLimit ? '#f87171' : '#fbbf24' }}>
      <span style={{fontSize:'1.1rem'}}>{atLimit ? '🚫' : '⚠️'}</span>
      <span style={{color: atLimit ? '#fca5a5' : '#fde68a', flex:1}}>
        {atLimit
          ? `Du har nått gränsen på ${planStatus.tradesMax} trades för gratisplanen.`
          : `Du har använt ${planStatus.tradesUsed} av ${planStatus.tradesMax} trades.`}
        {' '}<a href="/upgrade" style={{color:'#38bdf8', textDecoration:'underline'}}>Uppgradera till Pro →</a>
      </span>
      <button onClick={() => setDismissed(true)}
        style={{background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:'1rem'}}>✕</button>
    </div>
  );
}
