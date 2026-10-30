import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

/** Keep bootstrap art outside the game packs so it appears before the engine loads. */
export function writeSplashShell({ project, site }) {
  const file = join(site, 'index.html');
  let html = readFileSync(file, 'utf8');
  const launch = /    <div id="launch"[^>]*>[\s\S]*?<\/div>(?=\s*<script\b)/;
  if (!launch.test(html)) throw new Error('Pinned engine shell changed: could not locate launch screen.');
  html = html.replace(launch, readFileSync(join(project, 'web/splash.html'), 'utf8').trimEnd());
  html = html.replace('<title>Game Engine</title>', '<title>The Bubble Brigade</title>');
  const styleVersion = createHash('sha256').update(readFileSync(join(project, 'web/splash.css'))).digest('hex').slice(0, 12);
  html = html.replace('</head>', `    <link rel="preload" href="./splash/brigade.ttf" as="font" type="font/ttf" crossorigin />\n    <link rel="stylesheet" href="./splash/splash.css?v=${styleVersion}" />\n  </head>`);
  const assets = join(site, 'splash');
  mkdirSync(assets, { recursive: true });
  copyFileSync(join(project, 'web/splash.css'), join(assets, 'splash.css'));
  for (const [source, name] of [
    ['assets/cartoon/menu/curtain-tactile.png', 'curtain.png'],
    ['assets/cartoon/menu/curtain-tactile-portrait.png', 'curtain-portrait.png'],
    ['assets/cartoon/fonts/BreeSerif-Regular.ttf', 'brigade.ttf'],
  ]) copyFileSync(join(project, source), join(assets, name));
  writeFileSync(file, html);
}
