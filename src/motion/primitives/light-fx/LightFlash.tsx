import type {TransitionPresentation, TransitionPresentationComponentProps, TransitionTiming} from '@remotion/transitions';
import type React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {num, variantOf} from '../../engine/anim';
import {mix, progressAt} from '../../engine/progress';
import {motionTiming} from '../../engine/transition';
import {scheme, type Scheme, type Tone} from '../../tokens/colors';
import {linear, type Motion} from '../../tokens/easing';
import {fontSize, FONT, TYPE} from '../../tokens/type';
import {FootageSlot} from '../footage/FootageSlot';
import type {DemoProps, VariantSpec} from '../types';
import {CENTRE, clamp01, type Origin, Sparkle, useRefFrame, withAlpha} from './light';
import {spec} from './LightFlash.spec';

// One picture of a light flash at frame f (60 fps, from its start), split the way a TransitionSeries
// renders it: what belongs to the outgoing scene, what belongs to the incoming one (drawn on top),
// and the light over both. LightFlash and lightFlashPresentation draw the same pictures.

type Size = {width: number; height: number};
type Picture = {
	from: (node: React.ReactNode) => React.ReactNode;
	to: (node: React.ReactNode) => React.ReactNode;
	over: React.ReactNode;
};

const end = (m: Motion | undefined) => (m ? m.delay + m.duration : 0);
const mot = (v: VariantSpec, prop: string): Motion => {
	const m = v.motions[prop];
	if (!m) throw new Error(`LightFlash variant has no motion ${prop}`);
	return m;
};

/** Frames (60 fps) a variant runs, from its first change until the incoming scene stands alone. */
const lengthOf = (name: string, v: VariantSpec): number =>
	name === 'iris' ? end(v.motions.progress) + num(v, 'holdWhite') : Math.max(...Object.values(v.motions).map(end));

const layer = (node: React.ReactNode, style?: React.CSSProperties) => <AbsoluteFill style={style}>{node}</AbsoluteFill>;
const shown = (on: boolean): React.CSSProperties => ({visibility: on ? 'inherit' : 'hidden'});

const picture = (name: string, v: VariantSpec, f: number, size: Size, s: Scheme, o: Origin): Picture => {
	const p = (prop: string) => progressAt(f, mot(v, prop));
	const w = (pct: number) => (pct / 100) * size.width;
	const ox = w(o.x);
	const oy = (o.y / 100) * size.height;
	const toBg: React.CSSProperties = {backgroundColor: s.bg};
	const flashFill = (a: number, extra?: React.CSSProperties) => (
		<AbsoluteFill style={{backgroundColor: s.flash, opacity: clamp01(a), ...extra}} />
	);

	if (name === 'iris') {
		const cut = lengthOf(name, v);
		const r = w(mix(p('progress'), num(v, 'fromRadius'), num(v, 'toRadius')));
		const before = f < cut;
		return {
			from: (n) => layer(n, shown(before)),
			to: (n) => layer(n, {...toBg, ...shown(!before)}),
			over: (
				<div
					style={{
						position: 'absolute',
						left: ox - r,
						top: oy - r,
						width: 2 * r,
						height: 2 * r,
						borderRadius: '50%',
						backgroundColor: s.flash,
						visibility: before ? 'inherit' : 'hidden',
					}}
				/>
			),
		};
	}

	if (name === 'ringBloom') {
		const cut = mot(v, 'recover').delay;
		const before = f < cut;
		const white = before ? p('opacity') : num(v, 'recoverFrom') * (1 - p('recover'));
		return {
			from: (n) => layer(n, shown(before)),
			to: (n) => layer(n, {...toBg, ...shown(!before)}),
			over: flashFill(white),
		};
	}

	if (name === 'flareCut') {
		const cut = end(v.motions.wash);
		const before = f < cut;
		const band = num(v, 'bandPeak') * p('band');
		const top = num(v, 'bandY') - num(v, 'bandHeight') / 2;
		const bot = num(v, 'bandY') + num(v, 'bandHeight') / 2;
		return {
			from: (n) => layer(n, shown(before)),
			to: (n) => layer(n, {...toBg, ...shown(!before)}),
			over: (
				<AbsoluteFill style={shown(before)}>
					{flashFill(num(v, 'washPeak') * p('wash'))}
					<AbsoluteFill
						style={{
							background: `linear-gradient(180deg, transparent ${top}%, ${withAlpha(s.flash, band)} ${num(v, 'bandY')}%, transparent ${bot}%)`,
						}}
					/>
				</AbsoluteFill>
			),
		};
	}

	if (name === 'starSplit') {
		const open = clamp01(p('progress'));
		const gap = open * 100;
		// the stars part on their own until the gap starts, then their inner tips ride its edges
		const sep = w(num(v, 'splitEarly') * p('split') + (num(v, 'splitTo') - num(v, 'splitEarly')) * open);
		const sw = w(num(v, 'starWidth'));
		const sh = sw * num(v, 'starAspect');
		const wash = num(v, 'washPeak') * (p('wash') - p('washOut'));
		// the gap's edges soften outward under the star bodies (half a star wide once fully open)
		const edge = (num(v, 'starWidth') / 2) * open;
		const lo = 50 - gap / 2;
		const hi = 50 + gap / 2;
		const mask = `linear-gradient(90deg, transparent ${lo - edge}%, black ${lo}%, black ${hi}%, transparent ${hi + edge}%)`;
		return {
			from: (n) => layer(n),
			to: (n) => layer(n, {...toBg, maskImage: mask, WebkitMaskImage: mask}),
			over: (
				<AbsoluteFill>
					{flashFill(wash)}
					<Sparkle x={ox - sep / 2} y={oy} w={sw} h={sh} color={s.flash} />
					<Sparkle x={ox + sep / 2} y={oy} w={sw} h={sh} color={s.flash} />
				</AbsoluteFill>
			),
		};
	}

	// invertRipple: inside ring 1 the outgoing picture is luminance-inverted; ring 2 restores the
	// polarity and brings the incoming picture with it
	const r1 = w(num(v, 'toRadius') * p('progress'));
	const r2 = w(num(v, 'toRadius') * p('restore'));
	return {
		from: (n) => (
			<>
				{layer(n)}
				{layer(n, {backgroundColor: s.bg, filter: 'invert(1)', clipPath: `circle(${r1}px at ${ox}px ${oy}px)`})}
			</>
		),
		to: (n) => layer(n, {...toBg, clipPath: `circle(${r2}px at ${ox}px ${oy}px)`}),
		over: null,
	};
};

export type LightFlashProps = {
	from: React.ReactNode;
	to: React.ReactNode;
	tone?: Tone;
	variant?: string;
	/** where the light starts, % of the frame (the landing point, the hero element) */
	origin?: Origin;
};

export const LightFlash: React.FC<LightFlashProps> = ({from, to, tone = 'light', variant, origin = CENTRE}) => {
	const f = useRefFrame();
	const {width, height} = useVideoConfig();
	const name = variant ?? spec.defaultVariant;
	const pic = picture(name, variantOf(spec, variant), f, {width, height}, scheme(tone), origin);
	return (
		<AbsoluteFill>
			{pic.from(from)}
			{pic.to(to)}
			{pic.over}
		</AbsoluteFill>
	);
};

type FlashPresentationProps = {variant: string; tone: Tone; origin: Origin};

const FlashPresentation: React.FC<TransitionPresentationComponentProps<FlashPresentationProps>> = ({
	children,
	presentationDirection,
	presentationProgress,
	passedProps,
}) => {
	const {width, height} = useVideoConfig();
	const v = variantOf(spec, passedProps.variant);
	const f = presentationProgress * lengthOf(passedProps.variant, v);
	const pic = picture(passedProps.variant, v, f, {width, height}, scheme(passedProps.tone), passedProps.origin);
	return presentationDirection === 'exiting' ? (
		<AbsoluteFill>{pic.from(children)}</AbsoluteFill>
	) : (
		<AbsoluteFill>
			{pic.to(children)}
			{pic.over}
		</AbsoluteFill>
	);
};

/** The flash as a TransitionSeries presentation: the outgoing scene, the incoming one and the light over both. */
export const lightFlashPresentation = (variant?: string, tone: Tone = 'light', origin: Origin = CENTRE): TransitionPresentation<FlashPresentationProps> => ({
	component: FlashPresentation,
	props: {variant: variant ?? spec.defaultVariant, tone, origin},
});

/** Its timing: a steady clock over the variant's length; the measured curves run inside the presentation. */
export const lightFlashTiming = (variant?: string): TransitionTiming => {
	const name = variant ?? spec.defaultVariant;
	const length = lengthOf(name, variantOf(spec, variant));
	return motionTiming({duration: length, delay: 0, ease: linear});
};

// ---- Demo: two neutral scenes, a light one going out and a dark one coming in ----

const Scene: React.FC<{tone: Tone; word: string; number: string; shape: 'circle' | 'square'}> = ({tone, word, number, shape}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			<div style={{position: 'absolute', left: '8%', top: '12%', width: '34%', height: '40%', borderRadius: 24, overflow: 'hidden'}}>
				<FootageSlot tone={tone} label="footage" />
			</div>
			<div
				style={{
					position: 'absolute',
					left: '8%',
					top: '60%',
					fontFamily: FONT[TYPE.display.font],
					fontSize: fontSize('display', height),
					fontWeight: 700,
					letterSpacing: `${TYPE.display.tracking}em`,
					color: s.ink,
					lineHeight: 1,
				}}
			>
				{word}
			</div>
			<svg style={{position: 'absolute', left: '58%', top: '18%', width: '30%', height: '54%'}} viewBox="0 0 100 100">
				{shape === 'circle' ? (
					<circle cx="50" cy="50" r="38" fill="none" stroke={s.ink} strokeWidth="6" />
				) : (
					<rect x="14" y="14" width="72" height="72" rx="10" fill={s.ink} />
				)}
			</svg>
			<div
				style={{
					position: 'absolute',
					right: '8%',
					bottom: '10%',
					fontFamily: FONT.mono,
					fontSize: fontSize('label', height),
					color: s.muted,
				}}
			>
				{number}
			</div>
		</AbsoluteFill>
	);
};

// which scene goes out and which comes in, so each flash reads against the picture it covers
const SCENES: Record<string, [Tone, Tone]> = {
	iris: ['light', 'dark'],
	ringBloom: ['dark', 'dark'],
	flareCut: ['dark', 'dark'],
	starSplit: ['dark', 'dark'],
	invertRipple: ['light', 'light'],
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const [a, b] = SCENES[variant] ?? ['light', 'dark'];
	return (
		<LightFlash
			variant={variant}
			tone={a}
			from={<Scene tone={a} word="North" number="01" shape="circle" />}
			to={<Scene tone={b} word="South" number="02" shape="square" />}
		/>
	);
};
