// OPTIONAL Cloudflare Worker: only needed if the browser blocks direct calls to
// data.aoe2companion.com (CORS). Deploy, then paste the worker URL + "/api" into Settings > API/proxy URL.
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/matches')) return new Response('Not found', { status: 404 });
    const upstream = 'https://data.aoe2companion.com' + url.pathname + url.search;
    const res = await fetch(upstream, { cf: { cacheTtl: 60, cacheEverything: true } });
    const out = new Response(res.body, res);
    out.headers.set('Access-Control-Allow-Origin', '*');
    return out;
  }
};
