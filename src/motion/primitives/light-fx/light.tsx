import type React from 'react';
import {useId} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scheme} from '../../tokens/colors';
import {REF_FPS} from '../../tokens/timing';

// Luminance helpers the light-fx primitives share. The references were measured as grayscale luma
// (0-255, BT.601 weights); these turn those measurements into layers built from scheme roles only:
// a white (flash) lift, a gain, a grey between the scheme's darkest role and its flash role.

/** Frames at 60 fps since the primitive started: the clock every motion token is written in. */
export const useRefFrame = (): number => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (frame * REF_FPS) / fps;
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Relative luma (0-1) of a #rrggbb scheme colour, with the BT.601 weights of the analysis' grayscale. */
export const lumaOf = (hex: string): number => {
	const n = Number.parseInt(hex.replace('#', ''), 16);
	const r = (n >> 16) & 0xff;
	const g = (n >> 8) & 0xff;
	const b = n & 0xff;
	return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

/** The darkest role of a scheme (ink on light, bg on dark): the low end of every grey below. */
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

/** Alpha of a white (flash) layer that lifts luma `rest` to `peak` (both 0-1). */
export const liftOf = (rest: number, peak: number): number => (peak - rest) / (1 - rest);

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

/** Quantise a frame to poses held `step` frames each (animation on twos). */
export const pose = (f: number, step: number): number => Math.floor(f / step) * step;

/**
 * Luminance transfer on everything a layer paints, alpha untouched: out = in * gain * (1 - lift) + lift.
 * lift is a white (flash) overlay clipped to the layer's own pixels; gain > 1 brightens, < 1 darkens.
 * The tree is the same at every value, so children never remount mid-pulse.
 */
export const LumaFilter: React.FC<{gain?: number; lift?: number; extra?: string; style?: React.CSSProperties; children: React.ReactNode}> = ({
	gain = 1,
	lift = 0,
	extra,
	style,
	children,
}) => {
	const id = `luma${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
	const slope = gain * (1 - clamp01(lift));
	const intercept = clamp01(lift);
	const on = Math.abs(slope - 1) > 1e-4 || intercept > 1e-4;
	const filter = [on ? `url(#${id})` : '', extra ?? ''].join(' ').trim();
	return (
		<>
			<svg width="0" height="0" style={{position: 'absolute'}} aria-hidden>
				<filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
					<feComponentTransfer>
						<feFuncR type="linear" slope={slope} intercept={intercept} />
						<feFuncG type="linear" slope={slope} intercept={intercept} />
						<feFuncB type="linear" slope={slope} intercept={intercept} />
					</feComponentTransfer>
				</filter>
			</svg>
			<div style={{...style, filter: filter || undefined}}>{children}</div>
		</>
	);
};

/** A four-point sparkle star centred on (x, y) px: concave sides meeting at four tips, w x h px tip to tip. */
export const Sparkle: React.FC<{x: number; y: number; w: number; h: number; color: string; opacity?: number}> = ({x, y, w, h, color, opacity = 1}) => (
	<svg
		width={w}
		height={h}
		viewBox="0 0 100 100"
		preserveAspectRatio="none"
		style={{position: 'absolute', left: x - w / 2, top: y - h / 2, opacity, overflow: 'visible'}}
	>
		{/* glyph drawing: tips on the box edges, the sides pulled in to the waist */}
		<path d="M50 0 Q56 44 100 50 Q56 56 50 100 Q44 56 0 50 Q44 44 50 0 Z" fill={color} />
	</svg>
);

/** Centre of the frame in % (the default origin of every burst, flash and flare). */
export type Origin = {x: number; y: number};
export const CENTRE: Origin = {x: 50, y: 50};
