import { createClient } from "@supabase/supabase-js";

function bad(msg) {
  return Response.json({ ok: false, error: msg }, { status: 400 });
}

export async function POST(req) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    return Response.json({ ok: false, error: "Missing env" }, { status: 500 });
  }
  const supabase = createClient(url, key);

  const body = await req.json().catch(() => null);
  if (!body) return bad("Invalid JSON");

  const {
    clinic_id = 1,
    session_id,            // UUID（後で自動発行にする。今はテスト用に手入力）
    q1_services = [],
    q2_reasons = [],
    q3_star,
    q3_label,
    q4_free = null
  } = body;

  if (!session_id) return bad("session_id required");
  if (!Array.isArray(q1_services) || !Array.isArray(q2_reasons)) return bad("q1_services/q2_reasons must be arrays");
  if (!(Number.isInteger(q3_star) && q3_star >= 1 && q3_star <= 5)) return bad("q3_star must be 1..5");

  const allowedLabels = ["とても満足", "満足", "普通", "やや不満", "不満"];
  if (!allowedLabels.includes(q3_label)) return bad("q3_label invalid");
  if (q4_free && String(q4_free).length > 120) return bad("q4_free too long (<=120)");

  // まずセッションが存在するか確認（MVPなので簡易）
  const { data: sess, error: sessErr } = await supabase
    .from("survey_sessions")
    .select("id, clinic_id")
    .eq("id", session_id)
    .maybeSingle();

  if (sessErr) return Response.json({ ok: false, error: sessErr }, { status: 500 });
  if (!sess) return bad("session_id not found");
  if (sess.clinic_id !== clinic_id) return bad("clinic mismatch");

  // answers upsert（1セッション1回答）
  const { data: ans, error: ansErr } = await supabase
    .from("survey_answers")
    .upsert(
      {
        clinic_id,
        session_id,
        q1_services,
        q2_reasons,
        q3_star,
        q3_label,
        q4_free
      },
      { onConflict: "session_id" }
    )
    .select("*")
    .single();

  if (ansErr) return Response.json({ ok: false, error: ansErr }, { status: 500 });

  // session status更新
  await supabase
    .from("survey_sessions")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", session_id);

  return Response.json({ ok: true, answer: ans });
}
