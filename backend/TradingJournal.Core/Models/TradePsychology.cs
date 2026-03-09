namespace TradingJournal.Core.Models;

// Psykologi-journalen kopplas till en specifik trade
// Tanken: efter varje trade fyller du i hur du mådde och varför du handlade
// Det är precis det konkurrenter som Edgewonk gör bra men TradeZella saknar
public class TradePsychology
{
    public int Id { get; set; }

    // Koppling till trade (en trade har en psykologi-post)
    public int TradeId { get; set; }
    public Trade Trade { get; set; } = null!;

    // ── Känslor FÖRE traden ────────────────────────────────────────
    // Skala 1-5: 1 = mycket dålig, 5 = utmärkt
    public int MoodBefore { get; set; }         // Humör innan trade
    public int ConfidenceBefore { get; set; }   // Självförtroende i setuppet
    public int FocusBefore { get; set; }        // Fokus/koncentration

    // ── Känslor EFTER traden ───────────────────────────────────────
    public int MoodAfter { get; set; }          // Humör efter trade
    public int DisciplineScore { get; set; }    // Följde du din plan? 1-5

    // ── Typ av känsla som drev traden ─────────────────────────────
    // FOMO, Revenge, Greed, Fear, Disciplined, etc.
    public string? EmotionTag { get; set; }

    // ── Fritext-reflektion ─────────────────────────────────────────
    public string? PreTradeNote { get; set; }   // Tankar INNAN
    public string? PostTradeNote { get; set; }  // Reflektion EFTER

    // ── Regelbrott ────────────────────────────────────────────────
    // Vilka regler bröt du mot på den här traden? (kommaseparerade regel-IDs)
    public string? BrokenRuleIds { get; set; }
    public string? BrokenRuleNote { get; set; } // Varför bröt du mot dem?

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
