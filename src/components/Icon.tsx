const paths: Record<string, string> = {
  play: 'M8 5v14l11-7z',
  pause: 'M7 5h4v14H7zM13 5h4v14h-4z',
  back10: 'M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z',
  fwd10: 'M12 5V1l5 5-5 5V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z',
  cc: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm3 5.5v3a1.5 1.5 0 0 0 1.5 1.5H11v-1.5H8.5v-3H11V9H8.5A1.5 1.5 0 0 0 7 10.5zm7 0v3a1.5 1.5 0 0 0 1.5 1.5H18v-1.5h-2.5v-3H18V9h-2.5a1.5 1.5 0 0 0-1.5 1.5z',
  full: 'M5 5h5v2H7v3H5zm9 0h5v5h-2V7h-3zM5 14h2v3h3v2H5zm12 0h2v5h-5v-2h3z',
  check: 'M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7z',
  home: 'M12 4 3 11h2v9h5v-6h4v6h5v-9h2z',
  book: 'M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zm0 13a1 1 0 0 0 1 1h10v-2H6a1 1 0 0 0-1 1z',
  gear: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8.4 4.6-1.9-.4a6.8 6.8 0 0 1-.6 1.5l1.1 1.6-1.6 1.6-1.6-1.1c-.5.3-1 .5-1.5.6l-.4 1.9h-2.2l-.4-1.9a6.8 6.8 0 0 1-1.5-.6l-1.6 1.1-1.6-1.6 1.1-1.6a6.8 6.8 0 0 1-.6-1.5l-1.9-.4v-2.2l1.9-.4c.1-.5.3-1 .6-1.5L4.9 7.2l1.6-1.6 1.6 1.1c.5-.3 1-.5 1.5-.6l.4-1.9h2.2l.4 1.9c.5.1 1 .3 1.5.6l1.6-1.1 1.6 1.6-1.1 1.6c.3.5.5 1 .6 1.5l1.9.4z',
  video: 'M4 6h11a1 1 0 0 1 1 1v3l4-3v10l-4-3v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z',
  text: 'M5 5h14v2H5zm0 4h14v2H5zm0 4h14v2H5zm0 4h9v2H5z',
  chevron: 'M9 6l6 6-6 6-1.4-1.4L12.2 12 7.6 7.4z',
  sync: 'M12 4a8 8 0 0 1 7.4 5H17v2h6V5h-2v2.3A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8zm8 8a8 8 0 0 1-15.4 3H7v-2H1v6h2v-2.3A10 10 0 0 0 22 12z',
};

export function Icon({ name, size = 20, className }: { name: keyof typeof paths | string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d={paths[name]} />
    </svg>
  );
}
