using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CoursesPlatform.API.Models;
using CoursesPlatform.API.Models.DTOs;
using CoursesPlatform.API.Services;

namespace CoursesPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EnrolmentsController : ControllerBase
{
    private readonly CosmosDbService _db;
    private readonly ILogger<EnrolmentsController> _logger;

    public EnrolmentsController(CosmosDbService db, ILogger<EnrolmentsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/enrolments — STUDENT only: enrol in a course
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "STUDENT")]
    public async Task<ActionResult<Enrolment>> Enrol([FromBody] CreateEnrolmentDto dto)
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("oid")?.Value ?? "unknown";

        // Verify course exists
        var course = await _db.GetAsync<Course>(dto.CourseId, dto.CourseId);
        if (course == null)
            return NotFound("Course not found");

        // Check for duplicate enrolment
        var existing = await _db.SqlQueryAsync<Enrolment>(
            "SELECT * FROM c WHERE c.type = 'ENROLMENT' AND c.userId = @userId AND c.courseId = @courseId",
            new Dictionary<string, object>
            {
                { "@userId", userId },
                { "@courseId", dto.CourseId }
            });

        if (existing.Count > 0)
            return Conflict("Already enrolled in this course");

        var enrolment = new Enrolment
        {
            Id = $"enrolment_{Guid.NewGuid():N}",
            Pk = userId, // partition by user for "my enrolments" query
            UserId = userId,
            CourseId = dto.CourseId,
            EnrolledAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _db.CreateAsync(enrolment);
        return CreatedAtAction(nameof(GetMy), null, created);
    }

    /// <summary>
    /// GET /api/enrolments/my — STUDENT only: get my enrolled courses
    /// </summary>
    [HttpGet("my")]
    [Authorize(Roles = "STUDENT")]
    public async Task<ActionResult<List<Enrolment>>> GetMy()
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("oid")?.Value ?? "unknown";
        var enrolments = await _db.QueryAsync<Enrolment>(userId, "ENROLMENT");
        return Ok(enrolments);
    }
}
