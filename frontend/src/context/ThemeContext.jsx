import { createContext, useContext, useState, useEffect } from 'react';

// ThemeContext gör temat (mörkt/ljust) tillgängligt i hela appen
// Temat sparas i localStorage så det finns kvar vid nästa besök
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Läs sparat tema vid start, annars mörkt som default
    return localStorage.getItem('tj_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('tj_theme', theme);
    // Lägg tema-klass på body så CSS-variabler kan användas globalt
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const isDark  = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

// ── Färgpalett för båda teman ──────────────────────────────────────────────
// Importeras och används i alla komponenter via useTheme() + colors(isDark)
export function colors(isDark) {
  return isDark ? {
    // Mörkt tema — samma som tidigare
    bg:          '#0f172a',
    surface:     '#1e293b',
    surface2:    '#334155',
    border:      '#334155',
    border2:     '#475569',
    text:        '#f1f5f9',
    textMuted:   '#94a3b8',
    textFaint:   '#64748b',
    accent:      '#38bdf8',
    accentBg:    'rgba(56,189,248,0.12)',
    green:       '#4ade80',
    greenBg:     'rgba(74,222,128,0.12)',
    red:         '#f87171',
    redBg:       'rgba(248,113,113,0.12)',
    purple:      '#a78bfa',
    yellow:      '#fbbf24',
    cardShadow:  '0 2px 8px rgba(0,0,0,0.4)',
  } : {
    // Ljust tema
    bg:          '#f8fafc',
    surface:     '#ffffff',
    surface2:    '#f1f5f9',
    border:      '#e2e8f0',
    border2:     '#cbd5e1',
    text:        '#0f172a',
    textMuted:   '#475569',
    textFaint:   '#94a3b8',
    accent:      '#0284c7',
    accentBg:    'rgba(2,132,199,0.08)',
    green:       '#16a34a',
    greenBg:     'rgba(22,163,74,0.08)',
    red:         '#dc2626',
    redBg:       'rgba(220,38,38,0.08)',
    purple:      '#7c3aed',
    yellow:      '#d97706',
    cardShadow:  '0 2px 8px rgba(0,0,0,0.08)',
  };
}
