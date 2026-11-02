import type React from 'react';
import type {VariantSpec} from '../types';
import {scheme, type Tone} from '../../tokens/colors';
import {CAP_RATIO, FONT, type FontRole} from '../../tokens/type';

// Helpers of the layout group: per-part params, which motion drives which part, speed-to-blur, the
// measured type a variant sets, units revealed one after another, and the neutral demo pieces.
// Nothing here holds a measured number; the specs do.

/** p(prop, offsetFrames): progress of a variant motion, from useProgress. */
export type P = (prop: string, offset?: number) => number;

/**
 * A param that is either one number for every part or a space-separated list, one value per part
 * (the last value holds for later parts). Undefined when the variant does not set it.
 */
export const perPart = (v: VariantSpec, key: string, i: number): number | undefined => {
	const x = v.params?.[key];
	if (typeof x === 'number') return x;
	if (typeof x !== 'string') return undefined;
	const list = x.trim().split(/\s+/).map(Number);
	return list[Math.min(i, list.length - 1)];
};

/** Motion that drives `prop` of part i: `<prop><i + 1>` when the variant has one for that part, else `<prop>`. */
export const motionOf = (v: VariantSpec, prop: string, i: number): string => (`${prop}${i + 1}` in v.motions ? `${prop}${i + 1}` : prop);

/** |progress per frame| of a motion at this frame (frames of the composition), from half a frame either side. */
export const speedOf = (p: P, prop: string, offset = 0) => Math.abs(p(prop, offset - 0.5) - p(prop, offset + 0.5));

/**
 * Gaussian deviation (px) of a horizontal motion blur: a streak `exposure` frames (60 fps) of travel
 * long, drawn as the Gaussian of the same variance (a streak of length L has deviation L / sqrt(12)).
 * Frames are 60 fps frames, as everywhere in the engine (useProgress).
 */
export const streakSigma = (pxPerFrame: number, exposure: number) => (pxPerFrame * exposure) / Math.sqrt(12);

/** How many of `count` units show at `frame`: none before `at`, then one more every `rate` frames (all at once without a rate). */
export const unitsShown = (frame: number, count: number, at: number, rate?: number): number => {
	if (frame < at) return 0;
	if (!rate) return count;
	return Math.min(count, Math.floor((frame - at) / rate) + 1);
};

/** A font role named by a string param (throws on a name FONT does not have). */
export const fontRole = (name: string): FontRole => {
	if (!(name in FONT)) throw new Error(`no font role ${name}`);
	return name as FontRole;
};

export type LayoutType = {font: FontRole; weight: number; capHeight: number; tracking?: number; stretch?: number; upper?: boolean};

/** Font size (px) that gives `t` its cap height (% of a frame `height` px tall). */
export const sizeOf = (t: LayoutType, height: number) => ((t.capHeight / 100) * height) / CAP_RATIO[t.font];

/** CSS of a type style on a frame `height` px tall; line-height 1 (Inter's caps then sit centred in the line box). */
export const typeCss = (t: LayoutType, height: number): React.CSSProperties => ({
	fontFamily: FONT[t.font],
	fontWeight: t.weight,
	fontSize: sizeOf(t, height),
	letterSpacing: t.tracking === undefined ? undefined : `${t.tracking}em`,
	fontStretch: t.stretch ? `${t.stretch}%` : undefined,
	textTransform: t.upper ? 'uppercase' : undefined,
	lineHeight: 1,
	whiteSpace: 'pre',
});

// ---- demo pieces (neutral content: plain words, discs, simple geometric marks, gray plates) ----

type InkRole = 'ink' | 'inkSoft' | 'muted' | 'onAccent' | 'line';

export const Words: React.FC<{tone: Tone; t: LayoutType; color?: InkRole; style?: React.CSSProperties; children: React.ReactNode}> = ({
	tone,
	t,
	color = 'ink',
	style,
	children,
}) => <span style={{...typeCss(t, 1080), color: scheme(tone)[color], display: 'inline-block', ...style}}>{children}</span>;

/** A word as one span per letter, for content revealed letter by letter. */
export const letters = (tone: Tone, t: LayoutType, text: string, color: InkRole = 'ink'): React.ReactNode[] =>
	Array.from(text).map((c, i) => (
		<Words key={i} tone={tone} t={t} color={color}>
			{c}
		</Words>
	));

export const Disc: React.FC<{tone: Tone; d: number; fill?: 'ink' | 'muted' | 'line' | 'accent' | 'surfaceAlt' | 'bgAlt'; style?: React.CSSProperties}> = ({
	tone,
	d,
	fill = 'ink',
	style,
}) => <div style={{width: d, height: d, borderRadius: d / 2, backgroundColor: scheme(tone)[fill], flexShrink: 0, ...style}} />;

export const Tile: React.FC<{tone: Tone; w: number; h: number; fill?: 'ink' | 'accent' | 'surface' | 'surfaceAlt' | 'bgAlt' | 'muted'; radius?: number; line?: boolean; style?: React.CSSProperties; children?: React.ReactNode}> = ({
	tone,
	w,
	h,
	fill = 'surface',
	radius = 24,
	line,
	style,
	children,
}) => {
	const s = scheme(tone);
	return (
		<div
			style={{
				width: w,
				height: h,
				borderRadius: radius,
				backgroundColor: s[fill],
				border: line ? `3px solid ${s.line}` : undefined,
				boxSizing: 'border-box',
				position: 'relative',
				overflow: 'hidden',
				flexShrink: 0,
				...style,
			}}
		>
			{children}
		</div>
	);
};

/** A plain geometric mark: a thick ring with a dot beside it inside the ring's box. Fills its parent. */
export const RingMark: React.FC<{tone: Tone}> = ({tone}) => {
	const s = scheme(tone);
	return (
		<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{display: 'block'}}>
			<circle cx="45" cy="52" r="35" fill="none" stroke={s.ink} strokeWidth="20" />
			<circle cx="86" cy="16" r="12" fill={s.ink} />
		</svg>
	);
};

/** A plain square glyph (rounded square with a bar), as a small icon in a line of words. */
export const SquareGlyph: React.FC<{tone: Tone; d: number; fill?: 'ink' | 'muted' | 'surfaceAlt'}> = ({tone, d, fill = 'ink'}) => {
	const s = scheme(tone);
	return (
		<svg width={d} height={d} viewBox="0 0 40 40" style={{display: 'block', flexShrink: 0}}>
			<rect x="2" y="2" width="36" height="36" rx="10" fill={s[fill]} />
			<rect x="11" y="18" width="18" height="5" rx="2.5" fill={s.bg} />
		</svg>
	);
};

/** A right-pointing arrow (shaft + head), `w` px long. */
export const Arrow: React.FC<{tone: Tone; w: number; h: number}> = ({tone, w, h}) => {
	const s = scheme(tone);
	const t = h * 0.22;
	return (
		<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display: 'block'}}>
			<path
				d={`M ${t} ${h / 2} L ${w - t} ${h / 2} M ${w - h / 2} ${t} L ${w - t} ${h / 2} L ${w - h / 2} ${h - t}`}
				fill="none"
				stroke={s.ink}
				strokeWidth={t}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};
