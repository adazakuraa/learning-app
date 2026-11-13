import { describe, expect, it } from 'vitest';
import { isCorrect, normalizeAnswer } from './quiz';

describe('quiz answers', () => {
  it('ignores width, kana, spaces and punctuation', () => {
    expect(normalizeAnswer('　ﾌﾟﾗﾄﾝ ')).toBe(normalizeAnswer('プラトン'));
    expect(isCorrect('ぷらとん', ['プラトン'])).toBe(true);
    expect(isCorrect('１０', ['10'])).toBe(true);
    expect(isCorrect('Ｈ２Ｏ', ['h2o'])).toBe(true);
    expect(isCorrect('答えは10', ['10'])).toBe(true);
  });
  it('rejects wrong or empty answers', () => {
    expect(isCorrect('', ['a'])).toBe(false);
    expect(isCorrect('ソクラテス', ['プラトン'])).toBe(false);
  });
});
