import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Icon } from './components/Icon';
import { useCatalog } from './lib/catalog';
import { useProgress } from './lib/progress/ProgressProvider';
import { Dashboard } from './pages/Dashboard';
import { Subjects } from './pages/Subjects';
import { SubjectDetail } from './pages/SubjectDetail';
import { UnitPage } from './pages/UnitPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFound } from './pages/NotFound';

function SyncDot() {
  const { sync } = useProgress();
  if (sync.status === 'off') return null;
  const label = sync.status === 'syncing' ? '同期中' : sync.status === 'error' ? '同期エラー' : '同期済み';
  return (
    <NavLink to="/settings" className={`syncdot ${sync.status}`} title={sync.message ?? label} aria-label={label}>
      <Icon name="sync" size={16} />
    </NavLink>
  );
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Shell() {
  const { error } = useCatalog();
  const nav = [
    { to: '/', icon: 'home', label: 'ホーム', end: true },
    { to: '/subjects', icon: 'book', label: '科目' },
    { to: '/settings', icon: 'gear', label: '設定' },
  ];
  return (
    <>
      <ScrollTop />
      <header className="topbar">
        <NavLink to="/" className="brand">
          学習室
        </NavLink>
        <nav className="topnav">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <SyncDot />
      </header>
      <main className="main">
        {error ? (
          <div className="notice error">教材データを読み込めませんでした（{error}）。再読み込みしてください。</div>
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/subjects/:subjectId" element={<SubjectDetail />} />
            <Route path="/units/:unitId" element={<UnitPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </main>
      <nav className="bottomnav">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <Icon name={n.icon} size={22} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
