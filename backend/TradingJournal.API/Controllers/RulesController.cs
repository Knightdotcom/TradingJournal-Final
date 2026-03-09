using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TradingJournal.Core.Models;
using TradingJournal.Infrastructure.Data;
using TradingJournal.Infrastructure.Services;

namespace TradingJournal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RulesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PlanGuard _guard;

    public RulesController(AppDbContext db, PlanGuard guard)
    {
        _db    = db;
        _guard = guard;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Hämtar alla tradingregler för inloggad användare.</summary>
    [HttpGet]
    public async Task<IActionResult> GetRules()
    {
        var rules = await _db.TradingRules
            .Where(r => r.UserId == GetUserId())
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
        return Ok(rules);
    }

    /// <summary>Skapar en ny tradingregel. Kontrollerar plangräns (Free: max 5 regler).</summary>
    [HttpPost]
    public async Task<IActionResult> CreateRule([FromBody] CreateRuleDto dto)
    {
        var guard = await _guard.CanAddRuleAsync(GetUserId());
        if (!guard.Allowed)
            return StatusCode(403, new { error = guard.Message });

        var rule = new TradingRule
        {
            UserId      = GetUserId(),
            Title       = dto.Title,
            Description = dto.Description,
            IsActive    = true,
            CreatedAt   = DateTime.UtcNow
        };

        _db.TradingRules.Add(rule);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetRules), new { id = rule.Id }, rule);
    }

    /// <summary>Växlar en regels aktiv/inaktiv-status.</summary>
    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> ToggleRule(int id)
    {
        var rule = await _db.TradingRules
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == GetUserId());

        if (rule == null) return NotFound();

        rule.IsActive = !rule.IsActive;
        await _db.SaveChangesAsync();
        return Ok(rule);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRule(int id)
    {
        var rule = await _db.TradingRules
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == GetUserId());

        if (rule == null) return NotFound();

        _db.TradingRules.Remove(rule);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record CreateRuleDto(string Title, string Description);
