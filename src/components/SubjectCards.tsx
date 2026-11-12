import { Link } from 'react-router-dom';
import { useProgress } from '../lib/progress/ProgressProvider';
import { subjectCounts } from '../lib/stats';
import type { Subject } from '../lib/types';
import { ProgressBar } from './ProgressBar';

/** Subject cards, grouped by subject.group (e.g. 文系学問 / 理系学問) in catalog order. */
export function SubjectCards({ subjects, detailed = false }: { subjects: Subject[]; detailed?: boolean }) {
  const { doc } = useProgress();
  const groups: { name: string; items: Subject[] }[] = [];
  for (const s of subjects) {
    const g = groups.find((x) => x.name === s.group);
    if (g) g.items.push(s);
    else groups.push({ name: s.group, items: [s] });
  }
  return (
    <>
      {groups.map((g) => (
        <div key={g.name || '_'} className="subject-group">
          {g.name && groups.length > 1 && <h3 className="group-title">{g.name}</h3>}
          <div className="cards">
            {g.items.map((s) => {
              const c = subjectCounts(s, doc);
              return (
                <Link key={s.id} to={`/subjects/${s.id}`} className="card subject-card">
                  <div className="card-title">{s.title}</div>
                  {detailed && s.description && <p className="muted small">{s.description}</p>}
                  <ProgressBar value={c.ratio} size="sm" label={`${s.title}の進捗`} />
                  <div className="muted small">
                    {detailed && `${s.chapters.length}章 ・ `}
                    {c.done}/{c.total} 完了
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      {subjects.length === 0 && <p className="muted">まだ教材が登録されていません。</p>}
    </>
  );
}
