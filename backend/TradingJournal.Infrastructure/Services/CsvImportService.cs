using Microsoft.EntityFrameworkCore;
using TradingJournal.Core.Models;
using TradingJournal.Infrastructure.Data;
using TradingJournal.Infrastructure.DTOs.Import;

namespace TradingJournal.Infrastructure.Services;

// Koordinerar hela import-flödet:
// 1. Ta emot CSV-fil
// 2. Detektera broker
// 3. Parsa varje rad med rätt parser
// 4. Dubblettskydda
// 5. Spara i databasen
// 6. Returnera ett detaljerat resultat
public class CsvImportService
{
    private readonly AppDbContext _db;

    public CsvImportService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ImportResultDto> ImportAsync(Stream csvStream, int userId)
    {
        var result = new ImportResultDto();

        // Läs hela filen som text
        using var reader = new StreamReader(csvStream);
        var content = await reader.ReadToEndAsync();

        // Splitta på rader och filtrera bort tomma
        var lines = content
            .Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Select(l => l.Trim())
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .ToList();

        if (lines.Count < 2)
        {
            result.Errors.Add("CSV-filen är tom eller saknar datarader.");
            return result;
        }

        // Rad 1 = kolumnrubriker
        var headerLine = lines[0];
        var headers = SplitCsvLine(headerLine);

        // Detektera vilken broker CSV:n kommer från
        var brokerType = BrokerDetector.Detect(headerLine);
        result.BrokerDetected = BrokerDetector.GetDisplayName(brokerType);

        // Hämta alla befintliga row-identifiers för denna användare (dubblettskydd)
        var existingIdentifiers = (await _db.Trades
            .Where(t => t.UserId == userId && t.BrokerRowId != null)
            .Select(t => t.BrokerRowId!)
            .ToListAsync()).ToHashSet();

        // Parsa varje datarad (hoppa över header-raden)
        for (int i = 1; i < lines.Count; i++)
        {
            var line = lines[i];

            // Hoppa över kommentarsrader (börjar med #)
            if (line.StartsWith("#")) continue;

            var cols = SplitCsvLine(line);

            try
            {
                // Välj rätt parser baserat på detekterad broker
                ParsedTradeRow? parsed = brokerType switch
                {
                    BrokerDetector.BrokerType.Binance             => BinanceCsvParser.ParseRow(headers, cols),
                    BrokerDetector.BrokerType.Alpaca              => AlpacaCsvParser.ParseRow(headers, cols),
                    BrokerDetector.BrokerType.MetaTrader          => MetaTraderCsvParser.ParseRow(headers, cols),
                    BrokerDetector.BrokerType.Nordnet             => NordnetCsvParser.ParseRow(headers, cols),
                    _                                              => GenericCsvParser.ParseRow(headers, cols)
                };

                if (parsed == null)
                {
                    result.Skipped++;
                    result.Warnings.Add($"Rad {i + 1}: Kunde inte tolkas (ej en trade-rad).");
                    continue;
                }

                // Dubblettskydd — hoppa över om denna trade redan finns
                if (!string.IsNullOrEmpty(parsed.RowIdentifier) &&
                    existingIdentifiers.Contains(parsed.RowIdentifier))
                {
                    result.Skipped++;
                    continue;
                }

                // Validering
                if (string.IsNullOrWhiteSpace(parsed.Symbol))
                {
                    result.Failed++;
                    result.Errors.Add($"Rad {i + 1}: Symbol saknas.");
                    continue;
                }

                if (parsed.EntryPrice <= 0)
                {
                    result.Failed++;
                    result.Errors.Add($"Rad {i + 1}: Ogiltigt inköpspris för {parsed.Symbol}.");
                    continue;
                }

                // Skapa Trade-objekt
                var trade = new Trade
                {
                    UserId        = userId,
                    Symbol        = parsed.Symbol,
                    Direction     = parsed.Direction,
                    EntryPrice    = parsed.EntryPrice,
                    ExitPrice     = parsed.ExitPrice,
                    Quantity      = parsed.Quantity > 0 ? parsed.Quantity : 1,
                    LotSize       = parsed.LotSize,
                    ProfitLoss    = parsed.ProfitLoss,
                    EntryDate     = parsed.EntryDate,
                    ExitDate      = parsed.ExitDate,
                    Notes         = parsed.Notes ?? $"Importerad från {result.BrokerDetected}",
                    Strategy      = parsed.Strategy,
                    BrokerRowId   = parsed.RowIdentifier,  // Sparas för framtida dubblettskydd
                    CreatedAt     = DateTime.UtcNow
                };

                _db.Trades.Add(trade);
                existingIdentifiers.Add(parsed.RowIdentifier); // Förhindrar dubletter inom samma import
                result.Imported++;
            }
            catch (Exception ex)
            {
                result.Failed++;
                result.Errors.Add($"Rad {i + 1}: Oväntat fel — {ex.Message}");
            }
        }

        // Spara alla trades i ett enda anrop (effektivt)
        if (result.Imported > 0)
            await _db.SaveChangesAsync();

        return result;
    }

    // Hanterar CSV-rader korrekt, inklusive fält med kommatecken inuti citattecken
    // T.ex: "AAPL","1,234.56","Long" ska ge tre kolumner, inte fyra
    private static string[] SplitCsvLine(string line)
    {
        var result = new List<string>();
        bool inQuotes = false;
        var current = new System.Text.StringBuilder();

        foreach (var c in line)
        {
            if (c == '"')
            {
                inQuotes = !inQuotes;
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(current.ToString().Trim());
                current.Clear();
            }
            else if (c == ';' && !inQuotes) // Vissa europeiska CSV:er använder semikolon
            {
                result.Add(current.ToString().Trim());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }

        result.Add(current.ToString().Trim());
        return result.ToArray();
    }
}
