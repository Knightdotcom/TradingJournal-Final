namespace TradingJournal.Core.Models;

// En daglig påminnelse som användaren skapar
public class Reminder
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public TimeOnly ReminderTime { get; set; }   // Klockslag, t.ex. 09:00
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
