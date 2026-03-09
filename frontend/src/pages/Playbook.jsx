import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTheme, colors } from '../context/ThemeContext';

export default function Playbook() {
  const { isDark }  = useTheme();
  const c           = colors(isDark);
  const [playbooks, setPlaybooks] = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [editing,   setEditing]   = useState(false);
  const [form, setForm] = useState(emptyForm());

  useEffect(() => { load(); }, []);
  const load = () => api.get('/playbook').then(r => setPlaybooks(r.data)).catch(() => {});

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editing && selected) {
      await api.put(`/playbook/${selected.id}`, form);
    } else {
      await api.post('/playbook', form);
    }
    setEditing(false); setSelected(null); setForm(emptyForm());
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Ta bort playbook?')) return;
    await api.delete(`/playbook/${id}`);
    setSelected(null); load();
  };

  const startEdit = (p) => {
    setForm({ name:p.name, description:p.description||'', entryRules:p.entryRules||'', exitRules:p.exitRules||'', riskRules:p.riskRules||'', setup:p.setup||'', notes:p.notes||'' });
    setSelected(p); setEditing(true);
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:'1.5rem', maxWidth:1000 }}>
      {/* Vänster: Lista */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h2 style={{ color: c.text, margin:0, fontSize:'1.1rem' }}>📋 Playbooks</h2>
          <button onClick={() => { setEditing(true); setSelected(null); setForm(emptyForm()); }}
            style={{ background: c.accent, color:'#0f172a', border:'none', borderRadius:6, padding:'0.3rem 0.7rem', fontWeight:600, cursor:'pointer', fontSize:'0.82rem' }}>
            + Ny
          </button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {playbooks.map(p => (
            <div key={p.id} onClick={() => { setSelected(p); setEditing(false); }}
              style={{ background: c.surface, border:`1px solid ${selected?.id===p.id ? c.accent : c.border}`, borderRadius:8, padding:'0.75rem', cursor:'pointer', transition:'all 0.15s' }}>
              <p style={{ color: c.text, margin:'0 0 0.2rem', fontWeight:600, fontSize:'0.875rem' }}>{p.name}</p>
              <p style={{ color: c.textMuted, margin:0, fontSize:'0.75rem' }}>
                {p.tradeCount} trades · {p.winRate.toFixed(0)}% win
              </p>
              <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.4rem' }}>
                <MiniStat label="P&L" value={`${p.totalPnl>=0?'+':''}${p.totalPnl.toFixed(0)}`} color={p.totalPnl>=0?c.green:c.red} />
                <MiniStat label="Plan följd" value={`${p.planFollowedRate.toFixed(0)}%`} color={c.accent} />
              </div>
            </div>
          ))}
          {playbooks.length === 0 && (
            <p style={{ color: c.textFaint, fontSize:'0.875rem', textAlign:'center', padding:'1.5rem 0' }}>
              Inga playbooks än
            </p>
          )}
        </div>
      </div>

      {/* Höger: Detalj / Formulär */}
      <div style={{ background: c.surface, border:`1px solid ${c.border}`, borderRadius:10, padding:'1.5rem' }}>
        {editing ? (
          <>
            <h3 style={{ color: c.text, marginBottom:'1.25rem' }}>
              {selected ? 'Redigera playbook' : 'Ny playbook'}
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              <Field label="Namn *" c={c}>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                  placeholder="T.ex. Gap and Go" style={inp(c)} />
              </Field>
              <Field label="Beskrivning" c={c}>
                <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                  placeholder="Kort beskrivning av strategin" style={{...inp(c),resize:'vertical'}} />
              </Field>
              <Field label="Setup — vad letar du efter?" c={c}>
                <textarea rows={2} value={form.setup} onChange={e=>setForm(f=>({...f,setup:e.target.value}))}
                  placeholder="Vilka chartmönster, indikatorer, triggers?" style={{...inp(c),resize:'vertical'}} />
              </Field>
              <Field label="Entry-regler (när FÅR du gå in)" c={c}>
                <textarea rows={3} value={form.entryRules} onChange={e=>setForm(f=>({...f,entryRules:e.target.value}))}
                  placeholder="Regler som måste uppfyllas för att ta traden" style={{...inp(c),resize:'vertical'}} />
              </Field>
              <Field label="Exit-regler (när MÅSTE du gå ut)" c={c}>
                <textarea rows={3} value={form.exitRules} onChange={e=>setForm(f=>({...f,exitRules:e.target.value}))}
                  placeholder="Stop loss, take profit, tidsgräns" style={{...inp(c),resize:'vertical'}} />
              </Field>
              <Field label="Riskhantering" c={c}>
                <textarea rows={2} value={form.riskRules} onChange={e=>setForm(f=>({...f,riskRules:e.target.value}))}
                  placeholder="Position size, max risk per trade, etc." style={{...inp(c),resize:'vertical'}} />
              </Field>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button onClick={handleSave} style={{ flex:1, padding:'0.75rem', background: c.accent, color:'#0f172a', border:'none', borderRadius:8, fontWeight:'bold', cursor:'pointer' }}>
                  💾 Spara
                </button>
                <button onClick={() => { setEditing(false); }} style={{ padding:'0.75rem 1rem', background: c.surface2, border:`1px solid ${c.border}`, borderRadius:8, color: c.textMuted, cursor:'pointer' }}>
                  Avbryt
                </button>
              </div>
            </div>
          </>
        ) : selected ? (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.25rem' }}>
              <h3 style={{ color: c.text, margin:0 }}>{selected.name}</h3>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button onClick={() => startEdit(selected)} style={{ padding:'0.35rem 0.75rem', background: c.surface2, border:`1px solid ${c.border}`, borderRadius:6, color: c.textMuted, cursor:'pointer', fontSize:'0.82rem' }}>✏️ Redigera</button>
                <button onClick={() => handleDelete(selected.id)} style={{ padding:'0.35rem 0.75rem', background:'none', border:`1px solid ${c.red}`, borderRadius:6, color: c.red, cursor:'pointer', fontSize:'0.82rem' }}>🗑 Ta bort</button>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.6rem', marginBottom:'1.25rem' }}>
              <MiniCard label="Win rate" value={`${selected.winRate.toFixed(1)}%`} color={selected.winRate>=50?c.green:c.red} c={c} />
              <MiniCard label="Total P&L" value={`${selected.totalPnl>=0?'+':''}${selected.totalPnl.toFixed(2)}`} color={selected.totalPnl>=0?c.green:c.red} c={c} />
              <MiniCard label="Plan följd" value={`${selected.planFollowedRate.toFixed(0)}%`} color={c.accent} c={c} />
            </div>

            {[
              { key:'setup', label:'🔍 Setup' },
              { key:'entryRules', label:'🟢 Entry-regler' },
              { key:'exitRules', label:'🔴 Exit-regler' },
              { key:'riskRules', label:'⚠️ Riskhantering' },
              { key:'notes', label:'📝 Anteckningar' },
            ].map(({ key, label }) => selected[key] && (
              <div key={key} style={{ marginBottom:'1rem' }}>
                <p style={{ color: c.textMuted, fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.04em', margin:'0 0 0.3rem' }}>{label}</p>
                <p style={{ color: c.text, fontSize:'0.875rem', background: c.surface2, borderRadius:6, padding:'0.6rem 0.75rem', margin:0, whiteSpace:'pre-wrap' }}>{selected[key]}</p>
              </div>
            ))}
          </>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:300, gap:'0.75rem', color: c.textFaint }}>
            <span style={{ fontSize:'2.5rem' }}>📋</span>
            <p>Välj en playbook eller skapa en ny</p>
          </div>
        )}
      </div>
    </div>
  );
}

const Field = ({ label, c, children }) => (
  <div>
    <label style={{ display:'block', color: c.textMuted, fontSize:'0.78rem', marginBottom:'0.25rem' }}>{label}</label>
    {children}
  </div>
);
const MiniStat = ({ label, value, color }) => (
  <span style={{ fontSize:'0.72rem', color }}>{label}: {value}</span>
);
const MiniCard = ({ label, value, color, c }) => (
  <div style={{ background: c.surface2, borderRadius:7, padding:'0.5rem', textAlign:'center' }}>
    <div style={{ color, fontWeight:700 }}>{value}</div>
    <div style={{ color: c.textFaint, fontSize:'0.72rem' }}>{label}</div>
  </div>
);
const inp = (c) => ({ width:'100%', background: c.surface2, border:`1px solid ${c.border}`, borderRadius:7, padding:'0.5rem 0.75rem', color: c.text, fontSize:'0.875rem', boxSizing:'border-box' });
const emptyForm = () => ({ name:'', description:'', entryRules:'', exitRules:'', riskRules:'', setup:'', notes:'' });
