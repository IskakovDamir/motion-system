import type React from 'react';
import {random} from 'remotion';
import type {VariantSpec} from '../types';
import {scheme, type Scheme, type Tone} from '../../tokens/colors';
import {CAP_RATIO, FONT, TYPE, type FontRole, type TextCase, type TypeRole, type TypeStyle} from '../../tokens/type';

// Helpers of the text-reveal group: the measured type of a variant (a TYPE role plus the overrides its
// typography rows give), cadences (uniform, jittered, step lists), value tracks read from measured
// samples, the soft left-to-right front, and a seeded order for out-of-order builds.

const param = (v: VariantSpec, key: string) => v.params?.[key];
const strParam = <T extends string>(v: VariantSpec, key: string, fallback: T): T => {
	const x = param(v, key);
	return typeof x === 'string' ? (x as T) : fallback;
};
const numParam = (v: VariantSpec, key: string): number | undefined => {
	const x = param(v, key);
	return typeof x === 'number' ? x : undefined;
};

/**
 * The type a variant sets: params.type names the TYPE role; font, weight, capHeight (% H), tracking
 * (em), case and stretch (%) override it with what the variant's typography rows measured.
 */
export const typeOf = (v: VariantSpec): TypeStyle => {
	const base: TypeStyle = TYPE[strParam<TypeRole>(v, 'type', 'headline')];
	return {
		font: strParam<FontRole>(v, 'font', base.font),
		weight: numParam(v, 'weight') ?? base.weight,
		capHeight: numParam(v, 'capHeight') ?? base.capHeight,
		tracking: numParam(v, 'tracking') ?? base.tracking,
		case: strParam<TextCase>(v, 'case', base.case),
		stretch: numParam(v, 'stretch') ?? base.stretch,
	};
};

/** Font size (px) that gives `t` a cap height of `capHeight` % of a frame `height` px tall. */
export const sizeOf = (t: TypeStyle, height: number, capHeight = t.capHeight) => ((capHeight / 100) * height) / CAP_RATIO[t.font];

/** Cap height in px of a type style on a frame `height` px tall. */
export const capOf = (t: TypeStyle, height: number, capHeight = t.capHeight) => (capHeight / 100) * height;

/** CSS of a type style on a frame `height` px tall. */
export const typeCss = (t: TypeStyle, height: number, capHeight = t.capHeight): React.CSSProperties => ({
	fontFamily: FONT[t.font],
	fontWeight: t.weight ?? undefined,
	fontSize: sizeOf(t, height, capHeight),
	letterSpacing: t.tracking === null ? undefined : `${t.tracking}em`,
	textTransform: t.case === 'upper' ? 'uppercase' : t.case === 'lower' ? 'lowercase' : undefined,
	fontStretch: t.stretch ? `${t.stretch}%` : undefined,
	whiteSpace: 'pre',
	lineHeight: 'normal',
});

/** A string param, or undefined when the spec does not set it. */
export const optStr = (v: VariantSpec, key: string): string | undefined => {
	const x = param(v, key);
	return typeof x === 'string' ? x : undefined;
};

/** The tone a variant's demo is set in (params.tone), light when absent. */
export const toneOf = (v: VariantSpec): Tone => (param(v, 'tone') === 'dark' ? 'dark' : 'light');

/** A scheme colour named by a param (`fallback` role when the param is absent). */
export const colorOf = (v: VariantSpec, key: string, tone: Tone, fallback: keyof Scheme = 'ink'): string =>
	scheme(tone)[strParam<keyof Scheme>(v, key, fallback)];

/** A comma-separated list param. */
export const listOf = (v: VariantSpec, key: string): string[] => {
	const x = param(v, key);
	return typeof x === 'string' && x.length > 0 ? x.split(',').map((s) => s.trim()) : [];
};
export const numsOf = (v: VariantSpec, key: string): number[] => listOf(v, key).map(Number);

/** The i-th entry of a list, cycling past its end. */
export const cycleAt = <T,>(list: T[], i: number): T | undefined => (list.length ? list[i % list.length] : undefined);

// ---- cadences: frame (60 fps, from the start of the reveal) at which unit i appears ----

/** Units on a fixed rate: unit i at floor(i * framesPer), so a 1.76 rate steps by 1 and 2 frames. */
export const uniformOnsets = (n: number, framesPer: number, perPicture = 1): number[] =>
	Array.from({length: n}, (_, i) => Math.floor(Math.floor(i / perPicture) * perPicture * framesPer + 1e-9));

/** Units after a list of gaps (frames between successive units), the list cycling. */
export const gapOnsets = (n: number, gaps: number[], first = 0): number[] => {
	const out: number[] = [];
	let t = first;
	for (let i = 0; i < n; i++) {
		out.push(t);
		t += cycleAt(gaps, i) ?? 0;
	}
	return out;
};

/**
 * Uneven typing: unit i aims at i * mean and is pulled off it by a seeded jitter, every gap kept inside
 * [min, max]; the first gap that starts at or after `pauseAt` is a `pause` instead.
 */
export const jitterOnsets = (n: number, o: {mean: number; min: number; max: number; pause?: number; pauseAt?: number; seed: string}): number[] => {
	const out: number[] = [];
	let shift = 0;
	let paused = o.pause === undefined;
	for (let i = 0; i < n; i++) {
		if (i === 0) {
			out.push(0);
			continue;
		}
		const prev = out[i - 1] as number;
		if (!paused && o.pauseAt !== undefined && prev >= o.pauseAt && o.pause !== undefined) {
			paused = true;
			shift += o.pause - o.mean;
			out.push(prev + o.pause);
			continue;
		}
		const target = i * o.mean + shift + (random(`${o.seed}-${i}`) - 0.5) * (o.max - o.min);
		out.push(Math.min(prev + o.max, Math.max(prev + o.min, Math.round(target))));
	}
	return out;
};

/** How many of `onsets` have started at `frame`. */
export const countAt = (onsets: number[], frame: number): number => onsets.filter((t) => t <= frame).length;

/** `frame` held on a capture grid of `step` frames (a screen capture's pictures); no grid when step <= 0. */
export const onPicture = (frame: number, step: number): number => (step > 0 ? Math.floor(frame / step + 1e-9) * step : frame);

// ---- value tracks: measured samples 'value@frame, value@frame ...', linear between samples ----

export type Track = [number, number][];

export const trackOf = (v: VariantSpec, key: string): Track =>
	listOf(v, key).map((s) => {
		const [val, at] = s.split('@');
		return [Number(at), Number(val)];
	});

/** Value of a track at `frame`: linear between its samples, held before the first and after the last. */
export const trackAt = (tr: Track, frame: number): number => {
	if (!tr.length) return 0;
	const first = tr[0] as [number, number];
	if (frame <= first[0]) return first[1];
	for (let i = 1; i < tr.length; i++) {
		const [f1, v1] = tr[i] as [number, number];
		const [f0, v0] = tr[i - 1] as [number, number];
		if (frame <= f1) return v0 + ((v1 - v0) * (frame - f0)) / Math.max(1e-9, f1 - f0);
	}
	return (tr[tr.length - 1] as [number, number])[1];
};

// ---- the soft front ----

/**
 * A soft left-to-right front `feather` units wide (in widths of the line) whose total ink is `total`:
 * returns the ink (0..1) of the unit at `u` (0 = left end, 1 = right end). The front position is solved
 * so the mean ink over the line is exactly `total`, so a measured whole-line curve stays the whole-line
 * curve while its left parts lead.
 */
export const softFront = (total: number, u: number, feather: number): number => {
	if (total <= 0) return 0;
	if (total >= 1) return 1;
	const F = Math.max(1e-6, feather);
	const mean = (s: number) => {
		const a = Math.min(1, Math.max(0, s - F));
		const b = Math.min(1, Math.max(0, s));
		return a + ((s - a) ** 2 - (s - b) ** 2) / (2 * F);
	};
	let lo = 0;
	let hi = 1 + F;
	for (let k = 0; k < 48; k++) {
		const s = (lo + hi) / 2;
		if (mean(s) < total) lo = s;
		else hi = s;
	}
	const s = (lo + hi) / 2;
	return Math.min(1, Math.max(0, (s - u) / F));
};

/** A seeded order of n units (a permutation of 0..n-1). */
export const seededOrder = (n: number, seed: string): number[] =>
	Array.from({length: n}, (_, i) => i)
		.map((i) => ({i, r: random(`${seed}-${i}`)}))
		.sort((a, b) => a.r - b.r)
		.map((x) => x.i);
