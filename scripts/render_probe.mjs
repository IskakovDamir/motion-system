// Render frame ranges of compositions to JPEGs with one bundle, for comparison sheets and checks.
//   node scripts/render_probe.mjs <jobs.json>
// jobs.json is either a job list (bundled from src/index.ts) or {"entry": "<entry file>", "jobs": [...]}
// (scripts/probe_group.py bundles one group's primitives through its own entry).
// job: {"id": "...", "composition": "PrimitiveProbe", "inputProps": {...}, "frames": [0, 59],
//       "outDir": "analysis/compare/<id>/built", "scale": 0.5, "concurrency": 2}
// Each run bundles into its own .tmp/bundle-<pid> (not $TMPDIR), so parallel runs never share one.
import {bundle} from '@remotion/bundler';
import {renderFrames, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const jobs = Array.isArray(spec) ? spec : spec.jobs;
const entryPoint = Array.isArray(spec) ? path.join(root, 'src', 'index.ts') : path.resolve(root, spec.entry);
const outDir = path.join(root, '.tmp', `bundle-${process.pid}`);
fs.rmSync(outDir, {recursive: true, force: true});
const serveUrl = await bundle({entryPoint, outDir});

let failed = 0;
for (const job of jobs) {
	const dir = path.isAbsolute(job.outDir) ? job.outDir : path.join(root, job.outDir);
	fs.rmSync(dir, {recursive: true, force: true});
	fs.mkdirSync(dir, {recursive: true});
	try {
		const composition = await selectComposition({serveUrl, id: job.composition, inputProps: job.inputProps ?? {}});
		const last = Math.min(job.frames[1], composition.durationInFrames - 1);
		await renderFrames({
			composition,
			serveUrl,
			inputProps: job.inputProps ?? {},
			outputDir: dir,
			imageFormat: 'jpeg',
			jpegQuality: 90,
			scale: job.scale ?? 1,
			concurrency: job.concurrency ?? null,
			frameRange: [job.frames[0], last],
			chromiumOptions: {gl: 'angle'},
			timeoutInMilliseconds: 120000,
			onStart: () => undefined,
			onFrameUpdate: () => undefined,
		});
		console.log(`ok ${job.id} ${job.frames[0]}-${last} -> ${path.relative(root, dir)}`);
	} catch (err) {
		failed++;
		console.error(`FAIL ${job.id}: ${err instanceof Error ? err.message : String(err)}`);
	}
}
fs.rmSync(outDir, {recursive: true, force: true});
process.exit(failed ? 1 : 0);
