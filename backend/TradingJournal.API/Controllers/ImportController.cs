using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TradingJournal.Infrastructure.Services;

namespace TradingJournal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ImportController : ControllerBase
{
    private readonly CsvImportService _importService;

    public ImportController(CsvImportService importService)
    {
        _importService = importService;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>
    /// Importerar trades från en CSV-fil.
    /// Stöder: Binance, Alpaca, MetaTrader 4/5, Nordnet, samt generiska CSV-format.
    /// Automatisk broker-detektion och dubblettskydd ingår.
    /// </summary>
    // POST api/import/csv
    [HttpPost("csv")]
    [RequestSizeLimit(10 * 1024 * 1024)] // Max 10MB fil
    public async Task<IActionResult> ImportCsv(IFormFile file)
    {
        // Validera att en fil faktiskt skickades
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "Ingen fil uppladdad." });

        // Kontrollera filtyp
        var extension = Path.GetExtension(file.FileName).ToLower();
        if (extension != ".csv" && extension != ".txt")
            return BadRequest(new { error = "Endast .csv och .txt-filer accepteras." });

        // Kontrollera filstorlek (max 10MB)
        if (file.Length > 10 * 1024 * 1024)
            return BadRequest(new { error = "Filen är för stor. Max 10MB." });

        // Kör importen
        using var stream = file.OpenReadStream();
        var result = await _importService.ImportAsync(stream, GetUserId());

        // Returnera detaljerat resultat
        return Ok(new
        {
            message         = $"Import klar! {result.Imported} trades importerade.",
            brokerDetected  = result.BrokerDetected,
            imported        = result.Imported,
            skipped         = result.Skipped,
            failed          = result.Failed,
            warnings        = result.Warnings,
            errors          = result.Errors
        });
    }

    /// <summary>
    /// Visar vilka brokers som stöds och hur deras CSV ska se ut.
    /// Användbart för att visa i frontend.
    /// </summary>
    // GET api/import/supported-brokers
    [HttpGet("supported-brokers")]
    public IActionResult GetSupportedBrokers()
    {
        return Ok(new[]
        {
            new { name = "Binance",             format = "Order_ID, Symbol, Side, Price, Executed Qty, Time, Realized_PnL" },
            new { name = "Alpaca",              format = "id, symbol, side, qty, filled_avg_price, filled_at" },
            new { name = "MetaTrader 4/5",      format = "Ticket, Open Time, Type, Volume, Symbol, Open Price, Close Time, Close Price, Profit" },
            new { name = "Nordnet",             format = "Bokföringsdag, Värdepapper, Transaktionstyp, Antal, Kurs, Belopp, Verifikationsnummer" },
            new { name = "Generisk CSV",        format = "symbol, side/type, price, qty/quantity, date/time (valfria kolumnnamn)" }
        });
    }
}
