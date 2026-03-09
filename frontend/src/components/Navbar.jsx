import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PlanBanner from './PlanBanner';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = [
    { to: '/dashboard',    label: 'Dashboard' },
    { to: '/trades',       label: 'Trades' },
    { to: '/statistik',    label: 'Statistik' },
    { to: '/kalender',     label: 'Kalender' },
    { to: '/psykologi',    label: 'Psykologi' },
    { to: '/pre-market',   label: 'Pre-market' },
    { to: '/playbook',     label: 'Playbook' },
    { to: '/mal',          label: 'Mal' },
    { to: '/drawdown',     label: 'Drawdown' },
    { to: '/riskhantering',label: 'Risk' },
    { to: '/rules',        label: 'Regler' },
    { to: '/reminders',    label: 'Paminnelser' },
    { to: '/import',       label: 'Importera' },
    { to: '/export',       label: 'Exportera' },
    { to: '/forum',        label: 'Forum' },
  ];

  return (
    <nav style={s.nav}>
      <Link to="/dashboard" style={s.logo}>
        TradingJournal
      </Link>

      <div style={s.links}>
        {links.map(l => (
          <Link
            key={l.to}
            to={l.to}
            style={{ ...s.link, ...(location.pathname === l.to ? s.linkActive : {}) }}
          >
            {l.label}
          </Link>
        ))}
      </div>

      <div style={s.right}>
        <PlanBanner />
        <ThemeToggle />
        <button style={s.logout} onClick={handleLogout}>Logga ut</button>
      </div>
    </nav>
  );
}

const s = {
  nav:        { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', borderBottom: '1px solid #334155', padding: '0.75rem 1.5rem', flexWrap: 'wrap' },
  logo:       { color: '#38bdf8', fontWeight: '800', fontSize: '1.05rem', textDecoration: 'none', marginRight: '0.5rem', whiteSpace: 'nowrap' },
  links:      { display: 'flex', gap: '0.15rem', flexWrap: 'wrap', flex: 1 },
  link:       { color: '#94a3b8', textDecoration: 'none', padding: '0.3rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', transition: 'all 0.15s' },
  linkActive: { color: '#38bdf8', background: '#0f172a' },
  right:      { display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' },
  logout:     { background: 'none', border: '1px solid #334155', color: '#94a3b8', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' },
};
