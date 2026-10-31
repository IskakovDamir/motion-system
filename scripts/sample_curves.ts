// Prints, as JSON, what verify.py and compare_sheets.py need from the code:
//  - primitives: names with a spec AND a component; showcase: names MotionShowcase plays
//  - catalogue: technique id -> primitive / variant / property, read from the primitive specs
//  - techniques: per measured technique, the built progress per frame (60 fps) from progressAt(),
//    the same function the components render with
//  - styleDemo: the shot list StyleDemo is cut from
// Run: npx tsx scripts/sample_curves.ts             every registered primitive (verify.py)
//      npx tsx scripts/sample_curves.ts --group g   only src/motion/primitives/<g>/*.spec.ts, imported one
//                                                   by one, so other groups' files cannot break it (check_group.py)
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {PROBE_LEAD} from '../src/compositions/probe';
import {progressAt} from '../src/motion/engine/progress';
import type {PrimitiveSpec} from '../src/motion/primitives/types';
import type {Motion} from '../src/motion/tokens/easing';

const settledLength = (m: Motion): number => {
	// sample until the curve has stayed at its end value for 60 frames
	let f = Math.ceil(m.duration);
	let still = 0;
	let prev = progressAt(f, {...m, delay: 0});
	while (still < 60 && f < 3000) {
		f++;
		const p = progressAt(f, {...m, delay: 0});
		still = Math.abs(p - prev) < 1e-5 && Math.abs(p - 1) < 1e-3 ? still + 1 : 0;
		prev = p;
	}
	return f + 1;
};

const groupAt = process.argv.indexOf('--group');
const group = groupAt > 0 ? process.argv[groupAt + 1] : undefined;
const problems: string[] = [];

const groupSpecs = async (g: string): Promise<PrimitiveSpec[]> => {
	const dir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'src', 'motion', 'primitives', g);
	const out: PrimitiveSpec[] = [];
	for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.spec.ts')).sort()) {
		try {
			out.push((await import(pathToFileURL(path.join(dir, f)).href)).spec as PrimitiveSpec);
		} catch (err) {
			problems.push(`${g}/${f}: ${err instanceof Error ? err.message : String(err)}`);
		}
	}
	return out;
};

const specs: PrimitiveSpec[] = group ? await groupSpecs(group) : (await import('../src/motion/primitives/specs')).SPECS;

type Entry = {primitive: string; variant: string; property: string | null};
const catalogue: Record<string, Entry> = {};
const techniques: Record<string, Entry & {progress: number[]}> = {};

for (const spec of specs) {
	for (const [variant, v] of Object.entries(spec.variants)) {
		for (const [property, ids] of Object.entries(v.reproduces ?? {})) {
			const m = v.motions[property];
			if (!m) {
				problems.push(`${spec.name}/${variant}: no motion for property ${property}`);
				continue;
			}
			const n = settledLength(m);
			const progress = Array.from({length: n}, (_, f) => progressAt(f, {...m, delay: 0}));
			for (const id of ids) {
				if (catalogue[id]) problems.push(`${id} mapped twice (${catalogue[id].primitive}, ${spec.name})`);
				catalogue[id] = {primitive: spec.name, variant, property};
				techniques[id] = {primitive: spec.name, variant, property, progress};
			}
		}
		for (const id of v.covers ?? []) {
			if (catalogue[id]) problems.push(`${id} mapped twice (${catalogue[id].primitive}, ${spec.name})`);
			catalogue[id] = {primitive: spec.name, variant, property: null};
		}
	}
}

if (group) {
	console.log(JSON.stringify({group, primitives: specs.map((s) => s.name), specs, catalogue, techniques, probeLead: PROBE_LEAD, problems}));
} else {
	const {COMPONENTS} = await import('../src/motion/primitives/index');
	const {SHOWCASE_ORDER} = await import('../src/compositions/showcaseOrder');
	const {STYLE_DEMO_FPS, STYLE_DEMO_SHOTS} = await import('../src/compositions/styleDemoShots');
	const withComponent = specs.map((s) => s.name).filter((n) => n in COMPONENTS);
	for (const s of specs) if (!(s.name in COMPONENTS)) problems.push(`spec ${s.name} has no component`);
	for (const n of Object.keys(COMPONENTS)) if (!specs.some((s) => s.name === n)) problems.push(`component ${n} has no spec`);
	console.log(
		JSON.stringify({
			primitives: withComponent,
			showcase: SHOWCASE_ORDER,
			catalogue,
			techniques,
			probeLead: PROBE_LEAD,
			styleDemo: {fps: STYLE_DEMO_FPS, shots: STYLE_DEMO_SHOTS},
			problems,
		}),
	);
}
