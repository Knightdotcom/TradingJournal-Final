namespace TradingJournal.Core.Models;

public enum SubscriptionPlan
{
    Free  = 0,
    Pro   = 1,
    Elite = 2
}

public static class PlanLimits
{
    public static class Free
    {
        public const int MaxTrades     = 50;
        public const int MaxRules      = 5;
        public const int MaxReminders  = 3;
        public const bool CanExport    = true;
        public const bool CanImportCsv = true;
    }
}
