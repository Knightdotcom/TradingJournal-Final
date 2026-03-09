import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTheme, colors } from '../context/ThemeContext';

// Liten komponent som visas högst upp i appen om en riskregel är bruten.
// Lägg den i Layout.jsx eller App.jsx direkt under Navbar.
export default function RiskAlert() {
  const { isDark } = useTheme();
  const c          = colors(isDark);
  const [violations, setViolations] = useState([]);
  const [dismissed,  setDismissed]  = useState(false);

  useEffect(() => {
    api.get('/riskrules/check')
      .then(r => setViolations(r.data.violations || []))
      .catch(() => {});
  }, []);

  if (!violations.length || dismissed) return null;

  return (
    <div style={{
      background: '#7f1d1d', borderBottom: '1px solid #dc2626',
      padding: '0.6rem 1.5rem', display:'flex', alignItems:'center',
      justifyContent:'space-between', gap:'1rem'
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', flex:1 }}>
        <span style={{ fontSize:'1rem' }}>🚨</span>
        <p style={{ color:'#fecaca', margin:0, fontSize:'0.875rem', fontWeight:600 }}>
          Riskgräns bruten: {violations[0].title}
          {violations.length > 1 && ` (+${violations.length - 1} till)`}
          {' — '}
          <span style={{ fontWeight:400 }}>{violations[0].detail}</span>
        </p>
      </div>
      <button onClick={() => setDismissed(true)}
        style={{ background:'none', border:'none', color:'#fca5a5', cursor:'pointer', fontSize:'1.1rem', flexShrink:0 }}>
        ✕
      </button>
    </div>
  );
}
