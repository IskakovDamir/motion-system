import type {TransitionPresentation, TransitionPresentationComponentProps, TransitionTiming} from '@remotion/transitions';
import type React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {num, variantOf} from '../../engine/anim';
import {mix} from '../../engine/progress';
import {motionTiming} from '../../engine/transition';
import {scheme, type Tone} from '../../tokens/colors';
import {linear} from '../../tokens/easing';
import type {DemoProps, VariantSpec} from '../types';
import {clamp01, keyAt, keys, mot, motionEnd, prog, type Pt, SceneA, SceneB, useT, ZoomStreaks} from './kit';
import {spec} from './ZoomThrough.spec';

// One picture of a zoom-through at frame t (60 fps from its start), split the way a TransitionSeries
// renders it: the outgoing layer (with anything drawn over it, such as a white wash) and the
// incoming layer (with its own overlay, such as a dark vignette). ZoomThrough and
// zoomThroughPresentation draw the same pictures.

type Size = {width: number; height: number};

type Layer = {
	shown: boolean;
	opacity: number;
	/** CSS transform of the scene inside the layer */
	transform: string;
	/** transform origin, px */
	origin: Pt;
	/** zoom-streak length (fraction of the radius) about `origin` */
	streak: number;
	/** colour behind a scene scaled below full frame */
	fill?: string;
	over?: React.ReactNode;
};

type Picture = {from: Layer; to: Layer};

const rest: Omit<Layer, 'shown'> = {opacity: 1, transform: 'none', origin: [0, 0], streak: 0};

const hexAlpha = (hex: string, a: number): string => {
	const n = Number.parseInt(hex.slice(1), 16);
	return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${clamp01(a)})`;
};

/** Frames (60 fps) a variant runs: until its slowest motion has settled. */
const lengthOf = (v: VariantSpec): number => Math.max(...Object.values(v.motions).map(motionEnd));

const picture = (name: string, v: VariantSpec, t: number, size: Size, tone: Tone): Picture => {
	const s = scheme(tone);
	const at = (xKey: string, yKey: string): Pt => [(num(v, xKey) / 100) * size.width, (num(v, yKey) / 100) * size.height];
	const scale = (k: number, a = 0) => `rotate(${a}deg) scale(${k})`;

	if (name === 'cutContinue') {
		const cut = num(v, 'cut');
		const out = Math.exp(prog(v, 'out', t) * Math.log(num(v, 'outScale')));
		const inn = Math.exp((prog(v, 'scale', t) - 1) * Math.log(num(v, 'inScale')));
		return {
			from: {...rest, shown: t < cut, transform: scale(out), origin: at('outX', 'outY')},
			to: {...rest, shown: t >= cut, transform: scale(inn), origin: at('inX', 'inY'), fill: s.bg},
		};
	}

	if (name === 'risingZoom') {
		const k = mix(prog(v, 'scale', t), 1, num(v, 'toScale'));
		const dy = -num(v, 'rise') * prog(v, 'rise', t);
		const markX = num(v, 'markX');
		const markY = num(v, 'markY');
		const restY = markY - num(v, 'rise');
		const px = (pctH: number) => (pctH / 100) * size.height;
		return {
			// the outgoing layer zooms about its mark while the mark rises
			from: {...rest, shown: prog(v, 'fade', t) < 1, transform: `translateY(${px(dy)}px) scale(${k})`, origin: [(markX / 100) * size.width, px(markY)]},
			// the incoming layer rides the same zoom with its mark on the outgoing mark, landing at rest
			to: {
				...rest,
				shown: prog(v, 'fade', t) > 0,
				opacity: prog(v, 'fade', t),
				transform: `translateY(${px(markY + dy - restY)}px) scale(${k / num(v, 'toScale')})`,
				origin: [(markX / 100) * size.width, px(restY)],
			},
		};
	}

	if (name === 'radialStreaks') {
		const cut = num(v, 'cut');
		const k = mix(prog(v, 'zoom', t), 1, num(v, 'zoomTo'));
		const streak = keyAt(keys(v, 'streaks'), t);
		const o = at('originX', 'originY');
		const dark = mot(v, 'opacity').delay;
		const p = prog(v, 'opacity', t);
		const u = clamp01((t - cut) / Math.max(1, dark - cut));
		const centre = t < dark ? mix(u, num(v, 'firstCentre'), num(v, 'darkCentre')) : num(v, 'darkCentre') * (1 - p);
		const edge = t < dark ? mix(u, num(v, 'firstEdge'), num(v, 'darkEdge')) : num(v, 'darkEdge') * (1 - p);
		const ink = scheme('dark').bg;
		const rx = (num(v, 'windowW') / 200) * size.width;
		const ry = (num(v, 'windowH') / 200) * size.height;
		return {
			from: {...rest, shown: t < cut, transform: scale(k), origin: o, streak},
			to: {
				...rest,
				shown: t >= cut,
				origin: o,
				streak,
				over: (
					<AbsoluteFill
						style={{
							background: `radial-gradient(ellipse ${rx}px ${ry}px at ${o[0]}px ${o[1]}px, ${hexAlpha(ink, centre)} 0%, ${hexAlpha(ink, centre)} 88%, ${hexAlpha(ink, edge)} 100%)`,
						}}
					/>
				),
			},
		};
	}

	if (name === 'oversizeLanding') {
		const cut = num(v, 'cut');
		const out = mix(prog(v, 'out', t), 1, num(v, 'outScale'));
		return {
			from: {...rest, shown: t < cut, transform: scale(out), origin: at('outX', 'outY'), fill: s.bg},
			to: {...rest, shown: t >= cut, transform: scale(mix(prog(v, 'scale', t), num(v, 'inScale'), 1)), origin: [size.width / 2, size.height / 2]},
		};
	}

	if (name === 'dissolve') {
		const m = mot(v, 'scale');
		const end = motionEnd(m);
		const stops = t <= end ? num(v, 'stops') * prog(v, 'scale', t) : num(v, 'stops') + num(v, 'exitRate') * (t - end);
		const d = prog(v, 'dissolve', t);
		return {
			from: {...rest, shown: d < 1, transform: scale(2 ** stops), origin: at('originX', 'originY')},
			to: {...rest, shown: d > 0, opacity: d},
		};
	}

	if (name === 'tunnelExit') {
		const card = mot(v, 'scale');
		const wash = prog(v, 'wash', t);
		const o = at('cardX', 'cardY');
		return {
			from: {
				...rest,
				shown: true,
				transform: wash < 1 ? scale(keyAt(keys(v, 'fly'), t, true)) : 'none',
				origin: o,
				over: <AbsoluteFill style={{backgroundColor: s.flash, opacity: wash}} />,
			},
			to: {...rest, shown: t >= card.delay, transform: scale(mix(prog(v, 'scale', t), num(v, 'cardFrom'), 1)), origin: o},
		};
	}

	if (name === 'spin') {
		const cut = num(v, 'cut');
		const po = prog(v, 'out', t);
		const out = Math.exp(po * Math.log(num(v, 'outScale')));
		const inn = mix(prog(v, 'scale', t), 1, num(v, 'inScale')) / num(v, 'inScale');
		return {
			from: {...rest, shown: t < cut, transform: scale(out, num(v, 'outAngle') * po), origin: at('outX', 'outY')},
			to: {
				...rest,
				shown: t >= cut,
				transform: scale(inn, num(v, 'inAngle') * (1 - prog(v, 'rotate', t))),
				origin: at('inX', 'inY'),
				fill: s.bg,
			},
		};
	}

	throw new Error(`ZoomThrough has no variant ${name}`);
};

const LayerView: React.FC<{layer: Layer; children: React.ReactNode}> = ({layer, children}) => (
	<AbsoluteFill style={{visibility: layer.shown ? 'inherit' : 'hidden', opacity: layer.opacity, overflow: 'hidden'}}>
		{layer.fill ? <AbsoluteFill style={{backgroundColor: layer.fill}} /> : null}
		<ZoomStreaks length={layer.streak} origin={layer.origin}>
			<AbsoluteFill style={{transform: layer.transform, transformOrigin: `${layer.origin[0]}px ${layer.origin[1]}px`}}>{children}</AbsoluteFill>
		</ZoomStreaks>
		{layer.over ?? null}
	</AbsoluteFill>
);

export type ZoomThroughProps = {
	from: React.ReactNode;
	to: React.ReactNode;
	/** tone of the field behind a scene drawn below full frame (the scenes' shared ground) */
	tone?: Tone;
	variant?: string;
};

export const ZoomThrough: React.FC<ZoomThroughProps> = ({from, to, tone = 'light', variant}) => {
	const t = useT();
	const {width, height} = useVideoConfig();
	const name = variant ?? spec.defaultVariant;
	const pic = picture(name, variantOf(spec, variant), t, {width, height}, tone);
	return (
		<AbsoluteFill>
			<LayerView layer={pic.from}>{from}</LayerView>
			<LayerView layer={pic.to}>{to}</LayerView>
		</AbsoluteFill>
	);
};

type ZoomPresentationProps = {variant: string; tone: Tone};

const ZoomPresentation: React.FC<TransitionPresentationComponentProps<ZoomPresentationProps>> = ({
	children,
	presentationDirection,
	presentationProgress,
	passedProps,
}) => {
	const {width, height} = useVideoConfig();
	const v = variantOf(spec, passedProps.variant);
	const pic = picture(passedProps.variant, v, presentationProgress * lengthOf(v), {width, height}, passedProps.tone);
	return <LayerView layer={presentationDirection === 'exiting' ? pic.from : pic.to}>{children}</LayerView>;
};

/** The zoom-through as a TransitionSeries presentation: the outgoing scene and the incoming one, each on its side of the cut. */
export const zoomThroughPresentation = (variant?: string, tone: Tone = 'light'): TransitionPresentation<ZoomPresentationProps> => ({
	component: ZoomPresentation,
	props: {variant: variant ?? spec.defaultVariant, tone},
});

/** Its timing: a steady clock over the variant's length; the measured curves run inside the presentation. */
export const zoomThroughTiming = (variant?: string): TransitionTiming => motionTiming({duration: lengthOf(variantOf(spec, variant)), delay: 0, ease: linear});

// ---- Demo: a light scene with a centred mark goes out, a dark three-plate scene comes in ----

const DEMO: Record<string, {from: [Tone, string]; to: [Tone, string]}> = {
	cutContinue: {from: ['light', 'Ready'], to: ['dark', 'Next']},
	risingZoom: {from: ['light', 'Ready'], to: ['light', 'Mark']},
	radialStreaks: {from: ['dark', 'Ready'], to: ['light', 'Next']},
	oversizeLanding: {from: ['light', 'Ready'], to: ['light', 'Next']},
	dissolve: {from: ['light', 'Ready'], to: ['dark', 'Next']},
	tunnelExit: {from: ['dark', 'Ready'], to: ['light', 'Next']},
	spin: {from: ['light', 'Ready'], to: ['dark', 'Next']},
};

/** risingZoom's incoming scene: the mark alone, risen to its rest place. */
const MarkCard: React.FC<{tone: Tone; markY: number}> = ({tone, markY}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	const d = height * 0.26 * 1.4;
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			<div style={{position: 'absolute', left: '50%', top: `${markY}%`, width: d, height: d, marginLeft: -d / 2, marginTop: -d / 2}}>
				<svg viewBox="0 0 100 100" width="100%" height="100%">
					<circle cx="50" cy="50" r="40" fill="none" stroke={s.ink} strokeWidth="14" />
				</svg>
			</div>
		</AbsoluteFill>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const d = DEMO[variant] ?? {from: ['light', 'Ready'], to: ['dark', 'Next']};
	const v = variantOf(spec, variant);
	const to = variant === 'risingZoom' ? <MarkCard tone={d.to[0]} markY={num(v, 'markY') - num(v, 'rise')} /> : <SceneB tone={d.to[0]} word={d.to[1]} />;
	return <ZoomThrough variant={variant} tone={d.to[0]} from={<SceneA tone={d.from[0]} word={d.from[1]} />} to={to} />;
};
