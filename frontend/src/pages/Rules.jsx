import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Rules() {
  const [rules, setRules] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchRules = () => api.get('/rules').then(res => setRules(res.data));

  useEffect(() => { fetchRules(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/rules', { title, description });
    setTitle(''); setDescription(''); setShowForm(false);
    fetchRules();
  };

  const deleteRule = async (id) => {
    if (window.confirm('Ta bort regeln?')) {
      await api.delete(`/rules/${id}`);
      fetchRules();
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.heading}>Mina Tradingregler</h1>
          <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Avbryt' : '+ Ny regel'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <input style={styles.input} placeholder="Regelns titel, t.ex. 'Max 2% risk per trade'"
              value={title} onChange={e => setTitle(e.target.value)} required />
            <textarea style={styles.textarea} placeholder="Beskriv regeln mer ingående..."
              value={description} onChange={e => setDescription(e.target.value)} required />
            <button style={styles.addBtn} type="submit">Spara regel</button>
          </form>
        )}

        {rules.length === 0
          ? <p style={styles.muted}>Inga regler ännu. Sätt upp dina tradingregler!</p>
          : (
            <div style={styles.rulesList}>
              {rules.map(r => (
                <div key={r.id} style={styles.ruleCard}>
                  <div style={styles.ruleHeader}>
                    <span style={styles.ruleIcon}>📌</span>
                    <h3 style={styles.ruleTitle}>{r.title}</h3>
                    <button onClick={() => deleteRule(r.id)} style={styles.deleteBtn}>🗑</button>
                  </div>
                  <p style={styles.ruleDesc}>{r.description}</p>
                  <p style={styles.ruleDate}>
                    Skapad: {new Date(r.createdAt).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a' },
  content: { padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  heading: { color: '#fff', margin: 0 },
  muted: { color: '#94a3b8' },
  addBtn: { background: '#38bdf8', color: '#0f172a', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  form: { background: '#1e293b', padding: '1.5rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  input: { padding: '0.65rem', borderRadius: '7px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.95rem' },
  textarea: { padding: '0.65rem', borderRadius: '7px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.95rem', minHeight: '100px' },
  rulesList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  ruleCard: { background: '#1e293b', borderRadius: '10px', padding: '1.25rem', border: '1px solid #334155' },
  ruleHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' },
  ruleIcon: { fontSize: '1.2rem' },
  ruleTitle: { color: '#fff', margin: 0, flex: 1 },
  ruleDesc: { color: '#94a3b8', margin: 0, fontSize: '0.9rem' },
  ruleDate: { color: '#475569', fontSize: '0.8rem', marginTop: '0.5rem' },
  deleteBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' },
};
