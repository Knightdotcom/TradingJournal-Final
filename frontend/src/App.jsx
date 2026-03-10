import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlanProvider } from './context/PlanContext';
import { ThemeProvider } from './context/ThemeContext';

// Sidor — befintliga
import Login       from './pages/Login';
import Register    from './pages/Register';
import Dashboard   from './pages/Dashboard';
import Trades      from './pages/Trades';
import Rules       from './pages/Rules';
import Reminders   from './pages/Reminders';
import Forum       from './pages/Forum';
import ImportCsv   from './pages/ImportCsv';
import ExportPanel from './pages/ExportPanel';
import Upgrade     from './pages/Upgrade';

// Sidor — nya (Prio 2 + 3 + Features)
import TradingCalendar from './pages/TradingCalendar';
import Psychology      from './pages/Psychology';
import Statistics      from './pages/Statistics';
import PreMarket       from './pages/PreMarket';
import Goals           from './pages/Goals';
import Drawdown        from './pages/Drawdown';
import Playbook        from './pages/Playbook';
import RiskManager     from './pages/RiskManager';

// Komponenter
import Navbar    from './components/Navbar';
import RiskAlert from './components/RiskAlert';

function PrivateRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080d18' }}>
      {/* Fast sidebar till vänster */}
      <Navbar />

      {/* Huvudinnehåll — förskjutet 240px för sidebaren */}
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <RiskAlert />
        <main style={{ flex: 1, padding: '2.5rem 3rem', color: '#f9fafb' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PlanProvider>
            <Routes>
              {/* Publika routes */}
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Skyddade routes */}
              <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
              <Route path="/trades"    element={<PrivateRoute><AppLayout><Trades /></AppLayout></PrivateRoute>} />
              <Route path="/rules"     element={<PrivateRoute><AppLayout><Rules /></AppLayout></PrivateRoute>} />
              <Route path="/reminders" element={<PrivateRoute><AppLayout><Reminders /></AppLayout></PrivateRoute>} />
              <Route path="/forum"     element={<PrivateRoute><AppLayout><Forum /></AppLayout></PrivateRoute>} />
              <Route path="/import"    element={<PrivateRoute><AppLayout><ImportCsv /></AppLayout></PrivateRoute>} />
              <Route path="/export"    element={<PrivateRoute><AppLayout><ExportPanel /></AppLayout></PrivateRoute>} />
              <Route path="/upgrade"   element={<PrivateRoute><AppLayout><Upgrade /></AppLayout></PrivateRoute>} />

              {/* Nya routes */}
              <Route path="/kalender"      element={<PrivateRoute><AppLayout><TradingCalendar /></AppLayout></PrivateRoute>} />
              <Route path="/psykologi"     element={<PrivateRoute><AppLayout><Psychology /></AppLayout></PrivateRoute>} />
              <Route path="/statistik"     element={<PrivateRoute><AppLayout><Statistics /></AppLayout></PrivateRoute>} />
              <Route path="/pre-market"    element={<PrivateRoute><AppLayout><PreMarket /></AppLayout></PrivateRoute>} />
              <Route path="/mal"           element={<PrivateRoute><AppLayout><Goals /></AppLayout></PrivateRoute>} />
              <Route path="/drawdown"      element={<PrivateRoute><AppLayout><Drawdown /></AppLayout></PrivateRoute>} />
              <Route path="/playbook"      element={<PrivateRoute><AppLayout><Playbook /></AppLayout></PrivateRoute>} />
              <Route path="/riskhantering" element={<PrivateRoute><AppLayout><RiskManager /></AppLayout></PrivateRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </PlanProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
