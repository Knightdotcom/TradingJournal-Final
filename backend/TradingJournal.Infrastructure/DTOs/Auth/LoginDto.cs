using System.ComponentModel.DataAnnotations;

namespace TradingJournal.Infrastructure.DTOs.Auth;

public class LoginDto
{
    [Required] public string Email { get; set; } = string.Empty;
    [Required] public string Password { get; set; } = string.Empty;
}
