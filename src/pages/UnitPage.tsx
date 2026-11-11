import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { StatusBadges } from '../components/StatusBadges';
import { VideoPlayer, type PlayerHandle } from '../components/VideoPlayer';
import { loadUnitContent, useCatalog } from '../lib/catalog';
import { unitSeconds } from '../lib/progress/model';
import { useProgress } from '../lib/progress/ProgressProvider';
import type { TocItem, UnitContent } from '../lib/types';
import { useStudyTimer } from '../lib/useStudyTimer';
import { fmtDuration } from '../lib/vtt';
import { NotFound } from './NotFound';

export function UnitPage() {
  const { unitId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { catalog, units, unitById } = useCatalog();
  const { doc, unit: progressOf, setUnitCompleted } = useProgress();
  const [content, setContent] = useState<UnitContent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const player = useRef<PlayerHandle>(null);

  const meta = unitById.get(unitId);
  useStudyTimer(meta?.id, () => player.current?.isPlaying() ?? false);

  useEffect(() => {
    setContent(null);
    setLoadError(null);
    if (!unitId) return;
    loadUnitContent(unitId)
      .then(setContent)
      .catch((e) => setLoadError(String(e)));
  }, [unitId]);

  if (!catalog) return <div className="loading">読み込み中…</div>;
  if (!meta) return <NotFound />;

  const p = progressOf(meta.id);
  const hasVideo = meta.hasVideo;
  const tab = params.get('tab') === 'text' || !hasVideo ? 'text' : 'video';
  const setTab = (t: 'video' | 'text') => {
    setParams(t === 'video' ? {} : { tab: 'text' }, { replace: true });
    window.scrollTo(0, 0);
  };
  const idx = units.findIndex((u) => u.id === meta.id);
  const prev = units[idx - 1];
  const next = units[idx + 1];
  const done = !!p?.unit?.completed;

  return (
    <div className="page unit-page">
      <nav className="crumbs">
        <Link to={`/subjects/${meta.subject.id}`}>{meta.subject.title}</Link>
        <Icon name="chevron" size={14} />
        <span>{meta.chapter.title}</span>
      </nav>
      <h1 className="page-title">{meta.title}</h1>
      {meta.summary && <p className="muted">{meta.summary}</p>}
      <div className="unit-status">
        <StatusBadges unit={meta} p={p} />
        <span className="muted small">学習時間 {fmtDuration(unitSeconds(doc, meta.id))}</span>
        {done && <span className="badge on">単元完了</span>}
      </div>

      {hasVideo && meta.hasText && (
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'video'} onClick={() => setTab('video')}>
            <Icon name="video" size={18} /> 動画
          </button>
          <button role="tab" aria-selected={tab === 'text'} onClick={() => setTab('text')}>
            <Icon name="text" size={18} /> テキスト
          </button>
        </div>
      )}

      {loadError && <div className="notice error">教材を読み込めませんでした（{loadError}）</div>}
      {!content && !loadError && <div className="loading">読み込み中…</div>}

      {content && tab === 'video' && content.video?.src && (
        <section>
          <VideoPlayer ref={player} key={meta.id} unitId={meta.id} src={content.video.src} captions={content.video.captions} poster={content.video.poster} />
          {content.video.narration && <p className="credit muted small">ナレーション音声：{content.video.narration}</p>}
          {meta.hasText && (
            <button className="btn secondary block" onClick={() => setTab('text')}>
              <Icon name="text" size={18} /> テキストで復習する
            </button>
          )}
        </section>
      )}

      {content && tab === 'text' && content.lessonHtml && (
        <TextView unitId={meta.id} content={content} onWatch={hasVideo ? () => setTab('video') : undefined} />
      )}

      <section className={`complete-card card ${done ? 'done' : ''}`}>
        {done ? (
          <>
            <div>
              <strong>この単元は完了しています</strong>
              {p?.unit?.updatedAt && <div className="muted small">{new Date(p.unit.updatedAt).toLocaleDateString('ja-JP')} に完了</div>}
            </div>
            <button className="btn ghost" onClick={() => setUnitCompleted(meta.id, false)}>
              完了を取り消す
            </button>
          </>
        ) : (
          <>
            <div className="muted small">動画・テキストで学習を終えたら押してください。</div>
            <button className="btn primary" onClick={() => setUnitCompleted(meta.id, true)}>
              <Icon name="check" size={18} /> 単元を完了する
            </button>
          </>
        )}
      </section>

      <nav className="pager">
        {prev ? (
          <Link to={`/units/${prev.id}`} className="pager-link">
            <span className="muted small">前の単元</span>
            <span>{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/units/${next.id}`} className="pager-link next">
            <span className="muted small">次の単元</span>
            <span>{next.title}</span>
          </Link>
        )}
      </nav>
    </div>
  );
}

function Toc({ toc, active, onPick }: { toc: TocItem[]; active: string | null; onPick?: () => void }) {
  return (
    <ol className="toc">
      {toc.map((t) => (
        <li key={t.id} className={`d${t.depth} ${active === t.id ? 'active' : ''}`}>
          <a
            href={`#${t.id}`}
            onClick={(e) => {
              e.preventDefault(); // HashRouter owns the URL hash
              document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              onPick?.();
            }}
          >
            {t.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

function TextView({ unitId, content, onWatch }: { unitId: string; content: UnitContent; onWatch?: () => void }) {
  const { unit, setTextScroll, setTextCompleted } = useProgress();
  const article = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'lesson' | 'source'>('lesson');
  const [active, setActive] = useState<string | null>(null);
  const [ratio, setRatio] = useState(0);
  const tocRef = useRef<HTMLDetailsElement>(null);
  const p = unit(unitId)?.text;
  const [resumeAt] = useState(() => (p && p.scrollRatio > 0.08 && p.scrollRatio < 0.95 && !p.completed ? p.scrollRatio : null));
  const [showResume, setShowResume] = useState(resumeAt !== null);
  const lastSaved = useRef(p?.scrollRatio ?? 0);

  useEffect(() => {
    const el = article.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const read = Math.max(0, Math.min(1, (window.innerHeight - r.top) / Math.max(1, r.height)));
        setRatio(read);
        if (read > lastSaved.current + 0.05 || (read >= 0.99 && lastSaved.current < 0.99)) {
          lastSaved.current = read;
          setTextScroll(unitId, Math.round(read * 100) / 100);
        }
        if (read > 0.15) setShowResume(false);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [unitId, setTextScroll, view]);

  useEffect(() => {
    const el = article.current;
    if (!el || view !== 'lesson') return;
    const heads = Array.from(el.querySelectorAll('h2[id], h3[id]'));
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: '0px 0px -70% 0px' },
    );
    heads.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [content, view]);

  const html = view === 'source' && content.sourceHtml ? content.sourceHtml : content.lessonHtml!;
  const done = !!p?.completed;

  return (
    <div className="textview">
      <div className="readbar" style={{ transform: `scaleX(${ratio})` }} aria-hidden="true" />
      <div className="text-layout">
        {content.toc.length > 1 && view === 'lesson' && (
          <aside className="toc-side">
            <div className="toc-head">目次</div>
            <Toc toc={content.toc} active={active} />
          </aside>
        )}
        <div className="text-main">
          {content.toc.length > 1 && view === 'lesson' && (
            <details className="toc-mobile card" ref={tocRef}>
              <summary>目次</summary>
              <Toc toc={content.toc} active={active} onPick={() => tocRef.current?.removeAttribute('open')} />
            </details>
          )}
          <div className="text-tools">
            {content.sourceHtml && (
              <div className="seg" role="group" aria-label="表示する文章">
                <button aria-pressed={view === 'lesson'} onClick={() => setView('lesson')}>
                  学習用テキスト
                </button>
                <button aria-pressed={view === 'source'} onClick={() => setView('source')}>
                  元の教材
                </button>
              </div>
            )}
            {onWatch && (
              <button className="btn secondary sm" onClick={onWatch}>
                <Icon name="video" size={16} /> 動画で見る
              </button>
            )}
          </div>
          {showResume && resumeAt !== null && (
            <button
              className="resume-read card"
              onClick={() => {
                const el = article.current!;
                const top = el.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({ top: top + el.offsetHeight * resumeAt - window.innerHeight * 0.8, behavior: 'smooth' });
                setShowResume(false);
              }}
            >
              前回の続き（{Math.round(resumeAt * 100)}%）から読む
            </button>
          )}
          <article ref={article} className="prose" dangerouslySetInnerHTML={{ __html: html }} />

          <div className={`read-done card ${done ? 'done' : ''}`}>
            {done ? (
              <>
                <span>
                  <Icon name="check" size={18} /> 読了済み
                </span>
                <button className="btn ghost sm" onClick={() => setTextCompleted(unitId, false)}>
                  取り消す
                </button>
              </>
            ) : (
              <button className="btn primary block" onClick={() => setTextCompleted(unitId, true)}>
                <Icon name="check" size={18} /> 読了
              </button>
            )}
          </div>
          {onWatch && (
            <button className="btn secondary block" onClick={onWatch}>
              <Icon name="video" size={18} /> この単元の動画を見る
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
