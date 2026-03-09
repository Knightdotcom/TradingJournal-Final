
using TradingJournal.Infrastructure.DTOs.Import;

namespace TradingJournal.Infrastructure.Services;

// Varje broker har sitt eget kolumnformat
// Dessa parsers konverterar broker-specifika rader till ParsedTradeRow

// ─────────────────────────────────────────────
// BINANCE
// Kolumner: Order_ID, Symbol, Side, Price, Executed Qty, Time, Realized_PnL
// ─────────────────────────────────────────────
public class BinanceCsvParser
{
    public static ParsedTradeRow? ParseRow(string[] headers, string[] cols)
    {
        try
        {
            var row = MapColumns(headers, cols);

            return new ParsedTradeRow
            {
                Symbol        = GetValue(row, "symbol").ToUpper(),
                Direction     = GetValue(row, "side").ToLower() == "buy" ? "Long" : "Short",
                EntryPrice    = ParseDecimal(GetValue(row, "price")),
                Quantity      = (int)ParseDecimal(GetValue(row, "executed qty")),
                ProfitLoss    = TryParseDecimal(GetValue(row, "realized_pnl")),
                EntryDate     = ParseDate(GetValue(row, "time")),
                RowIdentifier = GetValue(row, "order_id")
            };
        }
        catch { return null; }
    }

    private static Dictionary<string, string> MapColumns(string[] headers, string[] cols)
    {
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < headers.Length && i < cols.Length; i++)
            map[headers[i].Trim().Replace("\"", "")] = cols[i].Trim().Replace("\"", "");
        return map;
    }

    private static string GetValue(Dictionary<string, string> map, string key) =>
        map.TryGetValue(key, out var val) ? val : "";

    private static decimal ParseDecimal(string s) =>
        decimal.TryParse(s.Replace(",", "."), System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : 0;

    private static decimal? TryParseDecimal(string s) =>
        decimal.TryParse(s.Replace(",", "."), System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : null;

    private static DateTime ParseDate(string s) =>
        DateTime.TryParse(s, out var d) ? d : DateTime.UtcNow;
}

// ─────────────────────────────────────────────
// ALPACA
// Kolumner: symbol, side, qty, filled_avg_price, filled_at, status
// ─────────────────────────────────────────────
public class AlpacaCsvParser
{
    public static ParsedTradeRow? ParseRow(string[] headers, string[] cols)
    {
        try
        {
            var row = MapColumns(headers, cols);

            return new ParsedTradeRow
            {
                Symbol        = GetValue(row, "symbol").ToUpper(),
                Direction     = GetValue(row, "side").ToLower() == "buy" ? "Long" : "Short",
                EntryPrice    = ParseDecimal(GetValue(row, "filled_avg_price")),
                Quantity      = (int)ParseDecimal(GetValue(row, "qty")),
                EntryDate     = ParseDate(GetValue(row, "filled_at")),
                RowIdentifier = GetValue(row, "id")
            };
        }
        catch { return null; }
    }

    private static Dictionary<string, string> MapColumns(string[] headers, string[] cols)
    {
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < headers.Length && i < cols.Length; i++)
            map[headers[i].Trim().Replace("\"", "")] = cols[i].Trim().Replace("\"", "");
        return map;
    }

    private static string GetValue(Dictionary<string, string> map, string key) =>
        map.TryGetValue(key, out var val) ? val : "";

    private static decimal ParseDecimal(string s) =>
        decimal.TryParse(s.Replace(",", "."), System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : 0;

    private static DateTime ParseDate(string s) =>
        DateTime.TryParse(s, out var d) ? d : DateTime.UtcNow;
}

// ─────────────────────────────────────────────
// METATRADER 4/5
// Kolumner: Ticket, Open Time, Type, Volume, Symbol, Open Price, Close Time, Close Price, Profit
// ─────────────────────────────────────────────
public class MetaTraderCsvParser
{
    public static ParsedTradeRow? ParseRow(string[] headers, string[] cols)
    {
        try
        {
            var row = MapColumns(headers, cols);
            var type = GetValue(row, "type").ToLower();

            // Hoppa över rader som inte är trades (t.ex. "balance", "deposit")
            if (type != "buy" && type != "sell") return null;

            return new ParsedTradeRow
            {
                Symbol        = GetValue(row, "symbol").ToUpper(),
                Direction     = type == "buy" ? "Long" : "Short",
                EntryPrice    = ParseDecimal(GetValue(row, "open price")),
                ExitPrice     = TryParseDecimal(GetValue(row, "close price")),
                LotSize       = TryParseDecimal(GetValue(row, "volume")),
                Quantity      = 1, // MT använder lot-storlek istället för antal
                ProfitLoss    = TryParseDecimal(GetValue(row, "profit")),
                EntryDate     = ParseDate(GetValue(row, "open time")),
                ExitDate      = TryParseDate(GetValue(row, "close time")),
                RowIdentifier = GetValue(row, "ticket")
            };
        }
        catch { return null; }
    }

    private static Dictionary<string, string> MapColumns(string[] headers, string[] cols)
    {
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < headers.Length && i < cols.Length; i++)
            map[headers[i].Trim().Replace("\"", "")] = cols[i].Trim().Replace("\"", "");
        return map;
    }

    private static string GetValue(Dictionary<string, string> map, string key) =>
        map.TryGetValue(key, out var val) ? val : "";

    private static decimal ParseDecimal(string s) =>
        decimal.TryParse(s.Replace(",", "."), System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : 0;

    private static decimal? TryParseDecimal(string s) =>
        decimal.TryParse(s.Replace(",", "."), System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : null;

    private static DateTime ParseDate(string s) =>
        DateTime.TryParse(s, out var d) ? d : DateTime.UtcNow;

    private static DateTime? TryParseDate(string s) =>
        DateTime.TryParse(s, out var d) ? d : null;
}

// ─────────────────────────────────────────────
// NORDNET
// Kolumner: Bokföringsdag, Värdepapper, Transaktionstyp, Antal, Kurs, Belopp
// ─────────────────────────────────────────────
public class NordnetCsvParser
{
    public static ParsedTradeRow? ParseRow(string[] headers, string[] cols)
    {
        try
        {
            var row = MapColumns(headers, cols);
            var type = GetValue(row, "transaktionstyp").ToLower();

            // Nordnet använder "köp" och "sälj"
            if (type != "köp" && type != "sälj") return null;

            return new ParsedTradeRow
            {
                Symbol        = GetValue(row, "värdepapper").ToUpper(),
                Direction     = type == "köp" ? "Long" : "Short",
                EntryPrice    = ParseDecimal(GetValue(row, "kurs")),
                Quantity      = (int)ParseDecimal(GetValue(row, "antal")),
                EntryDate     = ParseDate(GetValue(row, "bokföringsdag")),
                RowIdentifier = GetValue(row, "verifikationsnummer")
            };
        }
        catch { return null; }
    }

    private static Dictionary<string, string> MapColumns(string[] headers, string[] cols)
    {
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < headers.Length && i < cols.Length; i++)
            map[headers[i].Trim().Replace("\"", "")] = cols[i].Trim().Replace("\"", "");
        return map;
    }

    private static string GetValue(Dictionary<string, string> map, string key) =>
        map.TryGetValue(key, out var val) ? val : "";

    private static decimal ParseDecimal(string s) =>
        decimal.TryParse(s.Replace(",", "").Replace(" ", ""),
            System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : 0;

    private static DateTime ParseDate(string s) =>
        DateTime.TryParse(s, out var d) ? d : DateTime.UtcNow;
}

// ─────────────────────────────────────────────
// GENERIC (fallback för okända brokers)
// Försöker hitta standardkolumner med vanliga namn
// ─────────────────────────────────────────────
public class GenericCsvParser
{
    // Vanliga kolumnnamn för samma data — vi testar alla
    private static readonly string[] SymbolKeys    = { "symbol", "ticker", "instrument", "asset", "pair" };
    private static readonly string[] DirectionKeys = { "side", "type", "direction", "action", "buy/sell" };
    private static readonly string[] PriceKeys     = { "price", "entryprice", "open price", "filled_avg_price", "kurs" };
    private static readonly string[] QtyKeys       = { "qty", "quantity", "amount", "antal", "volume", "size" };
    private static readonly string[] DateKeys      = { "date", "time", "datetime", "filled_at", "open time", "bokföringsdag" };
    private static readonly string[] PnlKeys       = { "pnl", "profit", "realized_pnl", "pl", "gain/loss" };

    public static ParsedTradeRow? ParseRow(string[] headers, string[] cols)
    {
        try
        {
            var row = MapColumns(headers, cols);

            var symbol = FindValue(row, SymbolKeys);
            if (string.IsNullOrEmpty(symbol)) return null;

            var direction = FindValue(row, DirectionKeys).ToLower();

            return new ParsedTradeRow
            {
                Symbol        = symbol.ToUpper(),
                Direction     = direction.Contains("buy") || direction.Contains("long") || direction.Contains("köp") ? "Long" : "Short",
                EntryPrice    = ParseDecimal(FindValue(row, PriceKeys)),
                Quantity      = (int)ParseDecimal(FindValue(row, QtyKeys)),
                ProfitLoss    = TryParseDecimal(FindValue(row, PnlKeys)),
                EntryDate     = ParseDate(FindValue(row, DateKeys)),
                RowIdentifier = $"{symbol}_{FindValue(row, DateKeys)}"
            };
        }
        catch { return null; }
    }

    private static Dictionary<string, string> MapColumns(string[] headers, string[] cols)
    {
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < headers.Length && i < cols.Length; i++)
            map[headers[i].Trim().Replace("\"", "").ToLower()] = cols[i].Trim().Replace("\"", "");
        return map;
    }

    private static string FindValue(Dictionary<string, string> map, string[] keys)
    {
        foreach (var key in keys)
            if (map.TryGetValue(key, out var val) && !string.IsNullOrEmpty(val))
                return val;
        return "";
    }

    private static decimal ParseDecimal(string s) =>
        decimal.TryParse(s.Replace(",", "."), System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : 0;

    private static decimal? TryParseDecimal(string s) =>
        decimal.TryParse(s.Replace(",", "."), System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : null;

    private static DateTime ParseDate(string s) =>
        DateTime.TryParse(s, out var d) ? d : DateTime.UtcNow;
}
