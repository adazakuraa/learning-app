import { videoRatio, type UnitProgress } from '../lib/progress/model';
import type { UnitMeta } from '../lib/types';
import { Icon } from './Icon';

export function StatusBadges({ unit, p }: { unit: UnitMeta; p?: UnitProgress }) {
  const vr = videoRatio(p?.video);
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
