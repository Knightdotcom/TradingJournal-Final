# TradingJournal — Komplett integrerat projekt

## Kom igång

### Backend
1. Öppna `backend/TradingJournal.sln` i Visual Studio
2. Uppdatera connection string i `TradingJournal.API/appsettings.json`
3. Kör migration i Package Manager Console:
   ```
   Add-Migration InitialCreate -Project TradingJournal.Infrastructure -StartupProject TradingJournal.API
   Update-Database -Project TradingJournal.Infrastructure -StartupProject TradingJournal.API
   ```
4. Starta med F5 — API:et körs på https://localhost:7xxx

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm start`
4. Öppnas automatiskt på http://localhost:3000

## Funktioner
- Autentisering (JWT)
- Trade-journal med tags och screenshots
- Psykologi-journal per trade
- Tradingkalender (P&L per dag)
- Statistik (4 vyer: overview, symbol, tid, strategi)
- Pre-market checklista
- Mål med progress-bar
- Drawdown-tracker
- Playbook per strategi
- Riskhantering med realtidsvarningar
- CSV-import (Binance, Alpaca, MetaTrader, Nordnet)
- Export till CSV
- Mörkt/ljust tema
- Prenumerationsplaner (Free/Pro/Elite)
