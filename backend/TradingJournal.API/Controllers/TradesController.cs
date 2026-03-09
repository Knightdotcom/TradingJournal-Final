using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TradingJournal.Infrastructure.Data;
using TradingJournal.Infrastructure.DTOs;
using TradingJournal.Infrastructure.Services;
using TradingJournal.Core.Models;

namespace TradingJournal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TradesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PlanGuard _guard;

    public TradesController(AppDbContext db, PlanGuard guard)
    {
        _db    = db;
        _guard = guard;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET api/trades
    /// <summary>Hämtar alla trades för inloggad användare, sorterade efter datum (nyast först).</summary>
    [HttpGet]
    public async Task<IActionResult> GetTrades()
    {
        var trades = await _db.Trades
            .Where(t => t.UserId == GetUserId())
            .OrderByDescending(t => t.EntryDate)
            .Select(t => new
            {
                t.Id, t.Symbol, t.Direction, t.EntryPrice, t.ExitPrice,
                t.Quantity, t.LotSize, t.ProfitLoss,
                t.EntryDate, t.ExitDate, t.Notes, t.Strategy, t.CreatedAt
            })
            .ToListAsync();

        return Ok(trades);
    }

    // POST api/trades
    /// <summary>Skapar en ny trade. P&amp;L beräknas automatiskt om exit-pris anges.</summary>
    [HttpPost]
    public async Task<IActionResult> CreateTrade([FromBody] CreateTradeDto dto)
    {
        // Kolla plangränsen INNAN vi skapar traden
        var guard = await _guard.CanAddTradeAsync(GetUserId());
        if (!guard.Allowed)
            return StatusCode(403, new { error = guard.Message });

        // Beräkna P&L automatiskt om både entry och exit finns
        decimal? pnl = null;
        if (dto.ExitPrice.HasValue)
        {
            pnl = dto.Direction == "Long"
                ? (dto.ExitPrice.Value - dto.EntryPrice) * dto.Quantity
                : (dto.EntryPrice - dto.ExitPrice.Value) * dto.Quantity;
        }

        var trade = new Trade
        {
            UserId     = GetUserId(),
            Symbol     = dto.Symbol.ToUpper().Trim(),
            Direction  = dto.Direction,
            EntryPrice = dto.EntryPrice,
            ExitPrice  = dto.ExitPrice,
            Quantity   = dto.Quantity,
            LotSize    = dto.LotSize,
            ProfitLoss = dto.ProfitLoss ?? pnl,
            EntryDate  = dto.EntryDate,
            ExitDate   = dto.ExitDate,
            Notes      = dto.Notes,
            Strategy   = dto.Strategy,
            CreatedAt  = DateTime.UtcNow
        };

        _db.Trades.Add(trade);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTrades), new { id = trade.Id }, trade);
    }

    // PUT api/trades/{id}
    /// <summary>Uppdaterar en befintlig trade. Omberäknar P&amp;L automatiskt.</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTrade(int id, [FromBody] CreateTradeDto dto)
    {
        var trade = await _db.Trades
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == GetUserId());

        if (trade == null) return NotFound();

        trade.Symbol     = dto.Symbol.ToUpper().Trim();
        trade.Direction  = dto.Direction;
        trade.EntryPrice = dto.EntryPrice;
        trade.ExitPrice  = dto.ExitPrice;
        trade.Quantity   = dto.Quantity;
        trade.LotSize    = dto.LotSize;
        trade.EntryDate  = dto.EntryDate;
        trade.ExitDate   = dto.ExitDate;
        trade.Notes      = dto.Notes;
        trade.Strategy   = dto.Strategy;

        // Räkna om P&L vid uppdatering
        if (dto.ExitPrice.HasValue)
        {
            trade.ProfitLoss = dto.Direction == "Long"
                ? (dto.ExitPrice.Value - dto.EntryPrice) * dto.Quantity
                : (dto.EntryPrice - dto.ExitPrice.Value) * dto.Quantity;
        }
        else
        {
            trade.ProfitLoss = null; // Trade är fortfarande öppen
        }

        await _db.SaveChangesAsync();
        return Ok(trade);
    }

    // DELETE api/trades/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTrade(int id)
    {
        var trade = await _db.Trades
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == GetUserId());

        if (trade == null) return NotFound();

        _db.Trades.Remove(trade);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
