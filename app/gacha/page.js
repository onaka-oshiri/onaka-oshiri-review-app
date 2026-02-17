function Spinner() {
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
