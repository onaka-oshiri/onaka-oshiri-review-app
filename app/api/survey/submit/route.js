import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      return Response.json({ ok: false, error: "Missing SUPABASE env" }, { status: 500 });
    }

    const supabase = createClient(url, key);
    const body = await req.json();

    const clinic_id = Number(body.clinic_id || 1);
    const session_id = body.session_id;

    if (!session_id) {
      return Response.json({ ok: false, error: "session_id is required" }, { status: 400 });
    }

    const q3_star = Number(body.q3_star || 0);

    // ★→ラベル（DB制約対策）
    // 5: A / 4: B / 1-3: C
    const q3_label = q3_star >= 5 ? "A" : (q3_star === 4 ? "B" : "C");

    const row = {
      clinic_id,
      session_id,

      // 既存（あなたのDBにある前提の列）
      q1_services: body.q1_services ?? [],
      q2_reasons: body.q2_reasons ?? [],
      q3_star,
      q3_label,              // ★ここが今回の必須
      q4_free: body.q4_free ?? "",

      // 新しく増やした列
      q3_anxiety: body.q3_anxiety ?? "",
      q5_impressions: body.q5_impressions ?? [],
      q6_experience: body.q6_experience ?? "",
      q7_recommend: body.q7_recommend ?? ""
    };

    // まずは insert（ダメなら error が返る）
    const { error } = await supabase.from("survey_answers").insert(row);

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
