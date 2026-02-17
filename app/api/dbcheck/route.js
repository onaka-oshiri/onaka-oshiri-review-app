import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY; // ← server専用（sb_secret_...）

  if (!url || !key) {
    return Response.json(
      { ok: false, error: "Missing SUPABASE_URL or SUPABASE_SECRET_KEY" },
      { status: 500 }
    );
  }

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("clinics")
    .select("id,name,subdomain,google_place_id,is_active,created_at")
    .order("id", { ascending: true })
    .limit(5);

  if (error) {
    return Response.json({ ok: false, error }, { status: 500 });
  }

  return Response.json({ ok: true, clinics: data });
}
