using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using TradingJournal.Core.Models;
using TradingJournal.Infrastructure.Data;
using TradingJournal.Infrastructure.DTOs;

namespace TradingJournal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChecklistController : ControllerBase
{
    private readonly AppDbContext _db;
    public ChecklistController(AppDbContext db) => _db = db;
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ── Checklistmallar (frågorna) ────────────────────────────────────────────

    /// <summary>Hämtar alla aktiva pre-market checklistfrågor för inloggad användare.</summary>
    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates()
    {
        var templates = await _db.ChecklistTemplates
            .Where(t => t.UserId == GetUserId() && t.IsActive)
            .OrderBy(t => t.SortOrder)
            .ToListAsync();
        return Ok(templates);
    }

    /// <summary>Skapar en ny pre-market checklistfråga.</summary>
    [HttpPost("templates")]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateChecklistTemplateDto dto)
    {
        var template = new ChecklistTemplate
        {
            UserId    = GetUserId(),
            Question  = dto.Question,
            SortOrder = dto.SortOrder,
            CreatedAt = DateTime.UtcNow
        };
        _db.ChecklistTemplates.Add(template);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTemplates), new { id = template.Id }, template);
    }

    /// <summary>Inaktiverar en checklistfråga (soft delete — historiken bevaras).</summary>
    [HttpDelete("templates/{id}")]
    public async Task<IActionResult> DeleteTemplate(int id)
    {
        var t = await _db.ChecklistTemplates
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == GetUserId());
        if (t == null) return NotFound();
        t.IsActive = false; // Soft delete — behåller historiken
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Dagliga svar ─────────────────────────────────────────────────────────

    /// <summary>Hämtar dagens pre-market checklista med frågor och eventuella sparade svar.</summary>
    [HttpGet("today")]
    public async Task<IActionResult> GetToday()
    {
        var today = DateTime.UtcNow.Date;
        var entry = await _db.DailyChecklists
            .FirstOrDefaultAsync(c => c.UserId == GetUserId() && c.Date == today);

        var templates = await _db.ChecklistTemplates
            .Where(t => t.UserId == GetUserId() && t.IsActive)
            .OrderBy(t => t.SortOrder)
            .ToListAsync();

        Dictionary<int, bool> answers = new();
        if (entry != null)
        {
            try { answers = JsonSerializer.Deserialize<Dictionary<int, bool>>(entry.Answers) ?? new(); }
            catch { }
        }

        return Ok(new
        {
            date      = today,
            allPassed = entry?.AllPassed ?? false,
            notes     = entry?.Notes,
            templates,
            answers
        });
    }

    /// <summary>Sparar dagens svar på pre-market checklistan.</summary>
    [HttpPost("today")]
    public async Task<IActionResult> SaveToday([FromBody] SaveDailyChecklistDto dto)
    {
        var date  = dto.Date.Date;
        var entry = await _db.DailyChecklists
            .FirstOrDefaultAsync(c => c.UserId == GetUserId() && c.Date == date);

        var allPassed = dto.Answers.Count > 0 && dto.Answers.Values.All(v => v);
        var answersJson = JsonSerializer.Serialize(dto.Answers);

        if (entry == null)
        {
            entry = new DailyChecklist
            {
                UserId    = GetUserId(),
                Date      = date,
                CreatedAt = DateTime.UtcNow
            };
            _db.DailyChecklists.Add(entry);
        }

        entry.Answers   = answersJson;
        entry.AllPassed = allPassed;
        entry.Notes     = dto.Notes;

        await _db.SaveChangesAsync();
        return Ok(new { allPassed, date });
    }

    /// <summary>Hämtar historik för pre-market checklistan. Standard: senaste 30 dagarna.</summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int days = 30)
    {
        var from = DateTime.UtcNow.Date.AddDays(-days);
        var history = await _db.DailyChecklists
            .Where(c => c.UserId == GetUserId() && c.Date >= from)
            .OrderByDescending(c => c.Date)
            .Select(c => new { c.Date, c.AllPassed, c.Notes })
            .ToListAsync();
        return Ok(history);
    }
}
