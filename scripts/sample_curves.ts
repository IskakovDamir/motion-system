// Prints, as JSON, what verify.py and compare_sheets.py need from the code:
//  - primitives: names with a spec AND a component; showcase: names MotionShowcase plays
//  - catalogue: technique id -> primitive / variant / property, read from the primitive specs
//  - techniques: per measured technique, the built progress per frame (60 fps) from progressAt(),
//    the same function the components render with
//  - styleDemo: the shot list StyleDemo is cut from
// Run: npx tsx scripts/sample_curves.ts
import {progressAt} from '../src/motion/engine/progress';
import {COMPONENTS} from '../src/motion/primitives/index';
import {SPECS} from '../src/motion/primitives/specs';
import {PROBE_LEAD} from '../src/compositions/probe';
import {SHOWCASE_ORDER} from '../src/compositions/showcaseOrder';
import {STYLE_DEMO_FPS, STYLE_DEMO_SHOTS} from '../src/compositions/styleDemoShots';
import type {Motion} from '../src/motion/tokens/easing';

const settledLength = (m: Motion): number => {
	// sample until the curve has stayed at its end value for 60 frames
	const base = m.ease.kind === 'spring' ? 0 : m.duration;
	let f = Math.ceil(base);
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

type Entry = {primitive: string; variant: string; property: string | null};
const catalogue: Record<string, Entry> = {};
const techniques: Record<string, Entry & {progress: number[]}> = {};
const problems: string[] = [];

for (const spec of SPECS) {
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

const withComponent = SPECS.map((s) => s.name).filter((n) => n in COMPONENTS);
for (const s of SPECS) if (!(s.name in COMPONENTS)) problems.push(`spec ${s.name} has no component`);
for (const n of Object.keys(COMPONENTS)) if (!SPECS.some((s) => s.name === n)) problems.push(`component ${n} has no spec`);

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
