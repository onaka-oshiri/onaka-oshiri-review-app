import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY; // Vercelに入れた“サーバ用”キー
  if (!url || !key) return Response.json({ ok: false, error: "Missing env" }, { status: 500 });

  const supabase = createClient(url, key);

  const { searchParams } = new URL(req.url);
  const sid = searchParams.get("sid");
  const clinic_id = Number(searchParams.get("clinic_id") || "1");

  if (!sid) return Response.json({ ok: false, error: "sid is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("survey_answers")
    .select("clinic_id, session_id, q1_services, q2_reasons, q3_star, q4_free, created_at")
    .eq("clinic_id", clinic_id)
    .eq("session_id", sid)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return Response.json({ ok: false, error: "not found" }, { status: 404 });

  return Response.json({ ok: true, answer: data });
}
