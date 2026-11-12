export type TocItem = { id: string; text: string; depth: 2 | 3 };

export type UnitMeta = {
  id: string;
  title: string;
  summary: string;
  hasVideo: boolean;
  hasText: boolean;
  videoDuration: number | null;
};
export type Chapter = { id: string; title: string; description: string; units: UnitMeta[] };
export type Subject = { id: string; title: string; description: string; group: string; chapters: Chapter[] };
export type Catalog = { generatedAt: string; subjects: Subject[] };

export type UnitContent = {
  id: string;
  lessonHtml: string | null;
  /** original material, present only when lesson.md differs from source.md */
  sourceHtml: string | null;
  toc: TocItem[];
  video: { src: string | null; captions: string | null; poster: string | null; duration: number | null; narration?: string | null } | null;
};

/** Flattened unit with its location, handy for lists. */
export type UnitRef = UnitMeta & { subject: Subject; chapter: Chapter };
