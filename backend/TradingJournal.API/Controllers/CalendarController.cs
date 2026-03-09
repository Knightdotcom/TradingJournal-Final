using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TradingJournal.Infrastructure.Data;

namespace TradingJournal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CalendarController : ControllerBase
{
    private readonly AppDbContext _db;
    public CalendarController(AppDbContext db) => _db = db;

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Returnerar P&amp;L per dag för angiven månad, inklusive månadssammanfattning med win rate och handelsdagar.</summary>
    [HttpGet]
    public async Task<IActionResult> GetMonthData([FromQuery] int year, [FromQuery] int month)
    {
        if (year < 2000 || year > 2100 || month < 1 || month > 12)
            return BadRequest(new { error = "Ogiltigt år eller månad." });

        var userId = GetUserId();

        // Hämta alla avslutade trades under angiven månad
        var trades = await _db.Trades
            .Where(t =>
                t.UserId == userId &&
                t.ProfitLoss.HasValue &&
                t.EntryDate.Year == year &&
                t.EntryDate.Month == month)
            .ToListAsync();

        // Gruppera per dag
        var days = trades
            .GroupBy(t => t.EntryDate.Day)
            .Select(g => new
            {
                day        = g.Key,
                pnl        = g.Sum(t => t.ProfitLoss!.Value),
                tradeCount = g.Count(),
                winners    = g.Count(t => t.ProfitLoss > 0),
                losers     = g.Count(t => t.ProfitLoss < 0),
                trades     = g.Select(t => new
                {
                    t.Id, t.Symbol, t.Direction,
                    t.ProfitLoss, t.EntryDate, t.Strategy
                }).ToList()
            })
            .ToDictionary(d => d.day);

        // Bygg ut månaden med alla dagar (inkl. dagar utan trades)
        var daysInMonth = DateTime.DaysInMonth(year, month);
        var result = Enumerable.Range(1, daysInMonth).Select(day =>
        {
            days.TryGetValue(day, out var dayData);
            return new
            {
                day,
                date       = new DateTime(year, month, day).ToString("yyyy-MM-dd"),
                weekday    = new DateTime(year, month, day).DayOfWeek.ToString(),
                pnl        = dayData?.pnl ?? 0m,
                tradeCount = dayData?.tradeCount ?? 0,
                winners    = dayData?.winners ?? 0,
                losers     = dayData?.losers ?? 0,
                hasTrades  = dayData != null,
                trades     = dayData?.trades.Cast<object>().ToList() ?? new List<object>()
            };
        });

        // Månadssammanfattning
        var closedTrades = trades.Where(t => t.ProfitLoss.HasValue).ToList();
        var summary = new
        {
            year,
            month,
            totalPnl      = closedTrades.Sum(t => t.ProfitLoss!.Value),
            tradingDays   = days.Count,
            profitDays    = days.Values.Count(d => d.pnl > 0),
            lossDays      = days.Values.Count(d => d.pnl < 0),
            totalTrades   = closedTrades.Count,
            winRate       = closedTrades.Any()
                ? (double)closedTrades.Count(t => t.ProfitLoss > 0) / closedTrades.Count * 100
                : 0
        };

        return Ok(new { summary, days = result });
    }

    /// <summary>Returnerar heatmap-data för hela året — P&amp;L, antal trades och win rate per månad.</summary>
    [HttpGet("year")]
    public async Task<IActionResult> GetYearData([FromQuery] int year)
    {
        var userId = GetUserId();

        var trades = await _db.Trades
            .Where(t =>
                t.UserId == userId &&
                t.ProfitLoss.HasValue &&
                t.EntryDate.Year == year)
            .ToListAsync();

        var months = trades
            .GroupBy(t => t.EntryDate.Month)
            .Select(g => new
            {
                month      = g.Key,
                pnl        = g.Sum(t => t.ProfitLoss!.Value),
                tradeCount = g.Count(),
                winRate    = (double)g.Count(t => t.ProfitLoss > 0) / g.Count() * 100
            })
            .OrderBy(m => m.month);

        return Ok(new { year, months });
    }
}
