using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Cosmos.Linq;
using CoursesPlatform.API.Models;
using System.Net;

namespace CoursesPlatform.API.Services;

/// <summary>
/// Generic CRUD service for Azure Cosmos DB using a single-container design.
/// All document types share one container, distinguished by the "type" discriminator field.
/// Partition key is "/pk" (synthetic, set per document type).
/// </summary>
public class CosmosDbService
{
    private readonly Container _container;
    private readonly ILogger<CosmosDbService> _logger;

    public CosmosDbService(CosmosClient cosmosClient, IConfiguration config, ILogger<CosmosDbService> logger)
    {
        var databaseName = config["CosmosDb:DatabaseName"] ?? "CoursesApp";
        var containerName = config["CosmosDb:ContainerName"] ?? "courses-db";
        _container = cosmosClient.GetContainer(databaseName, containerName);
        _logger = logger;
    }

    // ── Create ──
    public async Task<T> CreateAsync<T>(T item) where T : BaseDocument
    {
        var response = await _container.CreateItemAsync(item, new PartitionKey(item.Pk));
        _logger.LogInformation("Created {Type} document {Id}", item.Type, item.Id);
        return response.Resource;
    }

    // ── Read by ID ──
    public async Task<T?> GetAsync<T>(string id, string partitionKey) where T : BaseDocument
    {
        try
        {
            var response = await _container.ReadItemAsync<T>(id, new PartitionKey(partitionKey));
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    // ── Query by partition key and type ──
    public async Task<List<T>> QueryAsync<T>(string partitionKey, string type) where T : BaseDocument
    {
        var query = _container.GetItemLinqQueryable<T>(
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(partitionKey) })
            .Where(d => d.Type == type);

        var iterator = query.ToFeedIterator();
        var results = new List<T>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync();
            results.AddRange(response);
        }

        return results;
    }

    // ── Cross-partition query by type ──
    public async Task<List<T>> QueryByTypeAsync<T>(string type) where T : BaseDocument
    {
        var queryDef = new QueryDefinition("SELECT * FROM c WHERE c.type = @type")
            .WithParameter("@type", type);

        var iterator = _container.GetItemQueryIterator<T>(queryDef);
        var results = new List<T>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync();
            results.AddRange(response);
        }

        return results;
    }

    // ── Update (full replace) ──
    public async Task<T> UpdateAsync<T>(T item) where T : BaseDocument
    {
        var response = await _container.ReplaceItemAsync(item, item.Id, new PartitionKey(item.Pk));
        _logger.LogInformation("Updated {Type} document {Id}", item.Type, item.Id);
        return response.Resource;
    }

    // ── Delete ──
    public async Task DeleteAsync(string id, string partitionKey)
    {
        await _container.DeleteItemAsync<BaseDocument>(id, new PartitionKey(partitionKey));
        _logger.LogInformation("Deleted document {Id} from partition {Pk}", id, partitionKey);
    }

    // ── Custom SQL query ──
    public async Task<List<T>> SqlQueryAsync<T>(string sql, Dictionary<string, object>? parameters = null)
    {
        var queryDef = new QueryDefinition(sql);
        if (parameters != null)
        {
            foreach (var param in parameters)
            {
                queryDef = queryDef.WithParameter(param.Key, param.Value);
            }
        }

        var iterator = _container.GetItemQueryIterator<T>(queryDef);
        var results = new List<T>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync();
            results.AddRange(response);
        }

        return results;
    }
}
