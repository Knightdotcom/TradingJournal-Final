import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Förhindrar att sidan laddas om
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard'); // Skicka användaren till dashboard efter inloggning
    } catch {
      setError('Fel e-post eller lösenord.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>📈 TradingJournal</h1>
        <h2 style={styles.title}>Logga in</h2>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
        </form>

        <p style={styles.link}>
          Inget konto? <Link to="/register">Registrera dig</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: '#0f172a',
  },
  card: {
    background: '#1e293b', padding: '2.5rem',
    borderRadius: '12px', width: '100%', maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  },
  logo: { color: '#38bdf8', textAlign: 'center', marginBottom: '0.5rem' },
  title: { color: '#fff', textAlign: 'center', marginBottom: '1.5rem' },
  input: {
    display: 'block', width: '100%', padding: '0.75rem',
    marginBottom: '1rem', borderRadius: '8px',
    border: '1px solid #334155', background: '#0f172a',
    color: '#fff', fontSize: '1rem', boxSizing: 'border-box',
  },
  button: {
    width: '100%', padding: '0.75rem', background: '#38bdf8',
    color: '#0f172a', border: 'none', borderRadius: '8px',
    fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
  },
  error: { color: '#f87171', marginBottom: '1rem', textAlign: 'center' },
  link: { color: '#94a3b8', textAlign: 'center', marginTop: '1rem' },
};
