"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const box = (selected) => ({
  margin: 8,
  padding: 12,
  borderRadius: 10,
  border: selected ? "2px solid #111827" : "1px solid #d1d5db",
  background: selected ? "#e0f2fe" : "white",
  cursor: "pointer",
  userSelect: "none",
  fontWeight: selected ? 700 : 500,
});

function SurveyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sid = params.get("sid");

  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    q1_services: [],
    q2_reasons: [],
    q3_anxiety: "",
    q5_impressions: [],
    q6_experience: "",
    q3_star: 5,
    q4_free: "",
  });

  const toggleArray = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const setOne = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const canNext = useMemo(() => {
    if (step === 1) return form.q1_services.length > 0;
    if (step === 2) return form.q2_reasons.length > 0;
    if (step === 3) return !!form.q3_anxiety;
    if (step === 4) return form.q5_impressions.length > 0;
    if (step === 5) return !!form.q6_experience;
    if (step === 6) return true;
    if (step === 7) return true;
    return true;
  }, [step, form]);

  const submit = async () => {
    const res = await fetch("/api/survey/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sid, clinic_id: 1, ...form }),
    });
    const json = await res.json();
    if (!json.ok) {
      alert("送信に失敗しました：" + (json.error || ""));
      return;
    }
    router.push(`/gacha?sid=${sid}&star=${form.q3_star}`);
  };

  if (!sid) return <div style={{ padding: 20 }}>sidがありません</div>;

  return (
    <div style={{ padding: 20, maxWidth: 520, margin: "40px auto" }}>
      <div style={{ marginBottom: 18, fontWeight: 700 }}>STEP {step} / 7</div>

      {step === 1 && (
        <>
          <h2>Q1 本日の受診内容（複数選択）</h2>
          {["大腸カメラ", "胃カメラ", "ジオン注射", "マンジャロ注射"].map((v) => (
            <div
              key={v}
              onClick={() => toggleArray("q1_services", v)}
              style={box(form.q1_services.includes(v))}
            >
              {v}
            </div>
          ))}
          <button disabled={!canNext} onClick={next}>
            次へ
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h2>Q2 当院を選んだ理由（複数選択）</h2>
          {["口コミ", "立地", "専門性", "女性医師", "AI内視鏡"].map((v) => (
            <div
              key={v}
              onClick={() => toggleArray("q2_reasons", v)}
              style={box(form.q2_reasons.includes(v))}
            >
              {v}
            </div>
          ))}
          <button onClick={back}>戻る</button>{" "}
          <button disabled={!canNext} onClick={next}>
            次へ
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <h2>Q3 受診前の不安</h2>
          {["とても不安", "少し不安", "あまり不安なし", "不安なし"].map((v) => (
            <div
              key={v}
              onClick={() => setOne("q3_anxiety", v)}
              style={box(form.q3_anxiety === v)}
            >
              {v}
            </div>
          ))}
          <button onClick={back}>戻る</button>{" "}
          <button disabled={!canNext} onClick={next}>
            次へ
          </button>
        </>
      )}

      {step === 4 && (
        <>
          <h2>Q4 印象に残った点（複数選択）</h2>
          {["説明が丁寧", "痛みに配慮", "スタッフが親切", "清潔感", "待ち時間短い"].map((v) => (
            <div
              key={v}
              onClick={() => toggleArray("q5_impressions", v)}
              style={box(form.q5_impressions.includes(v))}
            >
              {v}
            </div>
          ))}
          <button onClick={back}>戻る</button>{" "}
          <button disabled={!canNext} onClick={next}>
            次へ
          </button>
        </>
      )}

      {step === 5 && (
        <>
          <h2>Q5 検査体験の印象</h2>
          {["想像より楽", "問題なかった", "少し緊張", "不安が残った"].map((v) => (
            <div
              key={v}
              onClick={() => setOne("q6_experience", v)}
              style={box(form.q6_experience === v)}
            >
              {v}
            </div>
          ))}
          <button onClick={back}>戻る</button>{" "}
          <button disabled={!canNext} onClick={next}>
            次へ
          </button>
        </>
      )}

      {step === 6 && (
        <>
          <h2>Q6 満足度</h2>
          <input
            type="range"
            min="1"
            max="5"
            value={form.q3_star}
            onChange={(e) => setOne("q3_star", Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ margin: "10px 0" }}>★ {form.q3_star}</div>
          <button onClick={back}>戻る</button>{" "}
          <button onClick={next}>次へ</button>
        </>
      )}

      {step === 7 && (
        <>
          <h2>Q7 一言（任意）</h2>
          <textarea
            value={form.q4_free}
            onChange={(e) => setOne("q4_free", e.target.value)}
            placeholder="120文字以内（目安）"
            style={{ width: "100%", height: 90, padding: 10 }}
            maxLength={120}
          />
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {form.q4_free.length}/120
          </div>
          <button onClick={back}>戻る</button>{" "}
          <button onClick={submit}>送信してガチャへ</button>
        </>
      )}
    </div>
  );
}

export default function SurveyPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>読み込み中...</div>}>
      <SurveyInner />
    </Suspense>
  );
}



