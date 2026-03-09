import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTheme, colors } from '../context/ThemeContext';

const RULE_TYPES = [
  { value:0, label:'Max daglig förlust',       unit:'kr',      desc:'Stoppa trading om du förlorar mer än X kr idag' },
  { value:1, label:'Max veckans förlust',       unit:'kr',      desc:'Stoppa trading om du förlorar mer än X kr denna vecka' },
  { value:2, label:'Max förluster i rad',       unit:'i rad',   desc:'Stoppa efter X förluster på rad' },
  { value:3, label:'Max trades per dag',        unit:'trades',  desc:'Tillåt max X trades per dag' },
  { value:4, label:'Min win rate (20 trades)',  unit:'%',       desc:'Varna om win rate sjunker under X% (senaste 20 trades)' },
];

export default function RiskManager() {
  const { isDark }  = useTheme();
  const c           = colors(isDark);
  const [rules,     setRules]     = useState([]);
  const [status,    setStatus]    = useState(null);
  const [adding,    setAdding]    = useState(false);
  const [form,      setForm]      = useState({ title:'', type:0, threshold:'', description:'' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [rulesRes, checkRes] = await Promise.all([
        api.get('/riskrules'),
        api.get('/riskrules/check'),
      ]);
      setRules(rulesRes.data);
      setStatus(checkRes.data);
    } catch {}
  };

  const handleCreate = async () => {
    if (!form.title || !form.threshold) return;
    await api.post('/riskrules', { ...form, threshold: parseFloat(form.threshold) });
    setAdding(false);
    setForm({ title:'', type:0, threshold:'', description:'' });
    loadAll();
  };

  const handleToggle = async (id) => {
    await api.patch(`/riskrules/${id}/toggle`);
    loadAll();
  };

  const handleDelete = async (id) => {
    await api.delete(`/riskrules/${id}`);
    loadAll();
  };

  const violations = status?.violations || [];
  const shouldStop = status?.shouldStopTrading;

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ color: c.text, marginBottom:'0.4rem' }}>⛔ Riskhantering</h2>
      <p style={{ color: c.textMuted, fontSize:'0.9rem', marginBottom:'1.5rem' }}>
        Sätt hårda regler för när du måste sluta handla. Appen varnar dig i realtid.
      </p>

      {/* Dagens status */}
      <div style={{
        background: shouldStop ? c.redBg : c.greenBg,
        border:`1px solid ${shouldStop ? c.red : c.green}`,
        borderRadius:10, padding:'1rem 1.25rem', marginBottom:'1.5rem'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span style={{ fontSize:'1.5rem' }}>{shouldStop ? '🚨' : '✅'}</span>
          <div>
            <p style={{ color: shouldStop ? c.red : c.green, fontWeight:700, margin:0 }}>
              {shouldStop ? 'STOPPA TRADING — Regel bruten!' : 'Alla riskgränser OK'}
            </p>
            <p style={{ color: c.textMuted, fontSize:'0.82rem', margin:0 }}>
              Kontrollerat {new Date(status?.checkedAt).toLocaleTimeString('sv-SE') || 'just nu'}
            </p>
          </div>
        </div>

        {violations.map((v, i) => (
          <div key={i} style={{ marginTop:'0.75rem', background: isDark ? 'rgba(248,113,113,0.1)' : 'rgba(220,38,38,0.07)', borderRadius:7, padding:'0.6rem 0.75rem' }}>
            <p style={{ color: c.red, fontWeight:600, margin:'0 0 0.15rem', fontSize:'0.875rem' }}>⛔ {v.title}</p>
            <p style={{ color: c.textMuted, margin:0, fontSize:'0.82rem' }}>{v.detail}</p>
          </div>
        ))}
      </div>

      {/* Regler */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
        <h3 style={{ color: c.text, margin:0 }}>Dina riskgränser</h3>
        <button onClick={() => setAdding(a=>!a)}
          style={{ padding:'0.45rem 0.9rem', background: c.accent, color:'#0f172a', border:'none', borderRadius:7, fontWeight:600, cursor:'pointer', fontSize:'0.875rem' }}>
          {adding ? '✕' : '+ Ny regel'}
        </button>
      </div>

      {/* Ny regel-formulär */}
      {adding && (
        <div style={{ background: c.surface, border:`1px solid ${c.border}`, borderRadius:10, padding:'1.25rem', marginBottom:'1rem' }}>
          <div style={{ display:'grid', gap:'0.6rem' }}>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
              placeholder="Namn på regeln" style={inp(c)} />
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:+e.target.value}))} style={inp(c)}>
              {RULE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <p style={{ color: c.textMuted, fontSize:'0.8rem', margin:'0.1rem 0', background: c.surface2, borderRadius:6, padding:'0.4rem 0.6rem' }}>
              {RULE_TYPES[form.type]?.desc}
            </p>
            <input value={form.threshold} onChange={e=>setForm(f=>({...f,threshold:e.target.value}))}
              type="number" placeholder={`Gränsvärde (${RULE_TYPES[form.type]?.unit})`} style={inp(c)} />
            <button onClick={handleCreate}
              style={{ padding:'0.7rem', background: c.accent, color:'#0f172a', border:'none', borderRadius:8, fontWeight:'bold', cursor:'pointer' }}>
              Skapa riskgräns
            </button>
          </div>
        </div>
      )}

      {/* Regellistan */}
      <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
        {rules.map(r => {
          const typeInfo = RULE_TYPES[r.type] || RULE_TYPES[0];
          const violated = violations.some(v => v.id === r.id);
          return (
            <div key={r.id} style={{
              background: c.surface, borderRadius:9, padding:'0.9rem 1rem',
              border:`1px solid ${violated ? c.red : r.isActive ? c.border : c.border}`,
              opacity: r.isActive ? 1 : 0.5, display:'flex', gap:'1rem', alignItems:'center'
            }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.2rem' }}>
                  {violated && <span style={{ color: c.red, fontSize:'0.9rem' }}>🚨</span>}
                  <span style={{ color: c.text, fontWeight:600, fontSize:'0.875rem' }}>{r.title}</span>
                </div>
                <span style={{ color: c.textMuted, fontSize:'0.8rem' }}>
                  {typeInfo.label}: max {r.threshold} {typeInfo.unit}
                </span>
              </div>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button onClick={() => handleToggle(r.id)}
                  style={{ padding:'0.3rem 0.65rem', borderRadius:6, border:`1px solid ${c.border}`, background: r.isActive ? c.greenBg : c.surface2, color: r.isActive ? c.green : c.textMuted, cursor:'pointer', fontSize:'0.8rem' }}>
                  {r.isActive ? 'Aktiv' : 'Inaktiv'}
                </button>
                <button onClick={() => handleDelete(r.id)}
                  style={{ padding:'0.3rem 0.6rem', background:'none', border:`1px solid ${c.border}`, borderRadius:6, color: c.textFaint, cursor:'pointer' }}>
                  🗑
                </button>
              </div>
            </div>
          );
        })}
        {rules.length === 0 && !adding && (
          <p style={{ color: c.textFaint, textAlign:'center', padding:'2rem' }}>
            Inga riskgränser ännu — skapa din första!
          </p>
        )}
      </div>
    </div>
  );
}

const inp = (c) => ({ width:'100%', background: c.surface2, border:`1px solid ${c.border}`, borderRadius:7, padding:'0.5rem 0.75rem', color: c.text, fontSize:'0.875rem', boxSizing:'border-box' });
