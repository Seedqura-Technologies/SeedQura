const API_URL = process.env.API_URL || "http://localhost:3001";

async function proxy(request: Request, path: string) {
  const url = new URL(request.url);
  const target = `${API_URL}${path}${url.search}`;
  const headers = new Headers();
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const init: RequestInit = {
    method: request.method,
    headers,
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const res = await fetch(target, init);
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}

export async function GET(request: Request) {
  return proxy(request, "/api/courses");
}
