using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TradingJournal.Infrastructure.Services;

namespace TradingJournal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlanController : ControllerBase
{
    private readonly PlanGuard _guard;
    public PlanController(PlanGuard guard) => _guard = guard;

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET api/plan/status
    // Frontend hämtar detta vid inloggning för att visa "X av Y trades använda"
    /// <summary>Hämtar inloggad användares prenumerationsstatus och förbrukad kvot (trades, regler, påminnelser).</summary>
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var status = await _guard.GetStatusAsync(GetUserId());
        return Ok(status);
    }

    // GET api/plan/pricing
    // Returnerar prisinformation för att visa i uppgraderingsdialogen
    /// <summary>Returnerar alla tillgängliga prenumerationsplaner med priser och funktioner. Kräver ej inloggning.</summary>
    [HttpGet("pricing")]
    [AllowAnonymous] // Ingen inloggning krävs för att se priser
    public IActionResult GetPricing()
    {
        return Ok(new[]
        {
            new {
                name        = "Free",
                price       = 0,
                currency    = "SEK",
                period      = "för alltid",
                features    = new[]
                {
                    "Upp till 50 trades",
                    "5 tradingregler",
                    "3 påminnelser",
                    "CSV-import",
                    "Dataexport (alltid fri)",
                    "Forum"
                },
                highlighted = false
            },
            new {
                name        = "Pro",
                price       = 99,
                currency    = "SEK",
                period      = "per månad",
                features    = new[]
                {
                    "Obegränsat antal trades",
                    "Obegränsade regler",
                    "Obegränsade påminnelser",
                    "CSV-import",
                    "Dataexport",
                    "Forum",
                    "Avancerad statistik",
                    "Tradingkalender"
                },
                highlighted = true  // Markerad som rekommenderad
            },
            new {
                name        = "Elite",
                price       = 199,
                currency    = "SEK",
                period      = "per månad",
                features    = new[]
                {
                    "Allt i Pro",
                    "AI-analys av dina trades",
                    "Psykologi-journal",
                    "Avancerade rapporter",
                    "Prioriterad support"
                },
                highlighted = false
            }
        });
    }
}
