import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
  const [planStatus, setPlanStatus] = useState(null);
  const [loading, setLoading]       = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/plan/status');
      setPlanStatus(res.data);
    } catch {
      // Tyst fel — användaren kanske inte är inloggad än
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  // Anropas efter att en ny resurs skapats så statusen hålls uppdaterad
  const refresh = () => fetchStatus();

  return (
    <PlanContext.Provider value={{ planStatus, loading, refresh }}>
      {children}
    </PlanContext.Provider>
  );
}

export const usePlan = () => useContext(PlanContext);
