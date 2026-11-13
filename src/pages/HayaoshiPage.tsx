import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from '../lib/progress/ProgressProvider';
import { isCorrect } from '../lib/quiz';
import { unitStatus } from '../lib/progress/model';
import {
  ACADEMIC_SHARE, AFTER_FULL, CPS, emptyH, pickNext, sessionTarget, TARGET, points, predict, rating, SESSION_LEN, thinkSeconds, updateTheta,
  type HBank, type HMode, type HQuestion, type HState,
} from '../lib/hayaoshi';

type Phase = 'ready' | 'reading' | 'answering' | 'judged' | 'result';
type Outcome = { q: HQuestion; ok: boolean; pos: number | null; pts: number; prevPos?: number; prevBest?: number; through: boolean };

const banks: Partial<Record<HMode, Promise<HBank>>> = {};
const loadBank = (m: HMode) => (banks[m] ??= fetch(m === 'review' ? 'data/hayaoshi-review.json' : 'data/hayaoshi.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))));
const today = () => new Date().toLocaleDateString('sv');

// small sound effects (Web Audio, no files)
let actx: AudioContext | null = null;
function beep(kind: 'buzz' | 'ok' | 'ng' | 'fanfare') {
  try {
    if (localStorage.getItem('la:hayaoshi-sound') === 'off') return;
    actx ??= new AudioContext();
    const notes: Record<string, [number, number, number][]> = {
      buzz: [[880, 0, 0.12]],
      ok: [[784, 0, 0.1], [1175, 0.1, 0.18]],
      ng: [[220, 0, 0.25]],
      fanfare: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.35]],
    };
    for (const [f, t, d] of notes[kind]) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = kind === 'ng' ? 'sawtooth' : 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, actx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.18, actx.currentTime + t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + t + d);
      o.connect(g).connect(actx.destination);
      o.start(actx.currentTime + t);
      o.stop(actx.currentTime + t + d + 0.02);
    }
  } catch { /* sound is optional */ }
}

export function HayaoshiPage() {
  const { doc, setHayaoshi: setH } = useProgress();
  const [mode, setMode] = useState<HMode>(() => { try { return localStorage.getItem('la:hayaoshi-mode') === 'review' ? 'review' : 'general'; } catch { return 'general'; } });
  const h: HState = (mode === 'review' ? doc.hayaoshiReview : doc.hayaoshi) ?? emptyH();
  const setHayaoshi = useCallback((fn: (x: HState) => HState) => setH(mode, fn), [setH, mode]);
  const [fullBank, setBank] = useState<HBank | null>(null);
  const done = useMemo(() => new Set(Object.entries(doc.units).filter(([, u]) => unitStatus(u) === 'done').map(([id]) => id)), [doc.units]);
  const bank = useMemo<HBank | null>(() => {
    if (!fullBank) return null;
    if (mode !== 'review') return fullBank;
    return { ...fullBank, questions: fullBank.questions.filter((x) => x.unit && done.has(x.unit)) };
  }, [fullBank, mode, done]);
  const [err, setErr] = useState(false);
  const [phase, setPhase] = useState<Phase>('ready');
  const [q, setQ] = useState<HQuestion | null>(null);
  const [pos, setPos] = useState(0);
  const [buzzPos, setBuzzPos] = useState<number | null>(null);
  const [left, setLeft] = useState(0);
  const [input, setInput] = useState('');
  const [outs, setOuts] = useState<Outcome[]>([]);
  const [streak, setStreak] = useState(0);
  const [startTheta, setStartTheta] = useState(0);
  const [sound, setSound] = useState(() => { try { return localStorage.getItem('la:hayaoshi-sound') !== 'off'; } catch { return true; } });
  const timer = useRef<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const hRef = useRef(h);
  hRef.current = h;
  const used = useRef(new Set<string>());
  const tgt = useRef(TARGET);

  useEffect(() => { setBank(null); loadBank(mode).then(setBank, () => setErr(true)); }, [mode]);
  useEffect(() => () => window.clearInterval(timer.current), []);

  const score = outs.reduce((s, o) => s + o.pts, 0);
  const genreTitle = useMemo(() => Object.fromEntries((bank?.genres ?? []).map((g) => [g.id, g.title])), [bank]);

  const nextQuestion = useCallback(() => {
    if (!bank) return;
    const recent = outs.map((o) => o.q.genre);
    let pool = bank;
    if (mode === 'general') {
      // keep academic genres at about ACADEMIC_SHARE of the questions
      const acad = new Set(bank.genres.filter((g) => g.academic).map((g) => g.id));
      const asked = outs.filter((o) => acad.has(o.q.genre)).length;
      const want = (asked + 1) / (outs.length + 1) <= ACADEMIC_SHARE + 0.05 && Math.random() < ACADEMIC_SHARE * 1.7 ? true : asked / Math.max(1, outs.length) < ACADEMIC_SHARE - 0.15 && outs.length >= 3;
      pool = { ...bank, questions: bank.questions.filter((x) => acad.has(x.genre) === want) };
    }
    const nq = pickNext(pool, hRef.current, used.current, recent, Math.random, tgt.current) ?? pickNext(bank, hRef.current, used.current, recent, Math.random, tgt.current);
    if (!nq) { setPhase('result'); return; }
    used.current.add(nq.id);
    setQ(nq); setPos(0); setBuzzPos(null); setInput(''); setPhase('reading');
  }, [bank, outs, mode]);

  const judge = useCallback((ok: boolean, through: boolean, at: number | null) => {
    if (!q) return;
    window.clearInterval(timer.current);
    const prev = hRef.current.items[q.id];
    const st = ok ? streak + 1 : 0;
    const pts = ok && at !== null ? points(at, [...q.q].length, streak) : 0;
    setStreak(st);
    setOuts((o) => [...o, { q, ok, pos: at, pts, prevPos: prev?.correct ? prev.lastPos : undefined, prevBest: prev?.bestPos, through }]);
    beep(ok ? 'ok' : 'ng');
    setHayaoshi((s) => {
      const it = s.items[q.id] ?? { seen: 0, correct: 0, lastAt: 0 };
      const now = Date.now();
      const item = {
        ...it, seen: it.seen + 1, correct: it.correct + (ok ? 1 : 0), lastAt: now,
        ...(ok && at !== null ? { lastPos: at, bestPos: Math.min(at, it.bestPos ?? Infinity) } : {}),
      };
      if (ok) delete (item as { lastWrongAt?: number }).lastWrongAt; else (item as { lastWrongAt?: number }).lastWrongAt = now;
      const theta = updateTheta(s, q, ok);
      return { ...s, theta, answered: s.answered + 1, correct: s.correct + (ok ? 1 : 0), items: { ...s.items, [q.id]: item }, history: { ...s.history, [today()]: theta } };
    });
    setPhase('judged');
  }, [q, streak, setHayaoshi]);

  // reveal the question text
  useEffect(() => {
    if (phase !== 'reading' || !q) return;
    const total = [...q.q].length;
    let p = 0, waited = 0;
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      if (p < total) { p += 1; setPos(p); }
      else if ((waited += 1000 / CPS) >= AFTER_FULL * 1000) judge(false, true, null);
    }, 1000 / CPS);
    return () => window.clearInterval(timer.current);
  }, [phase, q, judge]);

  // thinking time after the buzz
  useEffect(() => {
    if (phase !== 'answering' || !q) return;
    const total = thinkSeconds(q);
    const t0 = Date.now();
    setLeft(total);
    inputRef.current?.focus();
    timer.current = window.setInterval(() => {
      const l = total - (Date.now() - t0) / 1000;
      setLeft(l);
      if (l <= 0) judge(isCorrect(inputRef.current?.value ?? '', q.answers), false, buzzPosRef.current);
    }, 100);
    return () => window.clearInterval(timer.current);
  }, [phase, q, judge]);
  const buzzPosRef = useRef<number | null>(null);

  const buzz = () => {
    if (phase !== 'reading') return;
    window.clearInterval(timer.current);
    beep('buzz');
    try { navigator.vibrate?.(30); } catch { /* optional */ }
    setBuzzPos(pos); buzzPosRef.current = pos;
    setPhase('answering');
  };
  const submit = () => { if (phase === 'answering' && q) judge(isCorrect(input, q.answers), false, buzzPos); };
  const override = () => {
    const last = outs[outs.length - 1];
    if (!last || last.ok || last.through || !q) return;
    const pts = last.pos !== null ? points(last.pos, [...q.q].length, streak) : 0;
    setOuts((o) => [...o.slice(0, -1), { ...last, ok: true, pts }]);
    setStreak((s) => s + 1);
    setHayaoshi((s) => {
      const it = s.items[q.id];
      const theta = updateTheta(s, q, true) - (updateTheta(s, q, false) - s.theta); // undo the wrong update, apply right
      const item = { ...it, correct: it.correct + 1, ...(last.pos !== null ? { lastPos: last.pos, bestPos: Math.min(last.pos, it.bestPos ?? Infinity) } : {}) };
      delete (item as { lastWrongAt?: number }).lastWrongAt;
      return { ...s, theta, correct: s.correct + 1, items: { ...s.items, [q.id]: item }, history: { ...s.history, [today()]: theta } };
    });
  };
  const advance = () => {
    if (outs.length >= Math.min(SESSION_LEN, bank?.questions.length ?? SESSION_LEN)) {
      setHayaoshi((s) => ({ ...s, sessions: s.sessions + 1, bestScore: Math.max(s.bestScore, score) }));
      if (outs.every((o) => o.ok) || score > h.bestScore) beep('fanfare');
      setPhase('result');
    } else nextQuestion();
  };
  const start = () => {
    used.current = new Set();
    tgt.current = sessionTarget();
    setOuts([]); setStreak(0); setStartTheta(h.theta);
    setTimeout(() => nextQuestion(), 0);
  };
  const toggleSound = () => { const v = !sound; setSound(v); try { localStorage.setItem('la:hayaoshi-sound', v ? 'on' : 'off'); } catch { /* */ } };

  if (err) return <div className="page"><div className="notice error">問題を読み込めませんでした。</div></div>;
  if (!bank) return <div className="loading">読み込み中…</div>;

  // ---------- screens ----------
  if (phase === 'ready') {
    const acc = h.answered ? Math.round((h.correct / h.answered) * 100) : null;
    return (
      <div className="page hay">
        <h1 className="page-title">早押しクイズ</h1>
        <div className="hay-modes" role="tablist">
          {([['general', 'いろいろクイズ', 'いろんなジャンルから'], ['review', '復習クイズ', '学習済みの単元から']] as const).map(([m, t, d]) => (
            <button key={m} role="tab" aria-selected={mode === m} className={`hay-mode${mode === m ? ' on' : ''}`} onClick={() => { setMode(m); try { localStorage.setItem('la:hayaoshi-mode', m); } catch { /* */ } }}>
              <b>{t}</b><span className="muted small">{d}</span>
            </button>
          ))}
        </div>
        <div className="card hay-stats">
          <div><div className="muted small">クイズ力</div><div className="hay-big">{rating(h.theta)}</div></div>
          <div><div className="muted small">正答率</div><div className="hay-big">{acc === null ? '—' : `${acc}%`}</div></div>
          <div><div className="muted small">ハイスコア</div><div className="hay-big">{h.bestScore || '—'}</div></div>
        </div>
        <div className="card hay-rules">
          <p>問題文が少しずつ表示されます。答えがわかったら<b>早押しボタン</b>を押して、答えを入力してください。</p>
          <ul className="small">
            <li>早く押すほど得点が高くなります。連続正解でボーナス。</li>
            <li>押したあとは、答えの長さに応じた時間内に入力します（ひらがなでもOK）。</li>
            <li>あなたの実力に合わせて、ちょうどいい難しさの問題が出ます。間違えても減点はありません。</li>
          </ul>
        </div>
        {mode === 'review' && bank.questions.length < 5 ? (
          <div className="notice">復習クイズは、学習を完了した単元から出題します。単元を「完了」にすると、ここで遊べるようになります（いま出題できる問題：{bank.questions.length}問）。</div>
        ) : (
          <button className="btn primary block hay-start" onClick={start}>スタート（{Math.min(SESSION_LEN, bank.questions.length)}問）</button>
        )}
        <button className="linkbtn small" onClick={toggleSound}>効果音：{sound ? 'オン' : 'オフ'}</button>
        <p className="muted small">
          {mode === 'review' ? `学習済み${done.size}単元から ${bank.questions.length}問` : `全${bank.questions.length}問 ・ ${bank.genres.length}ジャンル`} ・ これまで{h.answered}問に挑戦
        </p>
      </div>
    );
  }

  if (phase === 'result') {
    const n = outs.filter((o) => o.ok).length;
    const diff = rating(h.theta) - rating(startTheta);
    const best = score > 0 && score >= h.bestScore;
    const perfect = n === outs.length && outs.length > 0;
    return (
      <div className="page hay">
        <h1 className="page-title">結果</h1>
        <div className={`card hay-result${perfect ? ' perfect' : ''}`}>
          {perfect && <div className="quiz-star" aria-hidden>★</div>}
          <div className="hay-score">{score}<span className="small"> 点</span></div>
          <div>{outs.length}問中 <b>{n}</b>問正解{best && <span className="hay-badge">ハイスコア！</span>}</div>
          <div className="muted small">クイズ力 {rating(startTheta)} → <b>{rating(h.theta)}</b> <span className={diff >= 0 ? 'up' : 'down'}>{diff >= 0 ? `▲${diff}` : `▼${-diff}`}</span></div>
        </div>
        <ol className="quiz-review">
          {outs.map((o, i) => (
            <li key={i} className={o.ok ? 'ok' : 'ng'}>
              <span className="quiz-mark">{o.ok ? '○' : '×'}</span>{o.q.show}
              <span className="muted small"> ・{genreTitle[o.q.genre]}{o.ok && o.pos !== null ? ` ・${o.pos}文字目で正解 +${o.pts}` : o.through ? ' ・スルー' : ''}</span>
            </li>
          ))}
        </ol>
        <div className="quiz-actions">
          <button className="btn primary" onClick={start}>もう一回</button>
          <button className="btn ghost" onClick={() => setPhase('ready')}>終わる</button>
        </div>
      </div>
    );
  }

  if (!q) return null;
  const chars = [...q.q];
  const shown = phase === 'judged' ? chars.length : buzzPos ?? pos;
  const last = outs[outs.length - 1];
  const think = thinkSeconds(q);
  return (
    <div className="page hay">
      <div className="hay-top">
        <span className="muted small">第{outs.length + (phase === 'judged' ? 0 : 1)}問 / {SESSION_LEN} ・ {genreTitle[q.genre]}</span>
        <span className="hay-points">{score}点{streak >= 2 && <span className="hay-streak"> 🔥{streak}連続</span>}</span>
      </div>
      <div className="card hay-q">
        <p>
          {phase === 'judged' && last?.pos != null ? (
            <>
              {chars.slice(0, last.pos).join('')}
              {last.pos < chars.length && <span className="hay-mark" aria-label="押した位置" />}
              <span className="hay-rest">{chars.slice(last.pos).join('')}</span>
            </>
          ) : (
            chars.slice(0, shown).join('')
          )}
          {phase === 'reading' && <span className="hay-cursor" aria-hidden>▍</span>}
        </p>
      </div>

      {phase === 'reading' && (
        <button className="hay-buzz" onPointerDown={buzz} onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && buzz()}>
          押す！
        </button>
      )}

      {phase === 'answering' && (
        <div className="card hay-answer">
          <div className="hay-timer"><span style={{ width: `${Math.max(0, (left / think) * 100)}%` }} /></div>
          <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <input ref={inputRef} className="quiz-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="答えを入力" aria-label="答え" autoComplete="off" />
            <button className="btn primary" type="submit">解答</button>
          </form>
          <div className="muted small">残り {Math.max(0, Math.ceil(left))} 秒</div>
        </div>
      )}

      {phase === 'judged' && last && (
        <div className={`quiz-feedback ${last.ok ? 'ok' : 'ng'} hay-fb`}>
          <div className="quiz-verdict">{last.ok ? `○ 正解！ +${last.pts}` : last.through ? '― スルー' : '× 不正解'}</div>
          <div>答え：<b>{q.show}</b></div>
          {last.ok && last.pos !== null && (
            <div className="small">
              {last.pos}文字目で正解（全{chars.length}文字）
              {last.prevPos !== undefined && (
                last.pos < last.prevPos ? <span className="up"> ・前回より{last.prevPos - last.pos}文字速い！</span>
                  : last.pos > last.prevPos ? <span className="muted"> ・前回は{last.prevPos}文字目</span>
                    : <span className="muted"> ・前回と同じ</span>
              )}
            </div>
          )}
          {!last.ok && last.prevBest !== undefined && <div className="muted small">前に{last.prevBest}文字目で正解した問題です</div>}
          <div className="muted small">予想正答率 {Math.round(q.p * 100)}%（あなたなら {Math.round(predict(startTheta, q) * 100)}%）</div>
          {!last.ok && !last.through && <button className="linkbtn small" onClick={override}>書き方が違うだけで合っていた → 正解にする</button>}
          <button className="btn primary quiz-next" onClick={advance}>{outs.length >= Math.min(SESSION_LEN, bank?.questions.length ?? SESSION_LEN) ? '結果を見る' : '次の問題'}</button>
        </div>
      )}
    </div>
  );
}
