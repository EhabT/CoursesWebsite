using Microsoft.Azure.Cosmos;
using Azure.Storage.Blobs;
using Microsoft.Identity.Web;
using CoursesPlatform.API.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;

var builder = WebApplication.CreateBuilder(args);

// ── Azure Cosmos DB ──
builder.Services.AddSingleton(sp =>
{
    var connectionString = builder.Configuration["CosmosDb:ConnectionString"];
    return new CosmosClient(connectionString, new CosmosClientOptions
    {
        SerializerOptions = new CosmosSerializationOptions
        {
            PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
        }
    });
});
builder.Services.AddSingleton<CosmosDbService>();

// ── Azure Blob Storage ──
builder.Services.AddSingleton(sp =>
{
    var connectionString = builder.Configuration["BlobStorage:ConnectionString"];
    return new BlobServiceClient(connectionString);
});
builder.Services.AddSingleton<BlobStorageService>();

// ── CDN Service ──
builder.Services.AddSingleton<CdnService>();

// ── Cognitive Services ──
builder.Services.AddSingleton<CognitiveService>();

// ── Microsoft Entra ID (Azure AD) Authentication ──
builder.Services.AddMicrosoftIdentityWebApiAuthentication(builder.Configuration, "AzureAd");
builder.Services.AddTransient<IClaimsTransformation, DemoRoleClaimsTransformation>();

// ── CORS (allow React frontend) ──
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
        // Note: AllowCredentials() cannot be combined with AllowAnyOrigin().
        // Auth uses Bearer tokens in headers, so credentials (cookies) are not needed.
    });
});

// ── Controllers + Swagger ──
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Courses Platform API", Version = "v1" });
});

// ── Health checks ──
builder.Services.AddHealthChecks();

var app = builder.Build();

// ── Middleware pipeline ──
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// Returns the authenticated user's role — used by the frontend since roles live
// in the access token (not the ID token), so the frontend can't read them directly.
app.MapGet("/api/me", (ClaimsPrincipal user) =>
{
    var role = user.IsInRole("INSTRUCTOR") ? "INSTRUCTOR" : "STUDENT";
    return Results.Ok(new { role });
}).RequireAuthorization();

app.Run();

public class DemoRoleClaimsTransformation : IClaimsTransformation
{
    public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        var clone = principal.Clone();
        var newIdentity = (ClaimsIdentity?)clone.Identity;

        if (newIdentity != null && newIdentity.IsAuthenticated)
        {
            var email = clone.FindFirstValue("preferred_username") ?? clone.FindFirstValue("emails") ?? clone.FindFirstValue(ClaimTypes.Name);
            if (email != null && (email.Equals("etarek1310@gmail.com", StringComparison.OrdinalIgnoreCase) || email.Contains("instructor", StringComparison.OrdinalIgnoreCase) || email.Contains("etarek", StringComparison.OrdinalIgnoreCase)))
            {
                if (!clone.IsInRole("INSTRUCTOR"))
                {
                    newIdentity.AddClaim(new Claim(ClaimTypes.Role, "INSTRUCTOR"));
                }
            }
        }
        return Task.FromResult(clone);
    }
}
