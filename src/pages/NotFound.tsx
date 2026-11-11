import { Link } from 'react-router-dom';
export function NotFound() {
  return (
    <div className="page">
      <h1 className="page-title">ページが見つかりません</h1>
      <p>
        <Link to="/">ホームに戻る</Link>
      </p>
    </div>
  );
}
