import { useState, useEffect } from 'react';
import api from '../services/api';

const EMOTION_TAGS = [
  { tag: 'Disciplined',   emoji: '🎯', color: '#4ade80' },
  { tag: 'FOMO',          emoji: '😰', color: '#f87171' },
  { tag: 'Revenge',       emoji: '😤', color: '#f87171' },
  { tag: 'Greed',         emoji: '🤑', color: '#fbbf24' },
  { tag: 'Fear',          emoji: '😨', color: '#fbbf24' },
  { tag: 'Boredom',       emoji: '😴', color: '#94a3b8' },
  { tag: 'Overconfident', emoji: '😎', color: '#fb923c' },
  { tag: 'Hesitant',      emoji: '🤔', color: '#a78bfa' },
];

// BUG FIX: defaultForm använde 0 för skalvärden, men backend kräver 1-5.
// Ändrat till null — spara-knappen är nu disabled tills alla obligatoriska fält är ifyllda.
function defaultForm() {
  return {
    moodBefore: null, confidenceBefore: null, focusBefore: null,
    moodAfter: null, disciplineScore: null,
    emotionTag: '', preTradeNote: '', postTradeNote: '',
    brokenRuleIds: [], brokenRuleNote: '',
  };
}

// Alla fem skalvärden måste vara satta (1-5) för att spara
function isFormValid(form) {
  return (
    form.moodBefore >= 1 &&
    form.confidenceBefore >= 1 &&
    form.focusBefore >= 1 &&
    form.moodAfter >= 1 &&
    form.disciplineScore >= 1
  );
}

export default function Psychology() {
  const [trades,   setTrades]   = useState([]);
  const [rules,    setRules]    = useState([]);
  const [stats,    setStats]    = useState(null);
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState(defaultForm());
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [view,     setView]     = useState('list');

  useEffect(() => {
    api.get('/trades').then(r => setTrades(r.data)).catch(() => {});
    api.get('/rules').then(r => setRules(r.data)).catch(() => {});
    api.get('/psychology/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const selectTrade = async (trade) => {
    setSelected(trade);
    setSaved(false);
    try {
      const res = await api.get(`/trades/${trade.id}/psychology`);
      const p   = res.data;
      setForm({
        moodBefore:       p.moodBefore,
        confidenceBefore: p.confidenceBefore,
        focusBefore:      p.focusBefore,
        moodAfter:        p.moodAfter,
        disciplineScore:  p.disciplineScore,
        emotionTag:       p.emotionTag || '',
        preTradeNote:     p.preTradeNote || '',
        postTradeNote:    p.postTradeNote || '',
        brokenRuleIds:    p.brokenRuleIds || [],
        brokenRuleNote:   p.brokenRuleNote || '',
      });
    } catch {
      setForm(defaultForm());
    }
  };

  const toggleRule = (id) => {
    setForm(f => ({
      ...f,
      brokenRuleIds: f.brokenRuleIds.includes(id)
        ? f.brokenRuleIds.filter(r => r !== id)
        : [...f.brokenRuleIds, id]
    }));
  };

  const handleSave = async () => {
    if (!selected || !isFormValid(form)) return;
    setSaving(true);
    try {
      await api.put(`/trades/${selected.id}/psychology`, form);
      setSaved(true);
      const res = await api.get('/psychology/stats');
      setStats(res.data);
    } catch {
      alert('Kunde inte spara. Försök igen.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.wrap}>
      <div style={s.topRow}>
        <h2 style={s.heading}>🧠 Psykologi-journal</h2>
        <div style={s.tabs}>
          <button style={{...s.tab, ...(view==='list' ? s.tabActive : {})}} onClick={() => setView('list')}>Journalföring</button>
          <button style={{...s.tab, ...(view==='stats' ? s.tabActive : {})}} onClick={() => setView('stats')}>Statistik</button>
        </div>
      </div>

      {view === 'stats' ? (
        <PsychStats stats={stats} rules={rules} />
      ) : (
        <div style={s.layout}>
          <div style={s.tradeList}>
            <p style={s.listLabel}>Välj en trade att journalföra</p>
            {trades.length === 0 && (
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Inga trades ännu.</p>
            )}
            {trades.map(t => (
              <div key={t.id}
                style={{ ...s.tradeItem, ...(selected?.id === t.id ? s.tradeItemSelected : {}) }}
                onClick={() => selectTrade(t)}>
                <div style={s.tradeTop}>
                  <span style={s.symbol}>{t.symbol}</span>
                  <span style={{ color: (t.profitLoss ?? 0) >= 0 ? '#4ade80' : '#f87171', fontSize:'0.82rem', fontWeight:'600' }}>
                    {t.profitLoss != null ? `${t.profitLoss >= 0 ? '+' : ''}${t.profitLoss.toFixed(2)}` : 'Öppen'}
                  </span>
                </div>
                <span style={s.tradeDate}>{new Date(t.entryDate).toLocaleDateString('sv-SE')}</span>
              </div>
            ))}
          </div>

          <div style={s.formArea}>
            {!selected ? (
              <div style={s.placeholder}>
                <span style={{ fontSize: '2.5rem' }}>👈</span>
                <p style={{ color: '#64748b' }}>Välj en trade till vänster</p>
              </div>
            ) : (
              <>
                <div style={s.formHeader}>
                  <h3 style={s.formTitle}>{selected.symbol} — {new Date(selected.entryDate).toLocaleDateString('sv-SE')}</h3>
                  {saved && <span style={s.savedBadge}>✓ Sparad</span>}
                </div>

                <Section title="Innan traden">
                  <ScaleRow label="Humör" value={form.moodBefore} onChange={v => setForm(f => ({...f, moodBefore: v}))} />
                  <ScaleRow label="Självförtroende i setuppet" value={form.confidenceBefore} onChange={v => setForm(f => ({...f, confidenceBefore: v}))} />
                  <ScaleRow label="Fokus & koncentration" value={form.focusBefore} onChange={v => setForm(f => ({...f, focusBefore: v}))} />
                  <label style={s.label}>Tankar & analys innan traden</label>
                  <textarea style={s.textarea} rows={3} value={form.preTradeNote}
                    onChange={e => setForm(f => ({...f, preTradeNote: e.target.value}))}
                    placeholder="Varför tog du den här traden? Vad var setuppet?" />
                </Section>

                <Section title="Vilken känsla drev traden?">
                  <div style={s.emotionGrid}>
                    {EMOTION_TAGS.map(e => (
                      <button key={e.tag}
                        style={{ ...s.emotionBtn, ...(form.emotionTag === e.tag ? { borderColor: e.color, background: `${e.color}22` } : {}) }}
                        onClick={() => setForm(f => ({...f, emotionTag: f.emotionTag === e.tag ? '' : e.tag}))}>
                        <span>{e.emoji}</span>
                        <span style={{ fontSize: '0.75rem', color: form.emotionTag === e.tag ? e.color : '#94a3b8' }}>{e.tag}</span>
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Bröt du mot några regler?">
                  {rules.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Du har inga regler skapade ännu.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {rules.map(r => (
                        <label key={r.id} style={s.ruleCheck}>
                          <input type="checkbox" checked={form.brokenRuleIds.includes(r.id)}
                            onChange={() => toggleRule(r.id)} style={{ accentColor: '#f87171' }} />
                          <span style={{ color: form.brokenRuleIds.includes(r.id) ? '#f87171' : '#cbd5e1', fontSize: '0.875rem' }}>
                            {r.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  {form.brokenRuleIds.length > 0 && (
                    <>
                      <label style={{...s.label, marginTop: '0.75rem'}}>Varför bröt du mot dem?</label>
                      <textarea style={s.textarea} rows={2} value={form.brokenRuleNote}
                        onChange={e => setForm(f => ({...f, brokenRuleNote: e.target.value}))}
                        placeholder="Vad hände? Varför avvek du från planen?" />
                    </>
                  )}
                </Section>

                <Section title="Efter traden">
                  <ScaleRow label="Humör efteråt" value={form.moodAfter} onChange={v => setForm(f => ({...f, moodAfter: v}))} />
                  <ScaleRow label="Disciplin — följde du din plan?" value={form.disciplineScore} onChange={v => setForm(f => ({...f, disciplineScore: v}))} />
                  <label style={s.label}>Reflektion & lärdomar</label>
                  <textarea style={s.textarea} rows={3} value={form.postTradeNote}
                    onChange={e => setForm(f => ({...f, postTradeNote: e.target.value}))}
                    placeholder="Vad lärde du dig? Vad skulle du göra annorlunda?" />
                </Section>

                {/* BUG FIX: Knappen disabled + förklarande text om formuläret inte är komplett */}
                {!isFormValid(form) && (
                  <p style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    ⚠️ Fyll i alla fem skalvärden (Humör, Självförtroende, Fokus, Humör efter, Disciplin) för att spara.
                  </p>
                )}
                <button style={{ ...s.saveBtn, opacity: isFormValid(form) ? 1 : 0.5 }}
                  onClick={handleSave}
                  disabled={saving || !isFormValid(form)}>
                  {saving ? '⏳ Sparar...' : '💾 Spara psykologi-journal'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>{title}</h4>
      {children}
    </div>
  );
}

function ScaleRow({ label, value, onChange }) {
  const labels = ['', 'Väldigt dålig', 'Dålig', 'Ok', 'Bra', 'Utmärkt'];
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>{label}</span>
        <span style={{ color: '#38bdf8', fontSize: '0.82rem' }}>
          {value >= 1 ? labels[value] : '– välj ett värde'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            flex: 1, height: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer',
            background: value >= 1 && n <= value
              ? (value <= 2 ? '#f87171' : value === 3 ? '#fbbf24' : '#4ade80')
              : '#334155',
            transition: 'background 0.15s'
          }} />
        ))}
      </div>
    </div>
  );
}

function PsychStats({ stats, rules }) {
  if (!stats || stats.message) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
      <p style={{ fontSize: '2rem' }}>📊</p>
      <p>Ingen psykologidata ännu. Börja journalföra dina trades!</p>
    </div>
  );

  const ruleMap = Object.fromEntries((rules || []).map(r => [r.id, r.title]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={s.statsGrid}>
        <StatCard label="Snitt disciplin"       value={`${stats.avgDisciplineScore?.toFixed(1)}/5`} color="#4ade80" />
        <StatCard label="Snitt humör innan"     value={`${stats.avgMoodBefore?.toFixed(1)}/5`}     color="#38bdf8" />
        <StatCard label="Snitt humör efter"     value={`${stats.avgMoodAfter?.toFixed(1)}/5`}      color="#a78bfa" />
        <StatCard label="Snitt självförtroende" value={`${stats.avgConfidence?.toFixed(1)}/5`}     color="#fbbf24" />
        <StatCard label="Trades med 5/5 disciplin" value={stats.tradesWith100Discipline}           color="#4ade80" />
        <StatCard label="Trades med regelbrott"    value={stats.tradesWithRuleBreaks}              color="#f87171" />
      </div>

      {stats.emotionDistribution?.length > 0 && (
        <div style={s.statsBox}>
          <h3 style={s.statsBoxTitle}>😤 Känslofördelning</h3>
          {stats.emotionDistribution.map(e => {
            const tag = EMOTION_TAGS.find(t => t.tag === e.emotion);
            return (
              <div key={e.emotion} style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{tag?.emoji ?? '•'}</span>
                <span style={{ color: '#cbd5e1', flex: 1, fontSize: '0.875rem' }}>{e.emotion}</span>
                <span style={{ color: tag?.color ?? '#94a3b8', fontWeight: '600' }}>{e.count} trades</span>
              </div>
            );
          })}
        </div>
      )}

      {stats.mostBrokenRuleIds?.length > 0 && (
        <div style={s.statsBox}>
          <h3 style={s.statsBoxTitle}>⚠️ Regler du bryter mest mot</h3>
          {stats.mostBrokenRuleIds.map(r => (
            <div key={r.ruleId} style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}>
              <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                {ruleMap[r.ruleId] ?? `Regel #${r.ruleId}`}
              </span>
              <span style={{ color: '#f87171', fontWeight: '600' }}>{r.count}×</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
      <div style={{ color, fontSize: '1.4rem', fontWeight: 'bold' }}>{value}</div>
      <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.25rem' }}>{label}</div>
    </div>
  );
}

const s = {
  wrap:              { maxWidth: '1000px' },
  topRow:            { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'0.75rem' },
  heading:           { color:'#fff', margin:0 },
  tabs:              { display:'flex', gap:'0.4rem' },
  tab:               { padding:'0.4rem 1rem', background:'#1e293b', border:'1px solid #334155', borderRadius:'6px', color:'#94a3b8', cursor:'pointer', fontSize:'0.875rem' },
  tabActive:         { borderColor:'#38bdf8', color:'#38bdf8' },
  layout:            { display:'grid', gridTemplateColumns:'240px 1fr', gap:'1.5rem' },
  tradeList:         { background:'#1e293b', borderRadius:'10px', padding:'1rem', overflowY:'auto', maxHeight:'75vh' },
  listLabel:         { color:'#64748b', fontSize:'0.78rem', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em' },
  tradeItem:         { padding:'0.6rem 0.75rem', borderRadius:'7px', cursor:'pointer', marginBottom:'0.3rem', border:'1px solid transparent', transition:'all 0.15s' },
  tradeItemSelected: { background:'#0f172a', borderColor:'#38bdf8' },
  tradeTop:          { display:'flex', justifyContent:'space-between', alignItems:'center' },
  symbol:            { color:'#fff', fontWeight:'600', fontSize:'0.875rem' },
  tradeDate:         { color:'#64748b', fontSize:'0.75rem', marginTop:'2px' },
  formArea:          { background:'#1e293b', borderRadius:'10px', padding:'1.5rem', overflowY:'auto', maxHeight:'75vh' },
  placeholder:       { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'300px', gap:'0.75rem' },
  formHeader:        { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' },
  formTitle:         { color:'#fff', margin:0, fontSize:'1.1rem' },
  savedBadge:        { background:'rgba(74,222,128,0.15)', color:'#4ade80', padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.8rem' },
  label:             { display:'block', color:'#94a3b8', fontSize:'0.82rem', marginBottom:'0.35rem' },
  textarea:          { width:'100%', background:'#0f172a', border:'1px solid #334155', borderRadius:'7px', color:'#e2e8f0', padding:'0.6rem 0.75rem', fontSize:'0.875rem', resize:'vertical', boxSizing:'border-box' },
  emotionGrid:       { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.5rem' },
  emotionBtn:        { background:'#0f172a', border:'1px solid #334155', borderRadius:'8px', padding:'0.5rem 0.25rem', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.25rem', fontSize:'1.2rem', transition:'all 0.15s' },
  ruleCheck:         { display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' },
  saveBtn:           { width:'100%', padding:'0.85rem', background:'#38bdf8', color:'#0f172a', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer', fontSize:'0.95rem', marginTop:'0.5rem' },
  statsGrid:         { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:'0.75rem' },
  statsBox:          { background:'#1e293b', border:'1px solid #334155', borderRadius:'10px', padding:'1.25rem' },
  statsBoxTitle:     { color:'#fff', fontSize:'0.95rem', marginBottom:'1rem' },
};
