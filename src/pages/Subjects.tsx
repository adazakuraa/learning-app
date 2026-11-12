import { SubjectCards } from '../components/SubjectCards';
import { UnitSearch } from '../components/UnitSearch';
import { useCatalog } from '../lib/catalog';

export function Subjects() {
  const { catalog } = useCatalog();
  if (!catalog) return <div className="loading">読み込み中…</div>;
  return (
    <div className="page">
      <h1 className="page-title">科目一覧</h1>
      <UnitSearch>
        <SubjectCards subjects={catalog.subjects} detailed />
      </UnitSearch>
    </div>
  );
}
