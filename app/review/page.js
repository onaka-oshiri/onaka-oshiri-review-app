"use client";

import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

const PLACE_ID = "ChIJUzCzdW2NGGAROHHvN9rZPTc";
const GOOGLE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${PLACE_ID}`;

function normalizeStarLabel(star, fallback) {
  if (fallback && String(fallback).trim()) return String(fallback).trim();
  const s = Number(star || 0);
  if (s >= 5) return "とても満足";
  if (s === 4) return "満足";
  if (s === 3) return "普通";
  if (s === 2) return "やや不満";
  if (s === 1) return "不満";
  return "";
}

function ReviewInner() {
  const params = useSearchParams();
  const sid = params.get("sid");

  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState("");

  // AI生成
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // コピー表示
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!sid) return;

    const run = async () => {
      setLoading(true);
      setError("");
      setAnswer(null);

      setAiText("");
      setAiError("");
      setCopied(false);

      const res = await fetch(`/api/survey/get?clinic_id=1&sid=${sid}`);
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "取得失敗");
        setLoading(false);
        return;
      }

      setAnswer(json.answer);
      setLoading(false);
    };

    run();
  }, [sid]);

  const star = useMemo(() => Number(answer?.q3_star || 0), [answer]);
  const isFive = star >= 5;
  const isFour = star === 4;
  const isLow = star <= 3;

  const generate = useCallback(async () => {
    if (!answer) return;

    setAiLoading(true);
    setAiError("");
    setCopied(false);

    try {
      const visit_menu = Array.isArray(answer?.q1_services) ? answer.q1_services : [];
      const q2_reason =
        Array.isArray(answer?.q2_reasons) && answer.q2_reasons.length ? answer.q2_reasons[0] : "";

      const q3_label = normalizeStarLabel(answer?.q3_star, answer?.q3_label);
      const free_text = (answer?.q4_free || "").toString();

      const staff_label =
        Array.isArray(answer?.q5_impressions) && answer.q5_impressions.length
          ? answer.q5_impressions.slice(0, 3).join("、")
          : "";

      const resp = await fetch("/api/review/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_name: "おなかとおしりのクリニック 東京大塚",
          visit_menu,
          q2_reason,
          q3_label,
          free_text,
          staff_label,
          star: Number(answer?.q3_star || 0),
        }),
      });

      const data = await resp.json();
      if (!data.ok) {
        setAiError(data.error || "AI生成に失敗しました");
        setAiText("");
      } else {
        setAiText((data.text || "").trim());
      }
    } catch (e) {
      setAiError(String(e?.message || e));
      setAiText("");
    } finally {
      setAiLoading(false);
    }
  }, [answer]);

  // answer取得後に自動生成
  useEffect(() => {
    if (!answer) return;
    generate();
  }, [answer, generate]);

  const reviewText = aiText;

  const handleCopy = async () => {
    if (!aiText) return;
    try {
      await navigator.clipboard.writeText(aiText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500); // ★B：1.5秒後に戻す
    } catch {
      alert("コピーに失敗しました。ブラウザの権限をご確認ください。");
    }
  };

  if (!sid) return <div style={{ padding: 20 }}>sidがありません</div>;
  if (loading) return <div style={{ padding: 20 }}>読み込み中…</div>;
  if (error) return <div style={{ padding: 20, color: "red" }}>{error}</div>;

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 20 }}>
      <h1>アンケートありがとうございました</h1>

      {/* 選択内容の可視化（確認しやすくする） */}
      <div
        style={{
          fontSize: 13,
          opacity: 0.78,
          marginTop: 8,
          marginBottom: 14,
          lineHeight: 1.6,
        }}
      >
        <div>
          ★評価：{star || "-"}（{normalizeStarLabel(star, answer?.q3_label) || "-"}）
        </div>
        <div>
          受診内容：
          {Array.isArray(answer?.q1_services) && answer.q1_services.length
            ? answer.q1_services.join("、")
            : "-"}
        </div>
        <div>
          来院理由：
          {Array.isArray(answer?.q2_reasons) && answer.q2_reasons.length
            ? answer.q2_reasons.join("、")
            : "-"}
        </div>
      </div>

      <div
        style={{
          background: "#f3f4f6",
          padding: 20,
          borderRadius: 12,
          lineHeight: 1.8,
          marginBottom: 12,
          minHeight: 140,
          whiteSpace: "pre-wrap",
        }}
      >
        {aiLoading ? "口コミ文を作成中…" : reviewText || "口コミ文を作成できませんでした。"}
      </div>

      {aiError && <div style={{ color: "red", marginBottom: 10 }}>AIエラー：{aiError}</div>}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          onClick={handleCopy}
          disabled={!reviewText || aiLoading || copied}
          style={{
            padding: 12,
            borderRadius: 8,
            border: "none",
            background: copied ? "green" : "#111827",
            color: "white",
          }}
        >
          {copied ? "コピーしました ✓" : "口コミ文をコピー"}
        </button>

        <button
          onClick={generate}
          disabled={aiLoading}
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid #111827",
            background: "white",
            color: "#111827",
          }}
        >
          文章を作り直す
        </button>
      </div>

      {/* ★5：強調してGoogleへ */}
      {isFive && (
        <div>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              padding: "14px 24px",
              borderRadius: 999,
              background: "gold",
              fontWeight: 900,
              textDecoration: "none",
              color: "black",
            }}
          >
            Googleに投稿する
          </a>
        </div>
      )}

      {/* ★4：通常の案内 */}
      {isFour && (
        <div>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              padding: "12px 20px",
              borderRadius: 999,
              background: "#111827",
              fontWeight: 700,
              textDecoration: "none",
              color: "white",
            }}
          >
            Googleに投稿する（任意）
          </a>
        </div>
      )}

      {/* ★3以下：外部誘導しない */}
      {isLow && (
        <div
          style={{
            background: "#eef2ff",
            padding: 16,
            borderRadius: 10,
            marginTop: 12,
          }}
        >
          貴重なご意見ありがとうございます。改善に活かします。
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 12, opacity: 0.6 }}>
        ※投稿は任意です。本ガチャはアンケート回答への謝礼です。
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>読み込み中…</div>}>
      <ReviewInner />
    </Suspense>
  );
}
