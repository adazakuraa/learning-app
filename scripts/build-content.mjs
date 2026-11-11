// Reads content/ (subject > chapter > unit folders) and writes public/data/
//   catalog.json            : subject/chapter/unit tree (metadata only)
//   units/<unitId>.json     : rendered lesson/source HTML + table of contents
//   units/<unitId>/...      : copied assets (images, video, captions)
//
// Folder layout:
//   content/<subject>/subject.yaml
//   content/<subject>/<chapter>/chapter.yaml
//   content/<subject>/<chapter>/<unit>/unit.yaml
//   content/<subject>/<chapter>/<unit>/source.md   (original material, never edited by hand)
//   content/<subject>/<chapter>/<unit>/lesson.md   (organised learning text; falls back to source.md)
//   content/<subject>/<chapter>/<unit>/captions.vtt, video.mp4, images... (optional)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content');
const outDir = path.join(root, 'public', 'data');

const errors = [];
const readYaml = (file) => (fs.existsSync(file) ? YAML.parse(fs.readFileSync(file, 'utf8')) ?? {} : null);
const subdirs = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
    .map((d) => d.name)
    .sort();
const isExternal = (url) => /^([a-z]+:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('#');
const byOrder = (a, b) => (a.order ?? 9999) - (b.order ?? 9999) || a._dir.localeCompare(b._dir);

/** rehype plugin: collect h2/h3 for the TOC and rewrite relative asset URLs. */
function rehypeUnit({ toc, assetBase, unitDir, used }) {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if ((node.tagName === 'h2' || node.tagName === 'h3') && toc) {
        toc.push({ id: node.properties.id, text: toString(node), depth: node.tagName === 'h2' ? 2 : 3 });
      }
      for (const attr of ['src', 'href']) {
        const url = node.properties?.[attr];
        if (typeof url !== 'string' || !url || isExternal(url)) continue;
        if (attr === 'href' && !/\.(png|jpe?g|gif|svg|webp|pdf)$/i.test(url)) continue;
        let rel;
        try {
          rel = decodeURIComponent(url);
        } catch {
          rel = url;
        }
        const abs = path.join(unitDir, rel);
        if (!fs.existsSync(abs)) {
          errors.push(`missing asset: ${path.relative(root, abs)}`);
          continue;
        }
        used.add(rel);
        node.properties[attr] = `${assetBase}/${rel.split(path.sep).map(encodeURIComponent).join('/')}`;
      }
      if (node.tagName === 'img') {
        node.properties.loading = 'lazy';
        node.properties.decoding = 'async';
      }
      if (node.tagName === 'table') {
        // wrap later via class; CSS makes tables scroll horizontally
        node.properties.className = ['table'];
      }
      if (node.tagName === 'a' && isExternal(String(node.properties?.href ?? '')) && !String(node.properties.href).startsWith('#')) {
        node.properties.target = '_blank';
        node.properties.rel = 'noopener noreferrer';
      }
    });
  };
}

function renderMarkdown(md, opts) {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkRehype)
      .use(rehypeSlug)
      .use(rehypeKatex, { throwOnError: false })
      .use(rehypeUnit, opts)
      .use(rehypeStringify)
      .processSync(md),
  );
}

/** Drop a leading "# Title" line (the page shows the unit title itself). */
const stripTitle = (md) => md.replace(/^﻿?\s*#\s+[^\n]*\n/, '');

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function build() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, 'units'), { recursive: true });
  const unitIds = new Set();
  const subjects = [];

  if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir);

  for (const sDir of subdirs(contentDir)) {
    const sPath = path.join(contentDir, sDir);
    const sMeta = readYaml(path.join(sPath, 'subject.yaml'));
    if (!sMeta) continue;
    const subject = { id: sMeta.id ?? sDir, title: sMeta.title ?? sDir, description: sMeta.description ?? '', order: sMeta.order, _dir: sDir, chapters: [] };

    for (const cDir of subdirs(sPath)) {
      const cPath = path.join(sPath, cDir);
      const cMeta = readYaml(path.join(cPath, 'chapter.yaml'));
      if (!cMeta) continue;
      const chapter = { id: cMeta.id ?? cDir, title: cMeta.title ?? cDir, description: cMeta.description ?? '', order: cMeta.order, _dir: cDir, units: [] };

      for (const uDir of subdirs(cPath)) {
        const uPath = path.join(cPath, uDir);
        const uMeta = readYaml(path.join(uPath, 'unit.yaml'));
        if (!uMeta) continue;
        const id = String(uMeta.id ?? `${subject.id}-${chapter.id}-${uDir}`);
        if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) errors.push(`invalid unit id "${id}" (use a-z, 0-9, -) in ${path.relative(root, uPath)}`);
        if (unitIds.has(id)) errors.push(`duplicate unit id "${id}"`);
        unitIds.add(id);

        const assetBase = `data/units/${id}`;
        const used = new Set();
        const sourceFile = path.join(uPath, 'source.md');
        const lessonFile = path.join(uPath, 'lesson.md');
        const sourceMd = fs.existsSync(sourceFile) ? fs.readFileSync(sourceFile, 'utf8') : null;
        const lessonMd = fs.existsSync(lessonFile) ? fs.readFileSync(lessonFile, 'utf8') : sourceMd;

        const toc = [];
        const lessonHtml = lessonMd ? renderMarkdown(stripTitle(lessonMd), { toc, assetBase, unitDir: uPath, used }) : null;
        const sourceHtml =
          sourceMd && fs.existsSync(lessonFile) ? renderMarkdown(stripTitle(sourceMd), { toc: null, assetBase, unitDir: uPath, used }) : null;

        // video: either a URL (e.g. another GitHub Pages repo) or a file in the unit folder
        let video = null;
        if (uMeta.video?.src) {
          const v = uMeta.video;
          const resolve = (p) => {
            if (!p) return null;
            if (isExternal(p)) return p;
            const abs = path.join(uPath, p);
            if (!fs.existsSync(abs)) {
              errors.push(`missing video asset: ${path.relative(root, abs)}`);
              return null;
            }
            used.add(p);
            return `${assetBase}/${p}`;
          };
          video = {
            src: resolve(v.src),
            captions: resolve(v.captions ?? (fs.existsSync(path.join(uPath, 'captions.vtt')) ? 'captions.vtt' : null)),
            poster: resolve(v.poster),
            duration: v.duration ?? null,
          };
        }

        for (const rel of used) copyFile(path.join(uPath, rel), path.join(outDir, 'units', id, rel));

        fs.writeFileSync(
          path.join(outDir, 'units', `${id}.json`),
          JSON.stringify({ id, lessonHtml, sourceHtml, toc, video }),
        );

        chapter.units.push({
          id,
          title: uMeta.title ?? uDir,
          summary: uMeta.summary ?? '',
          order: uMeta.order,
          _dir: uDir,
          hasVideo: Boolean(video?.src),
          hasText: Boolean(lessonHtml),
          videoDuration: video?.duration ?? null,
        });
      }
      chapter.units.sort(byOrder);
      subject.chapters.push(chapter);
    }
    subject.chapters.sort(byOrder);
    subjects.push(subject);
  }
  subjects.sort(byOrder);

  const strip = (o) => {
    const { _dir, order, ...rest } = o;
    void _dir;
    void order;
    return rest;
  };
  const catalog = {
    generatedAt: new Date().toISOString(),
    subjects: subjects.map((s) => ({ ...strip(s), chapters: s.chapters.map((c) => ({ ...strip(c), units: c.units.map(strip) })) })),
  };
  fs.writeFileSync(path.join(outDir, 'catalog.json'), JSON.stringify(catalog));

  const unitCount = catalog.subjects.reduce((n, s) => n + s.chapters.reduce((m, c) => m + c.units.length, 0), 0);
  console.log(`content: ${catalog.subjects.length} subjects, ${unitCount} units`);
  if (errors.length) {
    console.error(errors.map((e) => `  ✗ ${e}`).join('\n'));
    process.exit(1);
  }
}

build();
