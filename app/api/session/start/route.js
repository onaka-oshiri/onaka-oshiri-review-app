import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function safeHash(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function POST(req) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return Response.json({ ok: false, error: "Missing env" }, { status: 500 });

  const supabase = createClient(url, key);

  const body = await req.json().catch(() => ({}));
  const clinic_id = body?.clinic_id ?? 1;

  // “当日1回”用：端末っぽい識別（個人情報は持たない）
  const ua = req.headers.get("user-agent") ?? "";
  const ip = req.headers.get("x-forwarded-for") ?? "";
  const device_hash = safeHash(`${ua}__${ip}`).slice(0, 32);

  // 当日トークン（受付QRを毎日変えたい場合に使える。今は固定でもOK）
  const today = new Date();
  const y = today.getUTCFullYear();
  const m = String(today.getUTCMonth() + 1).padStart(2, "0");
  const d = String(today.getUTCDate()).padStart(2, "0");
  const daily_token = `${y}${m}${d}`;

  // セッション作成
  const { data, error } = await supabase
    .from("survey_sessions")
    .insert({
      clinic_id,
      session_date: `${y}-${m}-${d}`,
      device_hash,
      daily_token,
      status: "started"
    })
    .select("id")
    .single();

  if (error) return Response.json({ ok: false, error }, { status: 500 });

  return Response.json({ ok: true, session_id: data.id });
}

