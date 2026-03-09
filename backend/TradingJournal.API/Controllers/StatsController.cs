using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TradingJournal.Infrastructure.Data;

namespace TradingJournal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StatsController : ControllerBase
{
    private readonly AppDbContext _db;
    public StatsController(AppDbContext db) => _db = db;

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET api/stats/overview
    // Dashboardens grundläggande nyckeltal
    /// <summary>Övergripande nyckeltal: totalt P&amp;L, win rate, profit factor, streak, bästa/sämsta trade.</summary>
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var trades = await _db.Trades
            .Where(t => t.UserId == GetUserId())
            .ToListAsync();

        var closed = trades.Where(t => t.ProfitLoss.HasValue).ToList();
        if (!closed.Any())
            return Ok(new { message = "Ingen data ännu." });

        var winners = closed.Where(t => t.ProfitLoss > 0).ToList();
        var losers  = closed.Where(t => t.ProfitLoss < 0).ToList();

        var avgWin  = winners.Any() ? winners.Average(t => t.ProfitLoss!.Value) : 0;
        var avgLoss = losers.Any()  ? Math.Abs(losers.Average(t => t.ProfitLoss!.Value)) : 0;

        return Ok(new
        {
            totalTrades      = closed.Count,
            openTrades       = trades.Count - closed.Count,
            totalPnl         = closed.Sum(t => t.ProfitLoss!.Value),
            winRate          = (double)winners.Count / closed.Count * 100,
            winners          = winners.Count,
            losers           = losers.Count,
            avgWin,
            avgLoss,
            // Profit factor = total vinst / total förlust
            // Över 1.5 = bra, över 2.0 = utmärkt
            profitFactor     = avgLoss > 0 ? Math.Round(avgWin / avgLoss, 2) : 0,
            avgRR            = avgLoss > 0 ? Math.Round(avgWin / avgLoss, 2) : 0,
            largestWin       = winners.Any() ? winners.Max(t => t.ProfitLoss!.Value) : 0,
            largestLoss      = losers.Any()  ? losers.Min(t => t.ProfitLoss!.Value) : 0,
            currentStreak    = CalculateCurrentStreak(closed),
            bestStreak       = CalculateBestStreak(closed)
        });
    }

    // GET api/stats/by-symbol
    // Win rate och P&L uppdelat per handelssymbol (t.ex. AAPL, BTC, EURUSD)
    /// <summary>Statistik uppdelad per handelssymbol — win rate och P&amp;L per instrument.</summary>
    [HttpGet("by-symbol")]
    public async Task<IActionResult> GetBySymbol()
    {
        var trades = await _db.Trades
            .Where(t => t.UserId == GetUserId() && t.ProfitLoss.HasValue)
            .ToListAsync();

        var result = trades
            .GroupBy(t => t.Symbol)
            .Select(g =>
            {
                var wins   = g.Count(t => t.ProfitLoss > 0);
                var total  = g.Count();
                var pnl    = g.Sum(t => t.ProfitLoss!.Value);
                return new
                {
                    symbol     = g.Key,
                    trades     = total,
                    wins,
                    losses     = total - wins,
                    winRate    = (double)wins / total * 100,
                    totalPnl   = pnl,
                    avgPnl     = pnl / total,
                    bestTrade  = g.Max(t => t.ProfitLoss!.Value),
                    worstTrade = g.Min(t => t.ProfitLoss!.Value)
                };
            })
            .OrderByDescending(s => s.totalPnl)
            .ToList();

        return Ok(result);
    }

    // GET api/stats/by-hour
    // Prestanda fördelad på timme på dygnet (0-23)
    // Hittar din bästa och sämsta handelstid
    /// <summary>Prestanda per timme på dygnet (0-23). Visar bästa och sämsta handelstid.</summary>
    [HttpGet("by-hour")]
    public async Task<IActionResult> GetByHour()
    {
        var trades = await _db.Trades
            .Where(t => t.UserId == GetUserId() && t.ProfitLoss.HasValue)
            .ToListAsync();

        var result = trades
            .GroupBy(t => t.EntryDate.Hour)
            .Select(g =>
            {
                var wins  = g.Count(t => t.ProfitLoss > 0);
                var total = g.Count();
                return new
                {
                    hour       = g.Key,
                    label      = $"{g.Key:00}:00",
                    trades     = total,
                    winRate    = (double)wins / total * 100,
                    totalPnl   = g.Sum(t => t.ProfitLoss!.Value),
                    avgPnl     = g.Average(t => t.ProfitLoss!.Value)
                };
            })
            .OrderBy(h => h.hour)
            .ToList();

        return Ok(result);
    }

    // GET api/stats/by-weekday
    // Prestanda per veckodag — måndag t.o.m. söndag
    [HttpGet("by-weekday")]
    public async Task<IActionResult> GetByWeekday()
    {
        var trades = await _db.Trades
            .Where(t => t.UserId == GetUserId() && t.ProfitLoss.HasValue)
            .ToListAsync();

        var dayNames = new[] { "Söndag","Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag" };

        var result = trades
            .GroupBy(t => (int)t.EntryDate.DayOfWeek)
            .Select(g =>
            {
                var wins  = g.Count(t => t.ProfitLoss > 0);
                var total = g.Count();
                return new
                {
                    dayIndex   = g.Key,
                    day        = dayNames[g.Key],
                    trades     = total,
                    winRate    = (double)wins / total * 100,
                    totalPnl   = g.Sum(t => t.ProfitLoss!.Value),
                    avgPnl     = g.Average(t => t.ProfitLoss!.Value)
                };
            })
            // Sortera Mån→Sön (börjar med index 1)
            .OrderBy(d => d.dayIndex == 0 ? 7 : d.dayIndex)
            .ToList();

        return Ok(result);
    }

    // GET api/stats/by-strategy
    // Vilken strategi är mest lönsam?
    [HttpGet("by-strategy")]
    public async Task<IActionResult> GetByStrategy()
    {
        var trades = await _db.Trades
            .Where(t => t.UserId == GetUserId() && t.ProfitLoss.HasValue)
            .ToListAsync();

        var result = trades
            .GroupBy(t => string.IsNullOrWhiteSpace(t.Strategy) ? "Ingen strategi" : t.Strategy)
            .Select(g =>
            {
                var wins  = g.Count(t => t.ProfitLoss > 0);
                var total = g.Count();
                var pnl   = g.Sum(t => t.ProfitLoss!.Value);
                return new
                {
                    strategy   = g.Key,
                    trades     = total,
                    wins,
                    losses     = total - wins,
                    winRate    = (double)wins / total * 100,
                    totalPnl   = pnl,
                    avgPnl     = pnl / total
                };
            })
            .OrderByDescending(s => s.totalPnl)
            .ToList();

        return Ok(result);
    }

    // GET api/stats/by-direction
    // Long vs Short — vilken är mer lönsam för dig?
    [HttpGet("by-direction")]
    public async Task<IActionResult> GetByDirection()
    {
        var trades = await _db.Trades
            .Where(t => t.UserId == GetUserId() && t.ProfitLoss.HasValue)
            .ToListAsync();

        var result = trades
            .GroupBy(t => t.Direction)
            .Select(g =>
            {
                var wins  = g.Count(t => t.ProfitLoss > 0);
                var total = g.Count();
                return new
                {
                    direction  = g.Key,
                    trades     = total,
                    winRate    = (double)wins / total * 100,
                    totalPnl   = g.Sum(t => t.ProfitLoss!.Value),
                    avgPnl     = g.Average(t => t.ProfitLoss!.Value)
                };
            })
            .ToList();

        return Ok(result);
    }

    // ── Hjälpmetoder för streak-beräkning ─────────────────────────────────
    private static int CalculateCurrentStreak(List<Core.Models.Trade> trades)
    {
        if (!trades.Any()) return 0;
        var ordered = trades.OrderByDescending(t => t.EntryDate).ToList();
        var firstPnl = ordered[0].ProfitLoss!.Value;
        bool isWin = firstPnl > 0;
        int streak = 0;

        foreach (var t in ordered)
        {
            if ((t.ProfitLoss!.Value > 0) == isWin) streak++;
            else break;
        }
        return isWin ? streak : -streak; // Positiv = win-streak, negativ = loss-streak
    }

    private static int CalculateBestStreak(List<Core.Models.Trade> trades)
    {
        if (!trades.Any()) return 0;
        var ordered = trades.OrderBy(t => t.EntryDate).ToList();
        int best = 0, current = 0;

        foreach (var t in ordered)
        {
            if (t.ProfitLoss!.Value > 0) { current++; best = Math.Max(best, current); }
            else current = 0;
        }
        return best;
    }
}
