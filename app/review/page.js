"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

const PLACE_ID = "ChIJUzCzdW2NGGAROHHvN9rZPTc";
const GOOGLE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${PLACE_ID}`;

function ReviewInner() {
  const params = useSearchParams();
  const sid = params.get("sid") || "";
  const star = Number(params.get("star") || "0"); // 0なら不明扱い

  // まずはテンプレで“必ず動く”状態を作る（次にAI化する）
  const generatedText =
    star >= 5
      ? "丁寧に説明していただき安心して受診できました。検査もスムーズで、スタッフの方も親切でした。ありがとうございました。"
      : "丁寧に対応していただきました。ありがとうございました。";

  const [copied, setCopied] = useState(false);
  const [copyErr, setCopyErr] = useState("");

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
    <main style={{ maxWidth: 680, margin: "40px auto", padding: 20 }}>
      <h1 style={{ marginBottom: 10 }}>口コミのご協力（任意）</h1>

      <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 16, wordBreak: "break-all" }}>
        sid: {sid || "（なし）"}
      </div>

      <div style={{ padding: 16, borderRadius: 14, background: "#f3f4f6", lineHeight: 1.7 }}>
        {generatedText}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        <button
          onClick={copy}
          style={{
            padding: 12,
            borderRadius: 12,
            border: "none",
            background: "#111827",
            color: "white",
            fontWeight: 800,
            cursor: "pointer"
          }}
        >
          {copied ? "コピーしました" : "口コミ文をコピー"}
        </button>

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
            textDecoration: "none"
          }}
        >
          Googleに投稿する
        </a>
      </div>

      {copyErr ? (
        <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: "#fee2e2", color: "#7f1d1d" }}>
          {copyErr}
        </div>
      ) : null}

      <div style={{ marginTop: 14, fontSize: 12, opacity: 0.6 }}>
        ※投稿は任意です。本ガチャはアンケート回答への謝礼です。
      </div>
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
