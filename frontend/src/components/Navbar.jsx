import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme, colors } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';

// Sidebar-navigation med 3 kategorier (Squarespace-stil)
export default function Navbar() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { isDark } = useTheme();
  const c          = colors(isDark);

  const handleLogout = () => { logout(); navigate('/login'); };

  const sections = [
    {
      label: 'Trading',
      links: [
        { to: '/dashboard', label: 'Dashboard',  icon: '◈' },
        { to: '/trades',    label: 'Trades',     icon: '↕' },
        { to: '/import',    label: 'Importera',  icon: '↓' },
        { to: '/export',    label: 'Exportera',  icon: '↑' },
      ],
    },
    {
      label: 'Analys',
      links: [
        { to: '/statistik',  label: 'Statistik',  icon: '▦' },
        { to: '/kalender',   label: 'Kalender',   icon: '▦' },
        { to: '/psykologi',  label: 'Psykologi',  icon: '◉' },
        { to: '/drawdown',   label: 'Drawdown',   icon: '↘' },
      ],
    },
    {
      label: 'Planering',
      links: [
        { to: '/pre-market',    label: 'Pre-market', icon: '◎' },
        { to: '/playbook',      label: 'Playbook',   icon: '▤' },
        { to: '/mal',           label: 'Mål',        icon: '◎' },
        { to: '/riskhantering', label: 'Risk',       icon: '▲' },
        { to: '/rules',         label: 'Regler',     icon: '▣' },
      ],
    },
  ];

  const bottomLinks = [
    { to: '/reminders', label: 'Påminnelser', icon: '◷' },
    { to: '/forum',     label: 'Forum',       icon: '◈' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      background: c.sidebar,
      borderRight: `1px solid ${c.border}`,
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      overflowY: 'auto',
      zIndex: 100,
    }}>

      {/* Logo */}
      <div style={{
        padding: '1.75rem 1.5rem 1.25rem',
        borderBottom: `1px solid ${c.border}`,
      }}>
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.3rem' }}>📈</span>
          <span style={{
            color: c.text,
            fontWeight: '700',
            fontSize: '1rem',
            letterSpacing: '-0.01em',
          }}>
            TradingJournal
          </span>
        </Link>
      </div>

      {/* Nav-sektioner */}
      <nav style={{ flex: 1, padding: '1rem 0' }}>
        {sections.map((section) => (
          <div key={section.label} style={{ marginBottom: '0.25rem' }}>

            {/* Sektionsrubrik */}
            <p style={{
              color: c.textFaint,
              fontSize: '0.68rem',
              fontWeight: '600',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '0.6rem 1.5rem 0.3rem',
            }}>
              {section.label}
            </p>

            {/* Underlänkar */}
            {section.links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.5rem 1.5rem',
                  color: isActive(link.to) ? c.accent : c.textMuted,
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isActive(link.to) ? '500' : '400',
                  borderLeft: isActive(link.to)
                    ? `2px solid ${c.accent}`
                    : '2px solid transparent',
                  background: isActive(link.to) ? c.accentBg : 'transparent',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={e => {
                  if (!isActive(link.to)) {
                    e.currentTarget.style.color = c.text;
                    e.currentTarget.style.background = c.surface2;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive(link.to)) {
                    e.currentTarget.style.color = c.textMuted;
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}

        {/* Separator */}
        <div style={{ height: '1px', background: c.border, margin: '0.75rem 1.5rem' }} />

        {/* Bottenlänkar (Forum, Påminnelser) */}
        {bottomLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.5rem 1.5rem',
              color: isActive(link.to) ? c.accent : c.textMuted,
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive(link.to) ? '500' : '400',
              borderLeft: isActive(link.to)
                ? `2px solid ${c.accent}`
                : '2px solid transparent',
              background: isActive(link.to) ? c.accentBg : 'transparent',
            }}
            onMouseEnter={e => {
              if (!isActive(link.to)) {
                e.currentTarget.style.color = c.text;
                e.currentTarget.style.background = c.surface2;
              }
            }}
            onMouseLeave={e => {
              if (!isActive(link.to)) {
                e.currentTarget.style.color = c.textMuted;
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Botten: ThemeToggle + Logga ut */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: `1px solid ${c.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
      }}>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: `1px solid ${c.border2}`,
            color: c.textMuted,
            padding: '0.4rem 0.85rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: '500',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = c.red; e.currentTarget.style.borderColor = c.red; }}
          onMouseLeave={e => { e.currentTarget.style.color = c.textMuted; e.currentTarget.style.borderColor = c.border2; }}
        >
          Logga ut
        </button>
      </div>
    </aside>
  );
}
