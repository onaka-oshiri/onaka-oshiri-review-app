"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const PLACE_ID = "ChIJUzCzdW2NGGAROHHvN9rZPTc";
const GOOGLE_REVIEW_URL =
  `https://search.google.com/local/writereview?placeid=${PLACE_ID}`;

function buildReviewText(answer) {
  const {
    q1_services = [],
    q2_reasons = [],
    q3_anxiety = "",
    q5_impressions = [],
    q6_experience = "",
    q4_free = "",
  } = answer || {};

  const parts = [];

  // 導入（軽くランダム化）
  const intros = [
    "初めて受診しましたが、",
    "今回受診して感じたのは、",
    "少し緊張していましたが、",
    "以前から気になっており、",
  ];
  parts.push(intros[Math.floor(Math.random() * intros.length)]);

  if (q1_services?.length) {
    parts.push(`「${q1_services.slice(0, 2).join("・")}」で伺いました。`);
  }

  if (q3_anxiety) {
    parts.push(`受診前は「${q3_anxiety}」でしたが、`);
  }

  if (q5_impressions?.length) {
    parts.push(`${q5_impressions.slice(0, 3).join("、")}点が印象的でした。`);
  }

  if (q6_experience) {
    parts.push(`全体として「${q6_experience}」と感じました。`);
  }

  if (q2_reasons?.length) {
    parts.push(`当院を選んだ理由は「${q2_reasons.slice(0, 2).join("・")}」です。`);
  }

  if (q4_free?.trim()) {
    parts.push(q4_free.trim());
  }

  parts.push("ありがとうございました。");

  return parts.join("");
}

function ReviewInner() {
  const params = useSearchParams();
  const sid = params.get("sid");

  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sid) return;

    const run = async () => {
      setLoading(true);
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

  const reviewText = useMemo(() => {
    if (!answer) return "";
    return buildReviewText(answer);
  }, [answer]);

  if (!sid) return <div style={{ padding: 20 }}>sidがありません</div>;
  if (loading) return <div style={{ padding: 20 }}>読み込み中…</div>;
  if (error) return <div style={{ padding: 20, color: "red" }}>{error}</div>;

  const star = Number(answer?.q3_star || 0);
  const isFive = star >= 5;
  const isLow = star <= 3;

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
      <h1>アンケートありがとうございました</h1>

      <div
        style={{
          background: "#f3f4f6",
          padding: 20,
          borderRadius: 12,
          lineHeight: 1.7,
          marginBottom: 20,
        }}
      >
        {reviewText}
      </div>

      <button
        onClick={() => navigator.clipboard.writeText(reviewText)}
        style={{
          padding: 12,
          borderRadius: 8,
          border: "none",
          background: "#111827",
          color: "white",
          marginBottom: 16,
        }}
      >
        口コミ文をコピー
      </button>

      {/* ★5以上のみGoogle強調 */}
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

      {/* ★3以下は内部のみ */}
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

