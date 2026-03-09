namespace TradingJournal.Core.Models;

// ══════════════════════════════════════════════════════════════
// 1. TRADE-TAGGAR
// En trade kan ha många taggar, en tagg kan tillhöra många trades
// Sparas som kommaseparerad sträng på Trade-modellen för enkelhet
// ══════════════════════════════════════════════════════════════

// Taggar lagras direkt på Trade som: Tags = "breakout,earnings,scalp"
// Ingen separat tabell behövs — enkelt och snabbt

// ══════════════════════════════════════════════════════════════
// 2. PRE-MARKET CHECKLISTA
// ══════════════════════════════════════════════════════════════
public class ChecklistTemplate
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Question { get; set; } = string.Empty; // T.ex. "Har du sovit minst 7h?"
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

public class DailyChecklist
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateTime Date { get; set; }           // Datum för checklistans dag
    public string Answers { get; set; } = "{}";  // JSON: { "1": true, "2": false, ... }
    public bool AllPassed { get; set; }          // Snabb boolean — fick du handla?
    public string? Notes { get; set; }           // Fritext om dagen
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

// ══════════════════════════════════════════════════════════════
// 3. MÅL & MILSTOLPAR
// ══════════════════════════════════════════════════════════════
public class TradingGoal
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;         // "Tjäna 5000 kr i mars"
    public GoalType Type { get; set; }
    public decimal TargetValue { get; set; }                  // Målvärdet
    public decimal CurrentValue { get; set; }                 // Nuvarande värde (uppdateras automatiskt)
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

public enum GoalType
{
    PnlTarget       = 0,  // Tjäna X kr
    WinRateTarget   = 1,  // Nå X% win rate
    TradeCount      = 2,  // Ta X antal trades
    MaxLossStreak   = 3,  // Max X förluster i rad
    ConsistencyDays = 4   // Journalföra X dagar i rad
}

// ══════════════════════════════════════════════════════════════
// 4. PLAYBOOK — HANDELSPLAN PER STRATEGI
// ══════════════════════════════════════════════════════════════
public class Playbook
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;          // "Gap and Go"
    public string? Description { get; set; }
    public string? EntryRules { get; set; }                   // Fritext: när du FÅR gå in
    public string? ExitRules { get; set; }                    // Fritext: när du MÅSTE gå ut
    public string? RiskRules { get; set; }                    // Fritext: position size, stop loss
    public string? Setup { get; set; }                        // Fritext: vad letade du efter i chartet
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<PlaybookTrade> PlaybookTrades { get; set; } = new List<PlaybookTrade>();
}

// Kopplingstabell: vilka trades använder en viss playbook?
public class PlaybookTrade
{
    public int Id { get; set; }
    public int PlaybookId { get; set; }
    public int TradeId { get; set; }
    public bool FollowedPlan { get; set; }        // Följde du planen?
    public string? Deviation { get; set; }         // Om nej — vad avvek du ifrån?

    public Playbook Playbook { get; set; } = null!;
    public Trade Trade { get; set; } = null!;
}

// ══════════════════════════════════════════════════════════════
// 5. RISKHANTERINGSREGLER
// ══════════════════════════════════════════════════════════════
public class RiskRule
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public RiskRuleType Type { get; set; }
    public decimal Threshold { get; set; }         // Gränsvärdet
    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

public enum RiskRuleType
{
    MaxDailyLoss      = 0,  // Stoppa om förlust > X kr idag
    MaxWeeklyLoss     = 1,  // Stoppa om förlust > X kr denna vecka
    MaxConsecutiveLoss = 2, // Stoppa efter X förlorare i rad
    MaxTradesPerDay   = 3,  // Max X trades per dag
    MinWinRatePeriod  = 4,  // Varna om win rate < X% senaste 20 trades
    MaxDrawdown       = 5,  // Stoppa vid X% drawdown från peak
}
