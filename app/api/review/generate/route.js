import { NextResponse } from "next/server";

export const runtime = "nodejs";

function safeText(v) {
  if (v == null) return "";
  return String(v).trim();
}

export async function POST(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY is missing" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      clinic_name,
      visit_menu,     // ["大腸内視鏡検査（大腸カメラ）", ...]
      q2_reason,      // "口コミ" など
      q3_label,       // "とても満足" など
      free_text,      // 自由記述
      staff_label,    // 複数選択の印象まとめ
      star            // 5,4,3...
    } = body || {};

    const clinic = safeText(clinic_name) || "おなかとおしりのクリニック 東京大塚";
    const menuList = Array.isArray(visit_menu) ? visit_menu.filter(Boolean) : [];

    const menuText = menuList.length ? `受診内容：${menuList.join("、")}` : "";
    const reasonText = safeText(q2_reason) ? `来院のきっかけ：${safeText(q2_reason)}` : "";
    const satText = safeText(q3_label) ? `満足度：${safeText(q3_label)}` : "";
    const staffText = safeText(staff_label) ? `印象：${safeText(staff_label)}` : "";
    const starText = star ? `星評価：${star}` : "";
    const free = safeText(free_text) ? `自由記述：${safeText(free_text)}` : "";

    // ★ここが「薄い作文」にならないための強制条件
    const system = `
あなたは医療機関のGoogle口コミ文を作る日本語のプロです。
不自然なAI文や広告っぽさを避け、患者が実際に書いたような自然な文章にしてください。

【必須条件】
・150〜220文字
・抽象的な褒め言葉だけで終わらせない（具体的な場面を1つ入れる）
・個人情報（氏名・病名の断定・具体的な診断内容）は書かない
・医療効果を断定しない（「治った」「完治」など禁止）
・最後は「ありがとうございました。」で締める
・同じ言い回しの連発を避ける
`.trim();

    const user = `
口コミ対象：${clinic}
${menuText}
${reasonText}
${satText}
${staffText}
${starText}
${free}

上の情報をもとに、患者がそのままGoogleに貼れる自然な口コミ文を1つ作成してください。
`.trim();

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.7,
      }),
    });

    const raw = await resp.text();
    if (!resp.ok) {
      console.error("OpenAI API ERROR", resp.status, raw);
      return NextResponse.json(
        { ok: false, error: "OpenAI error", status: resp.status, detail: raw },
        { status: 500 }
      );
    }

    const data = JSON.parse(raw);

    let text = "";
    if (data.output_text) text = data.output_text;
    if (!text && Array.isArray(data.output)) {
      for (const o of data.output) {
        if (o?.type === "message" && Array.isArray(o.content)) {
          for (const c of o.content) {
            if (c?.type === "output_text" && c.text) text += c.text;
          }
        }
      }
    }

    return NextResponse.json({ ok: true, text: safeText(text) });
  } catch (e) {
    console.error("route exception", e);
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}


