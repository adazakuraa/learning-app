import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Settings = {
  theme: 'dark' | 'light' | 'system';
  captionSize: 'm' | 'l' | 'xl';
  playbackRate: number;
  textSize: 'm' | 'l';
};
const defaults: Settings = { theme: 'dark', captionSize: 'l', playbackRate: 1, textSize: 'm' };
const KEY = 'la:settings';

const Ctx = createContext<{ settings: Settings; set: (p: Partial<Settings>) => void }>({ settings: defaults, set: () => {} });

function load(): Settings {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return defaults;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
    const root = document.documentElement;
    if (settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
    root.dataset.textSize = settings.textSize;
  }, [settings]);
  return <Ctx.Provider value={{ settings, set: (p) => setSettings((s) => ({ ...s, ...p })) }}>{children}</Ctx.Provider>;
}
export const useSettings = () => useContext(Ctx);
