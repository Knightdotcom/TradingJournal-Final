import axios from 'axios';

// Bas-URL till ditt API — Azure App Service backend
const api = axios.create({
  baseURL: 'https://tradingjournal-api-knightdotcom-gud0ergsg6e4f4hq.westeurope-01.azurewebsites.net/api',
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
