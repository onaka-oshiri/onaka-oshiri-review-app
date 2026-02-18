import { NextResponse } from "next/server";

export const runtime = "nodejs"; // OpenAI呼び出しはNode実行が安全

function pick(arr, fallback = "") {
  return Array.isArray(arr) && arr.length ? arr[0] : fallback;
}

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
      visit_menu,     // 例: ["大腸内視鏡検査（大腸カメラ）","胃内視鏡検査（胃カメラ）"]
      q2_reason,      // 例: "口コミ"
      q3_label,       // 例: "とても満足"
      free_text,      // 例: "受付がスムーズでした"
      staff_label,    // 任意: "丁寧だった" 等
      star            // 任意: 5,4,3...
    } = body || {};

    const clinic = safeText(clinic_name) || "当院";
    const menuList = Array.isArray(visit_menu) ? visit_menu.filter(Boolean) : [];
    const menuText = menuList.length ? `受診内容：${menuList.join("、")}` : "";
    const reasonText = safeText(q2_reason) ? `来院のきっかけ：${safeText(q2_reason)}` : "";
    const sat = safeText(q3_label) ? `満足度：${safeText(q3_label)}` : "";
    const free = safeText(free_text);
    const staff = safeText(staff_label);
    const starText = star ? `星評価：${star}` : "";

    // 口コミでNGになりやすい要素を避ける設計
    const system = [
      "あなたは日本語でGoogle口コミ文を作るプロです。",
      "医療機関の口コミとして自然で、誇張や広告っぽさを避けます。",
      "個人情報（氏名・病名の断定・具体的な診断内容）は書かない。",
      "医療効果を断定しない（『治った』などは避ける）。",
      "同じ言い回しを繰り返さない。AIっぽい定型文は避ける。",
      "文字数は150〜220字程度。",
      "文末は丁寧すぎず自然な口調（です・ます中心でOK）。"
    ].join("\n");

    const user = [
      `口コミ対象：${clinic}`,
      menuText,
      reasonText,
      sat,
      staff ? `スタッフ対応：${staff}` : "",
      starText,
      free ? `自由記述：${free}` : "",
      "",
      "上の情報をもとに、患者が実際に書いたような自然な口コミ文を1つ作成してください。",
      "最後に『ありがとうございました。』を入れてください。"
    ].filter(Boolean).join("\n");

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.7
      })
    });

    if (!resp.ok) {
      const t = await resp.text();
      return NextResponse.json(
        { ok: false, error: "OpenAI error", detail: t },
        { status: 500 }
      );
    }

    const data = await resp.json();

    // Responses APIのテキスト抽出（互換的に）
    let text = "";
    if (data.output_text) text = data.output_text;
    if (!text && Array.isArray(data.output)) {
      // 念のため
      for (const o of data.output) {
        if (o && o.type === "message" && Array.isArray(o.content)) {
          for (const c of o.content) {
            if (c.type === "output_text" && c.text) text += c.text;
          }
        }
      }
    }
    text = safeText(text);

    return NextResponse.json({ ok: true, text });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
