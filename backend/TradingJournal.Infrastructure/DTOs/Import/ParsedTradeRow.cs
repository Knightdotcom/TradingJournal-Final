namespace TradingJournal.Infrastructure.DTOs.Import;

// En normaliserad trade-rad efter att CSV:n har tolkats
// Oavsett vilken broker CSV:n kommer ifrån konverteras den till detta format
public class ParsedTradeRow
{
    public string Symbol { get; set; } = string.Empty;
    public string Direction { get; set; } = "Long";   // "Long" eller "Short"
    public decimal EntryPrice { get; set; }
    public decimal? ExitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal? LotSize { get; set; }             // För forex/CFD
    public decimal? ProfitLoss { get; set; }
    public DateTime EntryDate { get; set; }
    public DateTime? ExitDate { get; set; }
    public string? Strategy { get; set; }
    public string? Notes { get; set; }
    public string RowIdentifier { get; set; } = string.Empty; // Unik ID från broker för dubblettcheck
}
