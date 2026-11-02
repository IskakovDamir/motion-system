import type {VariantSpec} from '../types';
import type {Scheme} from '../../tokens/colors';

// Helpers the shapes group shares: list params, step lists, greys from measured luma levels.
// Nothing here holds a measured number; the specs do. (Copied in part from icons/geom.ts and
// light-fx/light.tsx, so the group never imports across groups.)

/** A point in % of frame width, % of frame height. */
export type Pt = [number, number];

/** A param written as a space-separated number list ("0 3 9 12"). */
export const nums = (v: VariantSpec, key: string): number[] => {
	const x = v.params?.[key];
	if (typeof x !== 'string') throw new Error(`variant param ${key} is not a number list (${String(x)})`);
	return x.trim().split(/\s+/).map(Number);
};

/** A param written as space-separated x,y pairs ("19.1,9.5 87.5,83.3"). */
export const points = (v: VariantSpec, key: string): Pt[] => {
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

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export const mod = (a: number, m: number) => ((a % m) + m) % m;

/**
 * Value of a step list "frame:value frame:value ..." (frames at 60 fps, ascending) at frame `f`:
 * the value of the last step reached, `before` until the first one.
 */
export const stepAt = (list: string, f: number, before: number): number => {
	let out = before;
	for (const item of list.trim().split(/\s+/)) {
		const [at, value] = item.split(':').map(Number);
		if (at === undefined || value === undefined) continue;
		if (f >= at) out = value;
	}
	return out;
};

/** Relative luma (0-1) of a #rrggbb scheme colour, BT.601 weights (the analysis' grayscale). */
export const lumaOf = (hex: string): number => {
	const n = Number.parseInt(hex.replace('#', ''), 16);
	const r = (n >> 16) & 0xff;
	const g = (n >> 8) & 0xff;
	const b = n & 0xff;
	return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

/** The darkest role of a scheme (ink on light, bg on dark). */
export const darkest = (s: Scheme): string => (lumaOf(s.ink) < lumaOf(s.bg) ? s.ink : s.bg);

/** A grey of luma `l` (0-1), mixed from the scheme's darkest role and its flash role. */
export const greyOf = (s: Scheme, l: number): string => {
	const lo = lumaOf(darkest(s));
	const hi = lumaOf(s.flash);
	const p = clamp01((l - lo) / (hi - lo));
	return `color-mix(in srgb, ${s.flash} ${(p * 100).toFixed(2)}%, ${darkest(s)})`;
};

/** A scheme colour at an alpha (0-1). */
export const withAlpha = (color: string, a: number): string =>
	`color-mix(in srgb, ${color} ${(clamp01(a) * 100).toFixed(2)}%, transparent)`;

/** True when the scheme's field is lighter than its ink (a light tone). */
export const isLight = (s: Scheme) => lumaOf(s.bg) > lumaOf(s.ink);

/**
 * A grey `levels` luma levels (0-255) away from the field, toward the ink: the way the analysis
 * measured faint lines, blobs and dots against their background.
 */
export const contrastGrey = (s: Scheme, levels: number): string => {
	const bg = lumaOf(s.bg);
	return greyOf(s, isLight(s) ? bg - levels / 255 : bg + levels / 255);
};
