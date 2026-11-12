import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../lib/catalog';
import { unitStatus } from '../lib/progress/model';
import { useProgress } from '../lib/progress/ProgressProvider';
import { StatusBadges, UnitCheck } from './StatusBadges';

const norm = (s: string) => s.toLowerCase().replace(/[\s\u3000]+/g, '');

/** Search box for units (title / summary / subject / chapter). While a query is typed the results replace `children`. */
export function UnitSearch({ children }: { children: ReactNode }) {
  const { units } = useCatalog();
  const { doc } = useProgress();
  const [q, setQ] = useState('');
  const query = norm(q);
  const hits = useMemo(() => {
    if (!query) return [];
    return units.filter((u) => norm(`${u.title}${u.summary}${u.subject.title}${u.chapter.title}`).includes(query));
  }, [units, query]);

  return (
    <>
      <div className="search">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="単元を検索（例：光合成、鎌倉、確率）" aria-label="単元を検索" enterKeyHint="search" />
        {q && (
          <button className="search-clear" onClick={() => setQ('')} aria-label="検索をクリア">
            ×
          </button>
        )}
      </div>
      {query ? (
        <section>
          <h2 className="section-title">検索結果 {hits.length} 件</h2>
          {hits.length === 0 ? (
            <p className="muted">見つかりませんでした。別の言葉で試してください。</p>
          ) : (
            <ul className="unit-list">
              {hits.slice(0, 60).map((u) => (
                <li key={u.id}>
                  <Link to={`/units/${u.id}`} className="unit-row">
                    <UnitCheck done={unitStatus(doc.units[u.id]) === 'done'} />
                    <span className="unit-row-main">
                      <span className="unit-row-title">{u.title}</span>
                      <span className="muted small">
                        {u.subject.title} › {u.chapter.title}
                      </span>
                    </span>
                    <StatusBadges unit={u} p={doc.units[u.id]} compact />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {hits.length > 60 && <p className="muted small">先頭の60件を表示しています。言葉を足して絞りこんでください。</p>}
        </section>
      ) : (
        children
      )}
    </>
  );
}
