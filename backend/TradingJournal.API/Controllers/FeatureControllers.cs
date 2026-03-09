using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TradingJournal.Core.Models;
using TradingJournal.Infrastructure.Data;
using TradingJournal.Infrastructure.DTOs;

namespace TradingJournal.API.Controllers;

// ══════════════════════════════════════════════════════════════
// PLAYBOOK (oförändrad — inga buggar hittade)
// ══════════════════════════════════════════════════════════════
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlaybookController : ControllerBase
{
    private readonly AppDbContext _db;
    public PlaybookController(AppDbContext db) => _db = db;
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Hämtar alla playbooks med länkade trades, win rate och plan-efterföljningsgrad.</summary>
    [HttpGet]
    public async Task<IActionResult> GetPlaybooks()
    {
        var playbooks = await _db.Playbooks
            .Where(p => p.UserId == GetUserId())
            .Include(p => p.PlaybookTrades)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var tradeIds = playbooks
            .SelectMany(p => p.PlaybookTrades.Select(pt => pt.TradeId))
            .Distinct().ToList();

        var trades = await _db.Trades
            .Where(t => tradeIds.Contains(t.Id) && t.ProfitLoss.HasValue)
            .ToListAsync();

        var result = playbooks.Select(p =>
        {
            var linkedTrades = p.PlaybookTrades
                .Join(trades, pt => pt.TradeId, t => t.Id, (pt, t) => new { pt, t })
                .ToList();

            var wins     = linkedTrades.Count(x => x.t.ProfitLoss > 0);
            var total    = linkedTrades.Count;
            var followed = p.PlaybookTrades.Count(pt => pt.FollowedPlan);

            return new
            {
                p.Id, p.Name, p.Description, p.EntryRules, p.ExitRules,
                p.RiskRules, p.Setup, p.Notes, p.IsActive, p.CreatedAt,
                tradeCount       = total,
                winRate          = total > 0 ? (double)wins / total * 100 : 0,
                totalPnl         = linkedTrades.Sum(x => x.t.ProfitLoss!.Value),
                planFollowedRate = total > 0 ? (double)followed / total * 100 : 0
            };
        });

        return Ok(result);
    }

    /// <summary>Hämtar en specifik playbook med tillhörande trades.</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPlaybook(int id)
    {
        var p = await _db.Playbooks
            .Include(p => p.PlaybookTrades)
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == GetUserId());
        if (p == null) return NotFound();
        return Ok(p);
    }

    /// <summary>Skapar en ny playbook med inträdes- och utträdesregler, riskhantering och setup-beskrivning.</summary>
    [HttpPost]
    public async Task<IActionResult> CreatePlaybook([FromBody] CreatePlaybookDto dto)
    {
        var p = new Playbook
        {
            UserId = GetUserId(), Name = dto.Name, Description = dto.Description,
            EntryRules = dto.EntryRules, ExitRules = dto.ExitRules,
            RiskRules = dto.RiskRules, Setup = dto.Setup, Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };
        _db.Playbooks.Add(p);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPlaybook), new { id = p.Id }, p);
    }

    /// <summary>Uppdaterar en befintlig playbook.</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePlaybook(int id, [FromBody] CreatePlaybookDto dto)
    {
        var p = await _db.Playbooks
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == GetUserId());
        if (p == null) return NotFound();
        p.Name = dto.Name; p.Description = dto.Description;
        p.EntryRules = dto.EntryRules; p.ExitRules = dto.ExitRules;
        p.RiskRules  = dto.RiskRules;  p.Setup = dto.Setup; p.Notes = dto.Notes;
        await _db.SaveChangesAsync();
        return Ok(p);
    }

    /// <summary>Kopplar en trade till en playbook och anger om handelsplanen följdes och eventuell avvikelse.</summary>
    [HttpPost("{id}/trades")]
    public async Task<IActionResult> LinkTrade(int id, [FromBody] LinkTradeToPlaybookDto dto)
    {
        var p = await _db.Playbooks
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == GetUserId());
        if (p == null) return NotFound();

        var trade = await _db.Trades
            .FirstOrDefaultAsync(t => t.Id == dto.TradeId && t.UserId == GetUserId());
        if (trade == null) return NotFound();

        var existing = await _db.PlaybookTrades
            .FirstOrDefaultAsync(pt => pt.PlaybookId == id && pt.TradeId == dto.TradeId);
        if (existing != null) _db.PlaybookTrades.Remove(existing);

        _db.PlaybookTrades.Add(new PlaybookTrade
        {
            PlaybookId = id, TradeId = dto.TradeId,
            FollowedPlan = dto.FollowedPlan, Deviation = dto.Deviation
        });
        await _db.SaveChangesAsync();
        return Ok();
    }

    /// <summary>Tar bort en playbook och alla kopplingar till trades permanent.</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePlaybook(int id)
    {
        var p = await _db.Playbooks
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == GetUserId());
        if (p == null) return NotFound();
        _db.Playbooks.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ══════════════════════════════════════════════════════════════
// RISKHANTERINGSREGLER
// BUG FIX: weekStart-beräkning kraschade på söndagar.
// DayOfWeek.Sunday = 0, så: today.AddDays(-(0) + 1) = imorgon (!!)
// Rätt: om söndag, gå 6 dagar bakåt; annars (DayOfWeek - 1) dagar bakåt.
// ══════════════════════════════════════════════════════════════
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RiskRulesController : ControllerBase
{
    private readonly AppDbContext _db;
    public RiskRulesController(AppDbContext db) => _db = db;
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Hämtar alla riskhanteringsregler för inloggad användare.</summary>
    [HttpGet]
    public async Task<IActionResult> GetRules()
    {
        var rules = await _db.RiskRules
            .Where(r => r.UserId == GetUserId())
            .OrderBy(r => r.Type)
            .ToListAsync();
        return Ok(rules);
    }

    /// <summary>Kontrollerar om några riskgränser är brutna idag — daglig/veckovis förlust, konsekutiva förluster, antal trades och win rate.</summary>
    [HttpGet("check")]
    public async Task<IActionResult> CheckRules()
    {
        var userId = GetUserId();
        var rules  = await _db.RiskRules
            .Where(r => r.UserId == userId && r.IsActive)
            .ToListAsync();

        if (!rules.Any())
            return Ok(new { violations = Array.Empty<object>(), shouldStopTrading = false, checkedAt = DateTime.UtcNow });

        var today = DateTime.UtcNow.Date;

        // BUG FIX: DayOfWeek.Sunday = 0.
        // Gamla koden: today.AddDays(-(int)today.DayOfWeek + 1)
        // På söndag: -(0) + 1 = +1 dag framåt = fel vecka!
        // Rätt: om söndag → 6 dagar bakåt, annars (dayIndex - 1) dagar bakåt
        var dayIndex  = (int)today.DayOfWeek;
        var daysToMon = dayIndex == 0 ? 6 : dayIndex - 1;
        var weekStart = today.AddDays(-daysToMon);

        var allTrades = await _db.Trades
            .Where(t => t.UserId == userId && t.ProfitLoss.HasValue)
            .OrderByDescending(t => t.EntryDate)
            .ToListAsync();

        var todayTrades = allTrades.Where(t => t.EntryDate.Date == today).ToList();
        var weekTrades  = allTrades.Where(t => t.EntryDate.Date >= weekStart).ToList();

        var violations = new List<object>();

        foreach (var rule in rules)
        {
            bool   violated = false;
            string detail   = "";

            switch ((RiskRuleType)rule.Type)
            {
                case RiskRuleType.MaxDailyLoss:
                    var dailyPnl = todayTrades.Sum(t => t.ProfitLoss!.Value);
                    if (dailyPnl < -rule.Threshold)
                    { violated = true; detail = $"Dagens förlust: {dailyPnl:F2} (gräns: -{rule.Threshold})"; }
                    break;

                case RiskRuleType.MaxWeeklyLoss:
                    var weeklyPnl = weekTrades.Sum(t => t.ProfitLoss!.Value);
                    if (weeklyPnl < -rule.Threshold)
                    { violated = true; detail = $"Veckans förlust: {weeklyPnl:F2} (gräns: -{rule.Threshold})"; }
                    break;

                case RiskRuleType.MaxConsecutiveLoss:
                    int streak = 0;
                    foreach (var t in allTrades)
                    {
                        if (t.ProfitLoss < 0) streak++;
                        else break;
                    }
                    if (streak >= rule.Threshold)
                    { violated = true; detail = $"{streak} förluster i rad (gräns: {rule.Threshold})"; }
                    break;

                case RiskRuleType.MaxTradesPerDay:
                    if (todayTrades.Count >= rule.Threshold)
                    { violated = true; detail = $"{todayTrades.Count} trades idag (gräns: {rule.Threshold})"; }
                    break;

                case RiskRuleType.MinWinRatePeriod:
                    var last20    = allTrades.Take(20).ToList();
                    var winRate20 = last20.Any()
                        ? (decimal)last20.Count(t => t.ProfitLoss > 0) / last20.Count * 100 : 100;
                    if (winRate20 < rule.Threshold)
                    { violated = true; detail = $"Win rate senaste 20 trades: {winRate20:F0}% (min: {rule.Threshold}%)"; }
                    break;
            }

            if (violated)
                violations.Add(new { rule.Id, rule.Title, rule.Type, detail, severity = "stop" });
        }

        return Ok(new { violations, shouldStopTrading = violations.Any(), checkedAt = DateTime.UtcNow });
    }

    /// <summary>Skapar en ny riskregel (MaxDagligFörlust, MaxVeckoförlust, KonsekutivFörlust, MaxTradesPerDag eller MinWinRate).</summary>
    [HttpPost]
    public async Task<IActionResult> CreateRule([FromBody] CreateRiskRuleDto dto)
    {
        var rule = new RiskRule
        {
            UserId = GetUserId(), Title = dto.Title,
            Type = (RiskRuleType)dto.Type, Threshold = dto.Threshold,
            Description = dto.Description, CreatedAt = DateTime.UtcNow
        };
        _db.RiskRules.Add(rule);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetRules), new { id = rule.Id }, rule);
    }

    /// <summary>Aktiverar eller inaktiverar en riskregel.</summary>
    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> Toggle(int id)
    {
        var r = await _db.RiskRules
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == GetUserId());
        if (r == null) return NotFound();
        r.IsActive = !r.IsActive;
        await _db.SaveChangesAsync();
        return Ok(r);
    }

    /// <summary>Tar bort en riskregel permanent.</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var r = await _db.RiskRules
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == GetUserId());
        if (r == null) return NotFound();
        _db.RiskRules.Remove(r);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ══════════════════════════════════════════════════════════════
// SCREENSHOTS
// BUG FIX: WebRootPath kan vara null om wwwroot-mappen inte existerar
// och UseStaticFiles() inte är konfigurerat. Lade till null-guard
// och fallback till ContentRootPath/wwwroot.
// ══════════════════════════════════════════════════════════════
[ApiController]
[Route("api/trades/{tradeId}/screenshot")]
[Authorize]
public class ScreenshotController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public ScreenshotController(AppDbContext db, IWebHostEnvironment env)
    {
        _db  = db;
        _env = env;
    }
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // BUG FIX: WebRootPath kan vara null. Använder fallback.
    private string GetScreenshotFolder()
    {
        var root = _env.WebRootPath
            ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        return Path.Combine(root, "screenshots");
    }

    /// <summary>Laddar upp en skärmdump för en specifik trade (jpg, png, webp, gif). Max 5 MB.</summary>
    [HttpPost]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> Upload(int tradeId, IFormFile file)
    {
        var trade = await _db.Trades
            .FirstOrDefaultAsync(t => t.Id == tradeId && t.UserId == GetUserId());
        if (trade == null) return NotFound();

        if (file == null || file.Length == 0)
            return BadRequest(new { error = "Ingen fil." });

        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        var ext     = Path.GetExtension(file.FileName).ToLower();
        if (!allowed.Contains(ext))
            return BadRequest(new { error = "Endast bilder tillåts (jpg, png, webp)." });

        var folder = GetScreenshotFolder();
        Directory.CreateDirectory(folder);

        // Ta bort gammal bild
        if (!string.IsNullOrEmpty(trade.ScreenshotPath))
        {
            var oldPath = Path.Combine(folder, trade.ScreenshotPath);
            if (System.IO.File.Exists(oldPath))
                System.IO.File.Delete(oldPath);
        }

        var fileName = $"{GetUserId()}_{tradeId}_{DateTime.UtcNow:yyyyMMddHHmmss}{ext}";
        var filePath = Path.Combine(folder, fileName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        trade.ScreenshotPath = fileName;
        await _db.SaveChangesAsync();

        return Ok(new { screenshotPath = fileName, url = $"/screenshots/{fileName}" });
    }

    /// <summary>Tar bort skärmdumpen för en specifik trade från servern och rensar sökvägen i databasen.</summary>
    [HttpDelete]
    public async Task<IActionResult> Delete(int tradeId)
    {
        var trade = await _db.Trades
            .FirstOrDefaultAsync(t => t.Id == tradeId && t.UserId == GetUserId());
        if (trade == null) return NotFound();

        if (!string.IsNullOrEmpty(trade.ScreenshotPath))
        {
            var path = Path.Combine(GetScreenshotFolder(), trade.ScreenshotPath);
            if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
            trade.ScreenshotPath = null;
            await _db.SaveChangesAsync();
        }
        return NoContent();
    }
}
