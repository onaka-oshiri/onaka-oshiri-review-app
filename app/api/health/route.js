export async function GET() {
  return Response.json({ ok: true, message: "health check ok" });
}
