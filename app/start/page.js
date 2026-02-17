"use client";

import { useState } from "react";

export default function Start() {
  const [sid, setSid] = useState("");
  const [err, setErr] = useState("");

  const go = async () => {
    setErr("");
    setSid("");
    const res = await fetch("/api/session/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinic_id: 1 })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      setErr(json?.error?.message ?? json?.error ?? "error");
      return;
    }
    setSid(json.session_id);
  };

  return (
    <main>
      <h1>受付スタート（テスト）</h1>
      <button onClick={go} style={{ padding: 12, borderRadius: 12, border: "none", background: "#111827", color: "white", fontWeight: 800 }}>
        セッション発行 → sid表示
      </button>

      {err ? <div style={{ marginTop: 12, padding: 12, background: "#fee2e2", borderRadius: 12 }}>{err}</div> : null}

      {sid ? (
        <div style={{ marginTop: 12, padding: 12, background: "#dcfce7", borderRadius: 12 }}>
          <div style={{ fontWeight: 800 }}>sid</div>
          <div style={{ wordBreak: "break-all" }}>{sid}</div>
          <div style={{ marginTop: 8 }}>
            <a href={`/survey?sid=${sid}`}>→ このsidでアンケへ</a>
          </div>
        </div>
      ) : null}
    </main>
  );
}
