const API_URL = process.env.API_URL || "http://localhost:3001";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const res = await fetch(`${API_URL}/api/courses/${id}`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
