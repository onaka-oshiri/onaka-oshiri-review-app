import { createClient } from "@supabase/supabase-js";

function starToLabel(star) {
  const s = Number(star || 0);
  if (s >= 5) return "とても満足";
  if (s === 4) return "満足";
  if (s === 3) return "普通";
  if (s === 2) return "やや不満";
  return "不満"; // 1 or 0
}

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
    const q3_label = starToLabel(q3_star); // ★ここが今回の核心

    const row = {
      clinic_id,
      session_id,

      // 既存列（あなたのDBにある想定）
      q1_services: body.q1_services ?? [],
      q2_reasons: body.q2_reasons ?? [],
      q3_star,
      q3_label,
      q4_free: body.q4_free ?? "",

      // 追加列（増やした分）
      q3_anxiety: body.q3_anxiety ?? "",
      q5_impressions: body.q5_impressions ?? [],
      q6_experience: body.q6_experience ?? "",
      q7_recommend: body.q7_recommend ?? ""
    };

    // まず insert（同sid重複があり得るなら、後でupsertに変更）
    const { error } = await supabase.from("survey_answers").insert(row);

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

