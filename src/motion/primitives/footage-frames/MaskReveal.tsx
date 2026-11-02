import type React from 'react';
import {useId} from 'react';
import {AbsoluteFill} from 'remotion';
import {maybe, mix, num, useFrame, variantOf} from '../../engine/anim';
import {progressAt} from '../../engine/progress';
import {scheme, type Tone} from '../../tokens/colors';
import type {Footage} from '../footage/FootageSlot';
import type {DemoProps, VariantSpec} from '../types';
import {type Box, boxOf, clamp01, Ground, listOf, mot, PlateMark, progOf, type Shot, ShotFill, useRefFrame, withAlpha, Word} from './kit';
import {spec} from './MaskReveal.spec';

export type MaskRevealProps = {
	/** the footage the mask reveals (scanBand: the unedited picture under the first sweep) */
	footage?: Footage;
	/** scanBand: the picture and its edited versions, one more revealed by each sweep; otherwise shots[0] is revealed */
	shots?: Shot[];
	tone?: Tone;
	variant?: string;
	label?: string;
	/** neutral overlay drawn on the footage */
	content?: React.ReactNode;
	/** where the card sits when the variant does not measure it (centre and size, % of frame) */
	box?: Partial<Box>;
	/** dotRing: what sits at the ring's centre before it passes (a status chip); it fades in place */
	centre?: React.ReactNode;
};

const CARD: Box = {x: 50, y: 50, w: 50, h: 50};

/** Largest progress step per reference frame of a motion: the speed at which a band's measured mid-card width holds. */
const peakRate = (v: VariantSpec, prop: string): number => {
	const m = mot(v, prop);
	let top = 0;
	for (let t = 0; t <= m.delay + m.duration; t++) top = Math.max(top, progressAt(t + 1, m) - progressAt(t, m));
	return top;
};

/** A ring of glowing dots on a square grid, the band from r_in to r_out with its peak at r_peak (px about cx, cy). */
const DotBand: React.FC<{w: number; h: number; cx: number; cy: number; rIn: number; rPeak: number; rOut: number; pitch: number; color: string; opacity: number}> = ({
	w,
	h,
	cx,
	cy,
	rIn,
	rPeak,
	rOut,
	pitch,
	color,
	opacity,
}) => {
	const id = useId().replace(/[^a-zA-Z0-9]/g, '');
	const on = rOut >= 0.5 && opacity > 0;
	const out = Math.max(0.5, rOut);
	return (
		<svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, opacity: on ? opacity : 0}}>
			<defs>
				<radialGradient id={`dot${id}`}>
					<stop offset={0} stopColor={color} stopOpacity={1} />
					<stop offset={1} stopColor={color} stopOpacity={0} />
				</radialGradient>
				<pattern id={`grid${id}`} width={pitch} height={pitch} patternUnits="userSpaceOnUse">
					<circle cx={pitch / 2} cy={pitch / 2} r={pitch / 2} fill={`url(#dot${id})`} />
				</pattern>
				<radialGradient id={`band${id}`} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={out}>
					<stop offset={0} stopColor={color} stopOpacity={0} />
					<stop offset={clamp01(rIn / out)} stopColor={color} stopOpacity={0} />
					<stop offset={clamp01(rPeak / out)} stopColor={color} stopOpacity={1} />
					<stop offset={1} stopColor={color} stopOpacity={0} />
				</radialGradient>
				<mask id={`mask${id}`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
					<rect width={w} height={h} fill={`url(#band${id})`} />
				</mask>
			</defs>
			<rect width={w} height={h} fill={`url(#grid${id})`} mask={`url(#mask${id})`} />
		</svg>
	);
};

// Footage revealed inside a card by a moving mask. dotRing: clear inside a circle that grows from the
// card centre, a band of glowing dots riding just outside it, the card fill outside; the chip at the
// centre fades as the ring passes, then the leftover dots and fill fade. scanBand: each sweep's trailing
// edge reveals the next version, a light band runs ahead of it (as wide as the progress one lead time
// ahead, its glow inverse to its width). seamOpen: the card's rounded outline opens from a fixed edge,
// content riding its sweeping edge. stripOpen: a strip opens to the right from a line.
export const MaskReveal: React.FC<MaskRevealProps> = ({footage, shots, tone = 'dark', variant, label, content, box, centre}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, name);
	const f = useRefFrame();
	const {width: W, height: H, px} = useFrame();
	const s = scheme(tone);
	const list: Shot[] = shots && shots.length ? shots : [{footage, label, content}];
	const first = list[0];
	const P = (prop: string, at = f) => progOf(v, prop, at);
	const pW = (x: number) => (x / 100) * W;
	const pH = (x: number) => (x / 100) * H;

	if (name === 'seamOpen' || name === 'stripOpen') {
		const b = boxOf(v, box, CARD);
		const p = P('width');
		const h = pH(b.h);
		const full = pW(num(v, 'toW'));
		const seam = name === 'seamOpen';
		const open = seam ? p * full : pW(mix(p, num(v, 'fromW'), num(v, 'toW')));
		// seamOpen: the right edge stays (with its measured drift) and the card rides the left edge; stripOpen: the left edge stays
		const right = seam ? pW(mix(p, num(v, 'right'), num(v, 'rightTo'))) : pW(num(v, 'left')) + open;
		const radius = ((maybe(v, 'radius') ?? 0) / 100) * full;
		return (
			<AbsoluteFill>
				{/* the mask is the card's rounded outline at its current width; the content keeps its size and rides the moving edge */}
				<div style={{position: 'absolute', left: right - open, top: pH(b.y) - h / 2, width: Math.max(0, open), height: h, borderRadius: radius, overflow: 'hidden'}}>
					<div style={{position: 'absolute', left: 0, top: 0, width: full, height: h}}>
						<ShotFill shot={first} tone={tone} />
					</div>
				</div>
			</AbsoluteFill>
		);
	}

	const b = boxOf(v, box, CARD);
	const cw = pW(b.w);
	const ch = pH(b.h);
	const card: React.CSSProperties = {
		position: 'absolute',
		left: pW(b.x) - cw / 2,
		top: pH(b.y) - ch / 2,
		width: cw,
		height: ch,
		borderRadius: ((maybe(v, 'radius') ?? 0) / 100) * cw,
		overflow: 'hidden',
		backgroundColor: s.surface,
	};

	if (name === 'dotRing') {
		const r = Math.max(0, pW(num(v, 'toR')) * P('progress'));
		const fade = 1 - P('dots');
		return (
			<AbsoluteFill>
				<div style={card}>
					<ShotFill shot={first} tone={tone} />
					{/* outside the ring the card's fill covers the footage; it leaves with the leftover dots */}
					<AbsoluteFill
						style={{
							backgroundColor: s.surface,
							opacity: fade,
							maskImage: `radial-gradient(circle at ${cw / 2}px ${ch / 2}px, transparent ${r}px, black ${r}px)`,
							WebkitMaskImage: `radial-gradient(circle at ${cw / 2}px ${ch / 2}px, transparent ${r}px, black ${r}px)`,
						}}
					/>
					<DotBand
						w={cw}
						h={ch}
						cx={cw / 2}
						cy={ch / 2}
						rIn={r}
						rPeak={r * num(v, 'peak')}
						rOut={r * num(v, 'outer')}
						pitch={px(num(v, 'pitch'))}
						color={s.flash}
						opacity={fade}
					/>
					{centre ? <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: 1 - P('chip')}}>{centre}</AbsoluteFill> : null}
				</div>
			</AbsoluteFill>
		);
	}

	// scanBand
	const sweeps = listOf(v, 'sweeps');
	// the band is the stretch between the reveal front now and `lead` frames ahead: bandWidth at the sweep's peak speed, narrower
	// where it is slower, squeezed to a line against either card edge
	const bandMax = pW(num(v, 'bandWidth'));
	const lead = bandMax / (cw * peakRate(v, 'progress'));
	return (
		<AbsoluteFill>
			<div style={card}>
				<ShotFill shot={first} tone={tone} />
				{sweeps.map((o, k) => {
					const t = clamp01(P('progress', f - o));
					const next = list[(k + 1) % list.length];
					return t > 0 ? (
						<AbsoluteFill key={`v${k}`} style={{clipPath: `inset(0 ${(1 - t) * 100}% 0 0)`}}>
							<ShotFill shot={next} tone={tone} />
						</AbsoluteFill>
					) : null;
				})}
				{sweeps.map((o, k) => {
					const t = clamp01(P('progress', f - o));
					const l = clamp01(P('progress', f - o + lead));
					const bw = (l - t) * cw;
					if (bw < 0.5 || t >= 1) return null;
					// the band's light is spread over its width: lift x width stays at the measured glow x bandWidth, capped
					const lift = Math.min(num(v, 'glowMax'), (num(v, 'glow') * bandMax) / bw);
					return (
						<div
							key={`b${k}`}
							style={{position: 'absolute', top: 0, bottom: 0, left: t * cw, width: bw, backgroundColor: withAlpha(s.flash, lift / 255), mixBlendMode: 'plus-lighter'}}
						/>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

// ---- isolated demo ----

const Chip: React.FC<{tone: Tone}> = ({tone}) => {
	const s = scheme(tone);
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 18,
				padding: '22px 40px',
				borderRadius: 999,
				backgroundColor: withAlpha(s.surfaceAlt, 0.85),
				border: `2px solid ${s.line}`,
			}}
		>
			<svg width={34} height={34} viewBox="0 0 34 34">
				<circle cx={17} cy={17} r={13} fill="none" stroke={s.muted} strokeWidth={4} />
				<path d="M17 4 A13 13 0 0 1 30 17" fill="none" stroke={s.ink} strokeWidth={4} strokeLinecap="round" />
			</svg>
			<Word tone={tone} role="label" color="ink">
				loading
			</Word>
		</div>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'dark';
	if (variant === 'scanBand') {
		const shapes = ['disc', 'square', 'triangle', 'bar'] as const;
		const shots: Shot[] = shapes.map((shape, i) => ({content: <PlateMark tone={tone} n={i + 1} shape={shape} light={i % 2 === 1} />}));
		return (
			<Ground tone={tone}>
				<MaskReveal variant={variant} tone={tone} shots={shots} />
			</Ground>
		);
	}
	if (variant === 'seamOpen') {
		return (
			<Ground tone={tone}>
				<MaskReveal variant={variant} tone={tone} box={{y: 50}} content={<PlateMark tone={tone} n={2} shape="square" light />} />
			</Ground>
		);
	}
	if (variant === 'stripOpen') {
		return (
			<Ground tone={tone}>
				<MaskReveal variant={variant} tone={tone} box={{y: 34}} content={<PlateMark tone={tone} n={3} shape="bar" light />} />
			</Ground>
		);
	}
	return (
		<Ground tone={tone}>
			<MaskReveal variant={variant} tone={tone} centre={<Chip tone={tone} />} content={<PlateMark tone={tone} n={5} shape="triangle" light />} />
		</Ground>
	);
};
