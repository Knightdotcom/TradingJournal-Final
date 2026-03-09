import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTheme, colors } from '../context/ThemeContext';

const GOAL_TYPES = [
  { value: 0, label: 'P&L-mål',           unit: 'kr',     example: 'Tjäna 5 000 kr i mars' },
  { value: 1, label: 'Win rate-mål',       unit: '%',      example: 'Nå 60% win rate' },
  { value: 2, label: 'Antal trades',       unit: 'trades', example: 'Ta 50 trades i månaden' },
  { value: 3, label: 'Max förlustretar',   unit: 'i rad',  example: 'Max 3 förluster i rad' },
];

export default function Goals() {
  const { isDark } = useTheme();
  const c          = colors(isDark);
  const [goals, setGoals]   = useState([]);
  const [form, setForm]     = useState({ title:'', type:0, targetValue:'', startDate: today(), endDate: monthEnd() });
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadGoals(); }, []);
  const loadGoals = () => api.get('/goals').then(r => setGoals(r.data)).catch(() => {});

  const handleCreate = async () => {
    if (!form.title || !form.targetValue) return;
    await api.post('/goals', { ...form, targetValue: parseFloat(form.targetValue) });
    setAdding(false);
    setForm({ title:'', type:0, targetValue:'', startDate: today(), endDate: monthEnd() });
    loadGoals();
  };

  const handleDelete = async (id) => {
    await api.delete(`/goals/${id}`);
    loadGoals();
  };

  const active   = goals.filter(g => !g.isExpired && !g.isCompleted);
  const expired  = goals.filter(g => g.isExpired || g.isCompleted);

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h2 style={{ color: c.text, margin: 0 }}>🎯 Mål & Milstolpar</h2>
        <button onClick={() => setAdding(a => !a)}
          style={{ padding:'0.5rem 1rem', background: c.accent, color:'#0f172a', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' }}>
          {adding ? '✕ Avbryt' : '+ Nytt mål'}
        </button>
      </div>

      {/* Skapa mål */}
      {adding && (
        <div style={{ background: c.surface, border:`1px solid ${c.border}`, borderRadius:10, padding:'1.25rem', marginBottom:'1.5rem' }}>
          <h3 style={{ color: c.text, marginBottom:'1rem', fontSize:'1rem' }}>Skapa nytt mål</h3>
          <div style={{ display:'grid', gap:'0.75rem' }}>
            <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
              placeholder="Titel, t.ex. 'Tjäna 5000 kr i april'"
              style={inputStyle(c)} />
            <select value={form.type} onChange={e => setForm(f=>({...f,type:+e.target.value}))}
              style={inputStyle(c)}>
              {GOAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <input value={form.targetValue} onChange={e => setForm(f=>({...f,targetValue:e.target.value}))}
                type="number" placeholder={`Målvärde (${GOAL_TYPES[form.type]?.unit})`}
                style={{ ...inputStyle(c), flex:1 }} />
            </div>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <div style={{ flex:1 }}>
                <label style={{ color: c.textMuted, fontSize:'0.78rem' }}>Startdatum</label>
                <input type="date" value={form.startDate} onChange={e => setForm(f=>({...f,startDate:e.target.value}))} style={inputStyle(c)} />
              </div>
              <div style={{ flex:1 }}>
                <label style={{ color: c.textMuted, fontSize:'0.78rem' }}>Slutdatum</label>
                <input type="date" value={form.endDate} onChange={e => setForm(f=>({...f,endDate:e.target.value}))} style={inputStyle(c)} />
              </div>
            </div>
            <button onClick={handleCreate}
              style={{ padding:'0.75rem', background: c.accent, color:'#0f172a', border:'none', borderRadius:8, fontWeight:'bold', cursor:'pointer' }}>
              Skapa mål
            </button>
          </div>
        </div>
      )}

      {/* Aktiva mål */}
      {active.length === 0 && !adding && (
        <div style={{ textAlign:'center', padding:'3rem', color: c.textFaint }}>
          <p style={{ fontSize:'2rem' }}>🎯</p>
          <p>Inga aktiva mål — sätt ditt första mål nu!</p>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:'1rem', marginBottom:'2rem' }}>
        {active.map(g => <GoalCard key={g.id} goal={g} c={c} onDelete={handleDelete} />)}
      </div>

      {/* Avslutade/Utgångna mål */}
      {expired.length > 0 && (
        <>
          <h3 style={{ color: c.textMuted, fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.75rem' }}>Avslutade mål</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', opacity: 0.6 }}>
            {expired.map(g => <GoalCard key={g.id} goal={g} c={c} onDelete={handleDelete} />)}
          </div>
        </>
      )}
    </div>
  );
}

function GoalCard({ goal, c, onDelete }) {
  const typeInfo = GOAL_TYPES[goal.type] || GOAL_TYPES[0];
  const pct      = goal.progressPct;
  const color    = pct >= 100 ? c.green : pct >= 60 ? c.yellow : c.accent;

  return (
    <div style={{ background: c.surface, border:`1px solid ${c.border}`, borderRadius:10, padding:'1.25rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
        <div>
          <h3 style={{ color: c.text, margin:'0 0 0.2rem', fontSize:'1rem' }}>{goal.title}</h3>
          <p style={{ color: c.textMuted, fontSize:'0.8rem', margin:0 }}>
            {typeInfo.label} · {goal.daysLeft > 0 ? `${goal.daysLeft} dagar kvar` : 'Avslutad'}
          </p>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
          <span style={{ color, fontWeight:'bold', fontSize:'1rem' }}>{pct}%</span>
          <button onClick={() => onDelete(goal.id)}
            style={{ background:'none', border:'none', color: c.textFaint, cursor:'pointer', fontSize:'1rem' }}>🗑</button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height:8, background: c.surface2, borderRadius:999, overflow:'hidden', marginBottom:'0.5rem' }}>
        <div style={{ width:`${pct}%`, height:'100%', background: color, borderRadius:999, transition:'width 0.4s ease' }} />
      </div>

      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <span style={{ color: c.textMuted, fontSize:'0.8rem' }}>
          {goal.currentValue.toFixed(goal.type === 1 ? 1 : 0)} {typeInfo.unit}
        </span>
        <span style={{ color: c.textFaint, fontSize:'0.8rem' }}>
          Mål: {goal.targetValue} {typeInfo.unit}
        </span>
      </div>
    </div>
  );
}

const inputStyle = (c) => ({
  width:'100%', background: c.surface2, border:`1px solid ${c.border}`,
  borderRadius:7, padding:'0.5rem 0.75rem', color: c.text,
  fontSize:'0.875rem', boxSizing:'border-box'
});

const today    = () => new Date().toISOString().split('T')[0];
const monthEnd = () => {
  const d = new Date(); d.setMonth(d.getMonth()+1); d.setDate(0);
  return d.toISOString().split('T')[0];
};
