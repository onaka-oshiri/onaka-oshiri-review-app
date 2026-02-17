"use client";

import { useEffect, useState } from "react";

function function Spinner() {
  return (
    <div style={{ display: "grid", placeItems: "center", padding: 18 }}>
      <div style={{ position: "relative", width: 220, height: 180 }}>
        {/* ガチャ本体 */}
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 10,
            width: 100,
            height: 100,
            borderRadius: 999,
            border: "6px solid #111827",
            boxSizing: "border-box",
            transformOrigin: "50% 50%",
            animation: "shake 0.5s ease-in-out infinite"
          }}
        />
        {/* カプセル（上下2色の球） */}
        <div
          style={{
            position: "absolute",
            left: 78,
            top: 28,
            width: 64,
            height: 64,
            borderRadius: 999,
            background: "linear-gradient(#60a5fa 0 50%, #fca5a5 50% 100%)",
            boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
            animation: "spinCapsule 0.9s linear infinite"
          }}
        />
        {/* キラキラ */}
        <div style={{ position: "absolute", left: 25, top: 25, fontSize: 18, animation: "twinkle 0.8s ease-in-out infinite" }}>✨</div>
        <div style={{ position: "absolute", right: 25, top: 45, fontSize: 16, animation: "twinkle 0.9s ease-in-out infinite" }}>✨</div>
        <div style={{ position: "absolute", left: 40, bottom: 30, fontSize: 14, animation: "twinkle 1s ease-in-out infinite" }}>✨</div>
      </div>

      <div style={{ marginTop: 2, fontWeight: 900, fontSize: 18 }}>ガチャ抽選中…</div>
      <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>（約2秒）</div>

      <style>{`
        @keyframes shake {
          0% { transform: rotate(-6deg) translateY(0px); }
          50% { transform: rotate(6deg) translateY(-2px); }
          100% { transform: rotate(-6deg) translateY(0px); }
        }
        @keyframes spinCapsule {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes twinkle {
          0%,100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes pop {
          0%{ transform: scale(0.95); opacity: 0;}
          100%{ transform: scale(1); opacity: 1;}
        }
      `}</style>
    </div>
  );
}
 {
  return (
    <div style={{ display: "grid", placeItems: "center", padding: 18 }}>
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 999,
          border: "10px solid #e5e7eb",
          borderTopColor: "#111827",
          animation: "spin 0.8s linear infinite"
        }}
      />
      <div style={{ marginTop: 12, fontWeight: 800 }}>抽選中…</div>
      <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>くるくる（2秒）</div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes pop { 0%{ transform: scale(0.95); opacity: 0;} 100%{ transform: scale(1); opacity: 1;} }
      `}</style>
    </div>
  );
}

export default function Gacha() {
  const [spinning, setSpinning] = useState(true);
  const [draw, setDraw] = useState(null);
  const [err, setErr] = useState("");

  // テスト中：固定。あとで「QR→自動発行」に置換する
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

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 12 }}>
        {spinning ? <Spinner /> : null}

        {err ? (
          <div style={{ padding: 12, borderRadius: 12, background: "#fee2e2", color: "#7f1d1d" }}>
            {err}
          </div>
        ) : null}

        {!spinning && draw ? (
          <div
            style={{
              marginTop: 4,
              padding: 16,
              borderRadius: 14,
              background: "#dcfce7",
              color: "#14532d",
              animation: "pop 200ms ease-out"
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>
              {draw?.prizes?.title ?? "当選"}
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>{draw?.display_message}</div>
            {draw?.prizes?.description ? (
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
                {draw.prizes.description}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

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
