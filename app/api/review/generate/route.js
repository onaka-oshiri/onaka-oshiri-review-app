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
    // ...（ここはあなたのままでOK）

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

    const raw = await resp.text(); // ←必ず読む（エラーでも）
    if (!resp.ok) {
      console.error("OpenAI API ERROR", resp.status, raw); // ←Vercel Logsに出る
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

