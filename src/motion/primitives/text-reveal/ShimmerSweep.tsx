import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {maybe, num, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {TYPE} from '../../tokens/type';
import type {DemoProps} from '../types';
import {onPicture, optStr, toneOf, typeCss} from './kit';
import {spec} from './ShimmerSweep.spec';

export type ShimmerSweepProps = {
	children: React.ReactNode;
	tone?: Tone;
	variant?: string;
	/** frames before the first sweep */
	delay?: number;
	style?: React.CSSProperties;
};

/** One mask stop: alpha at a position along the gradient line (a CSS length). */
type Stop = [number, string];

/** The band's alpha profile around its centre `at` (px offsets added to the CSS position `at(d)`). */
const bandStops = (profile: string, at: (d: number) => string, o: {band: number; edge: number; rise: number; fade: number}): Stop[] => {
	if (profile === 'plateau') {
		const half = o.band / 2;
		const e = o.edge / 2;
		return [
			[0, at(-half - e)],
			[1, at(-half + e)],
			[1, at(half - e)],
			[0, at(half + e)],
		];
	}
	if (profile === 'ramp') {
		// a sweep that lights each point over `rise` px ahead of the peak and lets it fade over `fade` px behind
		return [
			[0, at(-o.fade)],
			[1, at(0)],
			[0, at(o.rise)],
		];
	}
	// Gaussian dip of FWHM `band`
	const sigma = o.band / 2.355;
	return [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3].map((k) => [Math.exp(-(k * k) / 2), at(k * sigma)]);
};

const gradient = (angle: number, stops: Stop[], alpha: (a: number) => number) =>
	`linear-gradient(${angle}deg, ${[[0, '-9999px'] as Stop, ...stops, [0, 'calc(100% + 9999px)'] as Stop]
		.map(([a, pos]) => `rgba(0,0,0,${alpha(a).toFixed(4)}) ${pos}`)
		.join(', ')})`;

export const ShimmerSweep: React.FC<ShimmerSweepProps> = ({children, tone = 'light', variant, delay = 0, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const t = frame - delay;
	const {w} = useFrame();
	const mode = str(v, 'mode');
	const band = w(maybe(v, 'bandWidth') ?? 0);
	const edge = w(maybe(v, 'edge') ?? 0);
	const speed = maybe(v, 'speed');
	const period = maybe(v, 'period');
	const angle = 90 - (maybe(v, 'slant') ?? 0);

	// where the band centre is: a CSS position along the element, or null while no band is on it
	let at: ((d: number) => string) | null = null;
	const local = period !== undefined ? ((t % period) + period) % period : t;
	if (v.motions.x) {
		const g = onPicture(local, maybe(v, 'pictureFrames') ?? 0);
		const k = p('x', frame - g);
		const path = optStr(v, 'path');
		if (t >= 0 && g <= v.motions.x.duration + v.motions.x.delay) {
			if (path === 'across') at = (d) => `calc(${k * 100}% + ${k * band - band / 2 + d}px)`;
			else if (path === 'span') at = (d) => `calc(${k * 100}% + ${d}px)`;
			else {
				const travel = speed !== undefined ? w(speed) * v.motions.x.duration : 0;
				at = (d) => `${k * travel + d}px`;
			}
		}
	} else if (speed !== undefined && t >= 0) {
		const rise = w(speed) * (maybe(v, 'rise') ?? 0);
		const c = -w(maybe(v, 'lead') ?? 0) - rise + w(speed) * local;
		at = (d) => `${c + d}px`;
	}

	const stops = at ? bandStops(str(v, 'profile'), at, {band, edge, rise: w(speed ?? 0) * (maybe(v, 'rise') ?? 0), fade: w(speed ?? 0) * (maybe(v, 'fade') ?? 0)}) : [];
	const amount = maybe(v, 'amount') ?? 1;
	const mask = (alpha: (a: number) => number): React.CSSProperties => {
		const m = at ? gradient(angle, stops, alpha) : `linear-gradient(rgba(0,0,0,${alpha(0)}), rgba(0,0,0,${alpha(0)}))`;
		return {maskImage: m, WebkitMaskImage: m};
	};

	if (mode === 'brighten') {
		return (
			<div style={{position: 'relative', display: 'inline-block', ...style}}>
				{children}
				{at ? (
					<div style={{position: 'absolute', inset: 0, filter: `brightness(${amount})`, ...mask((a) => a)}} aria-hidden>
						{children}
					</div>
				) : null}
			</div>
		);
	}
	const alpha = mode === 'dim' ? (a: number) => 1 - (1 - amount) * a : (a: number) => a;
	return <div style={{position: 'relative', display: 'inline-block', ...mask(alpha), ...style}}>{children}</div>;
};

// ---- isolated demo ----

const H = 1080;

const Check: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<path d="M18 52 L40 74 L84 28" fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const Lens: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<circle cx={42} cy={42} r={26} fill="none" stroke={color} strokeWidth={11} />
		<line x1={62} y1={62} x2={86} y2={86} stroke={color} strokeWidth={11} strokeLinecap="round" />
	</svg>
);

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const tone = toneOf(v);
	const s = scheme(tone);
	const {w, h, px} = useFrame();
	const cap = maybe(v, 'capHeight') ?? TYPE.label.capHeight;
	const text = (weight: number, color: string, c = cap): React.CSSProperties => ({...typeCss({...TYPE.ui, weight}, H, c), color});
	let body: React.ReactNode;
	if (variant === 'slantedBand') {
		// the band is 2.5 x the pill height wide
		const pill = w(num(v, 'bandWidth') / num(v, 'pillRatio'));
		body = (
			<ShimmerSweep tone={tone} variant={variant}>
				<div style={{width: w(num(v, 'pillWidth')), height: pill, borderRadius: pill / 2, backgroundColor: s.bgAlt, display: 'flex', alignItems: 'center', padding: `0 ${pill * 0.6}px`, boxSizing: 'border-box'}}>
					<span style={text(400, s.ink)}>Saving your changes</span>
				</div>
			</ShimmerSweep>
		);
	} else if (variant === 'darkBand') {
		body = (
			<ShimmerSweep tone={tone} variant={variant}>
				<div style={{display: 'flex', alignItems: 'center', gap: h(0.8)}}>
					<Lens size={h(cap * 1.6)} color={s.muted} />
					<span style={text(400, s.muted)}>Searching the files</span>
				</div>
			</ShimmerSweep>
		);
	} else if (variant === 'looping') {
		body = (
			<div style={{display: 'flex', alignItems: 'center', gap: h(0.6)}}>
				<Check size={h(cap * 1.4)} color={s.muted} />
				<ShimmerSweep tone={tone} variant={variant}>
					<span style={text(400, s.muted)}>Reorganized</span>
				</ShimmerSweep>
			</div>
		);
	} else if (variant === 'once') {
		body = (
			<ShimmerSweep tone={tone} variant={variant}>
				<div style={{display: 'flex', flexDirection: 'column', gap: h(1.4)}}>
					<span style={text(600, s.ink)}>Three steps for a calm week</span>
					<span style={text(400, s.inkSoft, cap * 0.63)}>Pick one task each morning and keep it small.</span>
					<span style={text(400, s.inkSoft, cap * 0.63)}>Leave the last hour free for loose ends.</span>
				</div>
			</ShimmerSweep>
		);
	} else {
		// a card whose grid lines only show where the sweep passes
		const cols = 9;
		const rows = 5;
		body = (
			<div style={{width: w(70), height: h(52), backgroundColor: s.surface, borderRadius: px(36), overflow: 'hidden'}}>
				<ShimmerSweep tone={tone} variant={variant} style={{width: '100%', height: '100%'}}>
					<svg width={w(70)} height={h(52)}>
						{Array.from({length: cols - 1}, (_, i) => (
							<line key={`c${i}`} x1={(w(70) * (i + 1)) / cols} y1={0} x2={(w(70) * (i + 1)) / cols} y2={h(52)} stroke={s.surfaceAlt} strokeWidth={px(3)} />
						))}
						{Array.from({length: rows - 1}, (_, i) => (
							<line key={`r${i}`} x1={0} y1={(h(52) * (i + 1)) / rows} x2={w(70)} y2={(h(52) * (i + 1)) / rows} stroke={s.surfaceAlt} strokeWidth={px(3)} />
						))}
					</svg>
				</ShimmerSweep>
			</div>
		);
	}
	return <AbsoluteFill style={{backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center'}}>{body}</AbsoluteFill>;
};
