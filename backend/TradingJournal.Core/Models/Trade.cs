namespace TradingJournal.Core.Models;

public class Trade
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string Direction { get; set; } = string.Empty;
    public decimal EntryPrice { get; set; }
    public decimal? ExitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal? LotSize { get; set; }
    public DateTime EntryDate { get; set; }
    public DateTime? ExitDate { get; set; }
    public decimal? ProfitLoss { get; set; }
    public string? Notes { get; set; }
    public string? Strategy { get; set; }
    public string? BrokerRowId { get; set; }

    // NYTT: Taggar sparas kommaseparerat — enkelt och snabbt att filtrera
    // Exempel: "breakout,earnings,morning"
    public string? Tags { get; set; }

    // NYTT: Länk till uppladdad screenshot (filsökväg eller URL)
    public string? ScreenshotPath { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public TradePsychology? Psychology { get; set; }
    public ICollection<PlaybookTrade> PlaybookTrades { get; set; } = new List<PlaybookTrade>();
}
