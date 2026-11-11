import { expect, it } from 'vitest';
import { parseVtt } from './vtt';

it('parses cues', () => {
  const cues = parseVtt('WEBVTT\n\n1\n00:00:01.500 --> 00:00:03.000 align:center\nこんにちは\n2行目\n\n01:02.000 --> 01:04.000\n<b>次</b>\n');
  expect(cues).toEqual([
    { start: 1.5, end: 3, text: 'こんにちは\n2行目' },
    { start: 62, end: 64, text: '次' },
  ]);
});
