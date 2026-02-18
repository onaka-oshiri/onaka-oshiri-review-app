"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SurveyPage() {
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
    q7_recommend: "",
    q4_free: ""
  });

  const toggleArray = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const submit = async () => {
    await fetch("/api/survey/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, session_id: sid, clinic_id: 1 })
    });

    router.push(`/gacha?sid=${sid}&star=${form.q3_star}`);
  };

  const Card = ({ children }) => (
    <div style={{ padding: 20, maxWidth: 500, margin: "40px auto" }}>
      {children}
    </div>
  );

  const Option = ({ label, onClick, active }) => (
    <div
      onClick={onClick}
      style={{
        padding: 14,
        margin: "8px 0",
        borderRadius: 10,
        border: active ? "2px solid #111" : "1px solid #ccc",
        cursor: "pointer"
      }}
    >
      {label}
    </div>
  );

  if (!sid) return <div>sidがありません</div>;

  return (
    <Card>
      <div style={{ marginBottom: 20 }}>
        STEP {step} / 7
      </div>

      {step === 1 && (
        <>
          <h2>本日の受診内容</h2>
          {["大腸カメラ","胃カメラ","ジオン注射","マンジャロ注射"].map(v => (
            <Option
              key={v}
              label={v}
              active={form.q1_services.includes(v)}
              onClick={() => toggleArray("q1_services", v)}
            />
          ))}
          <button onClick={next}>次へ</button>
        </>
      )}

      {step === 2 && (
        <>
          <h2>当院を選んだ理由</h2>
          {["口コミ","立地","専門性","女性医師","AI内視鏡"].map(v => (
            <Option
              key={v}
              label={v}
              active={form.q2_reasons.includes(v)}
              onClick={() => toggleArray("q2_reasons", v)}
            />
          ))}
          <button onClick={back}>戻る</button>
          <button onClick={next}>次へ</button>
        </>
      )}

      {step === 3 && (
        <>
          <h2>受診前の不安は？</h2>
          {["とても不安","少し不安","あまり不安なし","不安なし"].map(v => (
            <Option
              key={v}
              label={v}
              active={form.q3_anxiety === v}
              onClick={() => setForm(prev => ({...prev, q3_anxiety: v}))}
            />
          ))}
          <button onClick={back}>戻る</button>
          <button onClick={next}>次へ</button>
        </>
      )}

      {step === 4 && (
        <>
          <h2>印象に残った点</h2>
          {["説明が丁寧","痛みに配慮","スタッフが親切","清潔感","待ち時間短い"].map(v => (
            <Option
              key={v}
              label={v}
              active={form.q5_impressions.includes(v)}
              onClick={() => toggleArray("q5_impressions", v)}
            />
          ))}
          <button onClick={back}>戻る</button>
          <button onClick={next}>次へ</button>
        </>
      )}

      {step === 5 && (
        <>
          <h2>検査体験の印象</h2>
          {["想像より楽","問題なかった","少し緊張","不安が残った"].map(v => (
            <Option
              key={v}
              label={v}
              active={form.q6_experience === v}
              onClick={() => setForm(prev => ({...prev, q6_experience: v}))}
            />
          ))}
          <button onClick={back}>戻る</button>
          <button onClick={next}>次へ</button>
        </>
      )}

      {step === 6 && (
        <>
          <h2>満足度</h2>
          <input
            type="range"
            min="1"
            max="5"
            value={form.q3_star}
            onChange={e => setForm(prev => ({...prev, q3_star: Number(e.target.value)}))}
          />
          <div>★ {form.q3_star}</div>
          <button onClick={back}>戻る</button>
          <button onClick={next}>次へ</button>
        </>
      )}

      {step === 7 && (
        <>
          <h2>一言（任意）</h2>
          <textarea
            value={form.q4_free}
            onChange={e => setForm(prev => ({...prev, q4_free: e.target.value}))}
          />
          <button onClick={back}>戻る</button>
          <button onClick={submit}>送信してガチャへ</button>
        </>
      )}
    </Card>
  );
}

