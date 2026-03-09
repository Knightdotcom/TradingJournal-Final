import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/login'); // Skicka till login efter registrering
    } catch {
      setError('Kunde inte skapa konto. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>📈 TradingJournal</h1>
        <h2 style={styles.title}>Skapa konto</h2>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input style={styles.input} type="text" placeholder="Användarnamn"
            value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input style={styles.input} type="email" placeholder="E-post"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="Lösenord (min 6 tecken)"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Skapar konto...' : 'Registrera'}
          </button>
        </form>

        <p style={styles.link}>
          Har du redan ett konto? <Link to="/login">Logga in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center', background: '#0f172a',
  },
  card: {
    background: '#1e293b', padding: '2.5rem', borderRadius: '12px',
    width: '100%', maxWidth: '400px', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  },
  logo: { color: '#38bdf8', textAlign: 'center', marginBottom: '0.5rem' },
  title: { color: '#fff', textAlign: 'center', marginBottom: '1.5rem' },
  input: {
    display: 'block', width: '100%', padding: '0.75rem', marginBottom: '1rem',
    borderRadius: '8px', border: '1px solid #334155', background: '#0f172a',
    color: '#fff', fontSize: '1rem', boxSizing: 'border-box',
  },
  button: {
    width: '100%', padding: '0.75rem', background: '#38bdf8', color: '#0f172a',
    border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
  },
  error: { color: '#f87171', marginBottom: '1rem', textAlign: 'center' },
  link: { color: '#94a3b8', textAlign: 'center', marginTop: '1rem' },
};
