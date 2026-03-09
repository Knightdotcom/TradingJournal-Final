namespace TradingJournal.Core.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public SubscriptionPlan Plan { get; set; } = SubscriptionPlan.Free;
    public DateTime? PlanExpiresAt { get; set; }

    public bool HasActivePaidPlan =>
        Plan != SubscriptionPlan.Free &&
        (PlanExpiresAt == null || PlanExpiresAt > DateTime.UtcNow);

    public SubscriptionPlan ActivePlan =>
        HasActivePaidPlan ? Plan : SubscriptionPlan.Free;

    public ICollection<Trade> Trades { get; set; } = new List<Trade>();
    public ICollection<TradingRule> TradingRules { get; set; } = new List<TradingRule>();
    public ICollection<Reminder> Reminders { get; set; } = new List<Reminder>();
    public ICollection<ForumPost> ForumPosts { get; set; } = new List<ForumPost>();
}
