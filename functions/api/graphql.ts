export const onRequest: PagesFunction<{ BACKEND_API_BASE: string }> = async ({ request, env }) => {
  const backendBase = env.BACKEND_API_BASE;
  if (!backendBase) {
    return new Response('Missing BACKEND_API_BASE env', { status: 500 });
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(backendBase);
  targetUrl.pathname = '/graphql';
  targetUrl.search = incomingUrl.search;

  const init: RequestInit = {
    method: request.method,
    headers: request.headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.clone().arrayBuffer()
  };

  return fetch(targetUrl.toString(), init);
};
