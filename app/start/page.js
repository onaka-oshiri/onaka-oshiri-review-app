"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Start() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const startSession = async () => {
      try {
        const res = await fetch("/api/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clinic_id: 1 })
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json.ok) {
          setErr(json?.error?.message ?? json?.error ?? "セッション作成失敗");
          setLoading(false);
          return;
        }

        // ✅ セッション成功 → アンケートへ自動遷移
        router.replace(`/survey?sid=${encodeURIComponent(json.session_id)}`);

      } catch (e) {
        setErr("通信エラー");
        setLoading(false);
      }
    };

    startSession();
  }, [router]);

  return (
    <main style={{ textAlign: "center", paddingTop: 60 }}>
      <h1>受付処理中...</h1>

      {loading && (
        <div style={{ marginTop: 20 }}>
          セッションを準備しています...
        </div>
      )}

      {err && (
        <div style={{
          marginTop: 20,
          padding: 16,
          background: "#fee2e2",
          borderRadius: 12,
          color: "#7f1d1d"
        }}>
          {err}
        </div>
      )}
    </main>
  );
}


