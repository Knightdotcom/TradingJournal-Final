using System.ComponentModel.DataAnnotations;

namespace TradingJournal.Infrastructure.DTOs.Auth;

// DTO = Data Transfer Object
// Vi exponerar ALDRIG direkt User-modellen mot API:et
public class RegisterDto
{
    [Required(ErrorMessage = "Användarnamn krävs")]
    public string Username { get; set; } = string.Empty;

    [Required, EmailAddress(ErrorMessage = "Ogiltig e-postadress")]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6, ErrorMessage = "Lösenord måste vara minst 6 tecken")]
    public string Password { get; set; } = string.Empty;
}
