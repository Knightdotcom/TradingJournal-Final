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
    // Mörkt tema — Squarespace-inspirerat: djupare, renare, mer professionellt
    bg:          '#080d18',
    sidebar:     '#0d1220',
    surface:     '#111827',
    surface2:    '#1f2937',
    border:      'rgba(255,255,255,0.07)',
    border2:     'rgba(255,255,255,0.13)',
    text:        '#f9fafb',
    textMuted:   '#9ca3af',
    textFaint:   '#6b7280',
    accent:      '#38bdf8',
    accentBg:    'rgba(56,189,248,0.10)',
    green:       '#4ade80',
    greenBg:     'rgba(74,222,128,0.10)',
    red:         '#f87171',
    redBg:       'rgba(248,113,113,0.10)',
    purple:      '#a78bfa',
    yellow:      '#fbbf24',
    cardShadow:  '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
  } : {
    // Ljust tema — rent Squarespace-vitt
    bg:          '#f5f5f5',
    sidebar:     '#ffffff',
    surface:     '#ffffff',
    surface2:    '#f9fafb',
    border:      '#e5e7eb',
    border2:     '#d1d5db',
    text:        '#111827',
    textMuted:   '#6b7280',
    textFaint:   '#9ca3af',
    accent:      '#0284c7',
    accentBg:    'rgba(2,132,199,0.08)',
    green:       '#16a34a',
    greenBg:     'rgba(22,163,74,0.08)',
    red:         '#dc2626',
    redBg:       'rgba(220,38,38,0.08)',
    purple:      '#7c3aed',
    yellow:      '#d97706',
    cardShadow:  '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)',
  };
}
