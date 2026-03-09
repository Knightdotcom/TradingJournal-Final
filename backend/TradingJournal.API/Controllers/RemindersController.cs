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
public class RemindersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PlanGuard _guard;

    public RemindersController(AppDbContext db, PlanGuard guard)
    {
        _db    = db;
        _guard = guard;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Hämtar alla aktiva påminnelser för inloggad användare.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Reminders
            .Where(r => r.UserId == GetUserId() && r.IsActive)
            .ToListAsync());

    /// <summary>Skapar en ny påminnelse. Kontrollerar plangräns (Free: max 3 påminnelser).</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Reminder dto)
    {
        var guard = await _guard.CanAddReminderAsync(GetUserId());
        if (!guard.Allowed)
            return StatusCode(403, new { error = guard.Message });

        var reminder = new Reminder
        {
            UserId       = GetUserId(),
            Title        = dto.Title,
            Message      = dto.Message,
            ReminderTime = dto.ReminderTime,
            IsActive     = true
        };
        _db.Reminders.Add(reminder);
        await _db.SaveChangesAsync();
        return Ok(reminder);
    }

    /// <summary>Tar bort en påminnelse permanent.</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var reminder = await _db.Reminders
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == GetUserId());
        if (reminder == null) return NotFound();
        _db.Reminders.Remove(reminder);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
