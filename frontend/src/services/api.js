import axios from 'axios';

// Bas-URL till ditt API — ändra denna när du deployar till Azure
const api = axios.create({
  baseURL: 'https://localhost:7001/api',
});

// Interceptor = kod som körs automatiskt innan VARJE request
// Här lägger vi till JWT-token från localStorage om den finns
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
