// Read-only replay inventory. Never bundles, records, rehashes or updates goldens.
// Supply a previously captured bundle so the baseline stays stable during art edits.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const option = name => { const at = args.indexOf(name); return at < 0 ? undefined : args[at + 1]; };
const bundle = option('--bundle');
if (!bundle) throw new Error('Usage: node tools/harness/cartoon-replay-audit.mjs --bundle <captured bundle.js> [--host <V8 host>]');
let host = option('--host');
if (!host) {
  const doctor = spawnSync('gameengine', ['doctor', '--json'], { cwd: root, encoding: 'utf8' });
  if (doctor.error || doctor.status !== 0) throw new Error(doctor.error?.message ?? doctor.stderr);
  host = JSON.parse(doctor.stdout).checks.find(c => c.name === 'gameengine-host (V8)' && c.ok)?.detail;
}
if (!host) throw new Error('Installed V8 host unavailable');
const harness = readFileSync(resolve(root, 'tools/harness/run.mjs'), 'utf8');
const declarations = harness.slice(harness.indexOf('const replays = ['), harness.indexOf('function verifyReplays'));
const replays = [...declarations.matchAll(/\{\s*path:\s*'([^']+)',\s*scene:\s*'([^']+)'/g)].map(m => ({ path: m[1], scene: m[2] }));
if (replays.length !== 33) throw new Error(`Expected the preserved 33-replay inventory, found ${replays.length}; review parser after harness changes`);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const archived = JSON.parse(readFileSync(resolve(root, 'docs/migration/evidence/artifacts/engine-update-replay-audit.json'), 'utf8'));
const results = replays.map(replay => {
  const bytes = readFileSync(resolve(root, replay.path));
  if (bytes.subarray(0, 8).toString() !== 'GAMERPL1') throw new Error(`Invalid replay ${replay.path}`);
  const header = JSON.parse(bytes.subarray(12, 12 + bytes.readUInt32LE(8)).toString('utf8'));
  const run = spawnSync(host, ['--mode', 'headless', '--project', root, '--bundle', resolve(root, bundle), '--js', 'v8', '--scene', replay.scene, '--verify', resolve(root, replay.path)], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 60000 });
  let report;
  try { report = JSON.parse(run.stdout); } catch { throw new Error(`No JSON for ${replay.path}: ${run.error?.message ?? run.stderr}`); }
  const previous = archived.results.find(r => r.path === replay.path);
  const divergence = report.firstDivergence ?? null;
  const sameAsArchived = report.ok === previous?.ok && JSON.stringify(divergence) === JSON.stringify(previous?.divergence ?? null);
  return { ...replay, sha256: sha(bytes), header, ok: report.ok === true, steps: report.steps, divergence, sameAsArchived, ...(report.error ? { error: report.error } : {}) };
});
console.log(JSON.stringify({ scope: 'Read-only verification on explicitly supplied bundle; original recordings and archived evidence unchanged. A matching historical failure is not a passing gameplay gate.', bundleSha256: sha(readFileSync(resolve(root, bundle))), host, total: results.length, passed: results.filter(r => r.ok).length, sameAsArchived: results.filter(r => r.sameAsArchived).length, results }, null, 2));
// Report inventory failures honestly; shell callers may retain the JSON while inspecting exit 1.
process.exitCode = results.every(r => r.ok) ? 0 : 1;
