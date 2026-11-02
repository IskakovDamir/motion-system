import type React from 'react';
import {useId} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {progressAt} from '../../engine/progress';
import {scheme, type Scheme, type Tone} from '../../tokens/colors';
import type {Motion} from '../../tokens/easing';
import {REF_FPS} from '../../tokens/timing';
import {FONT, fontSize, TYPE, type TypeRole} from '../../tokens/type';
import {type Footage, FootageSlot} from '../footage/FootageSlot';
import type {VariantSpec} from '../types';

// Helpers of the footage-frames group: the clock in reference frames, list and step params, the
// speed-to-blur rules the moving frames share, a luma gain, the box a frame sits in, and neutral demo
// pieces. Nothing here holds a measured number; the specs do. (Copied in spirit from camera-move,
// cards and light-fx: groups do not import each other.)

/** Frames at 60 fps since the primitive started: the clock every motion token is written in. */
export const useRefFrame = (): number => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (frame * REF_FPS) / fps;
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** The motion of a variant property; throws when the spec does not define it. */
export const mot = (v: VariantSpec, prop: string): Motion => {
	const m = v.motions[prop];
	if (!m) throw new Error(`variant has no motion ${prop}`);
	return m;
};

/** Progress of a variant property at reference frame f; a property the variant does not animate is settled (1). */
export const progOf = (v: VariantSpec, prop: string, f: number): number => {
	const m = v.motions[prop];
	return m ? progressAt(f, m) : 1;
};

/** A list param ('5 10 12' or '5, 10, 12') as numbers; [] when absent. */
export const listOf = (v: VariantSpec, key: string): number[] => {
	const x = v.params?.[key];
	if (typeof x === 'number') return [x];
	if (typeof x !== 'string') return [];
	return x.split(/[\s,]+/).filter(Boolean).map(Number);
};

/**
 * Value of a step list "frame:value frame:value ..." (reference frames, ascending) at frame `f`: the
 * value of the last step reached, `before` until the first one.
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

/** Number of entries of an ascending frame list reached at frame f (a cut list: the shot index). */
export const reached = (frames: number[], f: number): number => frames.filter((a) => f >= a).length;

// ---- blur ----

/** A box smear of length L as a Gaussian of the same variance. */
export const BOX_TO_SIGMA = 1 / Math.sqrt(12);
/** A Gaussian edge's 10-90% width is this many sigmas (2 x 1.2816). */
export const EDGE_10_90 = 2.5631;

/**
 * Gaussian sigma (px) of a moving edge whose measured softness is `ratio` x its travel per frame
 * (the 10-90% edge width over px moved per frame, as the zoom rows give it).
 */
export const edgeSigma = (ratio: number, pxPerFrame: number): number => (ratio * Math.abs(pxPerFrame)) / EDGE_10_90;

/** Gaussian sigma (px) of a shutter of `shutter` frames (a measured box length / px per frame) at this speed. */
export const shutterSigma = (shutter: number, pxPerFrame: number): number => shutter * Math.abs(pxPerFrame) * BOX_TO_SIGMA;

/** Rate of change per reference frame of a value read at frame f, over the frame before (the shutter integrates the past). */
export const rate = (at: (f: number) => number, f: number): number => at(f) - at(f - 1);

// ---- luma ----

/** Relative luma (0-1) of a #rrggbb scheme colour, BT.601 weights (the analysis' grayscale). */
export const lumaOf = (hex: string): number => {
	const n = Number.parseInt(hex.replace('#', ''), 16);
	return (0.299 * ((n >> 16) & 0xff) + 0.587 * ((n >> 8) & 0xff) + 0.114 * (n & 0xff)) / 255;
};

/** The darkest role of a scheme (ink on light, bg on dark): the black fill of a card. */
export const darkest = (s: Scheme): string => (lumaOf(s.ink) < lumaOf(s.bg) ? s.ink : s.bg);

/** A scheme colour at an alpha (0-1). */
export const withAlpha = (color: string, a: number): string => `color-mix(in srgb, ${color} ${(clamp01(a) * 100).toFixed(2)}%, transparent)`;

/** Multiplies the luma of everything a layer paints by `gain` (alpha untouched); the tree never remounts. */
export const LumaGain: React.FC<{gain: number; style?: React.CSSProperties; children: React.ReactNode}> = ({gain, style, children}) => {
	const id = `gain${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
	const on = Math.abs(gain - 1) > 1e-4;
	return (
		<>
			<svg width="0" height="0" style={{position: 'absolute'}} aria-hidden>
				<filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feComponentTransfer>
						<feFuncR type="linear" slope={gain} />
						<feFuncG type="linear" slope={gain} />
						<feFuncB type="linear" slope={gain} />
					</feComponentTransfer>
				</filter>
			</svg>
			<div style={{...style, filter: on ? `url(#${id})` : undefined}}>{children}</div>
		</>
	);
};

// ---- boxes ----

/** Where a frame sits: centre x / y in % of frame width / height, width and height in % of frame width / height. */
export type Box = {x: number; y: number; w: number; h: number};

/** The box from the variant's measured params (cx, cy, cardW, cardH) where they exist, the given one elsewhere. */
export const boxOf = (v: VariantSpec, given: Partial<Box> | undefined, fallback: Box): Box => {
	const p = v.params ?? {};
	const n = (k: string) => (typeof p[k] === 'number' ? (p[k] as number) : undefined);
	return {
		x: given?.x ?? n('cx') ?? fallback.x,
		y: given?.y ?? n('cy') ?? fallback.y,
		w: given?.w ?? n('cardW') ?? fallback.w,
		h: given?.h ?? n('cardH') ?? fallback.h,
	};
};

/** One shot a frame can carry: footage (or the gray plate) and a neutral overlay drawn on it. */
export type Shot = {footage?: Footage; label?: string; focus?: string; content?: React.ReactNode};

/** A shot filling its parent: the FootageSlot, then its overlay. */
export const ShotFill: React.FC<{shot?: Shot; tone: Tone}> = ({shot, tone}) => (
	<AbsoluteFill>
		<FootageSlot footage={shot?.footage} tone={tone} label={shot?.label} focus={shot?.focus} />
		{shot?.content ? <AbsoluteFill>{shot.content}</AbsoluteFill> : null}
	</AbsoluteFill>
);

// ---- demo pieces (neutral content: numbers, plain shapes, short words) ----

/** A large numeral and a simple shape on a plate, so cuts and swaps between gray plates read. */
export const PlateMark: React.FC<{tone: Tone; n: number; shape?: 'disc' | 'square' | 'triangle' | 'bar'; light?: boolean}> = ({
	tone,
	n,
	shape = 'disc',
	light,
}) => {
	const s = scheme(tone);
	const fill = light ? s.flash : s.ink;
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<svg viewBox="0 0 160 90" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{position: 'absolute'}}>
				{shape === 'disc' ? <circle cx={112} cy={45} r={18} fill={fill} opacity={0.85} /> : null}
				{shape === 'square' ? <rect x={96} y={29} width={32} height={32} rx={4} fill={fill} opacity={0.85} /> : null}
				{shape === 'triangle' ? <path d="M112 25 L132 63 L92 63 Z" fill={fill} opacity={0.85} /> : null}
				{shape === 'bar' ? <rect x={88} y={38} width={48} height={14} rx={7} fill={fill} opacity={0.85} /> : null}
				<text x={52} y={60} textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize={44} fill={fill} opacity={0.85}>
					{n}
				</text>
			</svg>
		</AbsoluteFill>
	);
};

export const Word: React.FC<{
	tone: Tone;
	children: React.ReactNode;
	role?: TypeRole;
	color?: 'ink' | 'inkSoft' | 'muted' | 'onAccent' | 'flash';
	weight?: number;
	upper?: boolean;
	style?: React.CSSProperties;
}> = ({tone, children, role = 'ui', color = 'ink', weight, upper, style}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	const t = TYPE[role];
	return (
		<span
			style={{
				fontFamily: FONT[t.font],
				fontWeight: weight ?? t.weight ?? 400,
				fontSize: fontSize(role, height),
				letterSpacing: t.tracking === null ? undefined : `${t.tracking}em`,
				color: s[color],
				lineHeight: 1.15,
				whiteSpace: 'nowrap',
				textTransform: upper ? 'uppercase' : undefined,
				...style,
			}}
		>
			{children}
		</span>
	);
};

/** A plain full-frame background in a tone (each demo variant picks the tone its reference moment has). */
export const Ground: React.FC<{tone: Tone; children?: React.ReactNode}> = ({tone, children}) => (
	<AbsoluteFill style={{backgroundColor: scheme(tone).bg}}>{children}</AbsoluteFill>
);
