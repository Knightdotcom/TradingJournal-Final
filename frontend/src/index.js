import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Ladda Inter-font från Google Fonts (Squarespace-känsla)
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
document.head.appendChild(fontLink);

// Global CSS-reset + Squarespace-inspirerade basregler
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #080d18;
    color: #f9fafb;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  a { color: #38bdf8; text-decoration: none; }
  a:hover { opacity: 0.85; }

  /* Tunn, diskret scrollbar */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }

  /* Smooth transitions på alla interaktiva element */
  button, a, input, select, textarea {
    transition: all 0.15s ease;
  }

  /* Förbättrad input-styling */
  input, select, textarea {
    font-family: inherit;
  }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
