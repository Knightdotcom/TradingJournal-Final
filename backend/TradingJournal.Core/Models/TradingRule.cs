namespace TradingJournal.Core.Models;

// En tradingregel som användaren sätter upp för sig själv
public class TradingRule
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;        // T.ex. "Max 2% risk per trade"
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
