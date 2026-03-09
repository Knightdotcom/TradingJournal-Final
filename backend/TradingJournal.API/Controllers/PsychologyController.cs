using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TradingJournal.Core.Models;
using TradingJournal.Infrastructure.Data;
using TradingJournal.Infrastructure.DTOs;

namespace TradingJournal.API.Controllers;

[ApiController]
[Route("api/trades/{tradeId}/psychology")]
[Authorize]
public class PsychologyController : ControllerBase
{
    private readonly AppDbContext _db;
    public PsychologyController(AppDbContext db) => _db = db;

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Hämtar psykologidata för en specifik trade.</summary>
    [HttpGet]
    public async Task<IActionResult> Get(int tradeId)
    {
        // Verifiera att traden tillhör användaren
        var trade = await _db.Trades
            .FirstOrDefaultAsync(t => t.Id == tradeId && t.UserId == GetUserId());
        if (trade == null) return NotFound();

        var psych = await _db.TradePsychologies
            .FirstOrDefaultAsync(p => p.TradeId == tradeId);

        if (psych == null) return NotFound();

        return Ok(await BuildResponseAsync(psych));
    }

    /// <summary>Skapar eller uppdaterar psykologilogg för en trade. Skalvärden 1–5 krävs för humör, fokus, disciplin och självförtroende.</summary>
    [HttpPut]
    public async Task<IActionResult> Upsert(int tradeId, [FromBody] UpsertPsychologyDto dto)
    {
        var trade = await _db.Trades
            .FirstOrDefaultAsync(t => t.Id == tradeId && t.UserId == GetUserId());
        if (trade == null) return NotFound();

        // Validera skalvärden (1-5)
        if (!IsValidScale(dto.MoodBefore, dto.ConfidenceBefore, dto.FocusBefore,
                          dto.MoodAfter, dto.DisciplineScore))
            return BadRequest(new { error = "Alla skalvärden måste vara mellan 1 och 5." });

        var psych = await _db.TradePsychologies
            .FirstOrDefaultAsync(p => p.TradeId == tradeId);

        if (psych == null)
        {
            // Skapa ny
            psych = new TradePsychology { TradeId = tradeId };
            _db.TradePsychologies.Add(psych);
        }
        else
        {
            psych.UpdatedAt = DateTime.UtcNow;
        }

        // Uppdatera fälten
        psych.MoodBefore       = dto.MoodBefore;
        psych.ConfidenceBefore = dto.ConfidenceBefore;
        psych.FocusBefore      = dto.FocusBefore;
        psych.MoodAfter        = dto.MoodAfter;
        psych.DisciplineScore  = dto.DisciplineScore;
        psych.EmotionTag       = dto.EmotionTag;
        psych.PreTradeNote     = dto.PreTradeNote;
        psych.PostTradeNote    = dto.PostTradeNote;
        psych.BrokenRuleIds    = dto.BrokenRuleIds.Count > 0
            ? string.Join(",", dto.BrokenRuleIds) : null;
        psych.BrokenRuleNote   = dto.BrokenRuleNote;

        await _db.SaveChangesAsync();
        return Ok(await BuildResponseAsync(psych));
    }

    /// <summary>Tar bort psykologiloggen för en specifik trade.</summary>
    [HttpDelete]
    public async Task<IActionResult> Delete(int tradeId)
    {
        var trade = await _db.Trades
            .FirstOrDefaultAsync(t => t.Id == tradeId && t.UserId == GetUserId());
        if (trade == null) return NotFound();

        var psych = await _db.TradePsychologies
            .FirstOrDefaultAsync(p => p.TradeId == tradeId);
        if (psych == null) return NotFound();

        _db.TradePsychologies.Remove(psych);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Returnerar aggregerad psykologistatistik: snittvärden för disciplin och humör, känslofördelning samt vilka regler som bryts mest.</summary>
    [HttpGet("/api/psychology/stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();

        // Hämta alla psyk-poster kopplade till användarens trades
        var stats = await _db.TradePsychologies
            .Include(p => p.Trade)
            .Where(p => p.Trade.UserId == userId)
            .ToListAsync();

        if (!stats.Any())
            return Ok(new { message = "Ingen psykologidata ännu." });

        // Räkna ut vanligaste emotions-taggen
        var emotionGroups = stats
            .Where(p => p.EmotionTag != null)
            .GroupBy(p => p.EmotionTag!)
            .Select(g => new { emotion = g.Key, count = g.Count() })
            .OrderByDescending(g => g.count)
            .ToList();

        // Regelbrott-analys: vilken regel bryts mest?
        var allBrokenIds = stats
            .Where(p => p.BrokenRuleIds != null)
            .SelectMany(p => p.BrokenRuleIds!.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(id => int.TryParse(id, out var i) ? i : -1)
                .Where(id => id > 0))
            .ToList();

        var ruleBreakCounts = allBrokenIds
            .GroupBy(id => id)
            .Select(g => new { ruleId = g.Key, count = g.Count() })
            .OrderByDescending(g => g.count)
            .ToList();

        return Ok(new
        {
            totalEntries          = stats.Count,
            avgDisciplineScore    = stats.Average(p => p.DisciplineScore),
            avgMoodBefore         = stats.Average(p => p.MoodBefore),
            avgMoodAfter          = stats.Average(p => p.MoodAfter),
            avgConfidence         = stats.Average(p => p.ConfidenceBefore),
            emotionDistribution   = emotionGroups,
            mostBrokenRuleIds     = ruleBreakCounts,
            tradesWith100Discipline = stats.Count(p => p.DisciplineScore == 5),
            tradesWithRuleBreaks  = stats.Count(p => p.BrokenRuleIds != null)
        });
    }

    // Bygg ut DTO med regelnamn
    private async Task<PsychologyResponseDto> BuildResponseAsync(TradePsychology psych)
    {
        var ruleIds = psych.BrokenRuleIds?
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(id => int.TryParse(id, out var i) ? i : -1)
            .Where(id => id > 0)
            .ToList() ?? new List<int>();

        var rules = ruleIds.Any()
            ? await _db.TradingRules
                .Where(r => ruleIds.Contains(r.Id))
                .Select(r => new BrokenRuleInfo { Id = r.Id, Title = r.Title })
                .ToListAsync()
            : new List<BrokenRuleInfo>();

        return new PsychologyResponseDto
        {
            Id               = psych.Id,
            TradeId          = psych.TradeId,
            MoodBefore       = psych.MoodBefore,
            ConfidenceBefore = psych.ConfidenceBefore,
            FocusBefore      = psych.FocusBefore,
            MoodAfter        = psych.MoodAfter,
            DisciplineScore  = psych.DisciplineScore,
            EmotionTag       = psych.EmotionTag,
            PreTradeNote     = psych.PreTradeNote,
            PostTradeNote    = psych.PostTradeNote,
            BrokenRuleIds    = ruleIds,
            BrokenRuleNote   = psych.BrokenRuleNote,
            BrokenRules      = rules,
            CreatedAt        = psych.CreatedAt,
            UpdatedAt        = psych.UpdatedAt
        };
    }

    private static bool IsValidScale(params int[] values) =>
        values.All(v => v >= 1 && v <= 5);
}
