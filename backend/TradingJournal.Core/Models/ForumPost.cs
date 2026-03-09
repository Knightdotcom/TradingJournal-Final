namespace TradingJournal.Core.Models;

// Ett foruminlägg
public class ForumPost
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<ForumComment> Comments { get; set; } = new List<ForumComment>();
}
