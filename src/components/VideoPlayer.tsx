import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useProgress } from '../lib/progress/ProgressProvider';
import { normalizeRanges, type Range } from '../lib/progress/model';
import { useSettings } from '../lib/settings';
import { fmtTime, parseVtt, type Cue } from '../lib/vtt';
import { Icon } from './Icon';

export type PlayerHandle = { seek: (t: number) => void; isPlaying: () => boolean };
type Props = { unitId: string; src: string; captions: string | null; poster: string | null };

const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

export const VideoPlayer = forwardRef<PlayerHandle, Props>(function VideoPlayer({ unitId, src, captions, poster }, ref) {
  const { unit, recordVideo } = useProgress();
  const { settings, set } = useSettings();
  const video = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [cues, setCues] = useState<Cue[]>([]);
  const [showCc, setShowCc] = useState(true);
  const [resumedFrom, setResumedFrom] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUi, setShowUi] = useState(true);

  // watched-range bookkeeping
  const lastT = useRef<number | null>(null);
  const pending = useRef<Range[]>([]);
  const flushTimer = useRef<number | undefined>(undefined);
  const hideTimer = useRef<number | undefined>(undefined);
  const saved = unit(unitId)?.video;
  const savedRef = useRef(saved);
  savedRef.current = saved;

  // remembered outside the element: on unmount the <video> ref is already detached
  const posRef = useRef(0);
  const durRef = useRef(0);
  const flush = useCallback(() => {
    if (!durRef.current || !Number.isFinite(durRef.current)) return;
    if (!pending.current.length && Math.abs(posRef.current - (savedRef.current?.position ?? -1)) < 1) return;
    recordVideo(unitId, { ranges: pending.current, position: posRef.current, duration: durRef.current });
    pending.current = [];
  }, [recordVideo, unitId]);
  const flushRef = useRef(flush);
  flushRef.current = flush;

  useImperativeHandle(ref, () => ({
    seek: (t) => {
      const v = video.current;
      if (!v) return;
      v.currentTime = t;
      void v.play().catch(() => {});
    },
    isPlaying: () => !!video.current && !video.current.paused,
  }));

  useEffect(() => {
    if (!captions) return setCues([]);
    let cancelled = false;
    fetch(captions)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((t) => !cancelled && setCues(parseVtt(t)))
      .catch(() => !cancelled && setCues([]));
    return () => {
      cancelled = true;
    };
  }, [captions]);

  useEffect(() => {
    flushTimer.current = window.setInterval(() => pending.current.length && flushRef.current(), 5000);
    return () => {
      window.clearInterval(flushTimer.current);
      flushRef.current();
    };
  }, [unitId]);

  useEffect(() => {
    if (video.current) video.current.playbackRate = settings.playbackRate;
  }, [settings.playbackRate]);

  const onLoaded = () => {
    const v = video.current!;
    setDuration(v.duration);
    durRef.current = v.duration;
    v.playbackRate = settings.playbackRate;
    const pos = savedRef.current?.position ?? 0;
    if (pos > 5 && pos < v.duration - 5) {
      v.currentTime = pos;
      setResumedFrom(pos);
    }
  };

  const onTime = () => {
    const v = video.current!;
    const t = v.currentTime;
    setTime(t);
    posRef.current = t;
    if (!v.paused && !v.seeking && lastT.current !== null) {
      const dt = t - lastT.current;
      if (dt > 0 && dt < 2 * v.playbackRate + 0.75) pending.current.push([lastT.current, t]);
      if (pending.current.length > 50) pending.current = normalizeRanges(pending.current);
    }
    lastT.current = t;
  };

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  };
  const skip = (d: number) => {
    const v = video.current;
    if (v) v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + d));
  };
  const fullscreen = () => {
    const el = box.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    const v = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) return void document.exitFullscreen();
    if (el?.requestFullscreen) void el.requestFullscreen().catch(() => v?.webkitEnterFullscreen?.());
    else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else v?.webkitEnterFullscreen?.(); // iPhone: native player (uses the <track> captions)
  };
  const poke = () => {
    setShowUi(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => video.current && !video.current.paused && setShowUi(false), 2500);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k === ' ' || k === 'k') toggle();
    else if (k === 'ArrowLeft') skip(-5);
    else if (k === 'ArrowRight') skip(5);
    else if (k === 'f') fullscreen();
    else if (k === 'c') setShowCc((s) => !s);
    else return;
    e.preventDefault();
    poke();
  };

  const cue = cues.find((c) => time >= c.start && time < c.end);
  const watched = normalizeRanges([...(saved?.watched ?? []), ...pending.current]);

  return (
    <div className="player-wrap">
      <div
        ref={box}
        className={`player cc-${settings.captionSize} ${showUi || !playing ? 'ui' : ''}`}
        tabIndex={0}
        onKeyDown={onKey}
        onPointerMove={poke}
        aria-label="動画プレーヤー"
      >
        <video
          ref={video}
          src={src}
          poster={poster ?? undefined}
          playsInline
          preload="metadata"
          onClick={() => {
            toggle();
            poke();
          }}
          onLoadedMetadata={onLoaded}
          onDurationChange={() => setDuration(video.current?.duration ?? 0)}
          onTimeUpdate={onTime}
          onPlay={() => {
            setPlaying(true);
            setResumedFrom(null);
            lastT.current = video.current?.currentTime ?? null;
            poke();
          }}
          onPause={() => {
            setPlaying(false);
            setShowUi(true);
            flush();
          }}
          onSeeking={() => (lastT.current = null)}
          onSeeked={() => (lastT.current = video.current?.currentTime ?? null)}
          onEnded={flush}
          onError={() => setError('動画を読み込めませんでした。通信状況を確認してください。')}
        >
          {captions && <track kind="subtitles" srcLang="ja" label="日本語" src={captions} />}
        </video>

        {showCc && cue && (
          <div className="captions" aria-live="off">
            <span>{cue.text}</span>
          </div>
        )}

        {!playing && (
          <button className="bigplay" onClick={toggle} aria-label="再生">
            <Icon name="play" size={40} />
          </button>
        )}

        {error && <div className="player-error">{error}</div>}

        <div className="controls" onClick={(e) => e.stopPropagation()}>
          <div className="seek">
            <div className="seek-watched" aria-hidden="true">
              {duration > 0 &&
                watched.map(([a, b]) => (
                  <i key={a} style={{ left: `${(a / duration) * 100}%`, width: `${((b - a) / duration) * 100}%` }} />
                ))}
            </div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={time}
              onChange={(e) => {
                const v = video.current;
                if (v) v.currentTime = Number(e.target.value);
                setTime(Number(e.target.value));
              }}
              aria-label="再生位置"
              style={{ ['--p' as string]: `${duration ? (time / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="ctrl-row">
            <button onClick={toggle} aria-label={playing ? '一時停止' : '再生'}>
              <Icon name={playing ? 'pause' : 'play'} size={24} />
            </button>
            <button onClick={() => skip(-10)} aria-label="10秒戻る">
              <Icon name="back10" />
            </button>
            <button onClick={() => skip(10)} aria-label="10秒進む">
              <Icon name="fwd10" />
            </button>
            <span className="ctrl-time">
              {fmtTime(time)} / {fmtTime(duration)}
            </span>
            <span className="spacer" />
            <select
              value={settings.playbackRate}
              onChange={(e) => set({ playbackRate: Number(e.target.value) })}
              aria-label="再生速度"
            >
              {RATES.map((r) => (
                <option key={r} value={r}>
                  {r}x
                </option>
              ))}
            </select>
            {cues.length > 0 && (
              <button onClick={() => setShowCc((s) => !s)} aria-label="字幕" aria-pressed={showCc} className={showCc ? 'on' : ''}>
                <Icon name="cc" />
              </button>
            )}
            <button onClick={fullscreen} aria-label="全画面">
              <Icon name="full" />
            </button>
          </div>
        </div>
      </div>

      {resumedFrom !== null && (
        <div className="resume-note">
          前回の続き（{fmtTime(resumedFrom)}）から再生します。
          <button
            className="linkbtn"
            onClick={() => {
              if (video.current) video.current.currentTime = 0;
              setResumedFrom(null);
            }}
          >
            最初から
          </button>
        </div>
      )}

      {cues.length > 0 && (
        <details className="transcript">
          <summary>字幕の全文</summary>
          <ol>
            {cues.map((c) => (
              <li key={c.start} className={cue === c ? 'now' : ''}>
                <button
                  onClick={() => {
                    if (video.current) {
                      video.current.currentTime = c.start;
                      void video.current.play().catch(() => {});
                    }
                  }}
                >
                  <time>{fmtTime(c.start)}</time>
                  <span>{c.text}</span>
                </button>
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
});
