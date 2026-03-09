using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TradingJournal.Core.Models;
using TradingJournal.Infrastructure.Data;

namespace TradingJournal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ForumController : ControllerBase
{
    private readonly AppDbContext _db;
    public ForumController(AppDbContext db) => _db = db;

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET api/forum — hämta alla inlägg med kommentarer och användarinfo
    /// <summary>Hämtar alla foruminlägg med tillhörande kommentarer och användare.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.ForumPosts
            .Include(p => p.User)
            .Include(p => p.Comments).ThenInclude(c => c.User)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync());

    // POST api/forum
    /// <summary>Skapar ett nytt foruminlägg.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ForumPost dto)
    {
        var post = new ForumPost
        {
            UserId  = GetUserId(),
            Title   = dto.Title,
            Content = dto.Content
        };
        _db.ForumPosts.Add(post);
        await _db.SaveChangesAsync();
        return Ok(post);
    }

    // POST api/forum/5/comments
    /// <summary>Lägger till en kommentar på ett specifikt foruminlägg.</summary>
    [HttpPost("{postId}/comments")]
    public async Task<IActionResult> AddComment(int postId, [FromBody] ForumComment dto)
    {
        var post = await _db.ForumPosts.FindAsync(postId);
        if (post == null) return NotFound("Inlägg hittades inte.");

        var comment = new ForumComment
        {
            ForumPostId = postId,
            UserId      = GetUserId(),
            Content     = dto.Content
        };
        _db.ForumComments.Add(comment);
        await _db.SaveChangesAsync();
        return Ok(comment);
    }
}
