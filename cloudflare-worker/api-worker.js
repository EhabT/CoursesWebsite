export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }

    const url = new URL(request.url);

    // The HTTP IP of the AKS load balancer, wrapped in nip.io to satisfy Cloudflare's hostname requirement
    const targetIp = "http://20.19.112.96.nip.io";

    // Construct the new URL (e.g. forward to http://20.19.112.96/api/courses)
    const targetUrl = new URL(url.pathname + url.search, targetIp);

    // Create a new request, stripping the Host header so it doesn't confuse the backend
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow',
    });

    // Fetch from the AKS HTTP endpoint
    const response = await fetch(proxyRequest);

    // Clone the response and add CORS headers
    const newResponse = new Response(response.body, response);
    const headers = corsHeaders(request);
    for (const [key, value] of Object.entries(headers)) {
      newResponse.headers.set(key, value);
    }

    return newResponse;
  }
};

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}
