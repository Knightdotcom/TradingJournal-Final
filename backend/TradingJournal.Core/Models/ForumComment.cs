namespace TradingJournal.Core.Models;

// En kommentar på ett foruminlägg
public class ForumComment
{
    public int Id { get; set; }
    public int ForumPostId { get; set; }
    public int UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ForumPost ForumPost { get; set; } = null!;
    public User User { get; set; } = null!;
}
