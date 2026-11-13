import type { Quiz } from './types';

/** Normalise an answer for comparison: width, case, kana, spaces and punctuation. */
export function normalizeAnswer(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)) // katakana -> hiragana
    .replace(/[\s、。，．,.・「」『』（）()［］[\]【】"'“”‘’!！?？:：;；〜~ー－\-_/／]/g, '')
    .replace(/^(答え|こたえ)[はわ]?/, '');
}

export function isCorrect(input: string, answers: string[]): boolean {
  const n = normalizeAnswer(input);
  if (!n) return false;
  return answers.some((a) => normalizeAnswer(a) === n);
}

const cache = new Map<string, Promise<Quiz>>();
export function loadQuiz(id: string): Promise<Quiz> {
  let p = cache.get(id);
  if (!p) {
    p = fetch(`data/quizzes/${encodeURIComponent(id)}.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))));
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return p;
}
