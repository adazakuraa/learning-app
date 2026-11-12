import { Link } from 'react-router-dom';
import { ProgressBar } from '../components/ProgressBar';
import { SubjectCards } from '../components/SubjectCards';
import { UnitSearch } from '../components/UnitSearch';
import { StatusBadges, UnitCheck } from '../components/StatusBadges';
import { useCatalog } from '../lib/catalog';
import { totalSeconds, unitStatus } from '../lib/progress/model';
import { useProgress } from '../lib/progress/ProgressProvider';
import { countUnits } from '../lib/stats';
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

  // what to offer first: an unfinished unit you were on; else the next unfinished unit after the last one studied; else the very first
  const notDone = (u: (typeof units)[number]) => unitStatus(doc.units[u.id]) !== 'done';
  const last = recent[0];
  const after = last ? units.slice(units.findIndex((u) => u.id === last.id) + 1).find(notDone) : undefined;
  const lead = resume ?? after ?? units.find(notDone);
  const leadLabel = resume ? '続きから学習' : recent.length > 0 ? '次の単元' : 'はじめる';

  return (
    <div className="page">
      {lead && (
        <Link to={`/units/${lead.id}`} className="resume card">
          <div className="muted small">{leadLabel}</div>
          <div className="resume-title">{lead.title}</div>
          <div className="muted small">
            {lead.subject.title} › {lead.chapter.title}
          </div>
        </Link>
      )}

      <section className="card overall">
        <div className="overall-head">
          <span className="stat-label">全体の進捗</span>
          <span className="stat-sub">
            {all.done} / {all.total} 単元 完了
          </span>
        </div>
        <ProgressBar value={all.ratio} label="全体の進捗" />
        <div className="overall-nums">
          <span>
            学習中 <b>{all.inProgress}</b>
          </span>
          <span>
            未学習 <b>{all.notStarted}</b>
          </span>
          <span>
            累計 <b>{fmtDuration(totalSeconds(doc))}</b>
          </span>
        </div>
      </section>

      <UnitSearch>
      <section>
        <h2 className="section-title">科目</h2>
        <SubjectCards subjects={catalog.subjects} />
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
                  <StatusBadges unit={u} p={doc.units[u.id]} compact />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      </UnitSearch>
    </div>
  );
}
