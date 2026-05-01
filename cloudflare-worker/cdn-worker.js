/**
 * Cloudflare Worker — CDN Proxy for Azure Blob Storage
 *
 * This Worker sits at https://courses-cdn.[you].workers.dev
 * and proxies all requests to Azure Blob Storage, adding
 * cache headers for global edge delivery.
 *
 * Deploy via: Cloudflare Dashboard → Workers & Pages → Create Worker
 *
 * Configuration:
 *   In the Worker dashboard, go to Settings → Variables and add:
 *   BLOB_BASE_URL = https://[yourStorageAccount].blob.core.windows.net
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // The Worker URL path maps directly to the blob path
    // e.g. /videos/abc123/lecture.mp4 → blob/videos/abc123/lecture.mp4
    const blobUrl = `${env.BLOB_BASE_URL}${url.pathname}`;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Forward request to blob storage
    const blobResponse = await fetch(blobUrl, {
      method: request.method,
      headers: {
        'User-Agent': 'Cloudflare-Worker/1.0',
      },
    });

    if (!blobResponse.ok) {
      return new Response(`Not found: ${url.pathname}`, {
        status: blobResponse.status,
      });
    }

    // Build CDN response with caching and CORS headers
    const response = new Response(blobResponse.body, {
      status: blobResponse.status,
      headers: {
        // Cache for 24 hours at the edge
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        // Content type from blob storage
        'Content-Type': blobResponse.headers.get('Content-Type') || 'application/octet-stream',
        // CORS — allow React frontend to load media
        'Access-Control-Allow-Origin': '*',
        // CDN identification header
        'X-CDN-Provider': 'Cloudflare-Worker',
      },
    });

    return response;
  },
};
