// Check the preserved migration snapshot without requiring the original checkout.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const manifest = JSON.parse(readFileSync(resolve(root, 'bubble-boobble/docs/migration/source-manifest.json'), 'utf8'));
const failures = [];
const entries = [...manifest.files, ...(manifest.historyBundle ? [manifest.historyBundle] : [])];
for (const entry of entries) {
  try {
    const bytes = readFileSync(resolve(root, entry.destination));
    if (bytes.length !== entry.bytes || createHash('sha256').update(bytes).digest('hex') !== entry.sha256)
      failures.push({ path: entry.destination, reason: 'content differs from migration snapshot' });
  } catch (error) {
    failures.push({ path: entry.destination, reason: error.code ?? error.message });
  }
}
console.log(JSON.stringify({ ok: failures.length === 0, sourceCommit: manifest.sourceCommit, checked: entries.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
