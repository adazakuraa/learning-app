import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCatalog } from '../lib/catalog';
import { useProgress } from '../lib/progress/ProgressProvider';
import { isCorrect, loadQuiz } from '../lib/quiz';
import type { Quiz } from '../lib/types';
import { NotFound } from './NotFound';

type Judged = { input: string; ok: boolean; overridden?: boolean };

export function QuizPage() {
  const { quizId = '' } = useParams();
  const { catalog } = useCatalog();
  const { doc, recordQuiz } = useProgress();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState(false);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<Judged[]>([]);
  const [finished, setFinished] = useState(false);
  const [prevBest, setPrevBest] = useState<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuiz(null);
    setError(false);
    loadQuiz(quizId).then(setQuiz, () => setError(true));
  }, [quizId]);
  useEffect(() => { inputRef.current?.focus(); }, [idx, quiz]);

  if (error) return <NotFound />;
  if (!quiz || !catalog) return <div className="loading">読み込み中…</div>;
  const subject = catalog.subjects.find((s) => s.id === quiz.subjectId);
  const chapterNo = subject ? subject.chapters.findIndex((c) => c.quiz?.id === quiz.id) + 1 : 0;
  const total = quiz.questions.length;
  const q = quiz.questions[idx];
  const judged = results[idx];
  const score = results.filter((r) => r.ok).length;

  const check = () => {
    if (judged) return;
    const r = { input, ok: isCorrect(input, q.answers) };
    setResults((rs) => { const n = [...rs]; n[idx] = r; return n; });
  };
  const override = () => setResults((rs) => { const n = [...rs]; n[idx] = { ...n[idx], ok: true, overridden: true }; return n; });
  const next = () => {
    if (idx + 1 < total) { setIdx(idx + 1); setInput(''); return; }
    setPrevBest(doc.quizzes?.[quiz.id]?.best);
    recordQuiz(quiz.id, score, total);
    setFinished(true);
  };
  const restart = () => { setIdx(0); setInput(''); setResults([]); setFinished(false); };

  const crumbs = (
    <nav className="crumbs">
      <Link to="/subjects">科目一覧</Link>
      {subject && <> / <Link to={`/subjects/${subject.id}`}>{subject.title}</Link></>}
    </nav>
  );

  if (finished) {
    const perfect = score === total;
    const improved = prevBest !== undefined && score > prevBest;
    return (
      <div className="page quiz">
        {crumbs}
        <h1 className="page-title">練習問題の結果</h1>
        <div className={`card quiz-result${perfect ? ' perfect' : ''}`}>
          {perfect && <div className="quiz-star" aria-hidden>★</div>}
          <div className="quiz-score"><b>{score}</b> / {total} 問 正解</div>
          <p className="muted">
            {perfect ? '全問正解です。この章はしっかり身についています。' : improved ? `前回までの最高（${prevBest}問）を更新しました。` : '間違えた問題は、答えと解説を見直しておきましょう。'}
          </p>
        </div>
        <ol className="quiz-review">
          {quiz.questions.map((qq, i) => (
            <li key={i} className={results[i]?.ok ? 'ok' : 'ng'}>
              <span className="quiz-mark">{results[i]?.ok ? '○' : '×'}</span>
              <span dangerouslySetInnerHTML={{ __html: qq.q }} />
              <div className="muted small">答え：<span dangerouslySetInnerHTML={{ __html: qq.show }} /></div>
            </li>
          ))}
        </ol>
        <div className="quiz-actions">
          <button className="btn primary" onClick={restart}>もう一度解く</button>
          {subject && <Link className="btn ghost" to={`/subjects/${subject.id}`}>{subject.title}にもどる</Link>}
        </div>
      </div>
    );
  }

  return (
    <div className="page quiz">
      {crumbs}
      <h1 className="page-title">練習問題 <span className="muted small">{chapterNo ? `第${chapterNo}章 ` : ''}{quiz.title}</span></h1>
      <div className="quiz-progress" aria-label={`${idx + 1}問目 / ${total}問`}>
        {quiz.questions.map((_, i) => (
          <span key={i} className={`dot${i === idx ? ' now' : ''}${results[i] ? (results[i].ok ? ' ok' : ' ng') : ''}`} />
        ))}
      </div>
      <div className="card quiz-card">
        <div className="muted small">第{idx + 1}問</div>
        <div className="quiz-q" dangerouslySetInnerHTML={{ __html: q.q }} />
        <form onSubmit={(e) => { e.preventDefault(); if (judged) next(); else check(); }}>
          <input
            ref={inputRef}
            className="quiz-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="答えを入力"
            disabled={Boolean(judged)}
            aria-label="答え"
          />
          {!judged && <button className="btn primary" type="submit" disabled={!input.trim()}>答え合わせ</button>}
        </form>
        {!judged && <button className="linkbtn small" onClick={() => setResults((rs) => { const n = [...rs]; n[idx] = { input: '', ok: false }; return n; })}>わからない（答えを見る）</button>}
        {judged && (
          <div className={`quiz-feedback ${judged.ok ? 'ok' : 'ng'}`}>
            <div className="quiz-verdict">{judged.ok ? (judged.overridden ? '○ 正解にしました' : '○ 正解') : '× 不正解'}</div>
            <div>答え：<b dangerouslySetInnerHTML={{ __html: q.show }} /></div>
            {q.explain && <div className="muted small" dangerouslySetInnerHTML={{ __html: q.explain }} />}
            {!judged.ok && judged.input && <button className="linkbtn small" onClick={override}>書き方が違うだけで合っていた → 正解にする</button>}
            <button className="btn primary quiz-next" onClick={next}>{idx + 1 < total ? '次の問題へ' : '結果を見る'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
