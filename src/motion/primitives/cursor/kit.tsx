import type React from 'react';
import {useId} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {progressAt} from '../../engine/progress';
import {scheme, type Tone} from '../../tokens/colors';
import type {Motion} from '../../tokens/easing';
import {REF_FPS} from '../../tokens/timing';
import {FONT, fontSize, TYPE, type TypeRole} from '../../tokens/type';
import type {VariantSpec} from '../types';

// Helpers of the cursor group: the pointer drawing (a plain arrow, flat, outline or extruded), the
// clock in reference frames, list params, measured paths walked by arc length, the speed smear, and
// the neutral demo pieces. Nothing here holds a measured number; the specs do.

// ---- clock and params ----

/** The current frame in reference frames (60 fps), so motions play at their measured speed at any fps. */
export const useRefFrame = (): number => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (frame * REF_FPS) / fps;
};

/** The motion of a variant property; throws when the spec does not define it. */
export const mot = (v: VariantSpec, prop: string): Motion => {
	const m = v.motions[prop];
	if (!m) throw new Error(`variant has no motion ${prop}`);
	return m;
};

/** Clamped progress of a variant motion at reference frame f (what the components render with). */
export const at = (v: VariantSpec, prop: string, f: number, offset = 0): number => progressAt(f - offset, mot(v, prop));

/**
 * Progress continued past the end of the motion along its end tangent (read over one frame), so an
 * exit keeps its last speed and leaves the frame instead of stopping where the measurement ends.
 */
export const onward = (v: VariantSpec, prop: string, f: number): number => {
	const m = mot(v, prop);
	const end = m.delay + m.duration;
	if (f <= end) return progressAt(f, m);
	const slope = progressAt(end, m) - progressAt(end - 1, m);
	return progressAt(end, m) + slope * (f - end);
};

/** How far (reference frames) before its start a motion is continued when its speed is read. */
const SPEED_EDGE = 2;

/**
 * Progress for reading speed: like `at`, but continued along the start tangent just before the motion
 * starts, so an element that arrives already moving smears on its first picture.
 */
export const atSpeed = (v: VariantSpec, prop: string, f: number, offset = 0): number => {
	const m = mot(v, prop);
	const t = f - offset - m.delay;
	if (t < 0 && t >= -SPEED_EDGE) {
		const slope = progressAt(m.delay + 1, m) - progressAt(m.delay, m);
		return progressAt(m.delay, m) + slope * t;
	}
	return progressAt(f - offset, m);
};

/** A param written as a space-separated number list ("0 3 3 5"). */
export const nums = (v: VariantSpec, key: string): number[] => {
	const x = v.params?.[key];
	if (typeof x !== 'string') throw new Error(`variant param ${key} is not a number list (${String(x)})`);
	return x.trim().split(/\s+/).map(Number);
};

export type P = [number, number];

/** A param written as space-separated x,y pairs ("24.3,16.3 0,0"). */
export const points = (v: VariantSpec, key: string): P[] => {
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

/** A param of `frame:value` steps ("0:20 3:23.5"); the value of the last step reached, `before` until the first. */
export const stepValue = (v: VariantSpec, key: string, f: number, before: number): number => {
	const x = v.params?.[key];
	if (typeof x !== 'string') throw new Error(`variant param ${key} is not a step list (${String(x)})`);
	let out = before;
	for (const item of x.trim().split(/\s+/)) {
		const [s, value] = item.split(':').map(Number);
		if (s === undefined || value === undefined) continue;
		if (f >= s) out = value;
	}
	return out;
};

/** A param of `frame:x,y` steps; the point of the last step reached, `before` until the first. */
export const stepPoint = (v: VariantSpec, key: string, f: number, before: P): P => {
	const x = v.params?.[key];
	if (typeof x !== 'string') throw new Error(`variant param ${key} is not a step list (${String(x)})`);
	let out = before;
	for (const item of x.trim().split(/\s+/)) {
		const [s, xy] = item.split(':');
		const [a, b] = (xy ?? '').split(',').map(Number);
		if (s === undefined || a === undefined || b === undefined) continue;
		if (f >= Number(s)) out = [a, b];
	}
	return out;
};

// ---- paths ----

const catmull = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
	const t2 = t * t;
	const t3 = t2 * t;
	const f = (a: number, b: number, c: number, d: number) =>
		0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
	return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
};

/** Catmull-Rom samples through measured points. */
const spline = (pts: P[]): P[] => {
	const first = pts[0];
	const last = pts[pts.length - 1];
	if (!first || !last) throw new Error('a path needs points');
	if (pts.length === 1) return [first];
	const ext: P[] = [first, ...pts, last];
	const out: P[] = [];
	const SUB = 24;
	for (let i = 1; i < ext.length - 2; i++) {
		const [a, b, c, d] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]] as [P, P, P, P];
		for (let k = 0; k < SUB; k++) out.push(catmull(a, b, c, d, k / SUB));
	}
	out.push(last);
	return out;
};

/**
 * A smooth path through measured points (px), walked by arc length: at(u) is the point at the
 * fraction u of the length from the first point (0) to the last (1); outside 0..1 it continues
 * straight along the end tangents.
 */
export const makePath = (pts: P[]) => {
	const samples = spline(pts);
	const first = samples[0] as P;
	const last = samples[samples.length - 1] as P;
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
		if (samples.length < 2) return first;
		const s = u * length;
		if (s <= 0) {
			const d = dir(first, samples[1] as P);
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

/** y of a smooth path through measured points at a given x (the path must run one way in x). */
export const yAtX = (pts: P[], x: number): number => {
	const s = spline(pts);
	const first = s[0] as P;
	const last = s[s.length - 1] as P;
	const up = last[0] >= first[0];
	for (let i = 1; i < s.length; i++) {
		const a = s[i - 1] as P;
		const b = s[i] as P;
		const lo = Math.min(a[0], b[0]);
		const hi = Math.max(a[0], b[0]);
		if (x >= lo && x <= hi) {
			const k = b[0] === a[0] ? 0 : (x - a[0]) / (b[0] - a[0]);
			return a[1] + (b[1] - a[1]) * k;
		}
	}
	return (up ? x < first[0] : x > first[0]) ? first[1] : last[1];
};

/** Linear walk through keyframes [frame, x, y]; holds the ends. */
export const keyframesAt = (keys: [number, number, number][], f: number): P => {
	const first = keys[0];
	const last = keys[keys.length - 1];
	if (!first || !last) throw new Error('no keyframes');
	if (f <= first[0]) return [first[1], first[2]];
	if (f >= last[0]) return [last[1], last[2]];
	let i = 1;
	while ((keys[i]?.[0] ?? Infinity) < f) i++;
	const a = keys[i - 1] as [number, number, number];
	const b = keys[i] as [number, number, number];
	const k = b[0] > a[0] ? (f - a[0]) / (b[0] - a[0]) : 1;
	return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
};

// ---- smear ----

const BOX_TO_SIGMA = 1 / Math.sqrt(12);

/**
 * Motion blur from speed: `shutter` frames of travel smeared into one picture (a measured box length
 * over the speed it was measured at), as Gaussians of equal variance per screen axis.
 */
export const smear = (shutter: number, dx: number, dy: number): {x: number; y: number} => ({
	x: shutter * Math.abs(dx) * BOX_TO_SIGMA,
	y: shutter * Math.abs(dy) * BOX_TO_SIGMA,
});

/** A smear along the travel: Gaussian sigma (px) and direction (deg on screen). */
export type Streak = {sigma: number; angle: number};

/** The shutter's smear for a move of (dx, dy) px per frame, along its own direction. */
export const streak = (shutter: number, dx: number, dy: number): Streak => ({
	sigma: shutter * Math.hypot(dx, dy) * BOX_TO_SIGMA,
	angle: (Math.atan2(dy, dx) * 180) / Math.PI,
});

// ---- the pointer ----

// Artwork of the pointers, in drawing units with the tip at (0, 0): a plain arrow with a tail (the 2D
// cursor) and a notched arrowhead (the 3D pointer the references extrude). These shape the drawing
// only; the size it is drawn at comes from the specs or the caller.
const ARROW: P[] = [
	[0, 0],
	[0, 16],
	[3.8, 12.4],
	[6.4, 18.4],
	[8.9, 17.3],
	[6.4, 11.5],
	[11.6, 11.5],
];
const ARROW_H = 18.4;
const ARROW_W = 11.6;
const pathOf = (pts: P[]) => 'M ' + pts.map(([x, y]) => `${x} ${y}`).join(' L ') + ' Z';
const ARROW_D = pathOf(ARROW);
const HEAD: P[] = [
	[0, 0],
	[13, 5],
	[6.6, 6.6],
	[5, 13],
];
const HEAD_S = 13;
const HEAD_D = pathOf(HEAD);
/** depth of the extruded look, in drawing units */
const EXTRUDE = 1.6;
const EXTRUDE_STEPS = 8;
/** spread of the glow halo and of the wider bloom around it, in drawing units, and the bloom's share */
const HALO = 3.2;
const BLOOM = 9;
const BLOOM_OPACITY = 0.6;

type Shape = {d: string; w: number; h: number; centre: P};
const SHAPES: Record<'arrow' | 'head', Shape> = {
	arrow: {d: ARROW_D, w: ARROW_W, h: ARROW_H, centre: [ARROW_W / 2, ARROW_H / 2]},
	head: {d: HEAD_D, w: HEAD_S, h: HEAD_S, centre: [HEAD_S / 2, HEAD_S / 2]},
};

export type PointerLook = 'flat' | 'outline' | 'solid3d';
export type Anchor = 'tip' | 'centre';

export type PointerProps = {
	tone: Tone;
	/** height of the arrow, px */
	h: number;
	look: PointerLook;
	/** position of the anchor, px */
	x: number;
	y: number;
	anchor?: Anchor;
	/** rotation about the anchor, deg (positive = clockwise) */
	rotate?: number;
	/** scale about the arrow's centre */
	scale?: number;
	opacity?: number;
	/** Gaussian softness along both screen axes, px */
	blur?: {x: number; y: number};
	/** motion blur: a Gaussian along the travel (sigma px, direction deg on screen) */
	smear?: Streak;
	/** opacity of the light halo behind the arrow (0 = none) */
	glow?: number;
	/** the pointer's own brightness over the background behind it (1 = full; it stays opaque) */
	brightness?: number;
};

/** A plain arrow pointer: flat (ink with a light rim), an outline, or extruded. No hand, no finger. */
export const Pointer: React.FC<PointerProps> = ({tone, h, look, x, y, anchor = 'tip', rotate = 0, scale = 1, opacity = 1, blur, smear: streak, glow = 0, brightness = 1}) => {
	const id = `cur${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
	const s = scheme(tone);
	const shape = SHAPES[look === 'solid3d' ? 'head' : 'arrow'];
	const D = shape.d;
	const CENTRE = shape.centre;
	const k = h / shape.h;
	if (k <= 0) return null;
	const bx = (blur?.x ?? 0) / k;
	const by = (blur?.y ?? 0) / k;
	const sa = (streak?.sigma ?? 0) / k;
	const R = Math.hypot(shape.w, shape.h) + EXTRUDE + 3 * BLOOM + 3 * Math.max(bx, by) + 3 * sa + 2;
	const [ax, ay] = anchor === 'tip' ? [0, 0] : CENTRE;
	// scale about the arrow's centre, then rotate about the anchor
	const inner = `rotate(${rotate}) translate(${-ax} ${-ay}) translate(${CENTRE[0]} ${CENTRE[1]}) scale(${scale}) translate(${-CENTRE[0]} ${-CENTRE[1]})`;
	const blurOn = bx >= 0.02 || by >= 0.02;
	const streakOn = sa >= 0.02;
	const angle = streak?.angle ?? 0;
	const region = {filterUnits: 'userSpaceOnUse' as const, x: -2 * R, y: -2 * R, width: 4 * R, height: 4 * R, colorInterpolationFilters: 'sRGB' as const};
	return (
		<svg
			width={2 * R * k}
			height={2 * R * k}
			viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`}
			style={{position: 'absolute', left: x - R * k, top: y - R * k, opacity, overflow: 'visible', pointerEvents: 'none'}}
		>
			<defs>
				<filter id={`${id}b`} {...region}>
					<feGaussianBlur stdDeviation={`${bx} ${by}`} />
				</filter>
				<filter id={`${id}s`} {...region}>
					<feGaussianBlur stdDeviation={`${sa} 0`} />
				</filter>
				<filter id={`${id}g`} {...region}>
					<feGaussianBlur stdDeviation={HALO} />
				</filter>
				<filter id={`${id}h`} {...region}>
					<feGaussianBlur stdDeviation={BLOOM} />
				</filter>
			</defs>
			{/* the smear runs along the travel: blur along x in a frame turned to the travel direction */}
			<g transform={`rotate(${angle})`}>
				<g filter={streakOn ? `url(#${id}s)` : undefined}>
					<g transform={`rotate(${-angle})`}>
						<g filter={blurOn ? `url(#${id}b)` : undefined}>
							<g transform={inner}>
								{glow > 0 ? (
									<>
										<g filter={`url(#${id}h)`} opacity={Math.min(1, glow) * BLOOM_OPACITY}>
											<path d={D} fill={s.flash} stroke={s.flash} strokeWidth={BLOOM} strokeLinejoin="round" />
										</g>
										<g filter={`url(#${id}g)`} opacity={Math.min(1, glow)}>
											<path d={D} fill={s.flash} stroke={s.flash} strokeWidth={HALO} strokeLinejoin="round" />
										</g>
									</>
								) : null}
								{brightness < 1 && look === 'solid3d'
									? Array.from({length: EXTRUDE_STEPS + 1}, (_, i) => {
											const d = (EXTRUDE * (EXTRUDE_STEPS - i)) / EXTRUDE_STEPS;
											return <path key={i} d={D} transform={`translate(${d * 0.6} ${d})`} fill={s.bg} stroke={s.bg} strokeWidth={0.6} strokeLinejoin="round" />;
										})
									: null}
								<g opacity={Math.max(0, Math.min(1, brightness))}>
									{look === 'solid3d'
										? Array.from({length: EXTRUDE_STEPS}, (_, i) => {
												const d = (EXTRUDE * (EXTRUDE_STEPS - i)) / EXTRUDE_STEPS;
												return <path key={i} d={D} transform={`translate(${d * 0.6} ${d})`} fill={s.inkSoft} stroke={s.inkSoft} strokeWidth={0.6} strokeLinejoin="round" />;
											})
										: null}
									{look === 'outline' ? (
										<path d={D} fill="none" stroke={s.ink} strokeWidth={1.1} strokeLinejoin="round" />
									) : (
										<path d={D} fill={s.ink} stroke={look === 'flat' ? s.surface : s.muted} strokeWidth={look === 'flat' ? 1.2 : 0.5} strokeLinejoin="round" />
									)}
								</g>
							</g>
						</g>
					</g>
				</g>
			</g>
		</svg>
	);
};

/** Pointer size in px for a variant: `cursorH` (its height, % of frame height) or `cursorW` (its size in % of frame width). */
export const pointerHeight = (v: VariantSpec, width: number, height: number): number | undefined => {
	const ch = v.params?.cursorH;
	if (typeof ch === 'number') return (ch / 100) * height;
	const cw = v.params?.cursorW;
	if (typeof cw === 'number') return (cw / 100) * width;
	return undefined;
};

// ---- demo pieces (neutral content: plain surfaces, bars for text lines, short words) ----

export const Word: React.FC<{
	tone: Tone;
	children: React.ReactNode;
	role?: TypeRole;
	height: number;
	color?: 'ink' | 'inkSoft' | 'muted' | 'onAccent';
	style?: React.CSSProperties;
}> = ({tone, children, role = 'ui', height, color = 'ink', style}) => {
	const s = scheme(tone);
	const t = TYPE[role];
	return (
		<span
			style={{
				fontFamily: FONT[t.font],
				fontWeight: t.weight ?? 400,
				fontSize: fontSize(role, height),
				letterSpacing: t.tracking === null ? undefined : `${t.tracking}em`,
				color: s[color],
				lineHeight: 1.2,
				whiteSpace: 'nowrap',
				...style,
			}}
		>
			{children}
		</span>
	);
};

export const Bar: React.FC<{tone: Tone; w: number; h: number; strong?: boolean; style?: React.CSSProperties}> = ({tone, w, h, strong, style}) => {
	const s = scheme(tone);
	return <div style={{width: w, height: h, borderRadius: h / 2, backgroundColor: strong ? s.inkSoft : s.line, flexShrink: 0, ...style}} />;
};

export const Block: React.FC<{
	tone: Tone;
	w: number;
	h: number;
	fill?: 'surface' | 'surfaceAlt' | 'bgAlt' | 'accent' | 'ink' | 'line' | 'muted';
	radius?: number;
	line?: boolean;
	style?: React.CSSProperties;
	children?: React.ReactNode;
}> = ({tone, w, h, fill = 'surface', radius = 16, line = false, style, children}) => {
	const s = scheme(tone);
	return (
		<div
			style={{
				width: w,
				height: h,
				borderRadius: radius,
				backgroundColor: s[fill],
				border: line ? `2px solid ${s.line}` : undefined,
				boxSizing: 'border-box',
				flexShrink: 0,
				position: 'relative',
				overflow: 'hidden',
				...style,
			}}
		>
			{children}
		</div>
	);
};
