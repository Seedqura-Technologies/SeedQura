const API_URL = process.env.API_URL || "http://localhost:3001";

async function proxy(request: Request, pathParts: string[]) {
  const url = new URL(request.url);
  const path = `/api/student/${pathParts.join("/")}`;
  const target = `${API_URL}${path}${url.search}`;
  const headers = new Headers();
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  if (request.method !== "GET" && request.method !== "HEAD") {
    headers.set("content-type", "application/json");
  }

  const res = await fetch(target, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.text(),
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/json",
    },
  });
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return proxy(request, path);
}
