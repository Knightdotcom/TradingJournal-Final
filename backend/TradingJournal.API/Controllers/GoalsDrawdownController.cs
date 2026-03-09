using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TradingJournal.Core.Models;
using TradingJournal.Infrastructure.Data;
using TradingJournal.Infrastructure.DTOs;

namespace TradingJournal.API.Controllers;

// ══════════════════════════════════════════════════════════════
// MÅL & MILSTOLPAR
// ══════════════════════════════════════════════════════════════
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GoalsController : ControllerBase
{
    private readonly AppDbContext _db;
    public GoalsController(AppDbContext db) => _db = db;
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Hämtar alla handelsmål med aktuell progress, beräknat nuvarande värde och dagar kvar.</summary>
    [HttpGet]
    public async Task<IActionResult> GetGoals()
    {
        var userId = GetUserId();
        var goals  = await _db.Goals
            .Where(g => g.UserId == userId)
            .OrderBy(g => g.EndDate)
            .ToListAsync();

        var updated = await EnrichGoalsAsync(goals, userId);
        return Ok(updated);
    }

    /// <summary>Skapar ett nytt handelsmål (P&amp;L-mål, win rate-mål eller antal trades-mål) med start- och slutdatum.</summary>
    [HttpPost]
    public async Task<IActionResult> CreateGoal([FromBody] CreateGoalDto dto)
    {
        var goal = new TradingGoal
        {
            UserId      = GetUserId(),
            Title       = dto.Title,
            Type        = (GoalType)dto.Type,
            TargetValue = dto.TargetValue,
            StartDate   = dto.StartDate,
            EndDate     = dto.EndDate,
            CreatedAt   = DateTime.UtcNow
        };
        _db.Goals.Add(goal);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetGoals), new { id = goal.Id }, goal);
    }

    /// <summary>Tar bort ett handelsmål permanent.</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGoal(int id)
    {
        var g = await _db.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == GetUserId());
        if (g == null) return NotFound();
        _db.Goals.Remove(g);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<List<object>> EnrichGoalsAsync(List<TradingGoal> goals, int userId)
    {
        var trades = await _db.Trades
            .Where(t => t.UserId == userId && t.ProfitLoss.HasValue)
            .ToListAsync();

        return goals.Select(g =>
        {
            var periodTrades = trades
                .Where(t => t.EntryDate >= g.StartDate && t.EntryDate <= g.EndDate)
                .ToList();

            decimal current = (GoalType)g.Type switch
            {
                GoalType.PnlTarget     => periodTrades.Sum(t => t.ProfitLoss!.Value),
                GoalType.WinRateTarget => periodTrades.Any()
                    ? (decimal)periodTrades.Count(t => t.ProfitLoss > 0) / periodTrades.Count * 100 : 0,
                GoalType.TradeCount    => periodTrades.Count,
                _                      => 0
            };

            var progress = g.TargetValue > 0
                ? Math.Min((double)current / (double)g.TargetValue * 100, 100) : 0;

            return (object)new
            {
                g.Id, g.Title, g.Type, g.TargetValue, g.StartDate, g.EndDate,
                g.IsCompleted, g.CreatedAt,
                currentValue = current,
                progressPct  = Math.Round(progress, 1),
                isExpired    = g.EndDate < DateTime.UtcNow,
                daysLeft     = Math.Max(0, (g.EndDate - DateTime.UtcNow).Days)
            };
        }).ToList();
    }
}

// ══════════════════════════════════════════════════════════════
// DRAWDOWN-TRACKER
// BUG FIX: Select() med mutable closure (cumPnl, peak) är inte säkert —
// C# LINQ Select är lazy och garanterar inte rätt exekveringsordning
// vid parallellisering eller optimering. Använd foreach istället.
// ══════════════════════════════════════════════════════════════
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DrawdownController : ControllerBase
{
    private readonly AppDbContext _db;
    public DrawdownController(AppDbContext db) => _db = db;
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Returnerar drawdown-kurva med kumulativ P&amp;L, toppvärde och maximal procentuell nedgång över tid.</summary>
    [HttpGet]
    public async Task<IActionResult> GetDrawdown()
    {
        var trades = await _db.Trades
            .Where(t => t.UserId == GetUserId() && t.ProfitLoss.HasValue)
            .OrderBy(t => t.EntryDate)
            .ToListAsync();

        if (!trades.Any())
            return Ok(new { message = "Ingen data ännu." });

        // BUG FIX: Använder foreach istället för Select med mutable closure.
        // Select är lat (lazy) och det är farligt att mutera variabler utanför lambdan.
        decimal cumPnl      = 0;
        decimal peak        = 0;
        decimal maxDrawdown = 0;

        var curve = new List<object>(trades.Count);

        foreach (var t in trades)
        {
            cumPnl += t.ProfitLoss!.Value;

            if (cumPnl > peak) peak = cumPnl;

            decimal drawdown    = peak > 0 ? (peak - cumPnl) / peak * 100 : 0;
            decimal drawdownAbs = peak - cumPnl;

            if (drawdown > maxDrawdown) maxDrawdown = drawdown;

            curve.Add(new
            {
                date        = t.EntryDate.ToString("yyyy-MM-dd"),
                cumPnl      = Math.Round(cumPnl, 2),
                peak        = Math.Round(peak, 2),
                drawdown    = Math.Round(drawdown, 2),
                drawdownAbs = Math.Round(drawdownAbs, 2)
            });
        }

        // Hämta slutvärden från sista posten
        dynamic lastPoint   = curve.Last();
        decimal currentPnl  = (decimal)((dynamic)curve.Last()).cumPnl;
        decimal currentPeak = (decimal)((dynamic)curve.Last()).peak;
        decimal currentDD   = (decimal)((dynamic)curve.Last()).drawdown;

        return Ok(new
        {
            curve,
            maxDrawdown        = Math.Round(maxDrawdown, 2),
            currentDrawdown    = Math.Round(currentDD, 2),
            currentPnl         = Math.Round(currentPnl, 2),
            currentPeak        = Math.Round(currentPeak, 2),
            isInDrawdown       = currentPnl < currentPeak,
            drawdownFromPeak   = Math.Round(currentPeak - currentPnl, 2)
        });
    }
}
