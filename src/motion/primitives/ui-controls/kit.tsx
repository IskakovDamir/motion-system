import type React from 'react';
import {useId} from 'react';
import {useCurrentFrame} from 'remotion';
import {progressAt} from '../../engine/progress';
import {scheme, type Tone} from '../../tokens/colors';
import {CAP_RATIO, FONT, type FontRole, fontSize, TYPE, type TypeRole} from '../../tokens/type';
import type {PrimitiveSpec, VariantSpec} from '../types';

// Helpers of the ui-controls group: progress rates (for motion blur tied to speed), a measured shutter
// turned into a blur, text set at a measured cap height through the type tokens, list params, and the
// neutral demo pieces (discs, bars, chevrons, checks). Nothing here holds a measured number; the specs do.

/** Change of a variant motion's progress per reference frame (60 fps) at the current frame. */
export const useRate = (spec: PrimitiveSpec, variant?: string) => {
	const frame = useCurrentFrame();
	const v = spec.variants[variant ?? spec.defaultVariant];
	return (prop: string, offset = 0): number => {
		const m = v?.motions[prop];
		if (!m) return 0;
		return progressAt(frame - offset + 0.5, m) - progressAt(frame - offset - 0.5, m);
	};
};

/** Box (shutter) length in frames of travel -> Gaussian deviation of the same variance, in px. */
export const smear = (shutter: number, pxPerFrame: number): number => (shutter * Math.abs(pxPerFrame)) / Math.sqrt(12);

/** A param written as a space-separated number list ("0 17 33 50"). */
export const nums = (v: VariantSpec, key: string): number[] => {
	const x = v.params?.[key];
	if (typeof x !== 'string') throw new Error(`variant param ${key} is not a number list (${String(x)})`);
	return x.trim().split(/\s+/).map(Number);
};

/** A param written as frame:value pairs ("2:1 4:3 7:5"): the value of the last pair reached, `before` until then. */
export const stepAt = (v: VariantSpec, key: string, frame: number, before: number): number => {
	const x = v.params?.[key];
	if (typeof x !== 'string') throw new Error(`variant param ${key} is not a step list (${String(x)})`);
	let out = before;
	for (const item of x.trim().split(/\s+/)) {
		const [at, value] = item.split(':').map(Number);
		if (at !== undefined && value !== undefined && frame >= at) out = value;
	}
	return out;
};

/** Characters of a typed string shown `t` frames after typing starts, one every `framesPerChar`. */
export const typedCount = (t: number, framesPerChar: number, length: number): number =>
	t < 0 ? 0 : Math.min(length, Math.floor(t / framesPerChar) + 1);

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Alpha of a white layer that lifts luma `rest` to `peak` (both 0-1). */
export const liftOf = (rest: number, peak: number): number => (peak - rest) / (1 - rest);

/**
 * A white lift on everything a layer paints, alpha untouched: out = in * (1 - lift) + lift (the
 * light-fx LumaFilter's lift, copied so this group stands alone). The tree never changes with the value.
 */
export const Lift: React.FC<{lift: number; style?: React.CSSProperties; children: React.ReactNode}> = ({lift, style, children}) => {
	const id = `lift${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
	const a = clamp01(lift);
	return (
		<>
			<svg width="0" height="0" style={{position: 'absolute'}} aria-hidden>
				<filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
					<feComponentTransfer>
						<feFuncR type="linear" slope={1 - a} intercept={a} />
						<feFuncG type="linear" slope={1 - a} intercept={a} />
						<feFuncB type="linear" slope={1 - a} intercept={a} />
					</feComponentTransfer>
				</filter>
			</svg>
			<div style={{...style, filter: a > 1e-4 ? `url(#${id})` : undefined}}>{children}</div>
		</>
	);
};

/**
 * Font size (px) that sets `role` at a measured cap height (% of frame height), in `font` when the
 * measured family differs from the role's: fontSize() scaled by the cap-height and cap-ratio ratios.
 */
export const sizeAt = (role: TypeRole, height: number, capHeight?: number, font?: FontRole): number => {
	const t = TYPE[role];
	const f = font ?? t.font;
	return fontSize(role, height) * ((capHeight ?? t.capHeight) / t.capHeight) * (CAP_RATIO[t.font] / CAP_RATIO[f]);
};

export type TextProps = {
	role: TypeRole;
	height: number;
	/** measured cap height, % of frame height (default: the role's) */
	cap?: number;
	font?: FontRole;
	weight?: number;
	color: string;
	style?: React.CSSProperties;
	children: React.ReactNode;
};

export const Text: React.FC<TextProps> = ({role, height, cap, font, weight, color, style, children}) => {
	const t = TYPE[role];
	return (
		<span
			style={{
				fontFamily: FONT[font ?? t.font],
				fontWeight: weight ?? t.weight ?? 400,
				fontSize: sizeAt(role, height, cap, font),
				letterSpacing: t.tracking === null ? undefined : `${t.tracking}em`,
				lineHeight: 1.2,
				whiteSpace: 'pre',
				color,
				...style,
			}}
		>
			{children}
		</span>
	);
};

// ---- demo pieces (neutral: discs, bars, chevrons, checks, short words) ----

export const Chevron: React.FC<{size: number; color: string; dir?: 'up' | 'right' | 'down'; weight?: number}> = ({size, color, dir = 'up', weight = 0.14}) => {
	const rot = dir === 'up' ? 0 : dir === 'right' ? 90 : 180;
	return (
		<svg width={size} height={size} viewBox="0 0 100 100" style={{transform: `rotate(${rot}deg)`}}>
			<path d="M24 62 L50 36 L76 62" fill="none" stroke={color} strokeWidth={weight * 100} strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
};

export const Check: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<path d="M20 52 L42 72 L80 30" fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

export const Bar: React.FC<{tone: Tone; w: number; h: number; strong?: boolean; style?: React.CSSProperties}> = ({tone, w, h, strong, style}) => {
	const s = scheme(tone);
	return <div style={{width: w, height: h, borderRadius: h / 2, backgroundColor: strong ? s.inkSoft : s.line, flexShrink: 0, ...style}} />;
};

/** A square icon tile with a simple shape (circle, square or triangle) on it. */
export const Glyph: React.FC<{size: number; tile: string; mark: string; kind?: 'circle' | 'square' | 'triangle'; radius?: number}> = ({
	size,
	tile,
	mark,
	kind = 'circle',
	radius = 0.24,
}) => (
	<div style={{width: size, height: size, borderRadius: size * radius, backgroundColor: tile, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
		<svg width={size * 0.5} height={size * 0.5} viewBox="0 0 100 100">
			{kind === 'circle' ? <circle cx="50" cy="50" r="40" fill={mark} /> : null}
			{kind === 'square' ? <rect x="12" y="12" width="76" height="76" rx="12" fill={mark} /> : null}
			{kind === 'triangle' ? <polygon points="50,8 94,88 6,88" fill={mark} /> : null}
		</svg>
	</div>
);
