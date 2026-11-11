import { emptyDoc, parseDoc, type ProgressDoc } from './model';

// Tiny IndexedDB key-value store with localStorage fallback (private mode etc.).
const DB = 'learning-app';
const STORE = 'kv';
const KEY = 'progress';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadLocal(): Promise<ProgressDoc> {
  try {
    const db = await openDb();
    const value = await new Promise<unknown>((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return value ? parseDoc(value) : emptyDoc();
  } catch {
    try {
      const raw = localStorage.getItem(`la:${KEY}`);
      return raw ? parseDoc(JSON.parse(raw)) : emptyDoc();
    } catch {
      return emptyDoc();
    }
  }
}

export async function saveLocal(doc: ProgressDoc): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(doc, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    try {
      localStorage.setItem(`la:${KEY}`, JSON.stringify(doc));
    } catch {
      /* storage unavailable: progress lives in memory for this visit */
    }
  }
}

export function deviceId(): string {
  try {
    let id = localStorage.getItem('la:device');
    if (!id) {
      const kind = /iPhone|Android/i.test(navigator.userAgent) ? 'phone' : /iPad/i.test(navigator.userAgent) ? 'tablet' : 'pc';
      id = `${kind}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem('la:device', id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}
