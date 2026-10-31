// Render frame ranges of compositions to JPEGs with one bundle, for comparison sheets and checks.
//   node scripts/render_probe.mjs <jobs.json>
// jobs.json: [{"id": "...", "composition": "PrimitiveProbe", "inputProps": {...},
//              "frames": [0, 59], "outDir": "analysis/compare/<id>/built"}]
// The bundle goes to .tmp/bundle (not $TMPDIR) and is reused by every job.
import {bundle} from '@remotion/bundler';
import {renderFrames, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const outDir = path.join(root, '.tmp', 'bundle');
fs.rmSync(outDir, {recursive: true, force: true});
const serveUrl = await bundle({entryPoint: path.join(root, 'src', 'index.ts'), outDir});

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
