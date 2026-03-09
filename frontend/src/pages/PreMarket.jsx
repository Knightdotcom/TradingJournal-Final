import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTheme, colors } from '../context/ThemeContext';

// Standardfrågor som skapas automatiskt för nya användare
const DEFAULT_QUESTIONS = [
  'Har du sovit minst 7 timmar?',
  'Är du känslomässigt neutral — inte uppjagad eller stressad?',
  'Har du läst marknadsöversikten för idag?',
  'Vet du exakt vilka setups du letar efter idag?',
  'Är din riskgräns för dagen tydlig?',
  'Följer du din tradingplan — inte hämnd eller FOMO?',
];

export default function PreMarket() {
  const { isDark }  = useTheme();
  const c           = colors(isDark);

  const [templates, setTemplates] = useState([]);
  const [answers,   setAnswers]   = useState({});
  const [notes,     setNotes]     = useState('');
  const [allPassed, setAllPassed] = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [newQ,      setNewQ]      = useState('');
  const [adding,    setAdding]    = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      // Hämta mallar — om inga finns, skapa standardfrågorna
      const tmplRes = await api.get('/checklist/templates');
      let tmpl = tmplRes.data;

      if (tmpl.length === 0) {
        for (let i = 0; i < DEFAULT_QUESTIONS.length; i++) {
          await api.post('/checklist/templates', { question: DEFAULT_QUESTIONS[i], sortOrder: i });
        }
        const fresh = await api.get('/checklist/templates');
        tmpl = fresh.data;
      }
      setTemplates(tmpl);

      // Hämta dagens svar
      const todayRes = await api.get('/checklist/today');
      setAnswers(todayRes.data.answers || {});
      setNotes(todayRes.data.notes || '');
      setAllPassed(todayRes.data.allPassed || false);
    } catch {}
  };

  const toggle = (id) => {
    const updated = { ...answers, [id]: !answers[id] };
    setAnswers(updated);
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      const res = await api.post('/checklist/today', {
        date: new Date().toISOString(),
        answers,
        notes
      });
      setAllPassed(res.data.allPassed);
      setSaved(true);
    } catch {}
  };

  const addQuestion = async () => {
    if (!newQ.trim()) return;
    await api.post('/checklist/templates', { question: newQ, sortOrder: templates.length });
    setNewQ('');
    setAdding(false);
    loadData();
  };

  const deleteQuestion = async (id) => {
    await api.delete(`/checklist/templates/${id}`);
    loadData();
  };

  const passedCount = templates.filter(t => answers[t.id]).length;
  const allGreen    = passedCount === templates.length && templates.length > 0;

  return (
    <div style={{ maxWidth: 620 }}>
      <h2 style={{ color: c.text, marginBottom: '0.4rem' }}>✅ Pre-market checklista</h2>
      <p style={{ color: c.textMuted, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Slutför checklistan innan du börjar handla. Handla inte om inte alla rutor är gröna.
      </p>

      {/* Statusbanner */}
      <div style={{
        background: allGreen ? c.greenBg : c.redBg,
        border: `1px solid ${allGreen ? c.green : c.red}`,
        borderRadius: 10, padding: '0.9rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>{allGreen ? '🟢' : '🔴'}</span>
        <div>
          <p style={{ color: allGreen ? c.green : c.red, fontWeight: 700, margin: 0 }}>
            {allGreen ? 'Du är redo att handla!' : 'Inte redo ännu'}
          </p>
          <p style={{ color: c.textMuted, fontSize: '0.82rem', margin: 0 }}>
            {passedCount} av {templates.length} kriterier uppfyllda
          </p>
        </div>
      </div>

      {/* Frågelista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
        {templates.map(t => {
          const checked = !!answers[t.id];
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: c.surface, border: `1px solid ${checked ? c.green : c.border}`,
              borderRadius: 8, padding: '0.75rem 1rem',
              cursor: 'pointer', transition: 'all 0.15s',
              background: checked ? (isDark ? 'rgba(74,222,128,0.08)' : 'rgba(22,163,74,0.06)') : c.surface
            }} onClick={() => toggle(t.id)}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                border: `2px solid ${checked ? c.green : c.border2}`,
                background: checked ? c.green : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s'
              }}>
                {checked && <span style={{ color: '#0f172a', fontSize: '0.75rem', fontWeight: 'bold' }}>✓</span>}
              </div>
              <span style={{ color: checked ? c.text : c.textMuted, flex: 1, fontSize: '0.9rem' }}>
                {t.question}
              </span>
              <button onClick={e => { e.stopPropagation(); deleteQuestion(t.id); }}
                style={{ background: 'none', border: 'none', color: c.textFaint, cursor: 'pointer', fontSize: '0.85rem', padding: '0 0.2rem' }}>
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Lägg till fråga */}
      {adding ? (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input value={newQ} onChange={e => setNewQ(e.target.value)}
            placeholder="Skriv din fråga..."
            onKeyDown={e => e.key === 'Enter' && addQuestion()}
            style={{ flex: 1, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 7, padding: '0.5rem 0.75rem', color: c.text, fontSize: '0.875rem' }} />
          <button onClick={addQuestion} style={{ padding: '0.5rem 1rem', background: c.accent, color: '#0f172a', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>Lägg till</button>
          <button onClick={() => setAdding(false)} style={{ padding: '0.5rem 0.75rem', background: c.surface2, border: `1px solid ${c.border}`, borderRadius: 7, color: c.textMuted, cursor: 'pointer' }}>Avbryt</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ background: 'none', border: `1px dashed ${c.border2}`, borderRadius: 8, padding: '0.5rem 1rem', color: c.textMuted, cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1rem', width: '100%' }}>
          + Lägg till fråga
        </button>
      )}

      {/* Anteckningar */}
      <label style={{ display: 'block', color: c.textMuted, fontSize: '0.82rem', marginBottom: '0.35rem' }}>
        Dagens tankar & marknadsöversikt (valfritt)
      </label>
      <textarea value={notes} onChange={e => { setNotes(e.target.value); setSaved(false); }}
        rows={4} placeholder="Vad ser du i marknaden idag? Vad är din plan?"
        style={{ width: '100%', background: c.surface, border: `1px solid ${c.border}`, borderRadius: 8, padding: '0.6rem 0.75rem', color: c.text, fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box', marginBottom: '1rem' }} />

      <button onClick={handleSave} style={{ width: '100%', padding: '0.85rem', background: c.accent, color: '#0f172a', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
        {saved ? '✓ Sparad!' : '💾 Spara checklista'}
      </button>
    </div>
  );
}
