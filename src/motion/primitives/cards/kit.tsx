import type React from 'react';
import type {VariantSpec} from '../types';
import {scheme, type Tone} from '../../tokens/colors';
import {FONT, fontSize, TYPE, type TypeRole} from '../../tokens/type';

// Helpers of the cards group: per-item params, step lists, the speed-to-blur rule the entering
// cards share, and neutral demo pieces. Nothing here holds a measured number; the specs do.

/** A param that is either one number for every item or a space-separated list, one per item (cycled). */
export const perItem = (v: VariantSpec, key: string, i: number): number | undefined => {
	const x = v.params?.[key];
	if (typeof x === 'number') return x;
	if (typeof x !== 'string') return undefined;
	const list = x.trim().split(/\s+/).map(Number);
	return list[((i % list.length) + list.length) % list.length];
};

/** Frame an item starts at: its entry in `delays` (a per-item list), else i * stagger, else 0. */
export const itemDelay = (v: VariantSpec, i: number): number => {
	const d = perItem(v, 'delays', i);
	if (d !== undefined) return d;
	const s = v.params?.stagger;
	return typeof s === 'number' ? i * s : 0;
};

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

/** A box smear of length L as a Gaussian of the same variance (the camera group's rule). */
export const BOX_TO_SIGMA = 1 / Math.sqrt(12);

/**
 * Motion blur from speed: `shutter` frames of travel smeared into one picture (a measured box length
 * over the speed it was measured at), so the box is shutter x px moved per frame.
 */
export const smearBox = (shutter: number, pxPerFrame: number): number => shutter * Math.abs(pxPerFrame);

// ---- demo pieces (neutral content: plain surfaces, bars for text lines, discs, short words) ----

export const Surface: React.FC<{
	tone: Tone;
	w: number;
	h: number;
	fill?: 'surface' | 'surfaceAlt' | 'bgAlt' | 'accent' | 'ink';
	radius?: number;
	line?: boolean;
	style?: React.CSSProperties;
	children?: React.ReactNode;
}> = ({tone, w, h, fill = 'surface', radius = 28, line = true, style, children}) => {
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

export const Bar: React.FC<{tone: Tone; w: number; h: number; fill?: 'line' | 'inkSoft' | 'muted' | 'surfaceAlt' | 'onAccent'; style?: React.CSSProperties}> = ({
	tone,
	w,
	h,
	fill = 'line',
	style,
}) => {
	const s = scheme(tone);
	return <div style={{width: w, height: h, borderRadius: h / 2, backgroundColor: s[fill], flexShrink: 0, ...style}} />;
};

export const Disc: React.FC<{tone: Tone; d: number; fill?: 'ink' | 'muted' | 'line' | 'accent' | 'surface' | 'surfaceAlt' | 'bgAlt'; style?: React.CSSProperties}> = ({
	tone,
	d,
	fill = 'ink',
	style,
}) => {
	const s = scheme(tone);
	return <div style={{width: d, height: d, borderRadius: d / 2, backgroundColor: s[fill], flexShrink: 0, ...style}} />;
};

export const Word: React.FC<{
	tone: Tone;
	children: React.ReactNode;
	role?: TypeRole;
	height?: number;
	color?: 'ink' | 'inkSoft' | 'muted' | 'onAccent';
	mono?: boolean;
	weight?: number;
	style?: React.CSSProperties;
}> = ({tone, children, role = 'ui', height = 1080, color = 'ink', mono, weight, style}) => {
	const s = scheme(tone);
	const t = TYPE[role];
	return (
		<span
			style={{
				fontFamily: mono ? FONT.mono : FONT[t.font],
				fontWeight: weight ?? t.weight ?? 400,
				fontSize: fontSize(role, height),
				letterSpacing: t.tracking === null ? undefined : `${t.tracking}em`,
				color: s[color],
				lineHeight: 1.15,
				whiteSpace: 'nowrap',
				...style,
			}}
		>
			{children}
		</span>
	);
};

/** Lines of a text block drawn as bars (widths in px), the first one darker. */
export const Lines: React.FC<{tone: Tone; widths: number[]; h?: number; gap?: number; fill?: 'line' | 'muted' | 'onAccent'}> = ({
	tone,
	widths,
	h = 16,
	gap = 16,
	fill = 'line',
}) => (
	<div style={{display: 'flex', flexDirection: 'column', gap}}>
		{widths.map((w, i) => (
			<Bar key={i} tone={tone} w={w} h={h} fill={i === 0 && fill === 'line' ? 'muted' : fill} />
		))}
	</div>
);
