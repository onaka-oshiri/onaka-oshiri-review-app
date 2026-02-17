"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function GachaInner() {
  const params = useSearchParams();

  // sidは必須（受付QR→/start→/survey→/gacha で渡ってくる）
  const sessionId = params.get("sid") || "";

  // 星は「URLの star」を最優先（survey側で付けるのが最強）
  // 例：/gacha?sid=...&star=5
  const starFromQuery = Number(params.get("star") || "");
  const star = Number.isFinite(starFromQuery) && starFromQuery > 0 ? starFromQuery : null;

  const [phase, setPhase] = useState("mix"); // mix -> drop -> open -> reveal
  const [draw, setDraw] = useState(null);
  const [err, setErr] = useState("");

  const capsuleDots = useMemo(
    () => [
      { top: "#60a5fa", bottom: "#fca5a5" },
      { top: "#34d399", bottom: "#fde68a" },
      { top: "#a78bfa", bottom: "#fb7185" }
    ],
    []
  );

  // 当選に応じて色を変える（1等=金 / 2等=銀 / 3等=銅）
  const tier = useMemo(() => {
    const t = draw?.prizes?.title || "";
    if (t.includes("1等")) return 1;
    if (t.includes("2等")) return 2;
    if (t.includes("3等")) return 3;
    return 0;
  }, [draw]);

  const theme = useMemo(() => {
    if (tier === 1) return { top: "#fbbf24", bottom: "#fde68a", glow: "rgba(251,191,36,0.55)", label: "GOLD" };
    if (tier === 2) return { top: "#e5e7eb", bottom: "#9ca3af", glow: "rgba(229,231,235,0.55)", label: "SILVER" };
    if (tier === 3) return { top: "#fb923c", bottom: "#fdba74", glow: "rgba(251,146,60,0.55)", label: "BRONZE" };
    return { top: "#60a5fa", bottom: "#fca5a5", glow: "rgba(96,165,250,0.45)", label: "LUCKY" };
  }, [tier]);

  const isPositive = star !== null ? star >= 5 : false; // ★が分からない場合は強誘導しない

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setErr("");
      setDraw(null);
      setPhase("mix");

      // sidがない場合は止める（直アクセス対策）
      if (!sessionId) {
        setErr("URLの sid がありません。受付のQRから開き直してください。");
        setPhase("reveal");
        return;
      }

      // ① ガラガラ（2.0秒）
      await new Promise((r) => setTimeout(r, 2000));
      if (!alive) return;

      // 抽選確定
      try {
        const res = await fetch("/api/gacha/draw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clinic_id: 1, session_id: sessionId })
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          setErr(`抽選に失敗しました：${json?.error?.message ?? json?.error ?? res.statusText}`);
          setPhase("reveal");
          return;
        }
        setDraw(json.draw);
      } catch (e) {
        setErr(`通信エラー：${String(e)}`);
        setPhase("reveal");
        return;
      }

      // ② 落下（1.0秒：コロンバウンド込み）
      setPhase("drop");
      await new Promise((r) => setTimeout(r, 1000));
      if (!alive) return;

      // ③ 開封（0.9秒）
      setPhase("open");
      await new Promise((r) => setTimeout(r, 900));
      if (!alive) return;

      // ④ 結果表示
      setPhase("reveal");
    };

    run();
    return () => {
      alive = false;
    };
  }, [sessionId]);

  const prizeTitle = draw?.prizes?.title ?? "当選";
  const prizeDesc = draw?.prizes?.description ?? "";
  const displayMessage = draw?.display_message ?? "";

  return (
    <main style={{ textAlign: "center" }}>
      <style>{`
        .card {
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 16px;
          background: #fff;
        }

        /* ====== MACHINE ====== */
        .machine {
          width: 340px;
          height: 500px;
          margin: 10px auto 0;
          position: relative;
          border-radius: 28px;
          background: linear-gradient(180deg, #111827, #0b1220);
          box-shadow: 0 22px 55px rgba(0,0,0,0.28);
          overflow: hidden;
        }

        .topCap {
          position: absolute;
          inset: 0 0 auto 0;
          height: 84px;
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
          letter-spacing: 0.6px;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo small {
          font-weight: 700;
          opacity: 0.72;
          font-size: 12px;
        }

        /* ====== HANDLE ====== */
        .handleArea {
          position: absolute;
          top: 92px;
          right: 16px;
          width: 86px;
          height: 120px;
          display: grid;
          place-items: center;
        }
        .handleBase {
          width: 58px;
          height: 58px;
          border-radius: 999px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.15);
          box-shadow: inset 0 6px 14px rgba(0,0,0,0.25);
          position: relative;
        }
        .handleKnob {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.88);
          transform: translate(-50%,-50%);
          box-shadow: 0 6px 14px rgba(0,0,0,0.25);
        }
        .handleArm {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 34px;
          height: 6px;
          background: rgba(255,255,255,0.88);
          border-radius: 999px;
          transform-origin: 0% 50%;
          transform: translateY(-50%) rotate(0deg);
          box-shadow: 0 6px 14px rgba(0,0,0,0.18);
        }
        .handleSpin .handleArm { animation: crank 0.55s ease-in-out infinite; }
        @keyframes crank {
          0%   { transform: translateY(-50%) rotate(-30deg); }
          50%  { transform: translateY(-50%) rotate(110deg); }
          100% { transform: translateY(-50%) rotate(-30deg); }
        }

        /* ====== GLASS ====== */
        .glass {
          position: absolute;
          top: 98px;
          left: 22px;
          right: 106px; /* ハンドル分あける */
          height: 230px;
          border-radius: 22px;
          background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25), rgba(255,255,255,0.06));
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.22);
          overflow: hidden;
        }
        .shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(255,255,255,0.0) 20%, rgba(255,255,255,0.18) 35%, rgba(255,255,255,0.0) 55%);
          transform: translateX(-40%);
          animation: shine 2.1s ease-in-out infinite;
          opacity: 0.65;
        }
        @keyframes shine {
          0% { transform: translateX(-65%); }
          50% { transform: translateX(25%); }
          100% { transform: translateX(-65%); }
        }

        .capsuleDot {
          position: absolute;
          width: 56px;
          height: 56px;
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
          width: 18px;
          height: 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.55);
          transform: rotate(-18deg);
        }

        .mixing .c1 { animation: swirl1 0.9s linear infinite; }
        .mixing .c2 { animation: swirl2 1.05s linear infinite; }
        .mixing .c3 { animation: swirl3 0.95s linear infinite; }

        @keyframes swirl1 {
          0% { transform: translate(24px, 145px) rotate(0deg); }
          25% { transform: translate(165px, 48px) rotate(90deg); }
          50% { transform: translate(170px, 150px) rotate(180deg); }
          75% { transform: translate(62px, 176px) rotate(270deg); }
          100% { transform: translate(24px, 145px) rotate(360deg); }
        }
        @keyframes swirl2 {
          0% { transform: translate(150px, 160px) rotate(0deg); }
          25% { transform: translate(45px, 56px) rotate(110deg); }
          50% { transform: translate(38px, 164px) rotate(210deg); }
          75% { transform: translate(150px, 188px) rotate(320deg); }
          100% { transform: translate(150px, 160px) rotate(360deg); }
        }
        @keyframes swirl3 {
          0% { transform: translate(80px, 95px) rotate(0deg); }
          25% { transform: translate(175px, 105px) rotate(120deg); }
          50% { transform: translate(120px, 198px) rotate(220deg); }
          75% { transform: translate(30px, 120px) rotate(320deg); }
          100% { transform: translate(80px, 95px) rotate(360deg); }
        }

        /* ====== SLOT / TRAY ====== */
        .slot {
          position: absolute;
          top: 308px;
          left: 50%;
          transform: translateX(-50%);
          width: 190px;
          height: 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.14);
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.45);
        }

        .tray {
          position: absolute;
          left: 20px;
          right: 20px;
          bottom: 34px;
          height: 120px;
          border-radius: 20px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: inset 0 8px 18px rgba(0,0,0,0.32);
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        /* ====== HERO CAPSULE (drop/open) ====== */
        .heroWrap {
          position: absolute;
          left: 50%;
          top: 272px;
          transform: translateX(-50%);
          width: 110px;
          height: 220px;
          pointer-events: none;
          z-index: 5;
        }

        .dropBounce {
          animation: dropBounce 1.0s cubic-bezier(.2,.9,.2,1) forwards;
        }
        @keyframes dropBounce {
          0%   { transform: translateX(-50%) translateY(-40px) scale(0.95); opacity: 0; }
          10%  { opacity: 1; }
          60%  { transform: translateX(-50%) translateY(120px) scale(1); }
          78%  { transform: translateX(-50%) translateY(92px)  scale(1); }
          88%  { transform: translateX(-50%) translateY(120px) scale(1); }
          100% { transform: translateX(-50%) translateY(112px) scale(1); }
        }

        .capsuleBig {
          position: absolute;
          left: 50%;
          top: 0px;
          transform: translateX(-50%);
          width: 92px;
          height: 92px;
          border-radius: 999px;
          box-shadow: 0 18px 30px rgba(0,0,0,0.30);
        }

        .half {
          position: absolute;
          left: 0;
          width: 92px;
          height: 46px;
          border-radius: 999px 999px 18px 18px;
          background: var(--top);
        }
        .half.bottom {
          top: 46px;
          height: 46px;
          border-radius: 18px 18px 999px 999px;
          background: var(--bottom);
        }
        .seam {
          position: absolute;
          left: 10px;
          top: 44px;
          width: 72px;
          height: 4px;
          border-radius: 999px;
          background: rgba(0,0,0,0.18);
        }
        .highlight {
          position: absolute;
          left: 16px;
          top: 12px;
          width: 18px;
          height: 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.60);
          transform: rotate(-18deg);
        }

        .open .half.top { animation: openTop 0.9s ease-out forwards; }
        .open .half.bottom { animation: openBottom 0.9s ease-out forwards; }
        @keyframes openTop {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-20px) rotate(-20deg); }
        }
        @keyframes openBottom {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(20px) rotate(20deg); }
        }

        .winGlow {
          box-shadow: 0 0 0 2px rgba(255,255,255,0.10), 0 0 35px var(--glow);
        }

        /* ====== REVEAL CARD ====== */
        .revealCard {
          margin-top: 14px;
          padding: 16px;
          border-radius: 16px;
          background: #dcfce7;
          color: #14532d;
          animation: pop 200ms ease-out;
          border: 1px solid rgba(20,83,45,0.18);
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
        .badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.6px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(17,24,39,0.08);
          border: 1px solid rgba(17,24,39,0.12);
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

        /* Google誘導ブロック（★5のみ） */
        .cta {
          margin-top: 18px;
          padding: 16px;
          border-radius: 16px;
          background: #fef3c7;
          border: 1px solid #fcd34d;
          color: #111827;
        }
        .ctaBtn {
          display: inline-block;
          margin-top: 10px;
          padding: 12px 18px;
          border-radius: 999px;
          background: #111827;
          color: #fff;
          font-weight: 900;
          text-decoration: none;
        }
        .internal {
          margin-top: 18px;
          padding: 16px;
          border-radius: 16px;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          color: #111827;
        }
      `}</style>

      <h1>ガチャ</h1>

      <div className="card">
        <div className="machine">
          <div className="topCap" />
          <div className="logo">
            <span>GACHA</span>
            <small>ガチャ → カプセル → 当選</small>
          </div>

          {/* ハンドル（mix/dropで回る） */}
          <div className={`handleArea ${phase === "mix" || phase === "drop" ? "handleSpin" : ""}`}>
            <div className="handleBase">
              <div className="handleArm" />
              <div className="handleKnob" />
            </div>
          </div>

          {/* ガラス室 */}
          <div className={`glass ${phase === "mix" ? "mixing" : ""}`}>
            <div className="shine" />

            {/* ガチャ内カプセル（ガラガラ） */}
            <div className="capsuleDot c1" style={{ ["--top"]: capsuleDots[0].top, ["--bottom"]: capsuleDots[0].bottom }} />
            <div className="capsuleDot c2" style={{ ["--top"]: capsuleDots[1].top, ["--bottom"]: capsuleDots[1].bottom }} />
            <div className="capsuleDot c3" style={{ ["--top"]: capsuleDots[2].top, ["--bottom"]: capsuleDots[2].bottom }} />

            {/* mix以外は静止っぽく配置 */}
            {phase !== "mix" ? (
              <>
                <div className="capsuleDot" style={{ ["--top"]: capsuleDots[0].top, ["--bottom"]: capsuleDots[0].bottom, transform: "translate(30px, 150px)" }} />
                <div className="capsuleDot" style={{ ["--top"]: capsuleDots[1].top, ["--bottom"]: capsuleDots[1].bottom, transform: "translate(140px, 70px)" }} />
                <div className="capsuleDot" style={{ ["--top"]: capsuleDots[2].top, ["--bottom"]: capsuleDots[2].bottom, transform: "translate(170px, 165px)" }} />
              </>
            ) : null}
          </div>

          {/* スロット */}
          <div className="slot" />

          {/* 主役カプセル：drop/open/revealで表示 */}
          {(phase === "drop" || phase === "open" || phase === "reveal") && !err ? (
            <div className={`heroWrap ${phase === "drop" ? "dropBounce" : ""}`}>
              <div
                className={`capsuleBig ${phase === "open" || phase === "reveal" ? "open" : ""} ${phase === "reveal" ? "winGlow" : ""}`}
                style={{ ["--top"]: theme.top, ["--bottom"]: theme.bottom, ["--glow"]: theme.glow }}
              >
                <div className="half top" style={{ top: 0 }} />
                <div className="seam" />
                <div className="half bottom" />
                <div className="highlight" />
              </div>
            </div>
          ) : null}

          {/* トレー */}
          <div className="tray">
            <div style={{ color: "rgba(255,255,255,0.75)", fontWeight: 900 }}>
              {phase === "mix" ? "ガラガラ中…" : phase === "drop" ? "コロン！" : phase === "open" ? "パカッ…" : "🎉"}
            </div>
          </div>
        </div>

        {/* エラー */}
        {err ? <div className="errorBox">{err}</div> : null}

        {/* 結果表示 */}
        {phase === "reveal" && !err && draw ? (
          <div className="revealCard">
            <div className="badge">{theme.label}</div>
            <div className="bigTitle">🎉 {prizeTitle}</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{displayMessage || "受付でお申し出ください。"}</div>
            {prizeDesc ? <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>{prizeDesc}</div> : null}

            {/* ★5のみGoogleを強く誘導／それ以外は院内フィードバックのみ */}
            {isPositive ? (
              <div className="cta">
                <div style={{ fontWeight: 900, fontSize: 16 }}>
                  ご満足いただけましたら、ぜひGoogleの口コミもお願いいたします 🙇
                </div>
                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                  （投稿は任意です。いただいたご意見は今後の診療改善に活かします）
                </div>
                <a className="ctaBtn" href={`/review?sid=${encodeURIComponent(sessionId)}&star=${encodeURIComponent(star ?? "")}`}>
                  Googleに口コミを書く
                </a>
              </div>
            ) : (
              <div className="internal">
                <div style={{ fontWeight: 900, fontSize: 16 }}>貴重なご意見ありがとうございます。</div>
                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                  より良い医療を提供できるよう、院内で改善に活かさせていただきます。
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="tinyNote">
          本ガチャはアンケート回答への謝礼です。Google口コミ投稿は任意です。
        </div>

        <div style={{ marginTop: 12 }}>
          <a href="/">←戻る</a>
        </div>

        {/* ★がURLに来てない場合のヒント（運用に支障は出ない） */}
        {phase === "reveal" && !err && draw && star === null ? (
          <div style={{ marginTop: 10, fontSize: 11, opacity: 0.55 }}>
            ※star がURLに無い場合、Google誘導は強調しません（運用最適化のため）
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function GachaPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>読み込み中...</main>}>
      <GachaInner />
    </Suspense>
  );
}

