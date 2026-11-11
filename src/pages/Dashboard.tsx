import { Link } from 'react-router-dom';
import { ProgressBar } from '../components/ProgressBar';
import { StatusBadges, UnitCheck } from '../components/StatusBadges';
import { useCatalog } from '../lib/catalog';
import { totalSeconds, unitStatus } from '../lib/progress/model';
import { useProgress } from '../lib/progress/ProgressProvider';
import { countUnits, subjectCounts } from '../lib/stats';
import { fmtDuration } from '../lib/vtt';

export function Dashboard() {
  const { catalog, units } = useCatalog();
  const { doc } = useProgress();
  if (!catalog) return <div className="loading">読み込み中…</div>;

  const all = countUnits(units, doc);
  const recent = units
    .filter((u) => doc.units[u.id]?.lastStudiedAt)
    .sort((a, b) => (doc.units[b.id]!.lastStudiedAt ?? 0) - (doc.units[a.id]!.lastStudiedAt ?? 0))
    .slice(0, 5);
  const resume = recent.find((u) => unitStatus(doc.units[u.id]) !== 'done');

  return (
    <div className="page">
      <section className="stats">
        <div className="stat wide">
          <div className="stat-label">全体の進捗</div>
          <ProgressBar value={all.ratio} label="全体の進捗" />
          <div className="stat-sub">
            {all.done} / {all.total} 単元 完了
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">完了</div>
          <div className="stat-num">{all.done}</div>
        </div>
        <div className="stat">
          <div className="stat-label">学習中</div>
          <div className="stat-num">{all.inProgress}</div>
        </div>
        <div className="stat">
          <div className="stat-label">未学習</div>
          <div className="stat-num">{all.notStarted}</div>
        </div>
        <div className="stat">
          <div className="stat-label">累計学習時間</div>
          <div className="stat-num sm">{fmtDuration(totalSeconds(doc))}</div>
        </div>
      </section>

      {resume && (
        <Link to={`/units/${resume.id}`} className="resume card">
          <div className="muted small">続きから学習</div>
          <div className="resume-title">{resume.title}</div>
          <div className="muted small">
            {resume.subject.title} › {resume.chapter.title}
          </div>
        </Link>
      )}

      <section>
        <h2 className="section-title">科目</h2>
        <div className="cards">
          {catalog.subjects.map((s) => {
            const c = subjectCounts(s, doc);
            return (
              <Link key={s.id} to={`/subjects/${s.id}`} className="card subject-card">
                <div className="card-title">{s.title}</div>
                <ProgressBar value={c.ratio} size="sm" label={`${s.title}の進捗`} />
                <div className="muted small">
                  {c.done} / {c.total} 単元 完了
                </div>
              </Link>
            );
          })}
          {catalog.subjects.length === 0 && <p className="muted">まだ教材が登録されていません。</p>}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="section-title">最近学習した単元</h2>
          <ul className="unit-list">
            {recent.map((u) => (
              <li key={u.id}>
                <Link to={`/units/${u.id}`} className="unit-row">
                  <UnitCheck done={unitStatus(doc.units[u.id]) === 'done'} />
                  <span className="unit-row-main">
                    <span className="unit-row-title">{u.title}</span>
                    <span className="muted small">
                      {u.subject.title} › {u.chapter.title} ・ {new Date(doc.units[u.id]!.lastStudiedAt!).toLocaleDateString('ja-JP')}
                    </span>
                  </span>
                  <StatusBadges unit={u} p={doc.units[u.id]} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
