"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const PLACE_ID = "ChIJUzCzdW2NGGAROHHvN9rZPTc";
const GOOGLE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${PLACE_ID}`;

// ★ 口コミ文の“確実に使える”自動生成（AI化は次のステップ）
function buildReviewText({ q1_services, q2_reasons, q4_free }) {
  const s1 = Array.isArray(q1_services) ? q1_services : [];
  const s2 = Array.isArray(q2_reasons) ? q2_reasons : [];
  const free = (q4_free || "").trim();

  const parts = [];
  parts.push("丁寧に説明していただき、安心して受診できました。");

  if (s1.length) parts.push(`今回「${s1.slice(0, 3).join("・")}」で伺いました。`);
  if (s2.length) parts.push(`選んだ理由は「${s2.slice(0, 3).join("・")}」です。`);

  // 自由記述があれば、そのまま活かす
  if (free) parts.push(free);

  parts.push("スタッフの方も親切で、院内も清潔でした。ありがとうございました。");

  let text = parts.join("");
  if (text.length > 380) text = text.slice(0, 380) + "…";
  return text;
}

function ReviewInner() {
  const params = useSearchParams();
  const sid = params.get("sid") || "";

  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState(null);
  const [err, setErr] = useState("");

  const [copied, setCopied] = useState(false);
  const [copyErr, setCopyErr] = useState("");

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setErr("");
      setLoading(true);
      setAnswer(null);

      if (!sid) {
        setErr("sidがありません。ガチャ画面から開いてください。");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/survey/get?clinic_id=1&sid=${encodeURIComponent(sid)}`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          setErr(json?.error ?? "取得に失敗しました");
          setLoading(false);
          return;
        }
        if (!alive) return;
        setAnswer(json.answer);
      } catch (e) {
        setErr(`通信エラー：${String(e)}`);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [sid]);

  const star = Number(answer?.q3_star ?? 0);

  const generatedText = useMemo(() => {
    if (!answer) return "";
    return buildReviewText({
      q1_services: answer.q1_services,
      q2_reasons: answer.q2_reasons,
      q4_free: answer.q4_free,
    });
  }, [answer]);

  const isGoogleEncourage = star >= 5;   // ★5以上：Google強誘導
  const isInternalOnly = star <= 3;      // ★3以下：外部誘導しない

  const copy = async () => {
    setCopyErr("");
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopyErr("コピーできませんでした（ブラウザの権限設定をご確認ください）");
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 20 }}>
      <h1 style={{ marginBottom: 10 }}>アンケートのご協力ありがとうございました</h1>

      <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 16, wordBreak: "break-all" }}>
        sid: {sid || "（なし）"} / ★: {star || "（不明）"}
      </div>

      {loading ? (
        <div style={{ padding: 16, borderRadius: 14, background: "#f3f4f6" }}>読み込み中...</div>
      ) : err ? (
        <div style={{ padding: 16, borderRadius: 14, background: "#fee2e2", color: "#7f1d1d" }}>{err}</div>
      ) : (
        <>
          {/* 口コミ文 */}
          <div style={{ padding: 16, borderRadius: 14, background: "#f3f4f6", lineHeight: 1.7 }}>
            {generatedText}
          </div>

          {/* 操作 */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14, alignItems: "center" }}>
            <button
              onClick={copy}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "none",
                background: "#111827",
                color: "white",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {copied ? "コピーしました" : "口コミ文をコピー"}
            </button>

            {/* ★5以上だけ「Googleへ」を強調 */}
            {isGoogleEncourage ? (
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  padding: "12px 18px",
                  borderRadius: 999,
                  background: "#16a34a",
                  color: "white",
                  fontWeight: 900,
                  textDecoration: "none",
                }}
              >
                ぜひGoogleへ投稿する
              </a>
            ) : isInternalOnly ? (
              <div style={{ padding: 12, borderRadius: 12, background: "#eef2ff", fontWeight: 800 }}>
                ご意見は院内で改善に活かします（外部投稿のご案内は控えています）
              </div>
            ) : (
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  padding: "12px 18px",
                  borderRadius: 999,
                  background: "#2563eb",
                  color: "white",
                  fontWeight: 900,
                  textDecoration: "none",
                }}
              >
                Googleに投稿する（任意）
              </a>
            )}
          </div>

          {copyErr ? (
            <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: "#fee2e2", color: "#7f1d1d" }}>
              {copyErr}
            </div>
          ) : null}

          <div style={{ marginTop: 14, fontSize: 12, opacity: 0.6 }}>
            ※投稿は任意です。本ガチャはアンケート回答への謝礼です。
          </div>
        </>
      )}
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>読み込み中...</main>}>
      <ReviewInner />
    </Suspense>
  );
}

