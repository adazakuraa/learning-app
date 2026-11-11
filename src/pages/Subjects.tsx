import { SubjectCards } from '../components/SubjectCards';
import { useCatalog } from '../lib/catalog';

export function Subjects() {
  const { catalog } = useCatalog();
  if (!catalog) return <div className="loading">読み込み中…</div>;
  return (
    <div className="page">
      <h1 className="page-title">科目一覧</h1>
      <SubjectCards subjects={catalog.subjects} detailed />
    </div>
  );
}
