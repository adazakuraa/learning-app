import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ProgressBar } from '../components/ProgressBar';
import { StatusBadges, UnitCheck } from '../components/StatusBadges';
import { useCatalog } from '../lib/catalog';
import { unitStatus } from '../lib/progress/model';
import { useProgress } from '../lib/progress/ProgressProvider';
import { chapterCounts, subjectCounts } from '../lib/stats';
import { NotFound } from './NotFound';

export function SubjectDetail() {
  const { subjectId } = useParams();
  const { catalog } = useCatalog();
  const { doc } = useProgress();
  const [open, setOpen] = useState<Record<string, boolean> | null>(null);
  if (!catalog) return <div className="loading">読み込み中…</div>;
  const s = catalog.subjects.find((x) => x.id === subjectId);
  if (!s) return <NotFound />;
  const c = subjectCounts(s, doc);

  // the next unit to study: first one in order that is not completed yet
  const all = s.chapters.flatMap((ch) => ch.units.map((u) => ({ u, ch })));
  const next = all.find(({ u }) => unitStatus(doc.units[u.id]) !== 'done');
  const started = c.done + c.inProgress > 0;
  // by default only the chapter with the next unit is open; the rest stay folded so the page stays short
  const isOpen = (chId: string) => (open ? open[chId] ?? false : chId === next?.ch.id);
  const setAll = (v: boolean) => setOpen(Object.fromEntries(s.chapters.map((ch) => [ch.id, v])));
  const toggle = (chId: string, v: boolean) => setOpen({ ...(open ?? Object.fromEntries(s.chapters.map((ch) => [ch.id, ch.id === next?.ch.id]))), [chId]: v });
  const anyOpen = s.chapters.some((ch) => isOpen(ch.id));

  return (
    <div className="page">
      <nav className="crumbs">
        <Link to="/subjects">科目一覧</Link>
      </nav>
      <h1 className="page-title">{s.title}</h1>
      {s.description && <p className="muted">{s.description}</p>}
      <div className="card">
        <ProgressBar value={c.ratio} label="科目の進捗" />
        <div className="muted small">
          {c.done} / {c.total} 単元 完了 ・ 学習中 {c.inProgress} ・ 未学習 {c.notStarted}
        </div>
      </div>

      {next && (
        <Link to={`/units/${next.u.id}`} className="resume card">
          <div className="muted small">{started ? '続きから学習' : 'はじめる'}</div>
          <div className="resume-title">{next.u.title}</div>
          <div className="muted small">{next.ch.title}</div>
        </Link>
      )}

      <div className="chapter-tools">
        <span className="muted small">{s.chapters.length} 章</span>
        <button className="linkbtn" onClick={() => setAll(!anyOpen)}>
          {anyOpen ? 'すべて閉じる' : 'すべて開く'}
        </button>
      </div>

      {s.chapters.map((ch, i) => {
        const cc = chapterCounts(ch, doc);
        return (
          <details key={ch.id} className="chapter" open={isOpen(ch.id)} onToggle={(e) => { const v = (e.currentTarget as HTMLDetailsElement).open; if (v !== isOpen(ch.id)) toggle(ch.id, v); }}>
            <summary className="chapter-head">
              <h2>
                <span className="chapter-no">第{i + 1}章</span>
                {ch.title}
              </h2>
              <span className="chapter-count muted small">
                {cc.done}/{cc.total}
              </span>
              <ProgressBar value={cc.ratio} size="sm" label={`${ch.title}の進捗`} />
            </summary>
            <ul className="unit-list">
              {ch.units.map((u) => (
                <li key={u.id}>
                  <Link to={`/units/${u.id}`} className="unit-row">
                    <UnitCheck done={unitStatus(doc.units[u.id]) === 'done'} />
                    <span className="unit-row-main">
                      <span className="unit-row-title">{u.title}</span>
                      {u.summary && <span className="muted small clamp">{u.summary}</span>}
                    </span>
                    <StatusBadges unit={u} p={doc.units[u.id]} compact />
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
