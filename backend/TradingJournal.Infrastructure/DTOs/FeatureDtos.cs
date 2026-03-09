namespace TradingJournal.Infrastructure.DTOs;

// ── Checklista ───────────────────────────────────────────────────────────────

public record CreateChecklistTemplateDto(string Question, int SortOrder);

public class SaveDailyChecklistDto
{
    public DateTime Date { get; set; }
    public Dictionary<int, bool> Answers { get; set; } = new(); // { templateId: true/false }
    public string? Notes { get; set; }
}

// ── Mål ──────────────────────────────────────────────────────────────────────

public class CreateGoalDto
{
    public string Title { get; set; } = string.Empty;
    public int Type { get; set; }            // GoalType enum
    public decimal TargetValue { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

// ── Playbook ─────────────────────────────────────────────────────────────────

public class CreatePlaybookDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? EntryRules { get; set; }
    public string? ExitRules { get; set; }
    public string? RiskRules { get; set; }
    public string? Setup { get; set; }
    public string? Notes { get; set; }
}

public class LinkTradeToPlaybookDto
{
    public int TradeId { get; set; }
    public bool FollowedPlan { get; set; }
    public string? Deviation { get; set; }
}

// ── Riskhantering ────────────────────────────────────────────────────────────

public class CreateRiskRuleDto
{
    public string Title { get; set; } = string.Empty;
    public int Type { get; set; }            // RiskRuleType enum
    public decimal Threshold { get; set; }
    public string? Description { get; set; }
}

// ── Trade-uppdatering med taggar ─────────────────────────────────────────────

public class CreateTradeDto
{
    public string Symbol { get; set; } = string.Empty;
    public string Direction { get; set; } = "Long";
    public decimal EntryPrice { get; set; }
    public decimal? ExitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal? LotSize { get; set; }
    public decimal? ProfitLoss { get; set; }
    public DateTime EntryDate { get; set; }
    public DateTime? ExitDate { get; set; }
    public string? Notes { get; set; }
    public string? Strategy { get; set; }
    public List<string> Tags { get; set; } = new();  // NYTT
}
