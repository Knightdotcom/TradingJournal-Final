import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchReminders = () => api.get('/reminders').then(res => setReminders(res.data));

  useEffect(() => { fetchReminders(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/reminders', { title, message, reminderTime });
    setTitle(''); setMessage(''); setReminderTime(''); setShowForm(false);
    fetchReminders();
  };

  const deleteReminder = async (id) => {
    if (window.confirm('Ta bort påminnelsen?')) {
      await api.delete(`/reminders/${id}`);
      fetchReminders();
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.heading}>Påminnelser</h1>
          <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Avbryt' : '+ Ny påminnelse'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <input style={styles.input} placeholder="Titel, t.ex. 'Kolla marknadens öppning'"
              value={title} onChange={e => setTitle(e.target.value)} required />
            <textarea style={styles.textarea} placeholder="Meddelande..."
              value={message} onChange={e => setMessage(e.target.value)} required />
            <label style={styles.label}>
              Tid för påminnelse:
              <input style={{ ...styles.input, marginTop: '0.4rem' }} type="time"
                value={reminderTime} onChange={e => setReminderTime(e.target.value)} required />
            </label>
            <button style={styles.addBtn} type="submit">Spara påminnelse</button>
          </form>
        )}

        {reminders.length === 0
          ? <p style={styles.muted}>Inga påminnelser ännu.</p>
          : (
            <div style={styles.list}>
              {reminders.map(r => (
                <div key={r.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.icon}>🔔</span>
                    <div style={{ flex: 1 }}>
                      <h3 style={styles.cardTitle}>{r.title}</h3>
                      <p style={styles.cardMessage}>{r.message}</p>
                    </div>
                    <div style={styles.timeTag}>{r.reminderTime}</div>
                    <button onClick={() => deleteReminder(r.id)} style={styles.deleteBtn}>🗑</button>
                  </div>
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
  input: { padding: '0.65rem', borderRadius: '7px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' },
  textarea: { padding: '0.65rem', borderRadius: '7px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.95rem', minHeight: '80px' },
  label: { color: '#94a3b8', fontSize: '0.9rem', display: 'flex', flexDirection: 'column' },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  card: { background: '#1e293b', borderRadius: '10px', padding: '1.25rem', border: '1px solid #334155' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem' },
  icon: { fontSize: '1.3rem' },
  cardTitle: { color: '#fff', margin: '0 0 0.25rem' },
  cardMessage: { color: '#94a3b8', margin: 0, fontSize: '0.9rem' },
  timeTag: { background: '#0f172a', color: '#38bdf8', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', whiteSpace: 'nowrap' },
  deleteBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' },
};
