"use client";

import { useEffect, useMemo, useState } from "react";

export default function Gacha() {
  const [phase, setPhase] = useState("mix"); // mix -> drop -> open -> reveal
  const [draw, setDraw] = useState(null);
  const [err, setErr] = useState("");

  // テスト中：固定。あとで「QR→自動発行」に置換
  const sessionId = "94a2a745-97ad-47f2-9e75-1056aba54255";

  // カプセルの色（見た目固定でOK）
  const capsuleColors = useMemo(
    () => [
      { top: "#60a5fa", bottom: "#fca5a5" },
      { top: "#34d399", bottom: "#fde68a" },
      { top: "#a78bfa", bottom: "#fb7185" }
    ],
    []
  );

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setErr("");
      setDraw(null);
      setPhase("mix");

      // ① ガラガラ（2.0秒）
      await new Promise((r) => setTimeout(r, 2000));
      if (!alive) return;

      // 抽選（このタイミングで確定させる）
      try {
        const res = await fetch("/api/gacha/draw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clinic_id: 1, session_id: sessionId })
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          setErr(`抽選に失敗しました：${json?.error?.message ?? json?.error ?? res.statusText}`);
          return;
        }
        setDraw(json.draw);
      } catch (e) {
        setErr(`通信エラー：${String(e)}`);
        return;
      }

      // ② 1個落ちる（0.8秒）
      setPhase("drop");
      await new Promise((r) => setTimeout(r, 800));
      if (!alive) return;

      // ③ 開く（0.8秒）
      setPhase("open");
      await new Promise((r) => setTimeout(r, 800));
      if (!alive) return;

      // ④ 結果表示
      setPhase("reveal");
    };

    run();
    return () => {
      alive = false;
    };
  }, []);

  const prizeTitle = draw?.prizes?.title ?? "当選";
  const prizeDesc = draw?.prizes?.description ?? "";
  const displayMessage = draw?.display_message ?? "";

  return (
    <main style={{ textAlign: "center" }}>
      <style>{`
        /* ====== LAYOUT ====== */
        .card {
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 16px;
          background: #fff;
        }

        /* ====== MACHINE ====== */
        .machine {
          width: 320px;
          height: 420px;
          margin: 10px auto 0;
          position: relative;
          border-radius: 26px;
          background: linear-gradient(180deg, #111827, #0b1220);
          box-shadow: 0 22px 50px rgba(0,0,0,0.25);
          overflow: hidden;
        }

        .topCap {
          position: absolute;
          inset: 0 0 auto 0;
          height: 78px;
          background: linear-gradient(180deg, #1f2937, #0f172a);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .logo {
          position: absolute;
          top: 18px;
          left: 16px;
          right: 16px;
          color: rgba(255,255,255,0.92);
          font-weight: 900;
          letter-spacing: 0.5px;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo small {
          font-weight: 700;
          opacity: 0.7;
          font-size: 12px;
        }

        .glass {
          position: absolute;
          top: 92px;
          left: 26px;
          right: 26px;
          height: 210px;
          border-radius: 22px;
          background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25), rgba(255,255,255,0.06));
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.2);
          overflow: hidden;
        }

        .shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(255,255,255,0.0) 20%, rgba(255,255,255,0.16) 35%, rgba(255,255,255,0.0) 55%);
          transform: translateX(-40%);
          animation: shine 2.2s ease-in-out infinite;
          opacity: 0.7;
        }
        @keyframes shine {
          0% { transform: translateX(-60%); }
          50% { transform: translateX(20%); }
          100% { transform: translateX(-60%); }
        }

        /* inside capsules */
        .capsuleDot {
          position: absolute;
          width: 54px;
          height: 54px;
          border-radius: 999px;
          box-shadow: 0 10px 18px rgba(0,0,0,0.18);
        }
        .capsuleDot::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: linear-gradient(var(--top) 0 50%, var(--bottom) 50% 100%);
        }
        .capsuleDot::after {
          content: "";
          position: absolute;
          left: 12px;
          top: 10px;
          width: 16px;
          height: 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.55);
          filter: blur(0.2px);
          transform: rotate(-18deg);
        }

        /* “ガラガラ”動き */
        .mixing .c1 { animation: swirl1 0.9s linear infinite; }
        .mixing .c2 { animation: swirl2 1.05s linear infinite; }
        .mixing .c3 { animation: swirl3 0.95s linear infinite; }

        @keyframes swirl1 {
          0% { transform: translate(30px, 120px) rotate(0deg); }
          25% { transform: translate(180px, 40px) rotate(90deg); }
          50% { transform: translate(200px, 140px) rotate(180deg); }
          75% { transform: translate(70px, 160px) rotate(270deg); }
          100% { transform: translate(30px, 120px) rotate(360deg); }
        }
        @keyframes swirl2 {
          0% { transform: translate(170px, 130px) rotate(0deg); }
          25% { transform: translate(60px, 50px) rotate(100deg); }
          50% { transform: translate(40px, 150px) rotate(210deg); }
          75% { transform: translate(180px, 170px) rotate(320deg); }
          100% { transform: translate(170px, 130px) rotate(360deg); }
        }
        @keyframes swirl3 {
          0% { transform: translate(95px, 80px) rotate(0deg); }
          25% { transform: translate(210px, 95px) rotate(120deg); }
          50% { transform: translate(150px, 175px) rotate(220deg); }
          75% { transform: translate(40px, 110px) rotate(320deg); }
          100% { transform: translate(95px, 80px) rotate(360deg); }
        }

        /* ====== SLOT / DROP ====== */
        .slotArea {
          position: absolute;
          left: 0;
          right: 0;
          top: 315px;
          height: 80px;
          display: grid;
          place-items: center;
        }
        .slot {
          width: 180px;
          height: 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.14);
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.4);
        }

        .dispense {
          position: absolute;
          left: 50%;
          top: 286px;
          transform: translateX(-50%);
          width: 220px;
          height: 120px;
          border-radius: 18px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          display: grid;
          place-items: center;
        }

        .dropCapsuleWrap {
          position: absolute;
          left: 50%;
          top: 250px;
          transform: translateX(-50%);
          width: 90px;
          height: 170px;
          pointer-events: none;
        }

        /* 落下演出 */
        .dropping {
          animation: drop 0.8s cubic-bezier(.2,.9,.2,1) forwards;
        }
        @keyframes drop {
          0% { transform: translate(-50%, -20px) scale(0.9); opacity: 0.0; }
          12% { opacity: 1; }
          60% { transform: translate(-50%, 95px) scale(1); }
          100% { transform: translate(-50%, 110px) scale(1); }
        }

        /* ====== CAPSULE OPEN ====== */
        .capsuleBig {
          position: relative;
          width: 86px;
          height: 86px;
          border-radius: 999px;
          margin: 0 auto;
          box-shadow: 0 18px 28px rgba(0,0,0,0.28);
          overflow: visible;
        }
        .half {
          position: absolute;
          left: 0;
          width: 86px;
          height: 43px;
          border-radius: 999px 999px 18px 18px;
          background: var(--top);
        }
        .half.bottom {
          top: 43px;
          height: 43px;
          border-radius: 18px 18px 999px 999px;
          background: var(--bottom);
        }
        .seam {
          position: absolute;
          left: 10px;
          top: 41px;
          width: 66px;
          height: 4px;
          border-radius: 999px;
          background: rgba(0,0,0,0.18);
        }
        .open .half.top { animation: openTop 0.8s ease-out forwards; }
        .open .half.bottom { animation: openBottom 0.8s ease-out forwards; }
        @keyframes openTop {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-18px) rotate(-18deg); }
        }
        @keyframes openBottom {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(18px) rotate(18deg); }
        }

        /* ====== REVEAL CARD ====== */
        .revealCard {
          margin-top: 14px;
          padding: 16px;
          border-radius: 16px;
          background: #dcfce7;
          color: #14532d;
          animation: pop 200ms ease-out;
        }
        @keyframes pop {
          0% { transform: scale(0.96); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .bigTitle {
          font-weight: 900;
          font-size: 22px;
          margin-bottom: 8px;
        }

        .tinyNote {
          margin-top: 14px;
          font-size: 12px;
          opacity: 0.7;
        }

        .errorBox {
          margin-top: 12px;
          padding: 12px;
          border-radius: 12px;
          background: #fee2e2;
          color: #7f1d1d;
          text-align: left;
        }
      `}</style>

      <h1>ガチャ</h1>

      <div className="card">
        <div className="machine">
          <div className="topCap" />
          <div className="logo">
            <span>GACHA</span>
            <small>抽選</small>
          </div>

          <div className={`glass ${phase === "mix" ? "mixing" : ""}`}>
            <div className="shine" />

            {/* ガチャ内のカプセル（ガラガラ動く） */}
            <div
              className="capsuleDot c1"
              style={{ ["--top"]: capsuleColors[0].top, ["--bottom"]: capsuleColors[0].bottom }}
            />
            <div
              className="capsuleDot c2"
              style={{ ["--top"]: capsuleColors[1].top, ["--bottom"]: capsuleColors[1].bottom }}
            />
            <div
              className="capsuleDot c3"
              style={{ ["--top"]: capsuleColors[2].top, ["--bottom"]: capsuleColors[2].bottom }}
            />

            {/* mix以外では“静止”させる（自然） */}
            {phase !== "mix" ? (
              <>
                <div
                  className="capsuleDot"
                  style={{
                    ["--top"]: capsuleColors[0].top,
                    ["--bottom"]: capsuleColors[0].bottom,
                    transform: "translate(40px, 130px)"
                  }}
                />
                <div
                  className="capsuleDot"
                  style={{
                    ["--top"]: capsuleColors[1].top,
                    ["--bottom"]: capsuleColors[1].bottom,
                    transform: "translate(150px, 55px)"
                  }}
                />
                <div
                  className="capsuleDot"
                  style={{
                    ["--top"]: capsuleColors[2].top,
                    ["--bottom"]: capsuleColors[2].bottom,
                    transform: "translate(190px, 140px)"
                  }}
                />
              </>
            ) : null}
          </div>

          {/* 排出口っぽい部分 */}
          <div className="slotArea">
            <div className="slot" />
          </div>

          <div className="dispense">
            {/* 落下→開封の“主役カプセル” */}
            {(phase === "drop" || phase === "open" || phase === "reveal") ? (
              <div
                className={`dropCapsuleWrap ${phase === "drop" ? "dropping" : ""}`}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "250px",
                  transform: "translateX(-50%)"
                }}
              >
                <div
                  className={`capsuleBig ${phase === "open" || phase === "reveal" ? "open" : ""}`}
                  style={{
                    ["--top"]: "#60a5fa",
                    ["--bottom"]: "#fca5a5"
                  }}
                >
                  <div className="half top" style={{ top: 0 }} />
                  <div className="seam" />
                  <div className="half bottom" />
                </div>
              </div>
            ) : (
              <div style={{ color: "rgba(255,255,255,0.75)", fontWeight: 800 }}>
                {phase === "mix" ? "ガラガラ中…" : "準備中"}
              </div>
            )}
          </div>
        </div>

        {/* エラー表示 */}
        {err ? <div className="errorBox">{err}</div> : null}

        {/* 結果表示（カプセルが開いた後に出る） */}
        {phase === "reveal" && !err && draw ? (
          <div className="revealCard">
            <div className="bigTitle">🎉 {prizeTitle}</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{displayMessage || "受付でお申し出ください。"}</div>
            {prizeDesc ? (
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>{prizeDesc}</div>
            ) : null}
          </div>
        ) : null}

        <div style={{ marginTop: 16 }}>
          <a href="/review">よろしければGoogleへ →</a>
        </div>

        <div className="tinyNote">
          本ガチャはアンケート回答への謝礼です。Google口コミ投稿は任意です。
        </div>
      </div>
    </main>
  );
}
