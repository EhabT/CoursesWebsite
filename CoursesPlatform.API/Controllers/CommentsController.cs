using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CoursesPlatform.API.Models;
using CoursesPlatform.API.Models.DTOs;
using CoursesPlatform.API.Services;

namespace CoursesPlatform.API.Controllers;

[ApiController]
[Route("api/courses/{courseId}/comments")]
public class CommentsController : ControllerBase
{
    private readonly CosmosDbService _db;
    private readonly ILogger<CommentsController> _logger;

    public CommentsController(CosmosDbService db, ILogger<CommentsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/courses/{courseId}/comments — Public: get all comments for a course
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<Comment>>> GetAll(string courseId)
    {
        var comments = await _db.QueryAsync<Comment>(courseId, "COMMENT");
        return Ok(comments);
    }

    /// <summary>
    /// POST /api/courses/{courseId}/comments — STUDENT only: add a comment
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "STUDENT")]
    public async Task<ActionResult<Comment>> Create(string courseId, [FromBody] CreateCommentDto dto)
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("oid")?.Value ?? "unknown";

        var comment = new Comment
        {
            Id = $"comment_{Guid.NewGuid():N}",
            Pk = courseId,
            CourseId = courseId,
            VideoId = dto.VideoId ?? "",
            UserId = userId,
            Text = dto.Text,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _db.CreateAsync(comment);
        return CreatedAtAction(nameof(GetAll), new { courseId }, created);
    }
}
