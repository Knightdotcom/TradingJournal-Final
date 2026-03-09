import { createContext, useContext, useState } from 'react';
import api from '../services/api';

// Context = ett sätt att dela data globalt utan att skicka props genom varje komponent
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Kontrollerar om token redan finns sparad (t.ex. om användaren laddar om sidan)
  const [token, setToken] = useState(localStorage.getItem('token'));
  const isLoggedIn = !!token;

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const jwt = res.data.token;
    localStorage.setItem('token', jwt); // Spara token i webbläsaren
    setToken(jwt);
  };

  const register = async (username, email, password) => {
    await api.post('/auth/register', { username, email, password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook så vi enkelt kan använda AuthContext var som helst
export function useAuth() {
  return useContext(AuthContext);
}
