import { useTheme } from '../context/ThemeContext';

// Enkel toggle-knapp för mörkt/ljust tema
// Lägg i Navbar bredvid logout-knappen
export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Byt till ljust tema' : 'Byt till mörkt tema'}
      style={{
        background: 'none',
        border: '1px solid',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderRadius: '8px',
        padding: '0.35rem 0.65rem',
        cursor: 'pointer',
        fontSize: '1rem',
        lineHeight: 1,
        transition: 'all 0.2s',
        color: isDark ? '#94a3b8' : '#64748b',
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
