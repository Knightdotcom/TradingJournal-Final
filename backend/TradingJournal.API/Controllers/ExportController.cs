using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using TradingJournal.Infrastructure.Data;

namespace TradingJournal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExportController : ControllerBase
{
    private readonly AppDbContext _db;
    public ExportController(AppDbContext db) => _db = db;

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET api/export/trades/csv
    // Export är tillgängligt på ALLA planer — detta är vår edge mot TradeZella
    /// <summary>Exporterar alla trades som en CSV-fil med svenska kolumnrubriker.</summary>
    [HttpGet("trades/csv")]
    public async Task<IActionResult> ExportTradesCsv()
    {
        var trades = await _db.Trades
            .Where(t => t.UserId == GetUserId())
            .OrderByDescending(t => t.EntryDate)
            .ToListAsync();

        var sb = new StringBuilder();

        // Header-rad
        sb.AppendLine("Symbol,Riktning,Inköpspris,Säljpris,Antal,Lot Size,Vinst/Förlust,Inköpsdatum,Säljdatum,Strategi,Anteckningar");

        // En rad per trade
        foreach (var t in trades)
        {
            sb.AppendLine(string.Join(",", new[]
            {
                CsvSafe(t.Symbol),
                CsvSafe(t.Direction),
                t.EntryPrice.ToString("F4"),
                t.ExitPrice?.ToString("F4") ?? "",
                t.Quantity.ToString(),
                t.LotSize?.ToString("F2") ?? "",
                t.ProfitLoss?.ToString("F2") ?? "",
                t.EntryDate.ToString("yyyy-MM-dd HH:mm"),
                t.ExitDate?.ToString("yyyy-MM-dd HH:mm") ?? "",
                CsvSafe(t.Strategy ?? ""),
                CsvSafe(t.Notes ?? "")
            }));
        }

        // Returnerar filen direkt som nedladdning
        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv", $"TradingJournal_Trades_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    // GET api/export/rules/csv
    /// <summary>Exporterar alla tradingregler som en CSV-fil.</summary>
    [HttpGet("rules/csv")]
    public async Task<IActionResult> ExportRulesCsv()
    {
        var rules = await _db.TradingRules
            .Where(r => r.UserId == GetUserId())
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Titel,Beskrivning,Aktiv,Skapad");

        foreach (var r in rules)
            sb.AppendLine(string.Join(",", new[]
            {
                CsvSafe(r.Title),
                CsvSafe(r.Description),
                r.IsActive ? "Ja" : "Nej",
                r.CreatedAt.ToString("yyyy-MM-dd")
            }));

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv", $"TradingJournal_Regler_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    // GET api/export/summary/csv — komplett summary med statistik
    /// <summary>Exporterar en komplett sammanfattning med statistik och alla trades som CSV.</summary>
    [HttpGet("summary/csv")]
    public async Task<IActionResult> ExportSummaryCsv()
    {
        var trades = await _db.Trades
            .Where(t => t.UserId == GetUserId())
            .OrderBy(t => t.EntryDate)
            .ToListAsync();

        var closed = trades.Where(t => t.ProfitLoss.HasValue).ToList();

        var sb = new StringBuilder();
        sb.AppendLine("=== TradingJournal Sammanfattning ===");
        sb.AppendLine($"Exporterad:,{DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC");
        sb.AppendLine();
        sb.AppendLine("=== Statistik ===");
        sb.AppendLine($"Totalt antal trades:,{trades.Count}");
        sb.AppendLine($"Avslutade trades:,{closed.Count}");
        sb.AppendLine($"Öppna trades:,{trades.Count - closed.Count}");

        if (closed.Any())
        {
            var winners  = closed.Count(t => t.ProfitLoss > 0);
            var totalPnl = closed.Sum(t => t.ProfitLoss!.Value);
            var winRate  = (double)winners / closed.Count * 100;

            sb.AppendLine($"Win rate:,{winRate:F1}%");
            sb.AppendLine($"Totalt P&L:,{totalPnl:F2}");
            sb.AppendLine($"Vinnare:,{winners}");
            sb.AppendLine($"Förlorare:,{closed.Count - winners}");
            sb.AppendLine($"Snitt vinst per vinnande trade:,{closed.Where(t => t.ProfitLoss > 0).Average(t => t.ProfitLoss!.Value):F2}");
            sb.AppendLine($"Snitt förlust per förlorande trade:,{closed.Where(t => t.ProfitLoss < 0).DefaultIfEmpty().Average(t => t?.ProfitLoss ?? 0):F2}");
        }

        sb.AppendLine();
        sb.AppendLine("=== Alla Trades ===");
        sb.AppendLine("Symbol,Riktning,Inköpspris,Säljpris,Antal,P&L,Datum");

        foreach (var t in trades)
            sb.AppendLine(string.Join(",", new[]
            {
                CsvSafe(t.Symbol),
                CsvSafe(t.Direction),
                t.EntryPrice.ToString("F4"),
                t.ExitPrice?.ToString("F4") ?? "Öppen",
                t.Quantity.ToString(),
                t.ProfitLoss?.ToString("F2") ?? "Öppen",
                t.EntryDate.ToString("yyyy-MM-dd")
            }));

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv", $"TradingJournal_Sammanfattning_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    // Ser till att fält med kommatecken eller citattecken hanteras korrekt i CSV
    private static string CsvSafe(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }
}
