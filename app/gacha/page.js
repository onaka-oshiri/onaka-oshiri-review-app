"use client";

import { useEffect, useState } from "react";

export default function Gacha() {
  const [spinning, setSpinning] = useState(true);
  const [draw, setDraw] = useState(null);
  const [err, setErr] = useState("");

  const sessionId = "94a2a745-97ad-47f2-9e75-1056aba54255";

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setErr("");
      setDraw(null);
      setSpinning(true);

      // 2秒演出
      await new Promise((r) => setTimeout(r, 2000));

      try {
        const res = await fetch("/api/gacha/draw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clinic_id: 1, session_id: sessionId })
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          if (!alive) return;
          setErr(`抽選に失敗しました：${json?.error?.message ?? json?.error ?? res.statusText}`);
          setSpinning(false);
          return;
        }

        if (!alive) return;
        setDraw(json.draw);
        setSpinning(false);
      } catch (e) {
        if (!alive) return;
        setErr(`通信エラー：${String(e)}`);
        setSpinning(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main>
      <h1>ガチャ</h1>

      {/* アニメ用CSS（安全な置き方） */}
      <style>{`
        @keyframes wobble {
          0% { transform: rotate(-6deg) translateY(0px); }
          50% { transform: rotate(6deg) translateY(-3px); }
          100% { transform: rotate(-6deg) translateY(0px); }
        }
        @keyframes spinCapsule {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes twinkle {
          0%,100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.25); opacity: 1; }
        }
        @keyframes pop {
          0% { transform: scale(0.96); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {spinning ? (
        <div style={{ padding: 16, borderRadius: 16, border: "1px solid #e5e7eb" }}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>抽選中…</div>

          <div style={{ position: "relative", width: 240, height: 190, margin: "0 auto" }}>
            {/* ガチャ枠 */}
            <div
              style={{
                position: "absolute",
                left: 70,
                top: 15,
                width: 100,
                height: 100,
                borderRadius: 999,
                border: "6px solid #111827",
                boxSizing: "border-box",
                animation: "wobble 0.45s ease-in-out infinite"
              }}
            />
            {/* カプセル */}
            <div
              style={{
                position: "absolute",
                left: 88,
                top: 33,
                width: 64,
                height: 64,
                borderRadius: 999,
                background: "linear-gradient(#60a5fa 0 50%, #fca5a5 50% 100%)",
                boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
                animation: "spinCapsule 0.85s linear infinite"
              }}
            />
            {/* キラキラ */}
            <div style={{ position: "absolute", left: 30, top: 25, fontSize: 18, animation: "twinkle 0.8s ease-in-out infinite" }}>✨</div>
            <div style={{ position: "absolute", right: 30, top: 55, fontSize: 16, animation: "twinkle 0.9s ease-in-out infinite" }}>✨</div>
            <div style={{ position: "absolute", left: 45, bottom: 35, fontSize: 14, animation: "twinkle 1.0s ease-in-out infinite" }}>✨</div>
          </div>

          <div style={{ opacity: 0.7, fontSize: 12, textAlign: "center" }}>（約2秒）</div>
        </div>
      ) : null}

      {err ? (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fee2e2", color: "#7f1d1d" }}>
          {err}
        </div>
      ) : null}

      {(!spinning && draw) ? (
        <div
          style={{
            marginTop: 12,
            padding: 16,
            borderRadius: 14,
            background: "#dcfce7",
            color: "#14532d",
            animation: "pop 180ms ease-out"
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>
            {draw?.prizes?.title ?? "当選"}
          </div>
          <div style={{ whiteSpace: "pre-wrap" }}>
            {draw?.display_message}
          </div>
          {draw?.prizes?.description ? (
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
              {draw.prizes.description}
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ marginTop: 16 }}>
        <a href="/review">よろしければGoogleへ →</a>
      </div>

      <p style={{ fontSize: 12, opacity: 0.7, marginTop: 14 }}>
        本ガチャはアンケート回答への謝礼です。Google口コミ投稿は任意です。
      </p>

      <div style={{ marginTop: 12 }}>
        <a href="/">←戻る</a>
      </div>
    </main>
  );
}


