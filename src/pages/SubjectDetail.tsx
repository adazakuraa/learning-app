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
  if (!catalog) return <div className="loading">読み込み中…</div>;
  const s = catalog.subjects.find((x) => x.id === subjectId);
  if (!s) return <NotFound />;
  const c = subjectCounts(s, doc);

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

      {s.chapters.map((ch, i) => {
        const cc = chapterCounts(ch, doc);
        return (
          <section key={ch.id} className="chapter">
            <div className="chapter-head">
              <h2>
                <span className="chapter-no">第{i + 1}章</span>
                {ch.title}
              </h2>
              <ProgressBar value={cc.ratio} size="sm" label={`${ch.title}の進捗`} />
            </div>
            <ul className="unit-list">
              {ch.units.map((u) => (
                <li key={u.id}>
                  <Link to={`/units/${u.id}`} className="unit-row">
                    <UnitCheck done={unitStatus(doc.units[u.id]) === 'done'} />
                    <span className="unit-row-main">
                      <span className="unit-row-title">{u.title}</span>
                      {u.summary && <span className="muted small clamp">{u.summary}</span>}
                    </span>
                    <StatusBadges unit={u} p={doc.units[u.id]} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
