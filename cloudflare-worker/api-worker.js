export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // The HTTP IP of the AKS load balancer
    const targetIp = "http://20.19.112.96";
    
    // Construct the new URL (e.g. forward to http://20.19.112.96/api/courses)
    const targetUrl = new URL(url.pathname + url.search, targetIp);

    // Create a new request based on the original one, but pointing to the target
    const proxyRequest = new Request(targetUrl, request);

    // Fetch from the AKS HTTP endpoint
    const response = await fetch(proxyRequest);

    // Return the response directly
    // CORS headers should already be set by the .NET backend
    return response;
  }
};
