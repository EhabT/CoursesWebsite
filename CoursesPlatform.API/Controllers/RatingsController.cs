using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CoursesPlatform.API.Models;
using CoursesPlatform.API.Models.DTOs;
using CoursesPlatform.API.Services;
using CoursesPlatform.API.Extensions;

namespace CoursesPlatform.API.Controllers;

[ApiController]
[Route("api/courses/{courseId}/ratings")]
public class RatingsController : ControllerBase
{
    private readonly CosmosDbService _db;
    private readonly ILogger<RatingsController> _logger;

    public RatingsController(CosmosDbService db, ILogger<RatingsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/courses/{courseId}/ratings — Public: get average rating
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<AverageRatingDto>> GetAverage(string courseId)
    {
        var ratings = await _db.QueryAsync<Rating>(courseId, "RATING");

        if (ratings.Count == 0)
            return Ok(new AverageRatingDto(0, 0));

        var average = ratings.Average(r => r.Score);
        return Ok(new AverageRatingDto(Math.Round(average, 1), ratings.Count));
    }

    /// <summary>
    /// POST /api/courses/{courseId}/ratings — STUDENT only: rate a course (1-5)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "STUDENT")]
    public async Task<ActionResult<Rating>> Create(string courseId, [FromBody] CreateRatingDto dto)
    {
        if (dto.Score < 1 || dto.Score > 5)
            return BadRequest("Score must be between 1 and 5");

        var course = await _db.GetAsync<Course>(courseId, courseId);
        if (course == null) return NotFound("Course not found");

        var userId = User.GetUserId();

        // Check if user already rated this course
        var existing = await _db.SqlQueryAsync<Rating>(
            "SELECT * FROM c WHERE c.type = 'RATING' AND c.courseId = @courseId AND c.userId = @userId",
            new Dictionary<string, object>
            {
                { "@courseId", courseId },
                { "@userId", userId }
            });

        if (existing.Count > 0)
            return Conflict("You have already rated this course");

        var rating = new Rating
        {
            Id = $"rating_{Guid.NewGuid():N}",
            Pk = courseId,
            CourseId = courseId,
            UserId = userId,
            Score = dto.Score,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _db.CreateAsync(rating);
        return CreatedAtAction(nameof(GetAverage), new { courseId }, created);
    }
}
