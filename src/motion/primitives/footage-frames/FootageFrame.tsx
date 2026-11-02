import type React from 'react';
import {useId} from 'react';
import {AbsoluteFill} from 'remotion';
import {maybe, mix, num, str, useFrame, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {Footage} from '../footage/FootageSlot';
import type {DemoProps, VariantSpec} from '../types';
import {
	type Box,
	boxOf,
	darkest,
	EDGE_10_90,
	Ground,
	listOf,
	LumaGain,
	PlateMark,
	progOf,
	rate,
	reached,
	type Shot,
	ShotFill,
	shutterSigma,
	stepAt,
	useRefFrame,
	Word,
} from './kit';
import {spec} from './FootageFrame.spec';

export type FootageFrameProps = {
	footage?: Footage;
	/** the shots the window cuts between (cut variants); footage / label / content make a single shot */
	shots?: Shot[];
	tone?: Tone;
	variant?: string;
	label?: string;
	/** neutral overlay drawn on the footage (it dims with the footage) */
	content?: React.ReactNode;
	/** where the window sits when the variant does not measure it (centre and size, % of frame); default the full frame */
	box?: Partial<Box>;
	/** corner radius, px at 1080, where the variant does not measure it */
	radius?: number;
	/** position of this window in a row of windows: its cuts come `stagger` frames later per step */
	index?: number;
	/** drawn above the footage inside the window and never dimmed (the text a dim sits under) */
	children?: React.ReactNode;
};

const FULL: Box = {x: 50, y: 50, w: 100, h: 100};

/** A curved-screen outline in px of its own box: straight sides, top and bottom bowed in by `bow` px (parabolas), round corners. */
const curvedPath = (w: number, h: number, bow: number, r: number): string => {
	const c = Math.min(r, w / 2, h / 2);
	return [
		`M ${c} 0`,
		`Q ${w / 2} ${2 * bow} ${w - c} 0`,
		`A ${c} ${c} 0 0 1 ${w} ${c}`,
		`L ${w} ${h - c}`,
		`A ${c} ${c} 0 0 1 ${w - c} ${h}`,
		`Q ${w / 2} ${h - 2 * bow} ${c} ${h}`,
		`A ${c} ${c} 0 0 1 0 ${h - c}`,
		`L 0 ${c}`,
		`A ${c} ${c} 0 0 1 ${c} 0`,
		'Z',
	].join(' ');
};

/** The shot index at frame f: how many of the variant's cuts (shifted for this window) have passed. */
const shotIndex = (v: VariantSpec, f: number, index: number): number => {
	const shift = index * (maybe(v, 'stagger') ?? 0);
	return reached(
		listOf(v, 'cuts').map((c) => c + shift),
		f,
	);
};

/**
 * Liquid outline: the layer is displaced outward across its own edges, by `amount` px where its content
 * is bright (luma 1) and less where it is dark, then softened by a Gaussian (sx, sy). The edge direction
 * is the difference of the blurred alpha one blur width either side (the alpha's gradient); the
 * brightness is the content's luma spread by the same blur, so it reaches past the edge. The tree is the
 * same at every amount, so children never remount.
 */
const LiquidEdge: React.FC<{amount: number; sx: number; sy: number; children: React.ReactNode}> = ({amount, sx, sy, children}) => {
	const id = `liquid${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
	// the field reaches two offsets past the edge, so a bright edge can travel the full amount
	const reach = Math.max(0.5, 2 * amount);
	// alpha difference across +-1 sigma peaks at 0.683 (erf(1/sqrt 2)); this maps it to +-0.5 around the neutral 0.5
	const k = 0.5 / 0.6827;
	// half a sigma outside the edge the spread luma is 0.31 of the content's and the direction 0.46 from neutral:
	// scale = amount / (0.31 x 0.46) moves a white edge out by `amount` (a darker one less)
	const scale = amount / (0.3085 * 0.457);
	const on = amount > 0.05 || sx >= 0.05 || sy >= 0.05;
	return (
		<>
			<svg width="0" height="0" style={{position: 'absolute'}} aria-hidden>
				<filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
					{/* the gradient is worked out in the alpha channel (arithmetic offsets every channel, alpha too), then moved to R / G */}
					<feGaussianBlur in="SourceAlpha" stdDeviation={reach} result="a" />
					<feOffset in="a" dx={-reach} result="ar" />
					<feOffset in="a" dx={reach} result="al" />
					<feOffset in="a" dy={-reach} result="ad" />
					<feOffset in="a" dy={reach} result="au" />
					<feComposite in="ar" in2="al" operator="arithmetic" k1={0} k2={k} k3={-k} k4={0.5} result="gx" />
					<feComposite in="ad" in2="au" operator="arithmetic" k1={0} k2={k} k3={-k} k4={0.5} result="gy" />
					<feColorMatrix in="gx" type="matrix" values="0 0 0 1 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1" result="rx" />
					<feColorMatrix in="gy" type="matrix" values="0 0 0 0 0  0 0 0 1 0  0 0 0 0 0  0 0 0 0 1" result="ry" />
					<feComposite in="rx" in2="ry" operator="arithmetic" k1={0} k2={1} k3={1} k4={0} result="dir" />
					<feColorMatrix
						in="SourceGraphic"
						type="matrix"
						values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 0 1"
						result="lum"
					/>
					<feGaussianBlur in="lum" stdDeviation={reach} result="lumB" />
					<feComposite in="dir" in2="lumB" operator="arithmetic" k1={1} k2={0} k3={-0.5} k4={0.5} result="map" />
					<feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" result="moved" />
					<feGaussianBlur in="moved" stdDeviation={`${Math.max(0, sx)} ${Math.max(0, sy)}`} />
				</filter>
			</svg>
			<AbsoluteFill style={{filter: on ? `url(#${id})` : undefined}}>{children}</AbsoluteFill>
		</>
	);
};

// A window that holds still while its footage changes: hard cuts at the variant's frames (shots cycle),
// a fade in from the card's black fill, or a luma dim under text. curvedHold / wobbleExit mask the
// footage with the measured curved-screen panel; wobbleExit whips it out of the top while its outline
// bulges where the footage is bright and its edges soften (the readings, as step lists).
export const FootageFrame: React.FC<FootageFrameProps> = ({
	footage,
	shots,
	tone = 'dark',
	variant,
	label,
	content,
	box,
	radius,
	index = 0,
	children,
}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, name);
	const f = useRefFrame();
	const {width: W, height: H, px} = useFrame();
	const s = scheme(tone);
	const list: Shot[] = shots && shots.length ? shots : [{footage, label, content}];
	const shot = list[shotIndex(v, f, index) % list.length];
	const b = boxOf(v, box, FULL);
	const bw = (b.w / 100) * W;
	const bh = (b.h / 100) * H;
	const curved = maybe(v, 'bow') !== undefined;
	const r = curved ? (num(v, 'radius') / 100) * bw : maybe(v, 'radius') !== undefined ? num(v, 'radius') : px(radius ?? 0);
	const clip = curved ? `path('${curvedPath(bw, bh, (num(v, 'bow') / 100) * H, r)}')` : undefined;

	// fade from the card fill / dim under text
	const filled = v.params?.fill === 'dark';
	const opacity = filled ? progOf(v, 'opacity', f) : 1;
	const dimTo = maybe(v, 'dimTo');
	const gain = dimTo === undefined ? 1 : mix(progOf(v, 'opacity', f), 1, dimTo);

	// whip exit of the curved panel
	const exit = maybe(v, 'rise') !== undefined;
	const yAt = (at: number) => (exit ? -(num(v, 'rise') / 100) * H * progOf(v, 'y', at) : 0);
	const y = yAt(f);
	const amount = exit ? px(stepAt(str(v, 'wobble'), f, 0)) : 0;
	const ramps = exit ? str(v, 'ramp') : '';
	const ramp0 = exit ? stepAt(ramps, 0, 0) : 0;
	const rampNow = exit ? stepAt(ramps, f, ramp0) : 0;
	const soft = px(Math.sqrt(Math.max(0, rampNow * rampNow - ramp0 * ramp0))) / EDGE_10_90;
	const smear = exit ? shutterSigma(num(v, 'shutter'), rate(yAt, f)) : 0;

	const window = (
		<div
			style={{
				position: 'absolute',
				left: (b.x / 100) * W - bw / 2,
				top: (b.y / 100) * H - bh / 2 + y,
				width: bw,
				height: bh,
				overflow: 'hidden',
				borderRadius: curved ? undefined : r,
				clipPath: clip,
				backgroundColor: filled ? darkest(s) : undefined,
			}}
		>
			<LumaGain gain={gain} style={{position: 'absolute', inset: 0, opacity}}>
				<ShotFill shot={shot} tone={tone} />
			</LumaGain>
			{children ? <AbsoluteFill>{children}</AbsoluteFill> : null}
		</div>
	);
	if (!exit) return <AbsoluteFill>{window}</AbsoluteFill>;
	return (
		<LiquidEdge amount={amount} sx={soft} sy={Math.hypot(soft, smear)}>
			{window}
		</LiquidEdge>
	);
};

// ---- isolated demo ----

const SHAPES = ['disc', 'square', 'triangle', 'bar'] as const;
const numbered = (tone: Tone, from: number, count: number): Shot[] =>
	Array.from({length: count}, (_, i) => ({content: <PlateMark tone={tone} n={from + i} shape={SHAPES[i % SHAPES.length]} />}));

/** Bright neutral shapes against the panel's edges, so a brightness-driven outline has something to follow. */
const EdgeLights: React.FC<{tone: Tone}> = ({tone}) => {
	const s = scheme(tone);
	return (
		<svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" style={{position: 'absolute'}}>
			<rect x={0} y={18} width={9} height={22} fill={s.flash} />
			<rect x={0} y={62} width={6} height={12} fill={s.flash} opacity={0.7} />
			<rect x={91} y={40} width={9} height={18} fill={s.flash} />
			<rect x={30} y={88} width={22} height={12} fill={s.flash} />
			<rect x={70} y={92} width={12} height={8} fill={s.flash} opacity={0.7} />
		</svg>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	if (variant === 'singleCut') {
		const tone: Tone = 'dark';
		return (
			<Ground tone={tone}>
				{[0, 1].map((i) => (
					<FootageFrame key={i} variant={variant} tone={tone} index={i} radius={24} box={{x: 36 + i * 28, y: 50, w: 22, h: 52}} shots={numbered(tone, 1 + i * 2, 2)} />
				))}
			</Ground>
		);
	}
	if (variant === 'innerCuts' || variant === 'cutBurst') {
		const tone: Tone = 'dark';
		const s = scheme(tone);
		return (
			<Ground tone={tone}>
				<div style={{position: 'absolute', left: '18%', top: '14%', width: '64%', height: '72%', backgroundColor: s.surface, border: `2px solid ${s.line}`}} />
				<FootageFrame variant={variant} tone={tone} box={{x: 50, y: 42, w: 56, h: 48}} shots={numbered(tone, 1, 9)} />
				<div style={{position: 'absolute', left: '22%', top: '72%', width: '56%', height: 10, borderRadius: 5, backgroundColor: s.line}} />
				<div style={{position: 'absolute', left: '22%', top: '77%', width: '30%', height: 10, borderRadius: 5, backgroundColor: s.muted}} />
			</Ground>
		);
	}
	if (variant === 'curvedHold' || variant === 'wobbleExit') {
		const tone: Tone = 'dark';
		return (
			<Ground tone={tone}>
				<FootageFrame
					variant={variant}
					tone={tone}
					content={
						<>
							{variant === 'wobbleExit' ? <EdgeLights tone={tone} /> : null}
							<PlateMark tone={tone} n={7} shape="disc" light />
						</>
					}
				/>
			</Ground>
		);
	}
	if (variant === 'contentFade') {
		const tone: Tone = 'light';
		return (
			<Ground tone={tone}>
				<FootageFrame variant={variant} tone={tone} radius={18} box={{x: 50, y: 56, w: 30, h: 76}} content={<PlateMark tone={tone} n={4} shape="square" />} />
			</Ground>
		);
	}
	// dimIn / heldDim: full-frame footage with light shapes on it, a plain centred line of text above it that does not dim
	const tone: Tone = 'light';
	return (
		<Ground tone={tone}>
			<FootageFrame variant={variant} tone={tone} content={<EdgeLights tone={tone} />}>
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
					{variant === 'heldDim' ? (
						<Word tone={tone} role="label" color="flash" upper>
							open every day
						</Word>
					) : (
						<Word tone={tone} role="display" color="flash" weight={700}>
							Start
						</Word>
					)}
				</AbsoluteFill>
			</FootageFrame>
		</Ground>
	);
};
