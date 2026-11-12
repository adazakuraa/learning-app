import { videoRatio, type UnitProgress } from '../lib/progress/model';
import type { UnitMeta } from '../lib/types';
import { Icon } from './Icon';

/** compact = icons only (a small % while a video is partly watched, a check when done): keeps list rows short on phones */
export function StatusBadges({ unit, p, compact = false }: { unit: UnitMeta; p?: UnitProgress; compact?: boolean }) {
  const vr = videoRatio(p?.video);
  if (compact) {
    return (
      <span className="badges mini">
        {unit.hasVideo && (
          <span className={`badge ${p?.video?.completed ? 'on' : vr > 0 ? 'part' : ''}`} title="動画" aria-label={p?.video?.completed ? '動画 視聴済' : vr > 0 ? `動画 ${Math.round(vr * 100)}%` : '動画 未視聴'}>
            <Icon name="video" size={15} />
            {!p?.video?.completed && vr > 0 && `${Math.round(vr * 100)}%`}
          </span>
        )}
        {unit.hasText && (
          <span className={`badge ${p?.text?.completed ? 'on' : ''}`} title="テキスト" aria-label={p?.text?.completed ? 'テキスト 読了' : 'テキスト 未読'}>
            <Icon name="text" size={15} />
          </span>
        )}
      </span>
    );
  }
  return (
    <span className="badges">
      {unit.hasVideo && (
        <span className={`badge ${p?.video?.completed ? 'on' : vr > 0 ? 'part' : ''}`} title="動画">
          <Icon name="video" size={14} />
          {p?.video?.completed ? '視聴済' : vr > 0 ? `${Math.round(vr * 100)}%` : '未視聴'}
        </span>
      )}
      {unit.hasText && (
        <span className={`badge ${p?.text?.completed ? 'on' : ''}`} title="テキスト">
          <Icon name="text" size={14} />
          {p?.text?.completed ? '読了' : '未読'}
        </span>
      )}
    </span>
  );
}

export function UnitCheck({ done }: { done: boolean }) {
  return <span className={`ucheck ${done ? 'done' : ''}`}>{done && <Icon name="check" size={14} />}</span>;
}
