using Microsoft.EntityFrameworkCore;
using TradingJournal.Core.Models;
using TradingJournal.Infrastructure.Data;

namespace TradingJournal.Infrastructure.Services;

// PlanGuard kontrollerar om en användare har nått sin plans gränser
// Anropas från controllers innan en ny resurs skapas
// På det här sättet sitter all planbegränsningslogik på ett ställe
public class PlanGuard
{
    private readonly AppDbContext _db;

    public PlanGuard(AppDbContext db) => _db = db;

    public record GuardResult(bool Allowed, string? Message = null);

    // Kollar om användaren kan lägga till fler trades
    public async Task<GuardResult> CanAddTradeAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return new GuardResult(false, "Användare hittades inte.");

        // Betalande användare har inga begränsningar
        if (user.ActivePlan != SubscriptionPlan.Free)
            return new GuardResult(true);

        var count = await _db.Trades.CountAsync(t => t.UserId == userId);
        if (count >= PlanLimits.Free.MaxTrades)
            return new GuardResult(false,
                $"Gratisplanen tillåter max {PlanLimits.Free.MaxTrades} trades. " +
                "Uppgradera till Pro för obegränsat antal.");

        return new GuardResult(true);
    }

    // Kollar om användaren kan lägga till fler regler
    public async Task<GuardResult> CanAddRuleAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return new GuardResult(false, "Användare hittades inte.");

        if (user.ActivePlan != SubscriptionPlan.Free)
            return new GuardResult(true);

        var count = await _db.TradingRules.CountAsync(r => r.UserId == userId);
        if (count >= PlanLimits.Free.MaxRules)
            return new GuardResult(false,
                $"Gratisplanen tillåter max {PlanLimits.Free.MaxRules} regler. " +
                "Uppgradera till Pro för obegränsat antal.");

        return new GuardResult(true);
    }

    // Kollar om användaren kan lägga till fler påminnelser
    public async Task<GuardResult> CanAddReminderAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return new GuardResult(false, "Användare hittades inte.");

        if (user.ActivePlan != SubscriptionPlan.Free)
            return new GuardResult(true);

        var count = await _db.Reminders.CountAsync(r => r.UserId == userId);
        if (count >= PlanLimits.Free.MaxReminders)
            return new GuardResult(false,
                $"Gratisplanen tillåter max {PlanLimits.Free.MaxReminders} påminnelser. " +
                "Uppgradera till Pro för obegränsat antal.");

        return new GuardResult(true);
    }

    // Returnerar sammanfattning av planstatus för en användare
    // Används av frontend för att visa "X av Y trades använda"
    public async Task<PlanStatusDto> GetStatusAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) throw new Exception("Användare hittades inte.");

        var tradeCount    = await _db.Trades.CountAsync(t => t.UserId == userId);
        var ruleCount     = await _db.TradingRules.CountAsync(r => r.UserId == userId);
        var reminderCount = await _db.Reminders.CountAsync(r => r.UserId == userId);

        var isPaid = user.ActivePlan != SubscriptionPlan.Free;

        return new PlanStatusDto
        {
            Plan            = user.ActivePlan.ToString(),
            PlanExpiresAt   = user.PlanExpiresAt,
            TradesUsed      = tradeCount,
            TradesMax       = isPaid ? null : PlanLimits.Free.MaxTrades,
            RulesUsed       = ruleCount,
            RulesMax        = isPaid ? null : PlanLimits.Free.MaxRules,
            RemindersUsed   = reminderCount,
            RemindersMax    = isPaid ? null : PlanLimits.Free.MaxReminders,
            CanExport       = true,  // Alltid tillåtet — vår konkurrensfördel
            CanImportCsv    = true,
        };
    }
}

// DTO för planstatus — null på Max betyder obegränsat
public class PlanStatusDto
{
    public string Plan { get; set; } = "Free";
    public DateTime? PlanExpiresAt { get; set; }
    public int TradesUsed { get; set; }
    public int? TradesMax { get; set; }
    public int RulesUsed { get; set; }
    public int? RulesMax { get; set; }
    public int RemindersUsed { get; set; }
    public int? RemindersMax { get; set; }
    public bool CanExport { get; set; }
    public bool CanImportCsv { get; set; }
}
