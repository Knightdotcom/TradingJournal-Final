namespace TradingJournal.Infrastructure.Services;

// Avgör vilken broker en CSV-fil kommer ifrån
// genom att titta på kolumnnamnen i första raden
public static class BrokerDetector
{
    public enum BrokerType
    {
        Binance,
        Alpaca,
        InteractiveBrokers,
        OANDA,
        MetaTrader,
        Nordnet,
        Generic  // Fallback för okända brokers
    }

    public static BrokerType Detect(string headerLine)
    {
        // Normalisera — ta bort citattecken och gör lowercase
        var header = headerLine.ToLower().Replace("\"", "");

        if (header.Contains("order_id") && header.Contains("realized_pnl") && header.Contains("side"))
            return BrokerType.Binance;

        if (header.Contains("symbol") && header.Contains("filled_avg_price") && header.Contains("qty"))
            return BrokerType.Alpaca;

        if (header.Contains("tradeid") && header.Contains("ibcommission") && header.Contains("netcash"))
            return BrokerType.InteractiveBrokers;

        if (header.Contains("instrument") && header.Contains("units") && header.Contains("pl"))
            return BrokerType.OANDA;

        if (header.Contains("ticket") && header.Contains("volume") && header.Contains("profit"))
            return BrokerType.MetaTrader;

        if (header.Contains("värdepapper") || header.Contains("transaktionstyp") && header.Contains("kurs"))
            return BrokerType.Nordnet;

        return BrokerType.Generic;
    }

    public static string GetDisplayName(BrokerType broker) => broker switch
    {
        BrokerType.Binance => "Binance",
        BrokerType.Alpaca => "Alpaca",
        BrokerType.InteractiveBrokers => "Interactive Brokers",
        BrokerType.OANDA => "OANDA",
        BrokerType.MetaTrader => "MetaTrader 4/5",
        BrokerType.Nordnet => "Nordnet",
        _ => "Generisk CSV"
    };
}
