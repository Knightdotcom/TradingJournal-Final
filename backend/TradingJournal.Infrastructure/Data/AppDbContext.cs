using Microsoft.EntityFrameworkCore;
using TradingJournal.Core.Models;

namespace TradingJournal.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Base tables
    public DbSet<User>         Users        => Set<User>();
    public DbSet<Trade>        Trades       => Set<Trade>();
    public DbSet<TradingRule>  TradingRules => Set<TradingRule>();
    public DbSet<Reminder>     Reminders    => Set<Reminder>();
    public DbSet<ForumPost>    ForumPosts   => Set<ForumPost>();
    public DbSet<ForumComment> ForumComments => Set<ForumComment>();

    // Psychology
    public DbSet<TradePsychology> TradePsychologies { get; set; }

    // Pre-market checklist
    public DbSet<ChecklistTemplate> ChecklistTemplates { get; set; }
    public DbSet<DailyChecklist>    DailyChecklists    { get; set; }

    // Goals
    public DbSet<TradingGoal> Goals { get; set; }

    // Playbook
    public DbSet<Playbook>      Playbooks      { get; set; }
    public DbSet<PlaybookTrade> PlaybookTrades { get; set; }

    // Risk management
    public DbSet<RiskRule> RiskRules { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Trade decimal precision
        modelBuilder.Entity<Trade>(entity =>
        {
            entity.Property(t => t.EntryPrice).HasPrecision(18, 8);
            entity.Property(t => t.ExitPrice).HasPrecision(18, 8);
            entity.Property(t => t.ProfitLoss).HasPrecision(18, 2);
            entity.Property(t => t.LotSize).HasPrecision(18, 4);
        });

        // Unique email index
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email).IsUnique();

        // TradePsychology — one-to-one with Trade
        modelBuilder.Entity<TradePsychology>(entity =>
        {
            entity.HasOne(p => p.Trade)
                  .WithOne(t => t.Psychology)
                  .HasForeignKey<TradePsychology>(p => p.TradeId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // PlaybookTrade — junction table
        modelBuilder.Entity<PlaybookTrade>(entity =>
        {
            entity.HasOne(pt => pt.Playbook)
                  .WithMany(p => p.PlaybookTrades)
                  .HasForeignKey(pt => pt.PlaybookId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pt => pt.Trade)
                  .WithMany(t => t.PlaybookTrades)
                  .HasForeignKey(pt => pt.TradeId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        // ForumPost — cascade from User
        modelBuilder.Entity<ForumPost>(entity =>
        {
            entity.HasOne(p => p.User)
                  .WithMany(u => u.ForumPosts)
                  .HasForeignKey(p => p.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ForumComment — bryt cascade-cykeln (User→ForumPost→ForumComment + User→ForumComment)
        modelBuilder.Entity<ForumComment>(entity =>
        {
            // Kommentarer raderas via ForumPost cascade — ingen direkt cascade från User
            entity.HasOne(c => c.User)
                  .WithMany()
                  .HasForeignKey(c => c.UserId)
                  .OnDelete(DeleteBehavior.NoAction);

            // ForumPost cascade tar hand om radering av kommentarer
            entity.HasOne(c => c.ForumPost)
                  .WithMany(p => p.Comments)
                  .HasForeignKey(c => c.ForumPostId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
