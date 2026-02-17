"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const Q1_SERVICES = [
  "大腸内視鏡検査（大腸カメラ）",
  "胃内視鏡検査（胃カメラ）",
  "ジオン注射（痔の日帰り治療）",
  "メディカルダイエット外来（マンジャロ注射）",
  "痔の診察・治療",
  "腹痛の診察",
  "下痢の診察",
  "便秘の診察",
  "健康診断・検査",
  "その他"
];

const Q2_REASONS = [
  "大塚駅から近い",
  "豊島区で探した",
  "池袋・巣鴨・板橋区から通いやすい",
  "口コミが良かった",
  "医師の専門性",
  "女性医師が在籍している",
  "苦しくない内視鏡検査",
  "AI内視鏡がある",
  "痔の専門治療がある",
  "メディカルダイエットに対応している",
  "ホームページが分かりやすかった",
  "紹介された"
];

const Q3_LABELS = ["とても満足", "満足", "普通", "やや不満", "不満"];

export default function Survey() {
  const params = useSearchParams();
  const router = useRouter();
  const sid = params.get("sid") || "";

  const [q1, setQ1] = useState(new Set());
  const [q2, setQ2] = useState(new Set());
  const [q3Star, setQ3Star] = useState(5);
  const [q3Label, setQ3Label] = useState("とても満足");
  const [q4, setQ4] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const q4Len = useMemo(() => q4.length, [q4]);

  const toggle = (setState, value) => {
    setState((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const submit = async () => {
    setErr("");

    if (!sid) {
      setErr("URLの sid がありません。受付のQRから開き直してください。");
      return;
    }
    if (q1.size === 0) return setErr("Q1を1つ以上選択してください。");
    if (q2.size === 0) return setErr("Q2を1つ以上選択してください。");
    if (q4.length > 120) return setErr("自由記述が120文字を超えています。");

    setBusy(true);
    try {
      const res = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: 1,
          session_id: sid,
          q1_services: Array.from(q1),
          q2_reasons: Array.from(q2),
          q3_star: Number(q3Star),
          q3_label: q3Label,
          q4_free: q4.trim() ? q4.trim() : null
        })
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setErr(`送信に失敗しました：${json?.error?.message ?? json?.error ?? res.statusText}`);
        return;
      }

      // ✅ 送信成功したら同じsidでガチャへ
      router.push(`/gacha?sid=${encodeURIComponent(sid)}`);
    } catch (e) {
      setErr(`通信エラー：${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <h1>アンケート</h1>

      {!sid ? (
        <div style={{ padding: 12, borderRadius: 12, background: "#fee2e2", color: "#7f1d1d", marginBottom: 12 }}>
          sidがありません。受付のQRから開き直してください。
        </div>
      ) : (
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12, wordBreak: "break-all" }}>
          sid: {sid}
        </div>
      )}

      <section style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18 }}>Q1 本日の受診内容（複数選択可）</h2>
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          {Q1_SERVICES.map((v) => (
            <label key={v} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={q1.has(v)} onChange={() => toggle(setQ1, v)} />
              <span>{v}</span>
            </label>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18 }}>Q2 当院を選んだ理由（複数選択可）</h2>
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          {Q2_REASONS.map((v) => (
            <label key={v} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={q2.has(v)} onChange={() => toggle(setQ2, v)} />
              <span>{v}</span>
            </label>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18 }}>Q3 満足度（必須）</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
          <label>
            ⭐（1〜5）
            <input
              type="number"
              min={1}
              max={5}
              value={q3Star}
              onChange={(e) => setQ3Star(Number(e.target.value))}
              style={{ marginLeft: 8, width: 80, padding: 8, borderRadius: 10, border: "1px solid #d1d5db" }}
            />
          </label>
          <label>
            ラベル
            <select
              value={q3Label}
              onChange={(e) => setQ3Label(e.target.value)}
              style={{ marginLeft: 8, padding: 8, borderRadius: 10, border: "1px solid #d1d5db" }}
            >
              {Q3_LABELS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18 }}>Q4 ご感想（任意・120字まで）</h2>
        <textarea
          value={q4}
          onChange={(e) => setQ4(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #d1d5db", marginTop: 8 }}
          placeholder="（任意）"
        />
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
          {q4Len}/120
        </div>
      </section>

      {err ? (
        <div style={{ padding: 12, borderRadius: 12, background: "#fee2e2", color: "#7f1d1d", marginBottom: 12 }}>
          {err}
        </div>
      ) : null}

      <button
        onClick={submit}
        disabled={busy || !sid}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 14,
          border: "none",
          background: "#111827",
          color: "white",
          fontWeight: 800,
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy || !sid ? 0.6 : 1
        }}
      >
        {busy ? "送信中..." : "送信してガチャへ"}
      </button>

      <div style={{ marginTop: 12 }}>
        <a href="/">←戻る</a>
      </div>
    </main>
  );
}
