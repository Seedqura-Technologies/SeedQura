const API_URL = process.env.API_URL || "http://localhost:3001";

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${API_URL}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
