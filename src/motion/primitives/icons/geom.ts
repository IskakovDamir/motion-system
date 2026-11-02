import type {VariantSpec} from '../types';

// Helpers the icons group shares: list params, measured paths, loops and step lists. Nothing here
// holds a measured number; the specs do.

/** A param written as a space-separated number list ("0 1 8 11"). */
export const nums = (v: VariantSpec, key: string): number[] => {
	const x = v.params?.[key];
	if (typeof x !== 'string') throw new Error(`variant param ${key} is not a number list (${String(x)})`);
	return x.trim().split(/\s+/).map(Number);
};

/** A param written as space-separated x,y pairs ("45.3,38.5 0,0"). */
export const points = (v: VariantSpec, key: string): [number, number][] => {
	const x = v.params?.[key];
	if (typeof x !== 'string') throw new Error(`variant param ${key} is not a point list (${String(x)})`);
	return x
		.trim()
		.split(/\s+/)
		.map((pair) => {
			const [a, b] = pair.split(',').map(Number);
			return [a ?? 0, b ?? 0];
		});
};

/** Element i of a list, cycling when there are more units than entries. */
export const cyc = <T,>(list: T[], i: number): T => {
	const x = list[((i % list.length) + list.length) % list.length];
	if (x === undefined) throw new Error('empty list');
	return x;
};

/** Index of the last step whose frame is <= frame (-1 before the first). */
export const stepIndex = (frame: number, steps: number[]): number => {
	let k = -1;
	steps.forEach((s, i) => {
		if (frame >= s) k = i;
	});
	return k;
};

/** Triangle wave: t folded into 0..half and back, so a half-swing curve plays forward then mirrored. */
export const fold = (t: number, half: number): number => {
	const period = 2 * half;
	const u = ((t % period) + period) % period;
	return u <= half ? u : period - u;
};

/** Point on an ellipse at a screen angle (deg, 0 = 3 o'clock, clockwise with y down). */
export const ellipseAt = (deg: number, rx: number, ry: number): [number, number] => {
	const a = (deg * Math.PI) / 180;
	return [rx * Math.cos(a), ry * Math.sin(a)];
};

type P = [number, number];

const catmull = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
	const t2 = t * t;
	const t3 = t2 * t;
	const f = (a: number, b: number, c: number, d: number) =>
		0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
	return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
};

/**
 * A smooth path through measured points (Catmull-Rom, in px), walked by arc length. at(u) takes the
 * fraction of the length from the first point (0) to the last (1); below 0 or above 1 it continues
 * straight along the end tangents, so an element can come from beyond the first point.
 */
export const makePath = (pts: P[]) => {
	const first = pts[0];
	const last = pts[pts.length - 1];
	if (!first || !last) throw new Error('a path needs points');
	const ext: P[] = [first, ...pts, last];
	const samples: P[] = [];
	const SUB = 24;
	for (let i = 1; i < ext.length - 2; i++) {
		const [a, b, c, d] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]] as [P, P, P, P];
		for (let k = 0; k < SUB; k++) samples.push(catmull(a, b, c, d, k / SUB));
	}
	samples.push(last);
	return walk(samples);
};

/**
 * An arc through a start, a peak and an end with a level tangent at the peak: a parabola on each
 * side (y against x), so it rises into the peak and dives into the end the way a thrown element does.
 */
export const makeArc = (start: P, peak: P, end: P) => {
	const samples: P[] = [];
	const SUB = 48;
	const side = (from: P, k: number): P => {
		const x = peak[0] + (from[0] - peak[0]) * k;
		return [x, peak[1] + (from[1] - peak[1]) * k * k];
	};
	for (let i = SUB; i > 0; i--) samples.push(side(start, i / SUB));
	for (let i = 0; i <= SUB; i++) samples.push(side(end, i / SUB));
	return walk(samples);
};

/** Arc-length walk along a sampled polyline; at(u) as in makePath. */
const walk = (samples: P[]) => {
	const first = samples[0];
	const last = samples[samples.length - 1];
	if (!first || !last) throw new Error('a path needs points');
	const acc = [0];
	for (let i = 1; i < samples.length; i++) {
		const a = samples[i - 1] as P;
		const b = samples[i] as P;
		acc.push((acc[i - 1] ?? 0) + Math.hypot(b[0] - a[0], b[1] - a[1]));
	}
	const length = acc[acc.length - 1] ?? 0;
	const dir = (a: P, b: P): P => {
		const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
		return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
	};
	const at = (u: number): P => {
		const s = u * length;
		if (s <= 0) {
			const d = dir(samples[0] as P, samples[1] as P);
			return [first[0] + d[0] * s, first[1] + d[1] * s];
		}
		if (s >= length) {
			const d = dir(samples[samples.length - 2] as P, last);
			return [last[0] + d[0] * (s - length), last[1] + d[1] * (s - length)];
		}
		let i = 1;
		while ((acc[i] ?? length) < s) i++;
		const a = samples[i - 1] as P;
		const b = samples[i] as P;
		const s0 = acc[i - 1] ?? 0;
		const s1 = acc[i] ?? length;
		const k = s1 > s0 ? (s - s0) / (s1 - s0) : 0;
		return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
	};
	return {at, length};
};

/** Linear walk through points taken at equal time steps (keyframes on pictures); u in 0..1. */
export const keyframesAt = (pts: P[], u: number): P => {
	const n = pts.length - 1;
	const x = Math.min(Math.max(u, 0), 1) * n;
	const i = Math.min(Math.floor(x), n - 1);
	const a = pts[i] as P;
	const b = pts[i + 1] ?? a;
	const k = x - i;
	return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
};
