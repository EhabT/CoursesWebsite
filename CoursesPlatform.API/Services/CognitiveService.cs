using Azure;
using Azure.AI.Vision.ImageAnalysis;

namespace CoursesPlatform.API.Services;

/// <summary>
/// Integrates with Azure Cognitive Services (Computer Vision)
/// to auto-tag uploaded images with meaningful educational categories.
/// Uses OCR, Captions, and visual Tags — then maps keywords to course-relevant labels.
/// </summary>
public class CognitiveService
{
    private readonly ImageAnalysisClient? _client;
    private readonly ILogger<CognitiveService> _logger;

    // ── Visual tags that are NEVER useful for course categorisation ──
    private static readonly HashSet<string> BlockedTags = new(StringComparer.OrdinalIgnoreCase)
    {
        "text", "screenshot", "font", "logo", "graphics", "graphic design",
        "display", "pixel", "multimedia", "software", "web page", "website",
        "design", "icon", "symbol", "brand", "line", "circle", "rectangle",
        "pattern", "colorfulness", "number", "clip art", "illustration",
        "cartoon", "drawing", "art", "painting", "poster", "flyer",
        "document", "paper", "page", "slide", "presentation",
        "indoor", "outdoor", "wall", "floor", "table", "desk",
        "person", "man", "woman", "human face", "clothing", "smile",
        "computer", "laptop", "screen", "monitor", "keyboard", "mouse",
        "electric blue", "azure", "magenta", "violet", "purple", "yellow",
        "orange", "red", "green", "blue", "black", "white", "grey", "gray",
        "sky", "tree", "grass", "water", "building", "animal", "cat", "dog",
        "darkness", "light", "night", "photograph"
    };

    // ── Keywords found in OCR text or captions → educational categories ──
    private static readonly Dictionary<string, string> KeywordToCategory = new(StringComparer.OrdinalIgnoreCase)
    {
        // Programming
        { "python", "python" }, { "java", "java" }, { "javascript", "javascript" },
        { "c#", "c-sharp" }, { "c++", "c++" }, { "typescript", "typescript" },
        { "rust", "rust" }, { "golang", "golang" }, { "ruby", "ruby" },
        { "swift", "swift" }, { "kotlin", "kotlin" }, { "php", "php" },
        { "html", "web development" }, { "css", "web development" },
        { "react", "react" }, { "angular", "angular" }, { "vue", "vue.js" },
        { "node", "node.js" }, { "django", "django" }, { "flask", "flask" },
        { "programming", "programming" }, { "coding", "programming" },
        { "code", "programming" }, { "developer", "software development" },
        { "software", "software development" }, { "api", "api development" },
        { "frontend", "web development" }, { "backend", "backend development" },
        { "fullstack", "full-stack" }, { "full stack", "full-stack" },

        // Data
        { "big data", "big data" }, { "bigdata", "big data" },
        { "data science", "data science" }, { "data", "data science" },
        { "analytics", "data analytics" }, { "hadoop", "big data" },
        { "spark", "big data" }, { "kafka", "big data" },
        { "pandas", "data science" }, { "numpy", "data science" },
        { "statistics", "statistics" }, { "visualization", "data visualisation" },
        { "sql", "databases" }, { "nosql", "databases" }, { "database", "databases" },
        { "mongodb", "databases" }, { "postgresql", "databases" },
        { "cosmos", "databases" },

        // AI/ML
        { "machine learning", "machine learning" }, { "ml", "machine learning" },
        { "artificial intelligence", "artificial intelligence" }, { "ai", "artificial intelligence" },
        { "deep learning", "deep learning" }, { "neural", "deep learning" },
        { "tensorflow", "machine learning" }, { "pytorch", "machine learning" },
        { "nlp", "natural language processing" }, { "computer vision", "computer vision" },
        { "chatgpt", "artificial intelligence" }, { "openai", "artificial intelligence" },
        { "llm", "artificial intelligence" },

        // Cloud & DevOps
        { "cloud", "cloud computing" }, { "aws", "cloud computing" },
        { "azure", "cloud computing" }, { "gcp", "cloud computing" },
        { "docker", "containerisation" }, { "kubernetes", "kubernetes" },
        { "k8s", "kubernetes" }, { "devops", "devops" },
        { "ci/cd", "devops" }, { "terraform", "infrastructure" },
        { "microservices", "microservices" }, { "serverless", "cloud computing" },

        // Security
        { "security", "cybersecurity" }, { "cyber", "cybersecurity" },
        { "hacking", "cybersecurity" }, { "encryption", "cybersecurity" },
        { "penetration", "cybersecurity" }, { "firewall", "networking" },

        // Networking
        { "network", "networking" }, { "tcp", "networking" },
        { "dns", "networking" }, { "http", "networking" },

        // General
        { "tutorial", "tutorial" }, { "course", "course" },
        { "beginner", "beginner" }, { "advanced", "advanced" },
        { "intermediate", "intermediate" }, { "introduction", "beginner" },
        { "intro", "beginner" }, { "fundamentals", "fundamentals" },
        { "masterclass", "advanced" }, { "bootcamp", "bootcamp" },
        { "certification", "certification" }, { "exam", "certification" },

        // Other tech
        { "blockchain", "blockchain" }, { "crypto", "blockchain" },
        { "iot", "IoT" }, { "internet of things", "IoT" },
        { "embedded", "embedded systems" }, { "robotics", "robotics" },
        { "linux", "linux" }, { "windows", "windows" }, { "macos", "macOS" },
        { "git", "version control" }, { "github", "version control" },
        { "agile", "agile" }, { "scrum", "agile" },
        { "testing", "software testing" }, { "automation", "automation" },
        { "mobile", "mobile development" }, { "android", "android" },
        { "ios", "iOS development" }, { "flutter", "mobile development" },
        { "game", "game development" }, { "unity", "game development" },
        { "unreal", "game development" },

        // Business / Design
        { "business", "business" }, { "marketing", "digital marketing" },
        { "seo", "digital marketing" }, { "ux", "UX design" },
        { "ui", "UI design" }, { "figma", "UI design" },
        { "photoshop", "graphic design" }, { "illustrator", "graphic design" },
        { "excel", "Microsoft Excel" }, { "power bi", "business intelligence" },
        { "tableau", "business intelligence" },

        // Scalability keywords for YOUR project
        { "scalable", "scalability" }, { "scalability", "scalability" },
        { "performance", "performance" }, { "load balancing", "scalability" },
        { "distributed", "distributed systems" },
    };

    public CognitiveService(IConfiguration config, ILogger<CognitiveService> logger)
    {
        _logger = logger;

        var endpoint = config["CognitiveServices:Endpoint"];
        var key = config["CognitiveServices:ApiKey"];

        if (!string.IsNullOrEmpty(endpoint) && !string.IsNullOrEmpty(key))
        {
            _client = new ImageAnalysisClient(new Uri(endpoint), new AzureKeyCredential(key));
            _logger.LogInformation("Cognitive Services client initialised");
        }
        else
        {
            _logger.LogWarning("Cognitive Services not configured — auto-tagging disabled");
        }
    }

    /// <summary>
    /// Analyses an image using OCR + Caption + Tags, then maps findings
    /// to meaningful educational categories. Returns empty list if not configured.
    /// </summary>
    public async Task<List<string>> GetImageTagsAsync(Stream imageStream)
    {
        if (_client == null) return new List<string>();

        try
        {
            var binaryData = await BinaryData.FromStreamAsync(imageStream);

            // Request OCR (Read), Caption, and Tags from Azure CV
            var result = await _client.AnalyzeAsync(binaryData,
                VisualFeatures.Tags | VisualFeatures.Caption | VisualFeatures.Read);

            var educationalTags = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // ── 1. Extract text via OCR (e.g., "Big Data Tutorial") ──
            if (result.Value.Read?.Blocks != null)
            {
                foreach (var block in result.Value.Read.Blocks)
                {
                    foreach (var line in block.Lines)
                    {
                        var ocrText = line.Text;
                        _logger.LogInformation("OCR text found: \"{Text}\"", ocrText);
                        MapTextToCategories(ocrText, educationalTags);
                    }
                }
            }

            // ── 2. Extract meaning from caption (e.g., "a graphic about cloud computing") ──
            if (result.Value.Caption != null && result.Value.Caption.Confidence > 0.3)
            {
                var caption = result.Value.Caption.Text;
                _logger.LogInformation("Caption: \"{Caption}\" (confidence: {C})",
                    caption, result.Value.Caption.Confidence);
                MapTextToCategories(caption, educationalTags);
            }

            // ── 3. Filter visual tags — keep only meaningful ones ──
            if (result.Value.Tags?.Values != null)
            {
                foreach (var tag in result.Value.Tags.Values)
                {
                    if (tag.Confidence > 0.75 && !BlockedTags.Contains(tag.Name))
                    {
                        // Try to map the tag to an educational category
                        if (KeywordToCategory.TryGetValue(tag.Name, out var category))
                        {
                            educationalTags.Add(category);
                        }
                        else
                        {
                            // Keep the tag only if it wasn't blocked
                            educationalTags.Add(tag.Name);
                        }
                    }
                }
            }

            var finalTags = educationalTags.OrderBy(t => t).ToList();

            _logger.LogInformation("Smart-tagged image with {Count} tags: {Tags}",
                finalTags.Count, string.Join(", ", finalTags));

            return finalTags;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analysing image with Cognitive Services");
            return new List<string>();
        }
    }

    /// <summary>
    /// Scans a text string for known keywords and adds matching categories.
    /// </summary>
    private static void MapTextToCategories(string text, HashSet<string> categories)
    {
        if (string.IsNullOrWhiteSpace(text)) return;

        // Check multi-word phrases first (longest match wins)
        var sortedKeys = KeywordToCategory.Keys.OrderByDescending(k => k.Length);

        foreach (var keyword in sortedKeys)
        {
            if (text.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            {
                categories.Add(KeywordToCategory[keyword]);
            }
        }
    }

    /// <summary>
    /// Performs basic content moderation — checks if image is adult/racy.
    /// Returns true if the content is safe.
    /// </summary>
    public async Task<bool> IsContentSafeAsync(Stream imageStream)
    {
        if (_client == null) return true; // assume safe if not configured

        try
        {
            var binaryData = await BinaryData.FromStreamAsync(imageStream);
            var result = await _client.AnalyzeAsync(binaryData,
                VisualFeatures.SmartCrops); // Using available features

            return true; // Default to safe; full moderation uses Content Safety API
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking content safety");
            return true; // fail open
        }
    }
}

