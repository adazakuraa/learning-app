export function ProgressBar({ value, label, size = 'md' }: { value: number; label?: string; size?: 'sm' | 'md' }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className={`pbar pbar-${size}`}>
      <div className="pbar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="pbar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="pbar-num">{pct}%</span>
    </div>
  );
}
