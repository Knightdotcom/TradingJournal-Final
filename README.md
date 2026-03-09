# TradingJournal

En komplett tradingjournal-applikation för aktiva traders. Spåra affärer, analysera prestanda, hantera risk och dokumentera din tradingpsykologi — allt på ett ställe.

---

## Teknikstack

### Backend
| Teknologi | Användning |
|-----------|------------|
| **ASP.NET Core Web API (.NET 8)** | REST API och affärslogik |
| **Entity Framework Core** | ORM och migrationer |
| **SQL Server** | Relationsdatabas |
| **JWT (JSON Web Tokens)** | Stateless autentisering |
| **PlanGuard** | Feature-gates för Free / Pro / Elite |

### Frontend
| Teknologi | Användning |
|-----------|------------|
| **React + TypeScript** | Komponentbaserat UI |
| **React Router** | Klientsidesnavigering |
| **Context API** | Global state-hantering |
| **Chart.js / Recharts** | Statistikdiagram och grafer |
| **Dark/Light-tema** | Persisterat temabyte |

---

## Arkitektur

### Backend — lagerstruktur

```
backend/
├── TradingJournal.API/
│   ├── Controllers/           → HTTP-endpoints
│   └── Program.cs             → App-konfiguration, middleware, DI
├── TradingJournal.Core/
│   └── Models/                → Domänmodeller (Trade, User, m.fl.)
└── TradingJournal.Infrastructure/
    ├── Data/                  → AppDbContext och EF Core-konfiguration
    ├── DTOs/                  → Dataöverföringsobjekt
    ├── Migrations/            → EF Core-migrationer
    └── Services/              → Affärslogik (CSV-import, plan-guards m.fl.)
```

---

## Funktioner

### Tradingjournal
- Logga affärer med symbol, riktning, pris, resultat och taggar
- Bifoga screenshots per affär
- Psykologi-journal kopplad till varje affär (känslor, misstag, lärdomar)

### Statistik och Analys
- **Översikt** — total P&L, win rate, genomsnittlig vinst/förlust
- **Per symbol** — prestanda uppdelad per instrument
- **Per tid** — trender per dag, vecka och månad
- **Per strategi** — jämförelse mellan olika handelsstrategier

### Tradingkalender
- Månadsvy med P&L per handelsdag
- Snabb visuell översikt av lönsamma och förlustskapande dagar

### Pre-market checklista
- Anpassningsbar daglig checklista inför handelsdagen
- Bocka av uppgifter och spara som mall

### Mål och Drawdown-tracker
- Sätt upp finansiella mål med progress-indikator
- Drawdown-tracker med varningsgränser i realtid

### Riskhantering
- Beräkna positionsstorlek och risk per affär
- Realtidsvarningar vid regelbrott
- Playbook per strategi med inträdeskriterier och regler

### CSV-import och Export
Stöd för direktimport från populära mäklare/plattformar:
- Binance
- Alpaca
- MetaTrader
- Nordnet

Export av affärsdatan till CSV för extern analys.

### Forum
- Community-forum med inlägg och kommentarer
- Dela insikter och strategier med andra traders

### Prenumerationsplaner

| Plan | Funktioner |
|------|------------|
| **Free** | Grundläggande journal, begränsat antal affärer |
| **Pro** | Fullständig statistik, CSV-import, psykologi-journal |
| **Elite** | Alla funktioner inkl. forum, playbook och riskhantering |

---

## API-endpoints (urval)

| Metod | Endpoint | Beskrivning | Auth |
|-------|----------|-------------|------|
| POST | `/api/auth/register` | Registrera nytt konto | Nej |
| POST | `/api/auth/login` | Logga in — returnerar JWT-token | Nej |
| GET/POST/PUT/DELETE | `/api/trades` | Hantera affärer | JWT |
| GET | `/api/stats` | Hämta statistik | JWT |
| GET | `/api/calendar` | Hämta kalenderdata | JWT |
| GET/POST | `/api/checklist` | Hantera checklista | JWT |
| GET/POST | `/api/goals` | Hantera mål | JWT |
| GET/POST | `/api/rules` | Hantera tradingregler | JWT |
| GET/POST | `/api/psychology` | Psykologi-journal | JWT |
| POST | `/api/import` | Importera CSV-fil | JWT |
| GET | `/api/export` | Exportera affärer till CSV | JWT |
| GET/POST | `/api/forum` | Forum-inlägg och kommentarer | JWT |
| GET | `/api/plan` | Hämta prenumerationsplan | JWT |

> Fullständig dokumentation finns i Swagger UI när API:et körs.

---

## Kom igång

### Krav
- Visual Studio 2022 med .NET 8 SDK
- SQL Server eller SQL Server Express
- Node.js LTS

### 1. Starta backend

1. Öppna `backend/TradingJournal.sln` i Visual Studio
2. Uppdatera connection string i `TradingJournal.API/appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=TradingJournalDb;Trusted_Connection=True;TrustServerCertificate=True;"
}
```
3. Kör migrationer i **Package Manager Console**:
```bash
Add-Migration InitialCreate -Project TradingJournal.Infrastructure -StartupProject TradingJournal.API
Update-Database -Project TradingJournal.Infrastructure -StartupProject TradingJournal.API
```
4. Starta med **F5** — API:et körs på `https://localhost:7xxx`
5. Swagger UI finns på `https://localhost:7xxx/swagger`

### 2. Starta frontend

```bash
cd frontend
npm install
npm start
```

Öppna webbläsaren på `http://localhost:3000`

---

## Säkerhet

- Lösenord hashas med bcrypt
- JWT-token valideras vid varje skyddat anrop
- Plan-guards kontrollerar att användaren har rätt prenumerationsnivå per funktion
- CORS konfigurerat för frontend-ursprunget

---

## Databasmodell (förenklad)

```
User
  ├── Id, Username, Email, PasswordHash
  └── SubscriptionPlan (Free | Pro | Elite)

Trade
  ├── Id, Symbol, Direction, EntryPrice, ExitPrice
  ├── Quantity, PnL, Tags, ScreenshotUrl
  ├── OpenedAt, ClosedAt, Strategy
  └── FK → User

TradePsychology
  ├── Id, Emotion, Mistakes, Lessons, Rating
  └── FK → Trade

TradingRule / Playbook
  ├── Id, Name, Description, EntryConditions
  └── FK → User

ForumPost / ForumComment
  └── FK → User
```
