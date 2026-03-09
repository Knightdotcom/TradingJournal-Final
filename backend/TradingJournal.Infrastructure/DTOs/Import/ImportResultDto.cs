namespace TradingJournal.Infrastructure.DTOs.Import;

// Resultatet som returneras till frontend efter en import
public class ImportResultDto
{
    public int Imported { get; set; }        // Antal trades som importerades
    public int Skipped { get; set; }         // Antal rader som hoppades över (dubletter)
    public int Failed { get; set; }          // Antal rader som misslyckades
    public string BrokerDetected { get; set; } = "Okänd";
    public List<string> Errors { get; set; } = new();   // Felmeddelanden per rad
    public List<string> Warnings { get; set; } = new(); // Varningar (ej kritiska)
}
