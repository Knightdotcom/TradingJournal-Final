namespace TradingJournal.Infrastructure.DTOs;

// DTO för att skapa/uppdatera en psykologi-post
public class UpsertPsychologyDto
{
    public int MoodBefore { get; set; }        // 1-5
    public int ConfidenceBefore { get; set; }  // 1-5
    public int FocusBefore { get; set; }       // 1-5
    public int MoodAfter { get; set; }         // 1-5
    public int DisciplineScore { get; set; }   // 1-5
    public string? EmotionTag { get; set; }    // "FOMO" | "Revenge" | "Greed" | "Fear" | "Disciplined" | "Boredom"
    public string? PreTradeNote { get; set; }
    public string? PostTradeNote { get; set; }
    public List<int> BrokenRuleIds { get; set; } = new();
    public string? BrokenRuleNote { get; set; }
}

// DTO för svar — inkluderar regelnamn för visning i frontend
public class PsychologyResponseDto
{
    public int Id { get; set; }
    public int TradeId { get; set; }
    public int MoodBefore { get; set; }
    public int ConfidenceBefore { get; set; }
    public int FocusBefore { get; set; }
    public int MoodAfter { get; set; }
    public int DisciplineScore { get; set; }
    public string? EmotionTag { get; set; }
    public string? PreTradeNote { get; set; }
    public string? PostTradeNote { get; set; }
    public List<int> BrokenRuleIds { get; set; } = new();
    public string? BrokenRuleNote { get; set; }
    public List<BrokenRuleInfo> BrokenRules { get; set; } = new(); // Regelnamnen
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class BrokenRuleInfo
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
}
