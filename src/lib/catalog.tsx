import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Catalog, UnitContent, UnitRef } from './types';

type CatalogState = {
  catalog: Catalog | null;
  error: string | null;
  units: UnitRef[];
  unitById: Map<string, UnitRef>;
};

const Ctx = createContext<CatalogState>({ catalog: null, error: null, units: [], unitById: new Map() });

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('data/catalog.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setCatalog)
      .catch((e) => setError(String(e)));
  }, []);

  const value = useMemo(() => {
    const units: UnitRef[] = [];
    for (const subject of catalog?.subjects ?? [])
      for (const chapter of subject.chapters) for (const u of chapter.units) units.push({ ...u, subject, chapter });
    return { catalog, error, units, unitById: new Map(units.map((u) => [u.id, u])) };
  }, [catalog, error]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCatalog = () => useContext(Ctx);

const contentCache = new Map<string, Promise<UnitContent>>();
export function loadUnitContent(id: string): Promise<UnitContent> {
  let p = contentCache.get(id);
  if (!p) {
    p = fetch(`data/units/${encodeURIComponent(id)}.json`, { cache: 'no-cache' }).then((r) =>
      r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)),
    );
    p.catch(() => contentCache.delete(id));
    contentCache.set(id, p);
  }
  return p;
}
