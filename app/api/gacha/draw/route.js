import { createClient } from "@supabase/supabase-js";

function bad(msg) {
  return Response.json({ ok: false, error: msg }, { status: 400 });
}

function pickWeighted(prizes) {
  const active = prizes.filter(p => p.is_active && Number(p.probability_weight) > 0);
  const total = active.reduce((s, p) => s + Number(p.probability_weight), 0);
  if (active.length === 0 || total <= 0) return null;

  const r = Math.random() * total;
  let acc = 0;
  for (const p of active) {
    acc += Number(p.probability_weight);
    if (r <= acc) return p;
  }
  return active[active.length - 1];
}

export async function POST(req) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return Response.json({ ok: false, error: "Missing env" }, { status: 500 });

  const supabase = createClient(url, key);

  const body = await req.json().catch(() => null);
  if (!body) return bad("Invalid JSON");

  const { clinic_id = 1, session_id } = body;
  if (!session_id) return bad("session_id required");

  // 既に抽選済みなら同じ結果を返す（再抽選しない）
  const { data: existing, error: exErr } = await supabase
    .from("draws")
    .select("id, session_id, prize_id, display_message, drawn_at, prizes (id, title, description)")
    .eq("session_id", session_id)
    .maybeSingle();

  if (exErr) return Response.json({ ok: false, error: exErr }, { status: 500 });
  if (existing) {
    return Response.json({ ok: true, already: true, draw: existing });
  }

  // 景品一覧
  const { data: prizes, error: pErr } = await supabase
    .from("prizes")
    .select("id, clinic_id, title, description, probability_weight, is_active")
    .eq("clinic_id", clinic_id);

  if (pErr) return Response.json({ ok: false, error: pErr }, { status: 500 });

  const picked = pickWeighted(prizes ?? []);
  if (!picked) return Response.json({ ok: false, error: "No active prizes" }, { status: 500 });

  const display = `【当選】${picked.title}\n受付でお申し出ください。`;

  // insert（unique制約でレース耐性）
  const { data: ins, error: iErr } = await supabase
    .from("draws")
    .insert({
      clinic_id,
      session_id,
      prize_id: picked.id,
      display_message: display
    })
    .select("id, session_id, prize_id, display_message, drawn_at")
    .single();

  if (iErr) {
    // 競合したら既存を返す
    const { data: again } = await supabase
      .from("draws")
      .select("id, session_id, prize_id, display_message, drawn_at, prizes (id, title, description)")
      .eq("session_id", session_id)
      .maybeSingle();

    if (again) return Response.json({ ok: true, already: true, draw: again });
    return Response.json({ ok: false, error: iErr }, { status: 500 });
  }

  return Response.json({
    ok: true,
    already: false,
    draw: {
      ...ins,
      prizes: { id: picked.id, title: picked.title, description: picked.description }
    }
  });
}
