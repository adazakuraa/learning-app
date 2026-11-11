import { Link } from 'react-router-dom';
import { ProgressBar } from '../components/ProgressBar';
import { useCatalog } from '../lib/catalog';
import { useProgress } from '../lib/progress/ProgressProvider';
import { subjectCounts } from '../lib/stats';

export function Subjects() {
  const { catalog } = useCatalog();
  const { doc } = useProgress();
  if (!catalog) return <div className="loading">読み込み中…</div>;
  return (
    <div className="page">
      <h1 className="page-title">科目一覧</h1>
      <div className="cards">
        {catalog.subjects.map((s) => {
          const c = subjectCounts(s, doc);
          return (
            <Link key={s.id} to={`/subjects/${s.id}`} className="card subject-card">
              <div className="card-title">{s.title}</div>
              {s.description && <p className="muted small">{s.description}</p>}
              <ProgressBar value={c.ratio} size="sm" label={`${s.title}の進捗`} />
              <div className="muted small">
                {s.chapters.length} 章 ・ {c.done} / {c.total} 単元 完了
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
